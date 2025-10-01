# Test 6.2: Search API Endpoints - Refactoring Prompt

## Context

This document provides instructions for an AI agent to refactor the Schedule Editor application's server code to fix issues identified in Test 6.2: Search API Endpoints.

## Test Results Summary

**Test Date:** October 1, 2025  
**Total Tests:** 16  
**Passed:** 15  
**Failed:** 1  
**Success Rate:** 93.8%

## Issue Identified

### Failed Test: POST /api/search (malformed JSON)

**Problem:**
When malformed JSON is sent to the `/api/search` endpoint, the server returns a 500 Internal Server Error instead of a proper 400 Bad Request error.

**Current Behavior:**
- Request with malformed JSON → 500 Internal Server Error
- No clear error message indicating JSON parsing failure

**Expected Behavior:**
- Request with malformed JSON → 400 Bad Request
- Clear error message: "Invalid JSON format" or similar

**Root Cause:**
The `express.json()` middleware throws a `SyntaxError` when it encounters malformed JSON, but this error is not caught by proper error handling middleware. The error bubbles up and is caught by the generic error handler, which returns a 500 status code.

## Refactoring Instructions

### File to Modify
`src/server.js`

### Current Code Structure

The server currently has:
1. JSON parsing middleware: `app.use(express.json());` (line 54)
2. Authentication middleware: `authenticateUser` function (lines 71-91)
3. Generic error handler: Lines 354-357

```javascript
// Line 54
app.use(express.json());

// Lines 354-357
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});
```

### Required Changes

#### Change 1: Add JSON Parsing Error Handler

Add a specific error handler for JSON parsing errors immediately after the generic error handler (or modify the generic error handler to handle JSON parsing errors specifically).

**Location:** After line 357 in `src/server.js`

**New Code to Add:**
```javascript
// JSON parsing error handler
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        logger.error('JSON parsing error:', err.message);
        return res.status(400).json({ 
            error: 'Invalid JSON format',
            details: 'The request body contains malformed JSON. Please check your JSON syntax.'
        });
    }
    next(err);
});

// Generic error handler
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});
```

**OR** modify the existing generic error handler to check for JSON parsing errors first:

**Replace lines 354-357 with:**
```javascript
// Error handling middleware
app.use((err, req, res, next) => {
    // Handle JSON parsing errors
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        logger.error('JSON parsing error:', err.message);
        return res.status(400).json({ 
            error: 'Invalid JSON format',
            details: 'The request body contains malformed JSON. Please check your JSON syntax.'
        });
    }
    
    // Handle other errors
    logger.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});
```

### Alternative Solution: Use Custom JSON Parser Middleware

If you prefer more control over JSON parsing, you can replace the built-in `express.json()` with a custom middleware:

**Replace line 54:**
```javascript
// Custom JSON parsing with better error handling
app.use((req, res, next) => {
    if (req.is('application/json')) {
        let data = '';
        req.on('data', chunk => data += chunk);
        req.on('end', () => {
            try {
                req.body = data ? JSON.parse(data) : {};
                next();
            } catch (err) {
                logger.error('JSON parsing error:', err.message);
                return res.status(400).json({ 
                    error: 'Invalid JSON format',
                    details: 'The request body contains malformed JSON. Please check your JSON syntax.'
                });
            }
        });
    } else {
        next();
    }
});
```

**Note:** The first solution (error handler middleware) is simpler and recommended.

## Implementation Steps

1. **Open the file:** `src/server.js`

2. **Locate the error handling middleware** (around line 354)

3. **Modify the error handler** to check for JSON parsing errors first (use the code provided above)

4. **Save the file**

5. **Restart the server**

6. **Re-run the test** to verify the fix:
   ```bash
   node tests/group_6/test_6_2_search_api_endpoints.js
   ```

7. **Verify** that the previously failed test now passes:
   - Test: "POST /api/search (malformed JSON)"
   - Expected: 400 status code
   - Should now show: ✓ PASSED

## Expected Outcome After Refactoring

### Test Results
- **Total Tests:** 16
- **Passed:** 16 ← (increased from 15)
- **Failed:** 0 ← (decreased from 1)
- **Success Rate:** 100% ← (increased from 93.8%)

### Behavior Changes
- Requests with malformed JSON will now return 400 Bad Request instead of 500 Internal Server Error
- Error response will include a clear message indicating JSON parsing failure
- Server logs will clearly indicate JSON parsing errors
- No impact on valid requests or other error handling

## Additional Recommendations

While implementing the fix, consider these additional improvements:

### 1. Enhanced Error Logging
Add more detailed logging for debugging:
```javascript
if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    logger.error('JSON parsing error:', {
        message: err.message,
        path: req.path,
        method: req.method,
        headers: req.headers,
        timestamp: new Date().toISOString()
    });
    // ... rest of error handling
}
```

### 2. Content-Type Validation
Consider adding middleware to validate Content-Type before parsing:
```javascript
const validateContentType = (req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        const contentType = req.get('Content-Type');
        if (contentType && !contentType.includes('application/json')) {
            return res.status(415).json({ 
                error: 'Unsupported Media Type',
                details: 'Content-Type must be application/json'
            });
        }
    }
    next();
};

app.use(validateContentType);
app.use(express.json());
```

### 3. Request Size Limits
Ensure JSON parsing has size limits to prevent abuse:
```javascript
app.use(express.json({ 
    limit: '10mb', // Adjust based on your needs
    strict: true // Only parse arrays and objects
}));
```

### 4. Comprehensive Error Handler
Create a more comprehensive error handler for all types of errors:
```javascript
app.use((err, req, res, next) => {
    // Log all errors
    logger.error('Error occurred:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    // Handle specific error types
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ 
            error: 'Invalid JSON format',
            details: 'The request body contains malformed JSON.'
        });
    }

    if (err.name === 'ValidationError') {
        return res.status(400).json({ 
            error: 'Validation failed',
            details: err.message
        });
    }

    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({ 
            error: 'Authentication failed',
            details: err.message
        });
    }

    // Generic error handler
    res.status(err.status || 500).json({ 
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});
```

## Testing After Refactoring

### Manual Testing

Test the fix manually using curl or Postman:

```bash
# Test with malformed JSON (should return 400)
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d "invalid json"

# Expected response:
# Status: 400
# Body: {"error":"Invalid JSON format","details":"..."}

# Test with valid JSON (should return 401 - no auth)
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"searchText":"test"}'

# Expected response:
# Status: 401
# Body: {"error":"No token provided"}
```

### Automated Testing

Re-run the full test suite:
```bash
node tests/group_6/test_6_2_search_api_endpoints.js
```

Expected output:
```
Starting Test 6.2: Search API Endpoints

✓ POST /api/search (no auth): Status: 401, Error: No token provided
✓ POST /api/search (invalid token): Status: 401, Error: Invalid token
✓ POST /api/search (empty params, invalid token): Status: 401
✓ POST /api/search (malformed JSON): Status: 400  ← This should now pass
✓ POST /api/search (invalid param types): Status: 401
... (remaining tests)

==================================================
TEST SUMMARY
==================================================
Total Tests: 16
Passed: 16  ← All tests should pass
Failed: 0   ← No failures
Success Rate: 100%  ← Perfect score
```

## Verification Checklist

After implementing the changes, verify:

- [ ] Malformed JSON requests return 400 status code (not 500)
- [ ] Error message clearly indicates JSON parsing failure
- [ ] Valid requests still work as expected
- [ ] Authentication still functions correctly
- [ ] All 16 tests in Test 6.2 pass
- [ ] Server logs include JSON parsing error details
- [ ] No breaking changes to existing functionality

## Documentation Updates

After completing the refactoring, update:

1. **API Documentation** - Add information about error responses:
   - 400 Bad Request: Invalid JSON format
   - 401 Unauthorized: Missing or invalid authentication token
   - 500 Internal Server Error: Unexpected server error

2. **Error Handling Guide** - Document the error handling strategy for future developers

3. **Changelog** - Add entry:
   ```
   ## [Version] - [Date]
   ### Fixed
   - Fixed JSON parsing error handling to return 400 instead of 500
   - Improved error messages for malformed JSON requests
   ```

## Support

If you encounter any issues during refactoring:

1. Check the server logs for detailed error messages
2. Verify that express.json() middleware is properly configured
3. Ensure error handling middleware is placed after all route handlers
4. Test with simple curl commands to isolate the issue
5. Review Express.js error handling documentation

## Conclusion

This refactoring addresses a common but important issue in API error handling. By properly catching and handling JSON parsing errors, the API will provide better feedback to clients and follow HTTP status code best practices. The fix is straightforward and should take only a few minutes to implement.

**Priority:** Medium  
**Difficulty:** Easy  
**Estimated Time:** 10-15 minutes  
**Impact:** Improves API error handling and developer experience


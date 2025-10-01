# Test 6.1: Schedule API Endpoints - Refactoring Prompt

## Context
The Schedule Editor application's API endpoints have been tested and show **strong security fundamentals** but have **one critical error handling issue** that needs to be addressed. The test results show 9/10 tests passing (90% success rate), with authentication and authorization working correctly, but malformed JSON handling causing server crashes.

## Test Results Summary
- **Total Tests:** 10
- **Passed:** 9 (90.0%)
- **Failed:** 1 (10.0%)
- **Critical Issue:** POST /api/schedule endpoint crashes with 500 error when receiving malformed JSON instead of proper authentication validation

## Refactoring Requirements

### 🔴 CRITICAL: Fix Error Handling for Malformed JSON

**Problem:** The POST /api/schedule endpoint returns a 500 "Something broke!" error when receiving malformed JSON, instead of properly validating authentication first and returning appropriate error codes.

**Current Behavior:**
```bash
curl -X POST http://localhost:3000/api/schedule \
  -H "Content-Type: application/json" \
  -d "invalid json"
# Returns: 500 Internal Server Error with "Something broke!"
```

**Expected Behavior:**
```bash
curl -X POST http://localhost:3000/api/schedule \
  -H "Content-Type: application/json" \
  -d "invalid json"
# Should return: 401 Unauthorized with "No token provided"
```

### Specific Code Changes Needed

#### 1. Fix Authentication Middleware Order
**File:** `src/server.js`

**Current Issue:** The authentication middleware is applied after JSON parsing, causing malformed JSON to crash before authentication validation.

**Required Changes:**
```javascript
// BEFORE (current problematic order):
app.use(express.json()); // JSON parsing happens first
// ... other middleware
app.post('/api/schedule', authenticateUser, async (req, res) => {
    // Authentication happens after JSON parsing
});

// AFTER (recommended fix):
// Move authentication validation before JSON parsing for protected routes
// OR implement proper error handling for JSON parsing errors
```

#### 2. Implement Proper Error Handling Middleware
**File:** `src/server.js`

**Add comprehensive error handling for:**
- Malformed JSON requests
- Invalid Content-Type headers
- Request body parsing errors
- Authentication failures
- Database connection errors

**Recommended Implementation:**
```javascript
// Add error handling middleware before routes
app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        // Handle malformed JSON
        return res.status(400).json({ 
            error: 'Invalid JSON format',
            message: 'Request body contains invalid JSON'
        });
    }
    
    // Handle other errors
    logger.error('Request processing error:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        message: 'An unexpected error occurred'
    });
});
```

#### 3. Improve Error Messages
**Current Issue:** Generic "Something broke!" message provides no useful information.

**Required Changes:**
- Replace generic error messages with specific, actionable error descriptions
- Implement proper HTTP status codes for different error types
- Add request ID for error tracking
- Log detailed error information server-side while returning safe messages to clients

### 🟡 MEDIUM: Enhance Input Validation

#### 1. Add Request Body Validation
**Implement validation for:**
- Content-Type header validation
- Request body size limits
- JSON schema validation for schedule data
- Required field validation

#### 2. Add Rate Limiting
**Implement rate limiting for:**
- API endpoints to prevent abuse
- Authentication attempts
- File upload endpoints

### 🟢 LOW: Security Enhancements

#### 1. Improve Error Sanitization
- Ensure error messages don't expose internal server information
- Add request logging for security monitoring
- Implement proper CORS configuration validation

#### 2. Add Request Validation Middleware
- Validate request headers
- Check request body size limits
- Implement proper timeout handling

## Implementation Priority

### Phase 1: Critical Fixes (IMMEDIATE)
1. ✅ Fix malformed JSON error handling
2. ✅ Improve error messages
3. ✅ Add proper HTTP status codes

### Phase 2: Security Enhancements (WITHIN 1 WEEK)
1. ✅ Add input validation middleware
2. ✅ Implement rate limiting
3. ✅ Enhance error logging

### Phase 3: Monitoring & Observability (WITHIN 2 WEEKS)
1. ✅ Add request ID tracking
2. ✅ Implement health check endpoints
3. ✅ Add API usage metrics

## Testing Requirements

### After Refactoring, Verify:
1. **Malformed JSON Handling:**
   ```bash
   curl -X POST http://localhost:3000/api/schedule \
     -H "Content-Type: application/json" \
     -d "invalid json"
   # Should return 400 Bad Request with proper error message
   ```

2. **Authentication Still Works:**
   ```bash
   curl -X POST http://localhost:3000/api/schedule \
     -H "Content-Type: application/json" \
     -d "{}"
   # Should return 401 Unauthorized with "No token provided"
   ```

3. **Valid Requests Still Work:**
   ```bash
   curl -X POST http://localhost:3000/api/schedule \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer valid_token" \
     -d '{"weekdays": {}}'
   # Should return 200 OK or appropriate success response
   ```

## Success Criteria

### ✅ Must Have:
- [ ] Malformed JSON requests return proper 400/401 errors instead of 500
- [ ] All existing authentication tests still pass
- [ ] Error messages are informative but don't expose server details
- [ ] No server crashes from malformed requests

### ✅ Should Have:
- [ ] Input validation for all request types
- [ ] Rate limiting implemented
- [ ] Comprehensive error logging
- [ ] Request ID tracking for debugging

### ✅ Nice to Have:
- [ ] API documentation updates
- [ ] Health check endpoints
- [ ] Performance monitoring
- [ ] Automated testing for error scenarios

## Files to Modify

### Primary Files:
1. **`src/server.js`** - Main server configuration and error handling
2. **`package.json`** - Add any new dependencies for validation/rate limiting

### Secondary Files:
1. **`README.md`** - Update API documentation
2. **`tests/group_6/`** - Add additional error handling tests

## Notes for Implementation

1. **Backward Compatibility:** Ensure all existing functionality continues to work
2. **Performance:** Don't add excessive validation that impacts response times
3. **Logging:** Log all errors for debugging but sanitize client-facing messages
4. **Testing:** Add comprehensive tests for all error scenarios
5. **Documentation:** Update API documentation with new error responses

## Expected Outcome

After implementing these changes, the API should:
- Handle malformed requests gracefully
- Provide clear, actionable error messages
- Maintain strong security posture
- Pass all existing tests plus new error handling tests
- Be ready for production deployment

The refactoring should result in a **100% test pass rate** and significantly improved error handling and user experience.

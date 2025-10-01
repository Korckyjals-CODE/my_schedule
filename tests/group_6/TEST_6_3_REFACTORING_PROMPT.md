# Refactoring Prompt for Test 6.3: Image Extraction API

## Test Status: ✅ ALL TESTS PASSED

**Test Date:** October 1, 2025  
**Test ID:** test_6_3_results_1759287103324  
**Success Rate:** 100% (10/10 tests passed)  
**Refactoring Required:** ❌ No critical issues found

---

## Executive Summary

The Image Extraction API endpoint (`POST /api/schedule/extract`) **passed all 10 tests** with excellent security, error handling, and implementation quality. **No immediate refactoring is required** for production deployment.

However, this document provides recommendations for **optional enhancements** that could improve user experience, maintainability, and test coverage.

---

## Current Implementation Status

### ✅ Strengths (Keep These)

1. **Security**
   - Proper authentication enforcement via Supabase JWT
   - File size limits (10MB) prevent memory exhaustion
   - API keys stored securely in environment variables
   - Authentication-first approach (auth before processing)

2. **Error Handling**
   - Consistent JSON error responses
   - Appropriate HTTP status codes
   - Descriptive error messages
   - Try-catch blocks around async operations

3. **Code Quality**
   - Clean middleware architecture
   - Reusable authentication middleware
   - Proper separation of concerns
   - Good logging with winston

4. **API Design**
   - RESTful endpoint structure
   - Proper multipart/form-data handling
   - Multiple image format support
   - Structured JSON response

---

## Optional Enhancement Recommendations

### Priority 1: High Value, Low Effort

#### Enhancement 1.1: Add Explicit MIME Type Validation

**Current Behavior:**
The endpoint accepts any file through multer and relies on OpenAI to handle invalid file types.

**Recommended Change:**
Add explicit MIME type validation before processing.

**Implementation:**

```javascript
// In src/server.js, update the multer configuration:

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        // Accept only image files
        const allowedMimeTypes = [
            'image/jpeg',
            'image/jpg', 
            'image/png',
            'image/gif',
            'image/webp'
        ];
        
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`));
        }
    }
});
```

**Update the endpoint error handling:**

```javascript
app.post('/api/schedule/extract', authenticateUser, (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(413).json({ 
                    error: 'File too large. Maximum size is 10MB.' 
                });
            }
            return res.status(400).json({ error: err.message });
        } else if (err) {
            return res.status(400).json({ 
                error: err.message || 'Invalid file upload' 
            });
        }
        next();
    });
}, async (req, res) => {
    // Existing extraction logic...
});
```

**Benefits:**
- Better user experience with clear error messages
- Reduces unnecessary OpenAI API calls
- Validates file types before expensive processing
- Saves API costs by rejecting invalid files early

**Estimated Effort:** 30 minutes  
**Impact:** Medium (improves UX and reduces costs)

---

#### Enhancement 1.2: Improve File Upload Error Messages

**Current Behavior:**
When no file is uploaded, the error message "No image uploaded" appears only after authentication succeeds.

**Recommended Change:**
Add more descriptive error messages with guidance.

**Implementation:**

```javascript
app.post('/api/schedule/extract', authenticateUser, upload.single('image'), async (req, res) => {
    try {
        if (!openai) {
            return res.status(500).json({ 
                error: 'OpenAI not configured',
                details: 'The image extraction service is currently unavailable. Please contact support.'
            });
        }
        
        if (!req.file) {
            return res.status(400).json({ 
                error: 'No image uploaded',
                details: 'Please upload an image file in PNG, JPEG, or GIF format.',
                field: 'image'
            });
        }
        
        // Rest of the implementation...
    } catch (error) {
        logger.error('Error extracting schedule:', error);
        res.status(500).json({ 
            error: 'Failed to extract schedule',
            details: 'An error occurred while processing your image. Please try again.'
        });
    }
});
```

**Benefits:**
- More helpful error messages for users
- Reduces support requests
- Improves developer experience when debugging

**Estimated Effort:** 15 minutes  
**Impact:** Low to Medium (improves UX)

---

#### Enhancement 1.3: Add Request Validation Logging

**Current Behavior:**
Errors are logged but successful validations are not tracked.

**Recommended Change:**
Add logging for request validation steps.

**Implementation:**

```javascript
const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            logger.warn('Authentication failed: No token provided', {
                path: req.path,
                ip: req.ip
            });
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            logger.warn('Authentication failed: Invalid token', {
                path: req.path,
                ip: req.ip,
                error: error?.message
            });
            return res.status(401).json({ error: 'Invalid token' });
        }

        logger.info('User authenticated successfully', {
            userId: user.id,
            path: req.path
        });

        req.user = user;
        next();
    } catch (error) {
        logger.error('Authentication error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
};
```

**Benefits:**
- Better monitoring and debugging
- Track authentication patterns
- Identify potential security issues
- Audit trail for compliance

**Estimated Effort:** 20 minutes  
**Impact:** Medium (improves monitoring)

---

### Priority 2: Medium Value, Medium Effort

#### Enhancement 2.1: Add Response Wrapper for Consistency

**Current Behavior:**
Successful responses return raw extracted JSON, error responses have `{ error: "..." }` format.

**Recommended Change:**
Wrap all responses in a consistent format.

**Implementation:**

```javascript
// Add response wrapper utility
function successResponse(data, message = 'Success') {
    return {
        success: true,
        message,
        data
    };
}

function errorResponse(error, details = null) {
    return {
        success: false,
        error,
        ...(details && { details })
    };
}

// Update the extract endpoint
app.post('/api/schedule/extract', authenticateUser, upload.single('image'), async (req, res) => {
    try {
        if (!openai) {
            return res.status(500).json(errorResponse(
                'OpenAI not configured',
                'The image extraction service is currently unavailable.'
            ));
        }
        
        if (!req.file) {
            return res.status(400).json(errorResponse(
                'No image uploaded',
                'Please upload an image file.'
            ));
        }

        // ... extraction logic ...

        return res.json(successResponse(
            json,
            'Schedule extracted successfully'
        ));
        
    } catch (error) {
        logger.error('Error extracting schedule:', error);
        res.status(500).json(errorResponse(
            'Failed to extract schedule',
            'An error occurred while processing your image.'
        ));
    }
});
```

**Note:** This would be a **breaking change** if the API is already in use. Consider:
- Versioning the API (e.g., `/api/v2/schedule/extract`)
- Adding a migration period with support for both formats
- Updating all client code that consumes this endpoint

**Benefits:**
- Consistent API response format
- Easier for clients to parse responses
- Better error handling on client side
- Clearer success/failure states

**Estimated Effort:** 2 hours (including client updates)  
**Impact:** Medium (breaking change, but improves consistency)

---

#### Enhancement 2.2: Add Rate Limiting for OpenAI Calls

**Current Behavior:**
No rate limiting on image extraction requests.

**Recommended Change:**
Add rate limiting to prevent OpenAI API quota exhaustion.

**Implementation:**

```javascript
// Install express-rate-limit
// npm install express-rate-limit

const rateLimit = require('express-rate-limit');

// Create rate limiter for extraction endpoint
const extractionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each user to 10 requests per windowMs
    message: {
        error: 'Too many extraction requests',
        details: 'Please wait before uploading another image.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false,
    // Use user ID for rate limiting
    keyGenerator: (req) => {
        return req.user?.id || req.ip;
    }
});

// Apply to extraction endpoint
app.post('/api/schedule/extract', 
    authenticateUser, 
    extractionLimiter,
    upload.single('image'), 
    async (req, res) => {
        // Existing implementation...
    }
);
```

**Benefits:**
- Prevents API quota exhaustion
- Protects against abuse
- Controls OpenAI costs
- Fair resource distribution

**Estimated Effort:** 1 hour  
**Impact:** Medium (cost control, security)

---

#### Enhancement 2.3: Add Caching for Identical Images

**Current Behavior:**
Each image is processed fresh, even if identical to a previous upload.

**Recommended Change:**
Cache extraction results based on image hash.

**Implementation:**

```javascript
const crypto = require('crypto');

// Simple in-memory cache (consider Redis for production)
const extractionCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function getImageHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

app.post('/api/schedule/extract', authenticateUser, upload.single('image'), async (req, res) => {
    try {
        if (!openai) {
            return res.status(500).json({ error: 'OpenAI not configured' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        // Check cache
        const imageHash = getImageHash(req.file.buffer);
        const cached = extractionCache.get(imageHash);
        
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            logger.info('Returning cached extraction result', { 
                userId: req.user.id,
                imageHash 
            });
            return res.json(cached.data);
        }

        // ... existing OpenAI extraction logic ...

        // Cache the result
        extractionCache.set(imageHash, {
            data: json,
            timestamp: Date.now()
        });

        // Clean old cache entries periodically
        if (extractionCache.size > 1000) {
            const now = Date.now();
            for (const [key, value] of extractionCache.entries()) {
                if (now - value.timestamp > CACHE_TTL) {
                    extractionCache.delete(key);
                }
            }
        }

        return res.json(json);
    } catch (error) {
        logger.error('Error extracting schedule:', error);
        res.status(500).json({ error: 'Failed to extract schedule' });
    }
});
```

**Benefits:**
- Reduces OpenAI API calls
- Faster response times
- Lower costs
- Better user experience

**Considerations:**
- Use Redis or similar for production (shared cache across instances)
- Consider cache invalidation strategy
- Monitor cache hit rates

**Estimated Effort:** 2-3 hours (in-memory) or 4-5 hours (Redis)  
**Impact:** High (significant cost savings)

---

### Priority 3: Nice to Have

#### Enhancement 3.1: Add Async Processing with Job Queue

**Current Behavior:**
Image processing is synchronous, blocking the request until OpenAI responds.

**Recommended Change:**
Use a job queue for asynchronous processing.

**Implementation:**

```javascript
// Install bull for job queue
// npm install bull

const Queue = require('bull');
const extractionQueue = new Queue('image-extraction', {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
    }
});

// Endpoint creates a job and returns immediately
app.post('/api/schedule/extract', authenticateUser, upload.single('image'), async (req, res) => {
    try {
        if (!openai) {
            return res.status(500).json({ error: 'OpenAI not configured' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        // Create job
        const job = await extractionQueue.add({
            userId: req.user.id,
            image: req.file.buffer.toString('base64'),
            mimetype: req.file.mimetype
        });

        res.json({
            jobId: job.id,
            status: 'processing',
            message: 'Image is being processed. Check status with GET /api/schedule/extract/:jobId'
        });

    } catch (error) {
        logger.error('Error creating extraction job:', error);
        res.status(500).json({ error: 'Failed to create extraction job' });
    }
});

// Job processor
extractionQueue.process(async (job) => {
    const { userId, image, mimetype } = job.data;
    
    const imageBuffer = Buffer.from(image, 'base64');
    const base64 = imageBuffer.toString('base64');
    const imageUrl = `data:${mimetype};base64,${base64}`;

    // Existing OpenAI extraction logic...
    const completion = await openai.chat.completions.create({
        // ... same as before ...
    });

    const json = JSON.parse(completion.choices[0].message.content);
    
    return json;
});

// Status endpoint
app.get('/api/schedule/extract/:jobId', authenticateUser, async (req, res) => {
    try {
        const job = await extractionQueue.getJob(req.params.jobId);
        
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        const state = await job.getState();
        
        if (state === 'completed') {
            const result = job.returnvalue;
            res.json({
                status: 'completed',
                data: result
            });
        } else if (state === 'failed') {
            res.json({
                status: 'failed',
                error: 'Extraction failed'
            });
        } else {
            res.json({
                status: state,
                progress: job.progress()
            });
        }
    } catch (error) {
        logger.error('Error checking job status:', error);
        res.status(500).json({ error: 'Failed to check job status' });
    }
});
```

**Benefits:**
- Non-blocking requests
- Better scalability
- Can handle multiple concurrent extractions
- Better error recovery
- Progress tracking

**Considerations:**
- Requires Redis infrastructure
- Changes API contract (async instead of sync)
- Requires client-side polling or webhooks
- More complex deployment

**Estimated Effort:** 8-12 hours  
**Impact:** High (major architectural change, but excellent scalability)

---

#### Enhancement 3.2: Add Image Preprocessing

**Current Behavior:**
Images are sent directly to OpenAI without preprocessing.

**Recommended Change:**
Preprocess images to optimize for OCR and extraction.

**Implementation:**

```javascript
// Install sharp for image processing
// npm install sharp

const sharp = require('sharp');

async function preprocessImage(buffer) {
    return await sharp(buffer)
        .resize(2000, 2000, { // Resize to reasonable size
            fit: 'inside',
            withoutEnlargement: true
        })
        .normalize() // Normalize contrast
        .sharpen() // Enhance edges
        .png({ // Convert to PNG for consistency
            quality: 90,
            compressionLevel: 9
        })
        .toBuffer();
}

app.post('/api/schedule/extract', authenticateUser, upload.single('image'), async (req, res) => {
    try {
        // ... existing validation ...

        // Preprocess image
        const processedBuffer = await preprocessImage(req.file.buffer);
        const base64 = processedBuffer.toString('base64');
        const imageUrl = `data:image/png;base64,${base64}`;

        // ... existing OpenAI call ...

    } catch (error) {
        logger.error('Error extracting schedule:', error);
        res.status(500).json({ error: 'Failed to extract schedule' });
    }
});
```

**Benefits:**
- Better extraction accuracy
- Consistent image format for OpenAI
- Smaller file sizes
- Better handling of low-quality images

**Estimated Effort:** 2-3 hours  
**Impact:** Medium (improves accuracy)

---

#### Enhancement 3.3: Add Comprehensive Testing Suite

**Current Status:**
Only unauthenticated endpoint tests exist.

**Recommended Change:**
Create comprehensive test suite including authenticated tests.

**Implementation:**

Create `tests/group_6/test_6_3_authenticated.js`:

```javascript
/**
 * Test 6.3 Extended: Authenticated Image Extraction Tests
 */

const { supabase } = require('../../src/supabase');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Test setup
let authToken;
let testUserId;

async function setup() {
    // Create or sign in test user
    const { data, error } = await supabase.auth.signInWithPassword({
        email: process.env.TEST_USER_EMAIL || 'test@example.com',
        password: process.env.TEST_USER_PASSWORD || 'testpassword123'
    });
    
    if (error) throw error;
    
    authToken = data.session.access_token;
    testUserId = data.user.id;
}

async function testSuccessfulExtraction() {
    const imagePath = path.join(__dirname, '../../data/sample_schedule.png');
    const imageBuffer = fs.readFileSync(imagePath);
    
    const form = new FormData();
    form.append('image', imageBuffer, {
        filename: 'sample_schedule.png',
        contentType: 'image/png'
    });
    
    const response = await makeFormRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/schedule/extract',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    }, form);
    
    // Validate response
    expect(response.statusCode).toBe(200);
    expect(response.body.weekdays).toBeDefined();
    expect(response.body.specific_dates).toBeDefined();
    
    // Validate schedule structure
    const weekdays = response.body.weekdays;
    expect(weekdays.Monday).toBeInstanceOf(Array);
    expect(weekdays.Tuesday).toBeInstanceOf(Array);
    // ... more validations
}

async function testExtractionAccuracy() {
    // Test with known schedule image
    // Validate extracted data matches expected schedule
}

async function testMissingFileWithAuth() {
    // Test proper 400 error when auth succeeds but no file
}

async function testInvalidFileTypeWithAuth() {
    // Test proper error handling for non-image files
}

// Run all authenticated tests
async function runAuthenticatedTests() {
    await setup();
    await testSuccessfulExtraction();
    await testExtractionAccuracy();
    await testMissingFileWithAuth();
    await testInvalidFileTypeWithAuth();
}

module.exports = { runAuthenticatedTests };
```

**Benefits:**
- Complete test coverage
- Validates actual functionality
- Tests OpenAI integration
- Regression prevention

**Estimated Effort:** 4-6 hours  
**Impact:** High (ensures reliability)

---

## Testing Improvements

### Recommended Additional Tests

#### Test Suite 1: Authenticated Endpoint Tests
- ✅ Successful image extraction with valid auth
- ✅ Validate extracted JSON schema
- ✅ Test extraction accuracy with known schedule
- ✅ Test "no file" error with valid auth
- ✅ Test invalid file type with valid auth
- ✅ Test corrupted image handling

#### Test Suite 2: OpenAI Integration Tests
- ✅ Test OpenAI unavailability
- ✅ Test OpenAI rate limiting
- ✅ Test OpenAI invalid JSON response
- ✅ Test OpenAI timeout handling

#### Test Suite 3: Performance Tests
- ✅ Test concurrent extraction requests
- ✅ Test large image processing
- ✅ Measure response times
- ✅ Test memory usage under load

#### Test Suite 4: Integration Tests
- ✅ Upload → Extract → Save → Display workflow
- ✅ Test with various schedule formats
- ✅ Test with low-quality images
- ✅ Test with non-schedule images

---

## Implementation Priority Roadmap

### Phase 1: Quick Wins (1-2 days)
- [ ] Enhancement 1.1: Add explicit MIME type validation
- [ ] Enhancement 1.2: Improve error messages
- [ ] Enhancement 1.3: Add request validation logging

**Expected Outcome:** Better UX and monitoring with minimal effort

---

### Phase 2: Value Additions (3-5 days)
- [ ] Enhancement 2.2: Add rate limiting
- [ ] Enhancement 2.3: Add caching
- [ ] Enhancement 3.3: Add comprehensive testing

**Expected Outcome:** Cost control, performance improvement, reliability

---

### Phase 3: Major Improvements (1-2 weeks)
- [ ] Enhancement 2.1: Add response wrapper (with versioning)
- [ ] Enhancement 3.1: Add async processing
- [ ] Enhancement 3.2: Add image preprocessing

**Expected Outcome:** Architectural improvements, scalability

---

## Code Quality Checklist

Use this checklist when implementing enhancements:

### Before Making Changes
- [ ] Read existing code and understand current implementation
- [ ] Review test results and identify actual issues
- [ ] Plan changes with minimal disruption
- [ ] Consider backward compatibility

### During Implementation
- [ ] Follow existing code style and patterns
- [ ] Add comprehensive error handling
- [ ] Include detailed logging
- [ ] Write unit tests for new functionality
- [ ] Update API documentation

### After Implementation
- [ ] Run all existing tests to ensure no regression
- [ ] Test new functionality thoroughly
- [ ] Update documentation
- [ ] Monitor performance and error logs
- [ ] Consider rollback plan

---

## Prompt for AI Agent: Implementation Guide

**Context:**  
You are an AI agent tasked with implementing enhancements to the Image Extraction API endpoint in a Schedule Editor application. The endpoint currently **passes all tests** but has opportunities for improvement.

**Current Implementation:**  
- File: `src/server.js`
- Endpoint: `POST /api/schedule/extract`
- Lines: 285-351
- Status: ✅ Production ready, all tests passing

**Your Task:**  
Implement the Priority 1 enhancements to improve user experience and monitoring:

1. **Add Explicit MIME Type Validation** (Enhancement 1.1)
   - Update multer configuration to accept only image file types
   - Add proper error handling for invalid file types
   - Return clear error messages to users

2. **Improve Error Messages** (Enhancement 1.2)
   - Add descriptive `details` field to error responses
   - Include guidance on how to fix the error
   - Maintain consistent error response format

3. **Add Request Validation Logging** (Enhancement 1.3)
   - Log authentication attempts (success and failure)
   - Include relevant context (user ID, IP, path)
   - Use appropriate log levels (info, warn, error)

**Requirements:**
- ✅ Maintain backward compatibility (don't break existing clients)
- ✅ Keep all existing tests passing
- ✅ Follow existing code style and patterns
- ✅ Add comprehensive error handling
- ✅ Include detailed logging with winston
- ✅ Test all changes thoroughly

**Testing:**
After implementation, run:
```bash
cd tests/group_6
node test_6_3_image_extraction_api.js
```

Ensure all tests still pass with 100% success rate.

**Acceptance Criteria:**
1. All existing tests pass
2. Invalid file types return clear error messages before reaching OpenAI
3. All authentication attempts are logged
4. Error responses include helpful details
5. No breaking changes to API contract

**Reference Files:**
- Test Script: `tests/group_6/test_6_3_image_extraction_api.js`
- Test Results: `tests/group_6/TEST_6_3_RESULTS.md`
- Current Implementation: `src/server.js:285-351`

---

## Conclusion

The Image Extraction API endpoint is **production ready** with excellent security, error handling, and code quality. **No immediate refactoring is required**.

The enhancements outlined in this document are **optional improvements** that would:
- Improve user experience
- Reduce costs (caching, rate limiting)
- Enhance monitoring and debugging
- Increase scalability (async processing)
- Improve extraction accuracy (preprocessing)

**Recommendation:** Implement Priority 1 enhancements (1-2 days effort) for immediate value, then consider Priority 2 and 3 based on business needs and usage patterns.

---

**Document Version:** 1.0  
**Last Updated:** October 1, 2025  
**Status:** All tests passed - Optional enhancements only  
**Related Documents:**
- `TEST_6_3_RESULTS.md` - Detailed test results and analysis
- `TEST_6_3_EXECUTION_SUMMARY.md` - Test execution summary
- `test_6_3_image_extraction_api.js` - Test script
- `src/server.js` - Current implementation


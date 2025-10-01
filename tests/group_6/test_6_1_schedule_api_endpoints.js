/**
 * Test 6.1: Schedule API Endpoints
 * 
 * This test validates the schedule API endpoints using direct HTTP requests.
 * Tests authentication, data validation, and error handling.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Test configuration
const SERVER_URL = 'http://localhost:3000';
const TEST_RESULTS = {
    timestamp: new Date().toISOString(),
    testName: 'Test 6.1: Schedule API Endpoints',
    results: [],
    summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        errors: []
    }
};

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const protocol = options.protocol || 'http';
        const client = protocol === 'https' ? https : http;
        
        const req = client.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const jsonBody = body ? JSON.parse(body) : {};
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: jsonBody,
                        rawBody: body
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: body,
                        rawBody: body
                    });
                }
            });
        });
        
        req.on('error', reject);
        
        if (data) {
            req.write(typeof data === 'string' ? data : JSON.stringify(data));
        }
        
        req.end();
    });
}

// Test result helper
function recordTest(testName, passed, details, expected, actual) {
    TEST_RESULTS.summary.totalTests++;
    if (passed) {
        TEST_RESULTS.summary.passed++;
    } else {
        TEST_RESULTS.summary.failed++;
        TEST_RESULTS.summary.errors.push({
            test: testName,
            expected,
            actual,
            details
        });
    }
    
    TEST_RESULTS.results.push({
        test: testName,
        passed,
        details,
        expected,
        actual,
        timestamp: new Date().toISOString()
    });
    
    console.log(`${passed ? '✓' : '✗'} ${testName}: ${details}`);
}

// Test 1: GET /api/config endpoint
async function testConfigEndpoint() {
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/config',
            method: 'GET'
        });
        
        const passed = response.statusCode === 200 && 
                      response.body.SUPABASE_URL && 
                      response.body.SUPABASE_ANON_KEY;
        
        recordTest(
            'GET /api/config',
            passed,
            `Status: ${response.statusCode}, Contains config data: ${!!response.body.SUPABASE_URL}`,
            '200 status with SUPABASE_URL and SUPABASE_ANON_KEY',
            `Status: ${response.statusCode}, Body: ${JSON.stringify(response.body)}`
        );
    } catch (error) {
        recordTest(
            'GET /api/config',
            false,
            `Error: ${error.message}`,
            'Successful response',
            `Error: ${error.message}`
        );
    }
}

// Test 2: GET /api/schedule without authentication
async function testScheduleGetNoAuth() {
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/schedule',
            method: 'GET'
        });
        
        const passed = response.statusCode === 401 && 
                      response.body.error === 'No token provided';
        
        recordTest(
            'GET /api/schedule (no auth)',
            passed,
            `Status: ${response.statusCode}, Error: ${response.body.error}`,
            '401 status with "No token provided" error',
            `Status: ${response.statusCode}, Error: ${response.body.error}`
        );
    } catch (error) {
        recordTest(
            'GET /api/schedule (no auth)',
            false,
            `Error: ${error.message}`,
            '401 status with authentication error',
            `Error: ${error.message}`
        );
    }
}

// Test 3: GET /api/schedule with invalid token
async function testScheduleGetInvalidToken() {
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/schedule',
            method: 'GET',
            headers: {
                'Authorization': 'Bearer invalid_token'
            }
        });
        
        const passed = response.statusCode === 401 && 
                      response.body.error === 'Invalid token';
        
        recordTest(
            'GET /api/schedule (invalid token)',
            passed,
            `Status: ${response.statusCode}, Error: ${response.body.error}`,
            '401 status with "Invalid token" error',
            `Status: ${response.statusCode}, Error: ${response.body.error}`
        );
    } catch (error) {
        recordTest(
            'GET /api/schedule (invalid token)',
            false,
            `Error: ${error.message}`,
            '401 status with invalid token error',
            `Error: ${error.message}`
        );
    }
}

// Test 4: POST /api/schedule without authentication
async function testSchedulePostNoAuth() {
    try {
        const testData = {
            weekdays: {
                Monday: [{
                    grade: "6A",
                    startTime: "08:00",
                    endTime: "08:45",
                    subject: "Class"
                }]
            }
        };
        
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/schedule',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, testData);
        
        const passed = response.statusCode === 401 && 
                      response.body.error === 'No token provided';
        
        recordTest(
            'POST /api/schedule (no auth)',
            passed,
            `Status: ${response.statusCode}, Error: ${response.body.error}`,
            '401 status with "No token provided" error',
            `Status: ${response.statusCode}, Error: ${response.body.error}`
        );
    } catch (error) {
        recordTest(
            'POST /api/schedule (no auth)',
            false,
            `Error: ${error.message}`,
            '401 status with authentication error',
            `Error: ${error.message}`
        );
    }
}

// Test 5: POST /api/schedule with invalid token
async function testSchedulePostInvalidToken() {
    try {
        const testData = {
            weekdays: {
                Monday: [{
                    grade: "6A",
                    startTime: "08:00",
                    endTime: "08:45",
                    subject: "Class"
                }]
            }
        };
        
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/schedule',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer invalid_token'
            }
        }, testData);
        
        const passed = response.statusCode === 401 && 
                      response.body.error === 'Invalid token';
        
        recordTest(
            'POST /api/schedule (invalid token)',
            passed,
            `Status: ${response.statusCode}, Error: ${response.body.error}`,
            '401 status with "Invalid token" error',
            `Status: ${response.statusCode}, Error: ${response.body.error}`
        );
    } catch (error) {
        recordTest(
            'POST /api/schedule (invalid token)',
            false,
            `Error: ${error.message}`,
            '401 status with invalid token error',
            `Error: ${error.message}`
        );
    }
}

// Test 6: POST /api/schedule with malformed JSON
async function testSchedulePostMalformedJson() {
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/schedule',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer invalid_token'
            }
        }, 'invalid json');
        
        const passed = response.statusCode === 401 && 
                      response.body.error === 'Invalid token';
        
        recordTest(
            'POST /api/schedule (malformed JSON)',
            passed,
            `Status: ${response.statusCode}, Error: ${response.body.error}`,
            '401 status (auth checked before JSON parsing)',
            `Status: ${response.statusCode}, Error: ${response.body.error}`
        );
    } catch (error) {
        recordTest(
            'POST /api/schedule (malformed JSON)',
            false,
            `Error: ${error.message}`,
            '401 status with authentication error',
            `Error: ${error.message}`
        );
    }
}

// Test 7: GET /api/search/analytics without authentication
async function testSearchAnalyticsNoAuth() {
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/search/analytics',
            method: 'GET'
        });
        
        const passed = response.statusCode === 401 && 
                      response.body.error === 'No token provided';
        
        recordTest(
            'GET /api/search/analytics (no auth)',
            passed,
            `Status: ${response.statusCode}, Error: ${response.body.error}`,
            '401 status with "No token provided" error',
            `Status: ${response.statusCode}, Error: ${response.body.error}`
        );
    } catch (error) {
        recordTest(
            'GET /api/search/analytics (no auth)',
            false,
            `Error: ${error.message}`,
            '401 status with authentication error',
            `Error: ${error.message}`
        );
    }
}

// Test 8: POST /api/search without authentication
async function testSearchPostNoAuth() {
    try {
        const testData = {
            searchText: "test",
            grades: ["6A"],
            subjects: ["Class"],
            days: ["Monday"]
        };
        
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/search',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, testData);
        
        const passed = response.statusCode === 401 && 
                      response.body.error === 'No token provided';
        
        recordTest(
            'POST /api/search (no auth)',
            passed,
            `Status: ${response.statusCode}, Error: ${response.body.error}`,
            '401 status with "No token provided" error',
            `Status: ${response.statusCode}, Error: ${response.body.error}`
        );
    } catch (error) {
        recordTest(
            'POST /api/search (no auth)',
            false,
            `Error: ${error.message}`,
            '401 status with authentication error',
            `Error: ${error.message}`
        );
    }
}

// Test 9: POST /api/schedule/extract without authentication
async function testScheduleExtractNoAuth() {
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/schedule/extract',
            method: 'POST'
        });
        
        const passed = response.statusCode === 401 && 
                      response.body.error === 'No token provided';
        
        recordTest(
            'POST /api/schedule/extract (no auth)',
            passed,
            `Status: ${response.statusCode}, Error: ${response.body.error}`,
            '401 status with "No token provided" error',
            `Status: ${response.statusCode}, Error: ${response.body.error}`
        );
    } catch (error) {
        recordTest(
            'POST /api/schedule/extract (no auth)',
            false,
            `Error: ${error.message}`,
            '401 status with authentication error',
            `Error: ${error.message}`
        );
    }
}

// Test 10: Test response format consistency
async function testResponseFormatConsistency() {
    try {
        // Test multiple endpoints to ensure consistent response format
        const configResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/config',
            method: 'GET'
        });
        
        const scheduleResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/schedule',
            method: 'GET'
        });
        
        const passed = configResponse.headers['content-type'] === 'application/json; charset=utf-8' &&
                      scheduleResponse.headers['content-type'] === 'application/json; charset=utf-8';
        
        recordTest(
            'Response format consistency',
            passed,
            `Config: ${configResponse.headers['content-type']}, Schedule: ${scheduleResponse.headers['content-type']}`,
            'All responses have application/json; charset=utf-8 content-type',
            `Config: ${configResponse.headers['content-type']}, Schedule: ${scheduleResponse.headers['content-type']}`
        );
    } catch (error) {
        recordTest(
            'Response format consistency',
            false,
            `Error: ${error.message}`,
            'Consistent JSON response format',
            `Error: ${error.message}`
        );
    }
}

// Main test execution
async function runAllTests() {
    console.log('Starting Test 6.1: Schedule API Endpoints\n');
    
    await testConfigEndpoint();
    await testScheduleGetNoAuth();
    await testScheduleGetInvalidToken();
    await testSchedulePostNoAuth();
    await testSchedulePostInvalidToken();
    await testSchedulePostMalformedJson();
    await testSearchAnalyticsNoAuth();
    await testSearchPostNoAuth();
    await testScheduleExtractNoAuth();
    await testResponseFormatConsistency();
    
    // Generate summary
    console.log('\n' + '='.repeat(50));
    console.log('TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${TEST_RESULTS.summary.totalTests}`);
    console.log(`Passed: ${TEST_RESULTS.summary.passed}`);
    console.log(`Failed: ${TEST_RESULTS.summary.failed}`);
    console.log(`Success Rate: ${((TEST_RESULTS.summary.passed / TEST_RESULTS.summary.totalTests) * 100).toFixed(1)}%`);
    
    if (TEST_RESULTS.summary.errors.length > 0) {
        console.log('\nFAILED TESTS:');
        TEST_RESULTS.summary.errors.forEach(error => {
            console.log(`- ${error.test}: ${error.details}`);
        });
    }
    
    // Save results
    const resultsPath = path.join(__dirname, `test_6_1_results_${Date.now()}.json`);
    fs.writeFileSync(resultsPath, JSON.stringify(TEST_RESULTS, null, 2));
    console.log(`\nResults saved to: ${resultsPath}`);
    
    return TEST_RESULTS;
}

// Export for use in other modules
module.exports = {
    runAllTests,
    makeRequest,
    recordTest
};

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests().catch(console.error);
}

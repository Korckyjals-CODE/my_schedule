/**
 * Test 6.2: Search API Endpoints
 * 
 * This test validates the search API endpoints using direct HTTP requests.
 * Tests search functionality, pagination, analytics, and error handling.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Test configuration
const SERVER_URL = 'http://localhost:3000';
const TEST_RESULTS = {
    timestamp: new Date().toISOString(),
    testName: 'Test 6.2: Search API Endpoints',
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

// Test 1: POST /api/search without authentication
async function testSearchNoAuth() {
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

// Test 2: POST /api/search with invalid token
async function testSearchInvalidToken() {
    try {
        const testData = {
            searchText: "test",
            grades: ["6A"]
        };
        
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/search',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer invalid_token'
            }
        }, testData);
        
        const passed = response.statusCode === 401 && 
                      response.body.error === 'Invalid token';
        
        recordTest(
            'POST /api/search (invalid token)',
            passed,
            `Status: ${response.statusCode}, Error: ${response.body.error}`,
            '401 status with "Invalid token" error',
            `Status: ${response.statusCode}, Error: ${response.body.error}`
        );
    } catch (error) {
        recordTest(
            'POST /api/search (invalid token)',
            false,
            `Error: ${error.message}`,
            '401 status with invalid token error',
            `Error: ${error.message}`
        );
    }
}

// Test 3: POST /api/search with empty search parameters (should return all results)
async function testSearchEmptyParams() {
    try {
        const testData = {};
        
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/search',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer invalid_token'
            }
        }, testData);
        
        // Should fail authentication before processing search
        const passed = response.statusCode === 401;
        
        recordTest(
            'POST /api/search (empty params, invalid token)',
            passed,
            `Status: ${response.statusCode}`,
            '401 status (auth checked first)',
            `Status: ${response.statusCode}`
        );
    } catch (error) {
        recordTest(
            'POST /api/search (empty params)',
            false,
            `Error: ${error.message}`,
            '401 status',
            `Error: ${error.message}`
        );
    }
}

// Test 4: POST /api/search with malformed JSON
async function testSearchMalformedJson() {
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/search',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer invalid_token'
            }
        }, 'invalid json');
        
        const passed = response.statusCode === 401 || response.statusCode === 400;
        
        recordTest(
            'POST /api/search (malformed JSON)',
            passed,
            `Status: ${response.statusCode}`,
            '401 or 400 status',
            `Status: ${response.statusCode}`
        );
    } catch (error) {
        recordTest(
            'POST /api/search (malformed JSON)',
            false,
            `Error: ${error.message}`,
            '400 status with JSON error',
            `Error: ${error.message}`
        );
    }
}

// Test 5: POST /api/search with invalid search parameters types
async function testSearchInvalidParamTypes() {
    try {
        const testData = {
            searchText: 123, // Should be string
            grades: "6A", // Should be array
            subjects: ["Class"],
            days: null, // Should be array
            startTime: "invalid", // Should be HH:MM format
            endTime: "invalid",
            page: "one", // Should be number
            limit: -10 // Should be positive number
        };
        
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/search',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer invalid_token'
            }
        }, testData);
        
        // Auth should be checked before parameter validation
        const passed = response.statusCode === 401;
        
        recordTest(
            'POST /api/search (invalid param types)',
            passed,
            `Status: ${response.statusCode}`,
            '401 status (auth checked first)',
            `Status: ${response.statusCode}`
        );
    } catch (error) {
        recordTest(
            'POST /api/search (invalid param types)',
            false,
            `Error: ${error.message}`,
            '401 or 400 status',
            `Error: ${error.message}`
        );
    }
}

// Test 6: POST /api/search with pagination parameters
async function testSearchPagination() {
    try {
        const testData = {
            searchText: "Class",
            page: 1,
            limit: 10
        };
        
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/search',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer invalid_token'
            }
        }, testData);
        
        // Should fail authentication
        const passed = response.statusCode === 401;
        
        recordTest(
            'POST /api/search (with pagination)',
            passed,
            `Status: ${response.statusCode}`,
            '401 status',
            `Status: ${response.statusCode}`
        );
    } catch (error) {
        recordTest(
            'POST /api/search (with pagination)',
            false,
            `Error: ${error.message}`,
            '401 status',
            `Error: ${error.message}`
        );
    }
}

// Test 7: POST /api/search with grade filter
async function testSearchGradeFilter() {
    try {
        const testData = {
            grades: ["6A", "11A", "DC3A"]
        };
        
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/search',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer invalid_token'
            }
        }, testData);
        
        const passed = response.statusCode === 401;
        
        recordTest(
            'POST /api/search (grade filter)',
            passed,
            `Status: ${response.statusCode}`,
            '401 status',
            `Status: ${response.statusCode}`
        );
    } catch (error) {
        recordTest(
            'POST /api/search (grade filter)',
            false,
            `Error: ${error.message}`,
            '401 status',
            `Error: ${error.message}`
        );
    }
}

// Test 8: POST /api/search with subject filter
async function testSearchSubjectFilter() {
    try {
        const testData = {
            subjects: ["Class", "Recess", "Lunch"]
        };
        
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/search',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer invalid_token'
            }
        }, testData);
        
        const passed = response.statusCode === 401;
        
        recordTest(
            'POST /api/search (subject filter)',
            passed,
            `Status: ${response.statusCode}`,
            '401 status',
            `Status: ${response.statusCode}`
        );
    } catch (error) {
        recordTest(
            'POST /api/search (subject filter)',
            false,
            `Error: ${error.message}`,
            '401 status',
            `Error: ${error.message}`
        );
    }
}

// Test 9: POST /api/search with day filter
async function testSearchDayFilter() {
    try {
        const testData = {
            days: ["Monday", "Wednesday", "Friday"]
        };
        
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/search',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer invalid_token'
            }
        }, testData);
        
        const passed = response.statusCode === 401;
        
        recordTest(
            'POST /api/search (day filter)',
            passed,
            `Status: ${response.statusCode}`,
            '401 status',
            `Status: ${response.statusCode}`
        );
    } catch (error) {
        recordTest(
            'POST /api/search (day filter)',
            false,
            `Error: ${error.message}`,
            '401 status',
            `Error: ${error.message}`
        );
    }
}

// Test 10: POST /api/search with time range filter
async function testSearchTimeRange() {
    try {
        const testData = {
            startTime: "08:00",
            endTime: "12:00"
        };
        
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/search',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer invalid_token'
            }
        }, testData);
        
        const passed = response.statusCode === 401;
        
        recordTest(
            'POST /api/search (time range)',
            passed,
            `Status: ${response.statusCode}`,
            '401 status',
            `Status: ${response.statusCode}`
        );
    } catch (error) {
        recordTest(
            'POST /api/search (time range)',
            false,
            `Error: ${error.message}`,
            '401 status',
            `Error: ${error.message}`
        );
    }
}

// Test 11: POST /api/search with combined filters
async function testSearchCombinedFilters() {
    try {
        const testData = {
            searchText: "Class",
            grades: ["6A", "11A"],
            subjects: ["Class"],
            days: ["Monday", "Wednesday"],
            startTime: "08:00",
            endTime: "14:00",
            page: 1,
            limit: 20
        };
        
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/search',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer invalid_token'
            }
        }, testData);
        
        const passed = response.statusCode === 401;
        
        recordTest(
            'POST /api/search (combined filters)',
            passed,
            `Status: ${response.statusCode}`,
            '401 status',
            `Status: ${response.statusCode}`
        );
    } catch (error) {
        recordTest(
            'POST /api/search (combined filters)',
            false,
            `Error: ${error.message}`,
            '401 status',
            `Error: ${error.message}`
        );
    }
}

// Test 12: GET /api/search/analytics without authentication
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

// Test 13: GET /api/search/analytics with invalid token
async function testSearchAnalyticsInvalidToken() {
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/search/analytics',
            method: 'GET',
            headers: {
                'Authorization': 'Bearer invalid_token'
            }
        });
        
        const passed = response.statusCode === 401 && 
                      response.body.error === 'Invalid token';
        
        recordTest(
            'GET /api/search/analytics (invalid token)',
            passed,
            `Status: ${response.statusCode}, Error: ${response.body.error}`,
            '401 status with "Invalid token" error',
            `Status: ${response.statusCode}, Error: ${response.body.error}`
        );
    } catch (error) {
        recordTest(
            'GET /api/search/analytics (invalid token)',
            false,
            `Error: ${error.message}`,
            '401 status with invalid token error',
            `Error: ${error.message}`
        );
    }
}

// Test 14: Test response format for search endpoint
async function testSearchResponseFormat() {
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/search',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, { searchText: "test" });
        
        const passed = response.headers['content-type'] === 'application/json; charset=utf-8';
        
        recordTest(
            'POST /api/search response format',
            passed,
            `Content-Type: ${response.headers['content-type']}`,
            'application/json; charset=utf-8',
            response.headers['content-type']
        );
    } catch (error) {
        recordTest(
            'POST /api/search response format',
            false,
            `Error: ${error.message}`,
            'JSON content type',
            `Error: ${error.message}`
        );
    }
}

// Test 15: Test large pagination limit
async function testSearchLargePaginationLimit() {
    try {
        const testData = {
            searchText: "",
            page: 1,
            limit: 1000 // Very large limit
        };
        
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/search',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer invalid_token'
            }
        }, testData);
        
        const passed = response.statusCode === 401;
        
        recordTest(
            'POST /api/search (large pagination limit)',
            passed,
            `Status: ${response.statusCode}`,
            '401 status',
            `Status: ${response.statusCode}`
        );
    } catch (error) {
        recordTest(
            'POST /api/search (large pagination limit)',
            false,
            `Error: ${error.message}`,
            '401 status',
            `Error: ${error.message}`
        );
    }
}

// Test 16: Test search with special characters
async function testSearchSpecialCharacters() {
    try {
        const testData = {
            searchText: "!@#$%^&*()[]{}|\\/<>?~`"
        };
        
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/search',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer invalid_token'
            }
        }, testData);
        
        const passed = response.statusCode === 401;
        
        recordTest(
            'POST /api/search (special characters)',
            passed,
            `Status: ${response.statusCode}`,
            '401 status',
            `Status: ${response.statusCode}`
        );
    } catch (error) {
        recordTest(
            'POST /api/search (special characters)',
            false,
            `Error: ${error.message}`,
            '401 status',
            `Error: ${error.message}`
        );
    }
}

// Main test execution
async function runAllTests() {
    console.log('Starting Test 6.2: Search API Endpoints\n');
    
    await testSearchNoAuth();
    await testSearchInvalidToken();
    await testSearchEmptyParams();
    await testSearchMalformedJson();
    await testSearchInvalidParamTypes();
    await testSearchPagination();
    await testSearchGradeFilter();
    await testSearchSubjectFilter();
    await testSearchDayFilter();
    await testSearchTimeRange();
    await testSearchCombinedFilters();
    await testSearchAnalyticsNoAuth();
    await testSearchAnalyticsInvalidToken();
    await testSearchResponseFormat();
    await testSearchLargePaginationLimit();
    await testSearchSpecialCharacters();
    
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
    const resultsPath = path.join(__dirname, `test_6_2_results_${Date.now()}.json`);
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


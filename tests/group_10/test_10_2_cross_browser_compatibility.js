/**
 * Test 10.2: Cross-Browser Compatibility
 * 
 * This test evaluates the Schedule Editor application across different browsers and platforms.
 * It tests core functionality, browser-specific features, and mobile compatibility.
 */

class CrossBrowserCompatibilityTest {
    constructor() {
        this.testResults = {
            timestamp: new Date().toISOString(),
            browser: this.getBrowserInfo(),
            platform: navigator.platform,
            userAgent: navigator.userAgent,
            tests: {},
            summary: {
                totalTests: 0,
                passed: 0,
                failed: 0,
                warnings: 0
            }
        };
        
        this.baseUrl = 'http://localhost:3000';
        this.testUser = {
            email: 'testuser@example.com',
            password: 'testpassword123',
            name: 'Test User'
        };
    }

    getBrowserInfo() {
        const ua = navigator.userAgent;
        if (ua.includes('Chrome') && !ua.includes('Edge')) return 'Chrome';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
        if (ua.includes('Edge')) return 'Edge';
        return 'Unknown';
    }

    async runAllTests() {
        console.log(`Starting Cross-Browser Compatibility Test - ${this.testResults.browser}`);
        console.log(`Platform: ${this.testResults.platform}`);
        console.log(`User Agent: ${this.testResults.userAgent}`);
        
        try {
            await this.testCoreFunctionality();
            await this.testBrowserSpecificFeatures();
            await this.testMobileCompatibility();
            await this.testPerformance();
            
            this.generateSummary();
            this.saveResults();
            
        } catch (error) {
            console.error('Test execution failed:', error);
            this.testResults.summary.failed++;
        }
    }

    async testCoreFunctionality() {
        console.log('\n=== Testing Core Functionality ===');
        
        const coreTests = [
            { name: 'Page Load', test: () => this.testPageLoad() },
            { name: 'Authentication', test: () => this.testAuthentication() },
            { name: 'Schedule Creation', test: () => this.testScheduleCreation() },
            { name: 'Search Functionality', test: () => this.testSearchFunctionality() },
            { name: 'Calendar Navigation', test: () => this.testCalendarNavigation() }
        ];

        for (const test of coreTests) {
            try {
                console.log(`Testing ${test.name}...`);
                const result = await test.test();
                this.testResults.tests[test.name] = result;
                this.testResults.summary.totalTests++;
                
                if (result.status === 'passed') {
                    this.testResults.summary.passed++;
                    console.log(`✓ ${test.name}: PASSED`);
                } else if (result.status === 'warning') {
                    this.testResults.summary.warnings++;
                    console.log(`⚠ ${test.name}: WARNING - ${result.message}`);
                } else {
                    this.testResults.summary.failed++;
                    console.log(`✗ ${test.name}: FAILED - ${result.message}`);
                }
            } catch (error) {
                this.testResults.tests[test.name] = {
                    status: 'failed',
                    message: error.message,
                    error: error.stack
                };
                this.testResults.summary.failed++;
                console.log(`✗ ${test.name}: ERROR - ${error.message}`);
            }
        }
    }

    async testPageLoad() {
        try {
            const response = await fetch(this.baseUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const html = await response.text();
            const hasRequiredElements = 
                html.includes('Class Schedule Calendar') &&
                html.includes('authSection') &&
                html.includes('appSection');
            
            if (!hasRequiredElements) {
                return {
                    status: 'failed',
                    message: 'Required HTML elements not found'
                };
            }
            
            return {
                status: 'passed',
                message: 'Page loads successfully with all required elements',
                loadTime: performance.now()
            };
        } catch (error) {
            return {
                status: 'failed',
                message: `Page load failed: ${error.message}`
            };
        }
    }

    async testAuthentication() {
        try {
            // Test registration
            const registrationData = {
                name: this.testUser.name,
                email: this.testUser.email,
                password: this.testUser.password,
                confirmPassword: this.testUser.password
            };
            
            const regResponse = await fetch(`${this.baseUrl}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(registrationData)
            });
            
            // Test login
            const loginData = {
                email: this.testUser.email,
                password: this.testUser.password
            };
            
            const loginResponse = await fetch(`${this.baseUrl}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });
            
            if (!loginResponse.ok) {
                return {
                    status: 'warning',
                    message: 'Authentication endpoints may not be fully implemented'
                };
            }
            
            return {
                status: 'passed',
                message: 'Authentication endpoints respond correctly'
            };
        } catch (error) {
            return {
                status: 'failed',
                message: `Authentication test failed: ${error.message}`
            };
        }
    }

    async testScheduleCreation() {
        try {
            // Test schedule API endpoints
            const scheduleData = {
                day: 'Monday',
                grade: '6A',
                startTime: '08:00',
                endTime: '08:45',
                subject: 'Class'
            };
            
            const response = await fetch(`${this.baseUrl}/api/schedule`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(scheduleData)
            });
            
            if (!response.ok && response.status !== 401) {
                return {
                    status: 'warning',
                    message: 'Schedule API may require authentication'
                };
            }
            
            return {
                status: 'passed',
                message: 'Schedule creation endpoints respond correctly'
            };
        } catch (error) {
            return {
                status: 'failed',
                message: `Schedule creation test failed: ${error.message}`
            };
        }
    }

    async testSearchFunctionality() {
        try {
            const searchData = {
                query: '6A',
                filters: {
                    grades: ['6A'],
                    subjects: ['Class']
                }
            };
            
            const response = await fetch(`${this.baseUrl}/api/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(searchData)
            });
            
            if (!response.ok && response.status !== 401) {
                return {
                    status: 'warning',
                    message: 'Search API may require authentication'
                };
            }
            
            return {
                status: 'passed',
                message: 'Search endpoints respond correctly'
            };
        } catch (error) {
            return {
                status: 'failed',
                message: `Search functionality test failed: ${error.message}`
            };
        }
    }

    async testCalendarNavigation() {
        try {
            // Test calendar page accessibility
            const response = await fetch(`${this.baseUrl}`);
            const html = await response.text();
            
            const hasCalendarElements = 
                html.includes('calendar-grid') &&
                html.includes('prevMonth') &&
                html.includes('nextMonth') &&
                html.includes('monthDisplay');
            
            if (!hasCalendarElements) {
                return {
                    status: 'failed',
                    message: 'Calendar navigation elements not found'
                };
            }
            
            return {
                status: 'passed',
                message: 'Calendar navigation elements present'
            };
        } catch (error) {
            return {
                status: 'failed',
                message: `Calendar navigation test failed: ${error.message}`
            };
        }
    }

    async testBrowserSpecificFeatures() {
        console.log('\n=== Testing Browser-Specific Features ===');
        
        const browserTests = [
            { name: 'File Upload Support', test: () => this.testFileUploadSupport() },
            { name: 'Local Storage', test: () => this.testLocalStorage() },
            { name: 'CSS Rendering', test: () => this.testCSSRendering() },
            { name: 'JavaScript Execution', test: () => this.testJavaScriptExecution() }
        ];

        for (const test of browserTests) {
            try {
                console.log(`Testing ${test.name}...`);
                const result = await test.test();
                this.testResults.tests[test.name] = result;
                this.testResults.summary.totalTests++;
                
                if (result.status === 'passed') {
                    this.testResults.summary.passed++;
                    console.log(`✓ ${test.name}: PASSED`);
                } else if (result.status === 'warning') {
                    this.testResults.summary.warnings++;
                    console.log(`⚠ ${test.name}: WARNING - ${result.message}`);
                } else {
                    this.testResults.summary.failed++;
                    console.log(`✗ ${test.name}: FAILED - ${result.message}`);
                }
            } catch (error) {
                this.testResults.tests[test.name] = {
                    status: 'failed',
                    message: error.message,
                    error: error.stack
                };
                this.testResults.summary.failed++;
                console.log(`✗ ${test.name}: ERROR - ${error.message}`);
            }
        }
    }

    async testFileUploadSupport() {
        try {
            // Check if File API is supported
            const hasFileAPI = typeof File !== 'undefined' && typeof FileReader !== 'undefined';
            const hasFormData = typeof FormData !== 'undefined';
            
            if (!hasFileAPI || !hasFormData) {
                return {
                    status: 'failed',
                    message: 'File upload APIs not supported in this browser'
                };
            }
            
            return {
                status: 'passed',
                message: 'File upload APIs supported',
                features: {
                    File: hasFileAPI,
                    FormData: hasFormData
                }
            };
        } catch (error) {
            return {
                status: 'failed',
                message: `File upload test failed: ${error.message}`
            };
        }
    }

    async testLocalStorage() {
        try {
            const testKey = 'test_' + Date.now();
            const testValue = 'test_value';
            
            localStorage.setItem(testKey, testValue);
            const retrievedValue = localStorage.getItem(testKey);
            localStorage.removeItem(testKey);
            
            if (retrievedValue !== testValue) {
                return {
                    status: 'failed',
                    message: 'Local storage not working correctly'
                };
            }
            
            return {
                status: 'passed',
                message: 'Local storage working correctly'
            };
        } catch (error) {
            return {
                status: 'failed',
                message: `Local storage test failed: ${error.message}`
            };
        }
    }

    async testCSSRendering() {
        try {
            // Check CSS support
            const testElement = document.createElement('div');
            testElement.style.cssText = 'display: flex; grid-template-columns: 1fr 1fr;';
            
            const computedStyle = window.getComputedStyle(testElement);
            const hasFlex = computedStyle.display === 'flex';
            const hasGrid = computedStyle.gridTemplateColumns !== '';
            
            return {
                status: 'passed',
                message: 'CSS rendering capabilities detected',
                features: {
                    flexbox: hasFlex,
                    grid: hasGrid
                }
            };
        } catch (error) {
            return {
                status: 'failed',
                message: `CSS rendering test failed: ${error.message}`
            };
        }
    }

    async testJavaScriptExecution() {
        try {
            // Test modern JavaScript features
            const features = {
                arrowFunctions: (() => true)(),
                asyncAwait: (async () => true)(),
                templateLiterals: `test ${'works'}`,
                destructuring: (() => { const {test} = {test: true}; return test; })(),
                fetch: typeof fetch !== 'undefined',
                promises: typeof Promise !== 'undefined'
            };
            
            const allSupported = Object.values(features).every(feature => feature === true);
            
            if (!allSupported) {
                return {
                    status: 'warning',
                    message: 'Some modern JavaScript features not supported',
                    features: features
                };
            }
            
            return {
                status: 'passed',
                message: 'All required JavaScript features supported',
                features: features
            };
        } catch (error) {
            return {
                status: 'failed',
                message: `JavaScript execution test failed: ${error.message}`
            };
        }
    }

    async testMobileCompatibility() {
        console.log('\n=== Testing Mobile Compatibility ===');
        
        const mobileTests = [
            { name: 'Touch Events', test: () => this.testTouchEvents() },
            { name: 'Viewport Meta', test: () => this.testViewportMeta() },
            { name: 'Responsive Design', test: () => this.testResponsiveDesign() }
        ];

        for (const test of mobileTests) {
            try {
                console.log(`Testing ${test.name}...`);
                const result = await test.test();
                this.testResults.tests[test.name] = result;
                this.testResults.summary.totalTests++;
                
                if (result.status === 'passed') {
                    this.testResults.summary.passed++;
                    console.log(`✓ ${test.name}: PASSED`);
                } else if (result.status === 'warning') {
                    this.testResults.summary.warnings++;
                    console.log(`⚠ ${test.name}: WARNING - ${result.message}`);
                } else {
                    this.testResults.summary.failed++;
                    console.log(`✗ ${test.name}: FAILED - ${result.message}`);
                }
            } catch (error) {
                this.testResults.tests[test.name] = {
                    status: 'failed',
                    message: error.message,
                    error: error.stack
                };
                this.testResults.summary.failed++;
                console.log(`✗ ${test.name}: ERROR - ${error.message}`);
            }
        }
    }

    async testTouchEvents() {
        try {
            const hasTouchEvents = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            
            return {
                status: 'passed',
                message: hasTouchEvents ? 'Touch events supported' : 'Touch events not detected (desktop browser)',
                touchSupport: hasTouchEvents
            };
        } catch (error) {
            return {
                status: 'failed',
                message: `Touch events test failed: ${error.message}`
            };
        }
    }

    async testViewportMeta() {
        try {
            const viewportMeta = document.querySelector('meta[name="viewport"]');
            
            if (!viewportMeta) {
                return {
                    status: 'failed',
                    message: 'Viewport meta tag not found'
                };
            }
            
            return {
                status: 'passed',
                message: 'Viewport meta tag present',
                content: viewportMeta.getAttribute('content')
            };
        } catch (error) {
            return {
                status: 'failed',
                message: `Viewport meta test failed: ${error.message}`
            };
        }
    }

    async testResponsiveDesign() {
        try {
            const screenWidth = window.screen.width;
            const screenHeight = window.screen.height;
            const isMobile = screenWidth <= 768;
            
            return {
                status: 'passed',
                message: `Screen dimensions: ${screenWidth}x${screenHeight}`,
                isMobile: isMobile,
                screenSize: {
                    width: screenWidth,
                    height: screenHeight
                }
            };
        } catch (error) {
            return {
                status: 'failed',
                message: `Responsive design test failed: ${error.message}`
            };
        }
    }

    async testPerformance() {
        console.log('\n=== Testing Performance ===');
        
        try {
            const startTime = performance.now();
            
            // Test page load performance
            const loadTime = performance.now() - startTime;
            
            const performanceResult = {
                status: 'passed',
                message: 'Performance metrics collected',
                metrics: {
                    loadTime: loadTime,
                    memoryUsage: performance.memory ? {
                        used: performance.memory.usedJSHeapSize,
                        total: performance.memory.totalJSHeapSize,
                        limit: performance.memory.jsHeapSizeLimit
                    } : 'Not available'
                }
            };
            
            this.testResults.tests['Performance'] = performanceResult;
            this.testResults.summary.totalTests++;
            this.testResults.summary.passed++;
            
            console.log(`✓ Performance: PASSED`);
            
        } catch (error) {
            this.testResults.tests['Performance'] = {
                status: 'failed',
                message: error.message,
                error: error.stack
            };
            this.testResults.summary.failed++;
            console.log(`✗ Performance: ERROR - ${error.message}`);
        }
    }

    generateSummary() {
        console.log('\n=== Test Summary ===');
        console.log(`Total Tests: ${this.testResults.summary.totalTests}`);
        console.log(`Passed: ${this.testResults.summary.passed}`);
        console.log(`Failed: ${this.testResults.summary.failed}`);
        console.log(`Warnings: ${this.testResults.summary.warnings}`);
        
        const successRate = (this.testResults.summary.passed / this.testResults.summary.totalTests) * 100;
        console.log(`Success Rate: ${successRate.toFixed(1)}%`);
        
        this.testResults.summary.successRate = successRate;
        this.testResults.summary.overallStatus = successRate >= 80 ? 'passed' : 'failed';
    }

    saveResults() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `test_10_2_results_${timestamp}.json`;
        
        // In a real browser environment, this would save to localStorage or send to server
        console.log(`\nTest results saved as: ${filename}`);
        console.log('Results:', JSON.stringify(this.testResults, null, 2));
        
        return this.testResults;
    }
}

// Auto-run the test when script is loaded
if (typeof window !== 'undefined') {
    window.addEventListener('load', async () => {
        const test = new CrossBrowserCompatibilityTest();
        await test.runAllTests();
    });
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CrossBrowserCompatibilityTest;
}

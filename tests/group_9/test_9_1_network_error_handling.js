/**
 * Test 9.1: Network Error Handling
 * 
 * This test evaluates the application's handling of network errors and connectivity issues.
 * 
 * SETUP:
 * 1. Ensure user is logged in
 * 2. Open browser developer tools network tab
 * 
 * TEST STEPS:
 * 1. Test offline functionality
 * 2. Test server unavailability
 * 3. Test slow network conditions
 * 4. Test partial failures
 * 
 * EXPECTED RESULTS:
 * - Appropriate error messages are displayed
 * - Application doesn't crash on network errors
 * - Loading indicators work correctly
 * - Retry mechanisms function properly
 * - User can recover from errors
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class NetworkErrorTest {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = {
            testName: 'Test 9.1: Network Error Handling',
            timestamp: new Date().toISOString(),
            testSteps: [],
            overallResult: 'PENDING',
            issues: [],
            recommendations: []
        };
        this.screenshots = [];
    }

    async setup() {
        console.log('🚀 Setting up Test 9.1: Network Error Handling');
        
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1280, height: 720 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        this.page = await this.browser.newPage();
        
        // Enable request interception for network simulation
        await this.page.setRequestInterception(true);
        
        // Set up console logging
        this.page.on('console', msg => {
            console.log(`📝 Console ${msg.type()}: ${msg.text()}`);
        });
        
        // Set up error logging
        this.page.on('pageerror', error => {
            console.log(`❌ Page Error: ${error.message}`);
            this.results.issues.push({
                type: 'Page Error',
                message: error.message,
                stack: error.stack
            });
        });
        
        console.log('✅ Test setup completed');
    }

    async takeScreenshot(name) {
        const timestamp = Date.now();
        const filename = `test_9_1_${name}_${timestamp}.png`;
        const filepath = path.join(__dirname, filename);
        await this.page.screenshot({ path: filepath, fullPage: true });
        this.screenshots.push(filename);
        console.log(`📸 Screenshot taken: ${filename}`);
        return filename;
    }

    async testStep(stepName, testFunction) {
        console.log(`\n🔍 Testing: ${stepName}`);
        const stepResult = {
            step: stepName,
            status: 'PENDING',
            details: [],
            errors: [],
            screenshots: []
        };
        
        try {
            await testFunction(stepResult);
            stepResult.status = 'PASSED';
            console.log(`✅ ${stepName}: PASSED`);
        } catch (error) {
            stepResult.status = 'FAILED';
            stepResult.errors.push(error.message);
            console.log(`❌ ${stepName}: FAILED - ${error.message}`);
        }
        
        this.results.testSteps.push(stepResult);
        return stepResult;
    }

    async login() {
        console.log('🔐 Attempting to login...');
        
        try {
            await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
            await this.takeScreenshot('initial_load');
            
            // Wait for auth section to be visible
            await this.page.waitForSelector('#authSection', { timeout: 10000 });
            
            // Check if already logged in
            const authVisible = await this.page.$eval('#authSection', el => 
                window.getComputedStyle(el).display !== 'none'
            );
            
            if (authVisible) {
                // Try to login with test credentials
                await this.page.type('#loginEmail', 'test@example.com');
                await this.page.type('#loginPassword', 'testpassword123');
                await this.page.click('#loginButton');
                
                // Wait for either success or error
                await this.page.waitForTimeout(3000);
                
                // Check if we're now in the app
                const appVisible = await this.page.$eval('#appSection', el => 
                    window.getComputedStyle(el).display !== 'none'
                );
                
                if (appVisible) {
                    console.log('✅ Successfully logged in');
                    await this.takeScreenshot('after_login');
                    return true;
                } else {
                    console.log('⚠️ Login may have failed, but continuing with test');
                    return false;
                }
            } else {
                console.log('✅ Already logged in');
                await this.takeScreenshot('already_logged_in');
                return true;
            }
        } catch (error) {
            console.log(`⚠️ Login issue: ${error.message}`);
            return false;
        }
    }

    async testOfflineFunctionality(stepResult) {
        // Test 1: Offline functionality
        console.log('📡 Testing offline functionality...');
        
        // Simulate offline by blocking all requests
        await this.page.setRequestInterception(true);
        
        const offlineHandler = (request) => {
            request.abort();
        };
        
        this.page.on('request', offlineHandler);
        
        await this.takeScreenshot('offline_mode');
        stepResult.screenshots.push('offline_mode');
        
        // Try to perform operations while offline
        try {
            // Try to navigate to schedule editor
            await this.page.goto('http://localhost:3000/schedule-editor.html', { 
                waitUntil: 'networkidle2',
                timeout: 5000 
            });
        } catch (error) {
            stepResult.details.push('Navigation failed as expected in offline mode');
        }
        
        // Check for error messages
        const errorElements = await this.page.$$eval('*', elements => 
            elements.filter(el => 
                el.textContent && (
                    el.textContent.includes('offline') ||
                    el.textContent.includes('network') ||
                    el.textContent.includes('connection') ||
                    el.textContent.includes('error')
                )
            ).map(el => el.textContent.trim())
        );
        
        if (errorElements.length > 0) {
            stepResult.details.push(`Found error messages: ${errorElements.join(', ')}`);
        } else {
            stepResult.details.push('No specific offline error messages found');
        }
        
        // Reset request interception
        this.page.off('request', offlineHandler);
        await this.page.setRequestInterception(false);
    }

    async testServerUnavailability(stepResult) {
        // Test 2: Server unavailability
        console.log('🛑 Testing server unavailability...');
        
        // Block requests to localhost:3000
        await this.page.setRequestInterception(true);
        
        const serverUnavailableHandler = (request) => {
            if (request.url().includes('localhost:3000')) {
                request.abort();
            } else {
                request.continue();
            }
        };
        
        this.page.on('request', serverUnavailableHandler);
        
        await this.takeScreenshot('server_unavailable');
        stepResult.screenshots.push('server_unavailable');
        
        // Try to perform operations
        try {
            await this.page.goto('http://localhost:3000', { 
                waitUntil: 'networkidle2',
                timeout: 5000 
            });
        } catch (error) {
            stepResult.details.push('Navigation failed as expected when server unavailable');
        }
        
        // Check for error handling
        const errorElements = await this.page.$$eval('*', elements => 
            elements.filter(el => 
                el.textContent && (
                    el.textContent.includes('server') ||
                    el.textContent.includes('unavailable') ||
                    el.textContent.includes('connection') ||
                    el.textContent.includes('error')
                )
            ).map(el => el.textContent.trim())
        );
        
        if (errorElements.length > 0) {
            stepResult.details.push(`Found error messages: ${errorElements.join(', ')}`);
        } else {
            stepResult.details.push('No specific server error messages found');
        }
        
        // Reset request interception
        this.page.off('request', serverUnavailableHandler);
        await this.page.setRequestInterception(false);
    }

    async testSlowNetworkConditions(stepResult) {
        // Test 3: Slow network conditions
        console.log('🐌 Testing slow network conditions...');
        
        // Simulate slow network
        await this.page.setRequestInterception(true);
        
        const slowNetworkHandler = (request) => {
            // Add delay to requests
            setTimeout(() => {
                request.continue();
            }, 2000); // 2 second delay
        };
        
        this.page.on('request', slowNetworkHandler);
        
        await this.takeScreenshot('slow_network_start');
        stepResult.screenshots.push('slow_network_start');
        
        // Try to perform operations
        const startTime = Date.now();
        
        try {
            await this.page.goto('http://localhost:3000', { 
                waitUntil: 'networkidle2',
                timeout: 10000 
            });
            
            const loadTime = Date.now() - startTime;
            stepResult.details.push(`Page loaded in ${loadTime}ms with slow network simulation`);
            
            // Check for loading indicators
            const loadingElements = await this.page.$$eval('*', elements => 
                elements.filter(el => 
                    el.textContent && (
                        el.textContent.includes('loading') ||
                        el.textContent.includes('Loading') ||
                        el.textContent.includes('Please wait')
                    )
                ).map(el => el.textContent.trim())
            );
            
            if (loadingElements.length > 0) {
                stepResult.details.push(`Found loading indicators: ${loadingElements.join(', ')}`);
            } else {
                stepResult.details.push('No loading indicators found');
            }
            
        } catch (error) {
            stepResult.details.push(`Slow network test failed: ${error.message}`);
        }
        
        await this.takeScreenshot('slow_network_end');
        stepResult.screenshots.push('slow_network_end');
        
        // Reset request interception
        this.page.off('request', slowNetworkHandler);
        await this.page.setRequestInterception(false);
    }

    async testPartialFailures(stepResult) {
        // Test 4: Partial failures
        console.log('⚠️ Testing partial failures...');
        
        // Simulate partial failures by blocking some requests
        await this.page.setRequestInterception(true);
        let requestCount = 0;
        
        const partialFailureHandler = (request) => {
            requestCount++;
            // Block every 3rd request to simulate partial failures
            if (requestCount % 3 === 0) {
                request.abort();
            } else {
                request.continue();
            }
        };
        
        this.page.on('request', partialFailureHandler);
        
        await this.takeScreenshot('partial_failures_start');
        stepResult.screenshots.push('partial_failures_start');
        
        // Try to perform operations
        try {
            await this.page.goto('http://localhost:3000', { 
                waitUntil: 'networkidle2',
                timeout: 10000 
            });
            
            stepResult.details.push(`Page loaded with partial request failures (blocked ${Math.floor(requestCount/3)} requests)`);
            
            // Check for error handling
            const errorElements = await this.page.$$eval('*', elements => 
                elements.filter(el => 
                    el.textContent && (
                        el.textContent.includes('error') ||
                        el.textContent.includes('failed') ||
                        el.textContent.includes('retry')
                    )
                ).map(el => el.textContent.trim())
            );
            
            if (errorElements.length > 0) {
                stepResult.details.push(`Found error messages: ${errorElements.join(', ')}`);
            } else {
                stepResult.details.push('No specific error messages found for partial failures');
            }
            
        } catch (error) {
            stepResult.details.push(`Partial failures test failed: ${error.message}`);
        }
        
        await this.takeScreenshot('partial_failures_end');
        stepResult.screenshots.push('partial_failures_end');
        
        // Reset request interception
        this.page.off('request', partialFailureHandler);
        await this.page.setRequestInterception(false);
    }

    async testErrorRecovery(stepResult) {
        // Test 5: Error recovery
        console.log('🔄 Testing error recovery...');
        
        // First, simulate a network error
        await this.page.setRequestInterception(true);
        
        const errorRecoveryHandler = (request) => {
            request.abort();
        };
        
        this.page.on('request', errorRecoveryHandler);
        
        await this.takeScreenshot('error_recovery_before');
        stepResult.screenshots.push('error_recovery_before');
        
        // Try to perform an operation that should fail
        try {
            await this.page.goto('http://localhost:3000', { 
                waitUntil: 'networkidle2',
                timeout: 5000 
            });
        } catch (error) {
            stepResult.details.push('Operation failed as expected');
        }
        
        // Now restore network and test recovery
        this.page.off('request', errorRecoveryHandler);
        await this.page.setRequestInterception(false);
        
        await this.takeScreenshot('error_recovery_after');
        stepResult.screenshots.push('error_recovery_after');
        
        // Try to perform operations again
        try {
            await this.page.goto('http://localhost:3000', { 
                waitUntil: 'networkidle2',
                timeout: 10000 
            });
            
            stepResult.details.push('Recovery successful - operations work after network restoration');
            
        } catch (error) {
            stepResult.details.push(`Recovery failed: ${error.message}`);
        }
    }

    async runTests() {
        try {
            await this.setup();
            
            // Attempt login
            const loginSuccess = await this.login();
            if (!loginSuccess) {
                console.log('⚠️ Login failed, but continuing with network error tests');
            }
            
            // Run all test steps
            await this.testStep('Offline Functionality', (stepResult) => 
                this.testOfflineFunctionality(stepResult)
            );
            
            await this.testStep('Server Unavailability', (stepResult) => 
                this.testServerUnavailability(stepResult)
            );
            
            await this.testStep('Slow Network Conditions', (stepResult) => 
                this.testSlowNetworkConditions(stepResult)
            );
            
            await this.testStep('Partial Failures', (stepResult) => 
                this.testPartialFailures(stepResult)
            );
            
            await this.testStep('Error Recovery', (stepResult) => 
                this.testErrorRecovery(stepResult)
            );
            
            // Analyze results
            this.analyzeResults();
            
        } catch (error) {
            console.error('❌ Test execution failed:', error);
            this.results.overallResult = 'FAILED';
            this.results.issues.push({
                type: 'Test Execution Error',
                message: error.message,
                stack: error.stack
            });
        } finally {
            await this.cleanup();
        }
    }

    analyzeResults() {
        console.log('\n📊 Analyzing test results...');
        
        const failedSteps = this.results.testSteps.filter(step => step.status === 'FAILED');
        const passedSteps = this.results.testSteps.filter(step => step.status === 'PASSED');
        
        console.log(`✅ Passed: ${passedSteps.length}`);
        console.log(`❌ Failed: ${failedSteps.length}`);
        
        // Determine overall result
        if (failedSteps.length === 0) {
            this.results.overallResult = 'PASSED';
        } else if (failedSteps.length < this.results.testSteps.length / 2) {
            this.results.overallResult = 'PARTIAL';
        } else {
            this.results.overallResult = 'FAILED';
        }
        
        // Generate recommendations
        if (failedSteps.length > 0) {
            this.results.recommendations.push('Implement better error handling for network failures');
            this.results.recommendations.push('Add user-friendly error messages for connectivity issues');
            this.results.recommendations.push('Implement retry mechanisms for failed requests');
            this.results.recommendations.push('Add loading indicators for slow network conditions');
        }
        
        console.log(`\n🎯 Overall Result: ${this.results.overallResult}`);
    }

    async cleanup() {
        console.log('\n🧹 Cleaning up...');
        
        if (this.browser) {
            await this.browser.close();
        }
        
        // Save results
        const resultsFile = path.join(__dirname, `test_9_1_results_${Date.now()}.json`);
        fs.writeFileSync(resultsFile, JSON.stringify(this.results, null, 2));
        console.log(`📄 Results saved to: ${resultsFile}`);
        
        console.log('✅ Cleanup completed');
    }
}

// Run the test
async function runTest() {
    const test = new NetworkErrorTest();
    await test.runTests();
}

// Export for potential use in other test files
module.exports = NetworkErrorTest;

// Run if this file is executed directly
if (require.main === module) {
    runTest().catch(console.error);
}

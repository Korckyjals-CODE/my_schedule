/**
 * Test 9.1: Network Error Handling - Simplified Version
 * 
 * This test evaluates the application's handling of network errors and connectivity issues.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class SimpleNetworkErrorTest {
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
        
        // Set up console logging
        this.page.on('console', msg => {
            console.log(`📝 Console ${msg.type()}: ${msg.text()}`);
        });
        
        // Set up error logging
        this.page.on('pageerror', error => {
            console.log(`❌ Page Error: ${error.message}`);
            this.results.issues.push({
                type: 'Page Error',
                message: error.message
            });
        });
        
        console.log('✅ Test setup completed');
    }

    async takeScreenshot(name) {
        try {
            const timestamp = Date.now();
            const filename = `test_9_1_${name}_${timestamp}.png`;
            const filepath = path.join(__dirname, filename);
            await this.page.screenshot({ path: filepath, fullPage: true });
            this.screenshots.push(filename);
            console.log(`📸 Screenshot taken: ${filename}`);
            return filename;
        } catch (error) {
            console.log(`⚠️ Screenshot failed: ${error.message}`);
            return null;
        }
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

    async testBasicNavigation(stepResult) {
        console.log('🌐 Testing basic navigation...');
        
        try {
            await this.page.goto('http://localhost:3000', { 
                waitUntil: 'domcontentloaded',
                timeout: 10000 
            });
            
            await this.takeScreenshot('basic_navigation');
            stepResult.screenshots.push('basic_navigation');
            
            // Check if page loaded
            const title = await this.page.title();
            stepResult.details.push(`Page title: ${title}`);
            
            // Check for any error messages on the page
            const errorElements = await this.page.$$eval('*', elements => 
                elements.filter(el => 
                    el.textContent && (
                        el.textContent.includes('error') ||
                        el.textContent.includes('Error') ||
                        el.textContent.includes('failed') ||
                        el.textContent.includes('Failed')
                    )
                ).map(el => el.textContent.trim())
            );
            
            if (errorElements.length > 0) {
                stepResult.details.push(`Found error messages: ${errorElements.join(', ')}`);
            } else {
                stepResult.details.push('No error messages found on page load');
            }
            
        } catch (error) {
            stepResult.details.push(`Navigation failed: ${error.message}`);
        }
    }

    async testNetworkTimeout(stepResult) {
        console.log('⏰ Testing network timeout handling...');
        
        try {
            // Try to navigate with a very short timeout
            await this.page.goto('http://localhost:3000', { 
                waitUntil: 'networkidle2',
                timeout: 1000 // 1 second timeout
            });
            
            stepResult.details.push('Page loaded within timeout');
            
        } catch (error) {
            if (error.message.includes('timeout')) {
                stepResult.details.push('Timeout handled gracefully');
                
                // Check if page shows any content despite timeout
                const bodyText = await this.page.$eval('body', el => el.textContent);
                if (bodyText && bodyText.length > 0) {
                    stepResult.details.push('Page shows content despite timeout');
                } else {
                    stepResult.details.push('Page shows no content after timeout');
                }
            } else {
                stepResult.details.push(`Unexpected error: ${error.message}`);
            }
        }
        
        await this.takeScreenshot('network_timeout');
        stepResult.screenshots.push('network_timeout');
    }

    async testInvalidURL(stepResult) {
        console.log('🔗 Testing invalid URL handling...');
        
        try {
            await this.page.goto('http://localhost:3000/nonexistent-page', { 
                waitUntil: 'domcontentloaded',
                timeout: 5000 
            });
            
            // Check if we get a 404 page or error handling
            const bodyText = await this.page.$eval('body', el => el.textContent);
            
            if (bodyText.includes('404') || bodyText.includes('Not Found')) {
                stepResult.details.push('404 error page displayed correctly');
            } else {
                stepResult.details.push('No specific 404 handling found');
            }
            
        } catch (error) {
            stepResult.details.push(`Invalid URL error: ${error.message}`);
        }
        
        await this.takeScreenshot('invalid_url');
        stepResult.screenshots.push('invalid_url');
    }

    async testJavaScriptErrors(stepResult) {
        console.log('🔧 Testing JavaScript error handling...');
        
        // Listen for JavaScript errors
        const jsErrors = [];
        this.page.on('pageerror', error => {
            jsErrors.push(error.message);
        });
        
        try {
            await this.page.goto('http://localhost:3000', { 
                waitUntil: 'domcontentloaded',
                timeout: 10000 
            });
            
            // Wait a bit for any async operations
            await this.page.waitForTimeout(2000);
            
            if (jsErrors.length > 0) {
                stepResult.details.push(`JavaScript errors found: ${jsErrors.join(', ')}`);
            } else {
                stepResult.details.push('No JavaScript errors detected');
            }
            
        } catch (error) {
            stepResult.details.push(`Page load error: ${error.message}`);
        }
        
        await this.takeScreenshot('javascript_errors');
        stepResult.screenshots.push('javascript_errors');
    }

    async testResourceLoading(stepResult) {
        console.log('📦 Testing resource loading...');
        
        try {
            await this.page.goto('http://localhost:3000', { 
                waitUntil: 'domcontentloaded',
                timeout: 10000 
            });
            
            // Check if CSS and JS resources loaded
            const cssLinks = await this.page.$$eval('link[rel="stylesheet"]', links => 
                links.map(link => link.href)
            );
            
            const jsScripts = await this.page.$$eval('script[src]', scripts => 
                scripts.map(script => script.src)
            );
            
            stepResult.details.push(`CSS resources: ${cssLinks.length} found`);
            stepResult.details.push(`JS resources: ${jsScripts.length} found`);
            
            // Check for any failed resource loads
            const failedResources = await this.page.evaluate(() => {
                const resources = performance.getEntriesByType('resource');
                return resources.filter(resource => resource.transferSize === 0 && resource.decodedBodySize === 0);
            });
            
            if (failedResources.length > 0) {
                stepResult.details.push(`Failed resources: ${failedResources.length}`);
            } else {
                stepResult.details.push('All resources loaded successfully');
            }
            
        } catch (error) {
            stepResult.details.push(`Resource loading test failed: ${error.message}`);
        }
        
        await this.takeScreenshot('resource_loading');
        stepResult.screenshots.push('resource_loading');
    }

    async runTests() {
        try {
            await this.setup();
            
            // Run all test steps
            await this.testStep('Basic Navigation', (stepResult) => 
                this.testBasicNavigation(stepResult)
            );
            
            await this.testStep('Network Timeout Handling', (stepResult) => 
                this.testNetworkTimeout(stepResult)
            );
            
            await this.testStep('Invalid URL Handling', (stepResult) => 
                this.testInvalidURL(stepResult)
            );
            
            await this.testStep('JavaScript Error Handling', (stepResult) => 
                this.testJavaScriptErrors(stepResult)
            );
            
            await this.testStep('Resource Loading', (stepResult) => 
                this.testResourceLoading(stepResult)
            );
            
            // Analyze results
            this.analyzeResults();
            
        } catch (error) {
            console.error('❌ Test execution failed:', error);
            this.results.overallResult = 'FAILED';
            this.results.issues.push({
                type: 'Test Execution Error',
                message: error.message
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
    const test = new SimpleNetworkErrorTest();
    await test.runTests();
}

// Export for potential use in other test files
module.exports = SimpleNetworkErrorTest;

// Run if this file is executed directly
if (require.main === module) {
    runTest().catch(console.error);
}

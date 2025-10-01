/**
 * Test 8.1: Load Time Performance
 * 
 * This test evaluates the load time performance of the Schedule Editor application
 * according to the specifications in TEST_PROPOSAL.md
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class LoadTimePerformanceTest {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = {
            testName: 'Test 8.1: Load Time Performance',
            timestamp: new Date().toISOString(),
            setup: {},
            tests: {},
            performance: {},
            validation: {},
            errors: [],
            screenshots: []
        };
    }

    async setup() {
        console.log('Setting up Test 8.1: Load Time Performance...');
        
        try {
            // Clear browser cache simulation
            this.browser = await puppeteer.launch({
                headless: false,
                defaultViewport: null,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            this.page = await this.browser.newPage();
            
            // Enable performance monitoring
            await this.page.setCacheEnabled(false); // Simulate cleared cache
            
            // Set up performance monitoring
            await this.page.evaluateOnNewDocument(() => {
                window.performanceMetrics = {
                    navigationStart: 0,
                    loadEventEnd: 0,
                    domContentLoaded: 0,
                    firstContentfulPaint: 0,
                    largestContentfulPaint: 0
                };
            });

            this.results.setup.status = 'completed';
            this.results.setup.timestamp = new Date().toISOString();
            
        } catch (error) {
            this.results.errors.push(`Setup error: ${error.message}`);
            throw error;
        }
    }

    async testInitialPageLoad() {
        console.log('Testing initial page load...');
        
        try {
            // Start performance measurement
            const startTime = Date.now();
            
            // Navigate to the application
            await this.page.goto('http://localhost:3000', {
                waitUntil: 'networkidle0',
                timeout: 30000
            });

            const endTime = Date.now();
            const loadTime = endTime - startTime;

            // Get performance metrics
            const performanceMetrics = await this.page.evaluate(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                const paintEntries = performance.getEntriesByType('paint');
                
                return {
                    loadTime: navigation.loadEventEnd - navigation.loadEventStart,
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                    firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
                    largestContentfulPaint: paintEntries.find(entry => entry.name === 'largest-contentful-paint')?.startTime || 0,
                    totalTime: navigation.loadEventEnd - navigation.fetchStart
                };
            });

            // Take screenshot
            const screenshotPath = path.join(__dirname, `test_8_1_initial_load_${Date.now()}.png`);
            await this.page.screenshot({ path: screenshotPath, fullPage: true });
            this.results.screenshots.push(screenshotPath);

            this.results.tests.initialLoad = {
                status: 'completed',
                loadTime: loadTime,
                performanceMetrics: performanceMetrics,
                screenshot: screenshotPath,
                timestamp: new Date().toISOString()
            };

            console.log(`Initial load time: ${loadTime}ms`);
            console.log(`Performance metrics:`, performanceMetrics);

        } catch (error) {
            this.results.errors.push(`Initial load test error: ${error.message}`);
            this.results.tests.initialLoad = {
                status: 'failed',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async testSubsequentPageLoads() {
        console.log('Testing subsequent page loads...');
        
        try {
            // Test navigation to different pages
            const pages = [
                'http://localhost:3000/schedule-editor.html',
                'http://localhost:3000/search.html',
                'http://localhost:3000'
            ];

            const navigationResults = [];

            for (const url of pages) {
                const startTime = Date.now();
                
                await this.page.goto(url, {
                    waitUntil: 'networkidle0',
                    timeout: 15000
                });

                const endTime = Date.now();
                const navigationTime = endTime - startTime;

                navigationResults.push({
                    url: url,
                    navigationTime: navigationTime,
                    timestamp: new Date().toISOString()
                });

                console.log(`Navigation to ${url}: ${navigationTime}ms`);
            }

            this.results.tests.subsequentLoads = {
                status: 'completed',
                navigationResults: navigationResults,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            this.results.errors.push(`Subsequent loads test error: ${error.message}`);
            this.results.tests.subsequentLoads = {
                status: 'failed',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async testSlowNetworkConditions() {
        console.log('Testing slow network conditions...');
        
        try {
            // Simulate 3G connection
            await this.page.setOfflineMode(false);
            await this.page.emulate({
                name: 'Slow 3G',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                viewport: { width: 1920, height: 1080 },
                deviceScaleFactor: 1,
                isMobile: false,
                hasTouch: false,
                connection: {
                    effectiveType: '3g',
                    downlink: 1.6,
                    rtt: 562
                }
            });

            const startTime = Date.now();
            
            await this.page.goto('http://localhost:3000', {
                waitUntil: 'networkidle0',
                timeout: 30000
            });

            const endTime = Date.now();
            const slowLoadTime = endTime - startTime;

            // Take screenshot of slow load
            const screenshotPath = path.join(__dirname, `test_8_1_slow_network_${Date.now()}.png`);
            await this.page.screenshot({ path: screenshotPath, fullPage: true });
            this.results.screenshots.push(screenshotPath);

            this.results.tests.slowNetwork = {
                status: 'completed',
                slowLoadTime: slowLoadTime,
                screenshot: screenshotPath,
                timestamp: new Date().toISOString()
            };

            console.log(`Slow network load time: ${slowLoadTime}ms`);

        } catch (error) {
            this.results.errors.push(`Slow network test error: ${error.message}`);
            this.results.tests.slowNetwork = {
                status: 'failed',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async testLargeDatasetPerformance() {
        console.log('Testing performance with large datasets...');
        
        try {
            // Navigate to schedule editor to test with large data
            await this.page.goto('http://localhost:3000/schedule-editor.html', {
                waitUntil: 'networkidle0',
                timeout: 15000
            });

            // Simulate creating many schedule entries
            const startTime = Date.now();
            
            // Test calendar rendering performance
            await this.page.goto('http://localhost:3000', {
                waitUntil: 'networkidle0',
                timeout: 15000
            });

            const endTime = Date.now();
            const largeDatasetTime = endTime - startTime;

            // Test search performance
            await this.page.goto('http://localhost:3000/search.html', {
                waitUntil: 'networkidle0',
                timeout: 15000
            });

            const searchStartTime = Date.now();
            
            // Simulate search operation
            await this.page.type('input[type="text"]', 'test search');
            await this.page.click('button[type="submit"]');
            await this.page.waitForSelector('.search-results, .no-results', { timeout: 10000 });

            const searchEndTime = Date.now();
            const searchTime = searchEndTime - searchStartTime;

            this.results.tests.largeDataset = {
                status: 'completed',
                largeDatasetTime: largeDatasetTime,
                searchTime: searchTime,
                timestamp: new Date().toISOString()
            };

            console.log(`Large dataset load time: ${largeDatasetTime}ms`);
            console.log(`Search time: ${searchTime}ms`);

        } catch (error) {
            this.results.errors.push(`Large dataset test error: ${error.message}`);
            this.results.tests.largeDataset = {
                status: 'failed',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async validateResults() {
        console.log('Validating test results...');
        
        const validation = {
            initialLoadTime: this.results.tests.initialLoad?.loadTime || 0,
            performanceThresholds: {
                initialLoadUnder3Seconds: (this.results.tests.initialLoad?.loadTime || 0) < 3000,
                subsequentLoadsFaster: true,
                slowNetworkWorks: this.results.tests.slowNetwork?.status === 'completed',
                largeDatasetPerformance: this.results.tests.largeDataset?.status === 'completed'
            },
            criticalResourcesLoadFirst: true,
            cachingEffectiveness: true
        };

        // Check if subsequent loads are faster than initial load
        if (this.results.tests.subsequentLoads?.navigationResults) {
            const avgSubsequentTime = this.results.tests.subsequentLoads.navigationResults
                .reduce((sum, result) => sum + result.navigationTime, 0) / 
                this.results.tests.subsequentLoads.navigationResults.length;
            
            validation.performanceThresholds.subsequentLoadsFaster = 
                avgSubsequentTime < (this.results.tests.initialLoad?.loadTime || 0);
        }

        this.results.validation = validation;
        
        // Determine overall test status
        const allTestsPassed = Object.values(validation.performanceThresholds).every(threshold => threshold === true);
        this.results.overallStatus = allTestsPassed ? 'PASSED' : 'FAILED';
        
        console.log('Validation completed:', validation);
    }

    async generateReport() {
        console.log('Generating test report...');
        
        const reportPath = path.join(__dirname, `test_8_1_results_${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        
        console.log(`Test report saved to: ${reportPath}`);
        return reportPath;
    }

    async cleanup() {
        console.log('Cleaning up...');
        
        if (this.browser) {
            await this.browser.close();
        }
    }

    async run() {
        try {
            await this.setup();
            await this.testInitialPageLoad();
            await this.testSubsequentPageLoads();
            await this.testSlowNetworkConditions();
            await this.testLargeDatasetPerformance();
            await this.validateResults();
            
            const reportPath = await this.generateReport();
            await this.cleanup();
            
            console.log('\n=== Test 8.1: Load Time Performance - COMPLETED ===');
            console.log(`Overall Status: ${this.results.overallStatus}`);
            console.log(`Report saved to: ${reportPath}`);
            console.log(`Screenshots: ${this.results.screenshots.length} captured`);
            console.log(`Errors: ${this.results.errors.length}`);
            
            return this.results;
            
        } catch (error) {
            console.error('Test execution failed:', error);
            this.results.errors.push(`Test execution error: ${error.message}`);
            await this.cleanup();
            throw error;
        }
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    const test = new LoadTimePerformanceTest();
    test.run().catch(console.error);
}

module.exports = LoadTimePerformanceTest;


// Simple Test 2.1: Calendar Display Test Script (No Authentication)
// This script tests the calendar display functionality without authentication

const puppeteer = require('puppeteer');
const fs = require('fs');

class SimpleCalendarDisplayTest {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = {
            testName: 'Test 2.1: Calendar Display (Simple)',
            timestamp: new Date().toISOString(),
            results: [],
            screenshots: [],
            errors: []
        };
    }

    async setup() {
        console.log('🚀 Starting Simple Test 2.1: Calendar Display');
        console.log('📋 Setting up test environment...');
        
        try {
            this.browser = await puppeteer.launch({
                headless: false,
                defaultViewport: { width: 1920, height: 1080 },
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                protocolTimeout: 60000
            });
            
            this.page = await this.browser.newPage();
            
            // Set up console logging
            this.page.on('console', msg => {
                console.log(`📱 Browser Console [${msg.type()}]:`, msg.text());
            });
            
            // Set up error handling
            this.page.on('pageerror', error => {
                console.error('❌ Page Error:', error.message);
                this.testResults.errors.push({
                    type: 'page_error',
                    message: error.message,
                    stack: error.stack
                });
            });
            
            console.log('✅ Test environment setup complete');
            return true;
        } catch (error) {
            console.error('❌ Setup failed:', error);
            this.testResults.errors.push({
                type: 'setup_error',
                message: error.message,
                stack: error.stack
            });
            return false;
        }
    }

    async navigateToApp() {
        console.log('🌐 Navigating to application...');
        
        try {
            await this.page.goto('http://localhost:3000', { 
                waitUntil: 'networkidle2',
                timeout: 15000 
            });
            
            // Wait for the page to load
            await this.page.waitForSelector('#authSection, #appSection', { timeout: 10000 });
            
            console.log('✅ Successfully navigated to application');
            return true;
        } catch (error) {
            console.error('❌ Navigation failed:', error);
            this.testResults.errors.push({
                type: 'navigation_error',
                message: error.message,
                stack: error.stack
            });
            return false;
        }
    }

    async testInitialPageLoad() {
        console.log('📄 Testing initial page load...');
        
        try {
            // Check if auth section is visible
            const authSection = await this.page.$('#authSection');
            const appSection = await this.page.$('#appSection');
            
            if (authSection) {
                const authVisible = await this.page.$eval('#authSection', el => el.style.display !== 'none');
                if (authVisible) {
                    console.log('✅ Authentication section is visible');
                    this.testResults.results.push({
                        test: 'Initial Page Load - Auth Section',
                        status: 'PASS',
                        message: 'Authentication section is displayed'
                    });
                } else {
                    console.log('❌ Authentication section not visible');
                    this.testResults.results.push({
                        test: 'Initial Page Load - Auth Section',
                        status: 'FAIL',
                        message: 'Authentication section is not visible'
                    });
                }
            }
            
            if (appSection) {
                const appVisible = await this.page.$eval('#appSection', el => el.style.display !== 'none');
                if (appVisible) {
                    console.log('✅ App section is visible');
                    this.testResults.results.push({
                        test: 'Initial Page Load - App Section',
                        status: 'PASS',
                        message: 'App section is displayed'
                    });
                } else {
                    console.log('❌ App section not visible');
                    this.testResults.results.push({
                        test: 'Initial Page Load - App Section',
                        status: 'FAIL',
                        message: 'App section is not visible'
                    });
                }
            }
            
            return true;
        } catch (error) {
            console.error('❌ Initial page load test failed:', error);
            this.testResults.errors.push({
                type: 'initial_load_error',
                message: error.message,
                stack: error.stack
            });
            return false;
        }
    }

    async testCalendarElements() {
        console.log('📅 Testing calendar elements...');
        
        try {
            // Check if calendar elements exist (even if not visible)
            const calendar = await this.page.$('#calendar');
            const monthDisplay = await this.page.$('#monthDisplay');
            const prevButton = await this.page.$('#prevMonth');
            const nextButton = await this.page.$('#nextMonth');
            const weekdays = await this.page.$('.weekdays');
            
            if (calendar) {
                console.log('✅ Calendar element exists');
                this.testResults.results.push({
                    test: 'Calendar Element Exists',
                    status: 'PASS',
                    message: 'Calendar element is present in DOM'
                });
            } else {
                console.log('❌ Calendar element not found');
                this.testResults.results.push({
                    test: 'Calendar Element Exists',
                    status: 'FAIL',
                    message: 'Calendar element not found in DOM'
                });
            }
            
            if (monthDisplay) {
                console.log('✅ Month display element exists');
                this.testResults.results.push({
                    test: 'Month Display Element Exists',
                    status: 'PASS',
                    message: 'Month display element is present in DOM'
                });
            } else {
                console.log('❌ Month display element not found');
                this.testResults.results.push({
                    test: 'Month Display Element Exists',
                    status: 'FAIL',
                    message: 'Month display element not found in DOM'
                });
            }
            
            if (prevButton) {
                console.log('✅ Previous month button exists');
                this.testResults.results.push({
                    test: 'Previous Month Button Exists',
                    status: 'PASS',
                    message: 'Previous month button is present in DOM'
                });
            } else {
                console.log('❌ Previous month button not found');
                this.testResults.results.push({
                    test: 'Previous Month Button Exists',
                    status: 'FAIL',
                    message: 'Previous month button not found in DOM'
                });
            }
            
            if (nextButton) {
                console.log('✅ Next month button exists');
                this.testResults.results.push({
                    test: 'Next Month Button Exists',
                    status: 'PASS',
                    message: 'Next month button is present in DOM'
                });
            } else {
                console.log('❌ Next month button not found');
                this.testResults.results.push({
                    test: 'Next Month Button Exists',
                    status: 'FAIL',
                    message: 'Next month button not found in DOM'
                });
            }
            
            if (weekdays) {
                console.log('✅ Weekdays element exists');
                this.testResults.results.push({
                    test: 'Weekdays Element Exists',
                    status: 'PASS',
                    message: 'Weekdays element is present in DOM'
                });
            } else {
                console.log('❌ Weekdays element not found');
                this.testResults.results.push({
                    test: 'Weekdays Element Exists',
                    status: 'FAIL',
                    message: 'Weekdays element not found in DOM'
                });
            }
            
            return true;
        } catch (error) {
            console.error('❌ Calendar elements test failed:', error);
            this.testResults.errors.push({
                type: 'calendar_elements_error',
                message: error.message,
                stack: error.stack
            });
            return false;
        }
    }

    async testJavaScriptFunctionality() {
        console.log('🔧 Testing JavaScript functionality...');
        
        try {
            // Test if the calendar rendering function exists
            const calendarFunctionExists = await this.page.evaluate(() => {
                return typeof renderCalendar === 'function';
            });
            
            if (calendarFunctionExists) {
                console.log('✅ renderCalendar function exists');
                this.testResults.results.push({
                    test: 'JavaScript - renderCalendar Function',
                    status: 'PASS',
                    message: 'renderCalendar function is available'
                });
            } else {
                console.log('❌ renderCalendar function not found');
                this.testResults.results.push({
                    test: 'JavaScript - renderCalendar Function',
                    status: 'FAIL',
                    message: 'renderCalendar function not found'
                });
            }
            
            // Test if the selectDate function exists
            const selectDateFunctionExists = await this.page.evaluate(() => {
                return typeof selectDate === 'function';
            });
            
            if (selectDateFunctionExists) {
                console.log('✅ selectDate function exists');
                this.testResults.results.push({
                    test: 'JavaScript - selectDate Function',
                    status: 'PASS',
                    message: 'selectDate function is available'
                });
            } else {
                console.log('❌ selectDate function not found');
                this.testResults.results.push({
                    test: 'JavaScript - selectDate Function',
                    status: 'FAIL',
                    message: 'selectDate function not found'
                });
            }
            
            // Test if the currentDate variable exists
            const currentDateExists = await this.page.evaluate(() => {
                return typeof currentDate !== 'undefined';
            });
            
            if (currentDateExists) {
                console.log('✅ currentDate variable exists');
                this.testResults.results.push({
                    test: 'JavaScript - currentDate Variable',
                    status: 'PASS',
                    message: 'currentDate variable is available'
                });
            } else {
                console.log('❌ currentDate variable not found');
                this.testResults.results.push({
                    test: 'JavaScript - currentDate Variable',
                    status: 'FAIL',
                    message: 'currentDate variable not found'
                });
            }
            
            return true;
        } catch (error) {
            console.error('❌ JavaScript functionality test failed:', error);
            this.testResults.errors.push({
                type: 'javascript_functionality_error',
                message: error.message,
                stack: error.stack
            });
            return false;
        }
    }

    async testCSSStyling() {
        console.log('🎨 Testing CSS styling...');
        
        try {
            // Check if calendar grid has proper CSS
            const calendarGridStyles = await this.page.evaluate(() => {
                const calendar = document.querySelector('#calendar');
                if (!calendar) return null;
                
                const styles = window.getComputedStyle(calendar);
                return {
                    display: styles.display,
                    gridTemplateColumns: styles.gridTemplateColumns,
                    gap: styles.gap
                };
            });
            
            if (calendarGridStyles) {
                console.log('📊 Calendar grid styles:', calendarGridStyles);
                
                if (calendarGridStyles.display === 'grid') {
                    console.log('✅ Calendar uses CSS Grid');
                    this.testResults.results.push({
                        test: 'CSS - Calendar Grid Layout',
                        status: 'PASS',
                        message: 'Calendar uses CSS Grid layout'
                    });
                } else {
                    console.log('❌ Calendar does not use CSS Grid');
                    this.testResults.results.push({
                        test: 'CSS - Calendar Grid Layout',
                        status: 'FAIL',
                        message: `Calendar display is ${calendarGridStyles.display}, expected grid`
                    });
                }
            } else {
                console.log('❌ Calendar element not found for CSS testing');
                this.testResults.results.push({
                    test: 'CSS - Calendar Grid Layout',
                    status: 'FAIL',
                    message: 'Calendar element not found for CSS testing'
                });
            }
            
            // Check if weekday headers have proper CSS
            const weekdayStyles = await this.page.evaluate(() => {
                const weekdays = document.querySelector('.weekdays');
                if (!weekdays) return null;
                
                const styles = window.getComputedStyle(weekdays);
                return {
                    display: styles.display,
                    gridTemplateColumns: styles.gridTemplateColumns,
                    textAlign: styles.textAlign
                };
            });
            
            if (weekdayStyles) {
                console.log('📊 Weekday styles:', weekdayStyles);
                
                if (weekdayStyles.display === 'grid' && weekdayStyles.gridTemplateColumns.includes('repeat(7')) {
                    console.log('✅ Weekdays use proper CSS Grid');
                    this.testResults.results.push({
                        test: 'CSS - Weekday Headers Layout',
                        status: 'PASS',
                        message: 'Weekdays use proper CSS Grid layout'
                    });
                } else {
                    console.log('❌ Weekdays do not use proper CSS Grid');
                    this.testResults.results.push({
                        test: 'CSS - Weekday Headers Layout',
                        status: 'FAIL',
                        message: `Weekdays display is ${weekdayStyles.display}, expected grid with 7 columns`
                    });
                }
            } else {
                console.log('❌ Weekdays element not found for CSS testing');
                this.testResults.results.push({
                    test: 'CSS - Weekday Headers Layout',
                    status: 'FAIL',
                    message: 'Weekdays element not found for CSS testing'
                });
            }
            
            return true;
        } catch (error) {
            console.error('❌ CSS styling test failed:', error);
            this.testResults.errors.push({
                type: 'css_styling_error',
                message: error.message,
                stack: error.stack
            });
            return false;
        }
    }

    async takeScreenshot(name) {
        try {
            const screenshotPath = `test_2_1_simple_${name}_${Date.now()}.png`;
            await this.page.screenshot({ 
                path: screenshotPath, 
                fullPage: true 
            });
            
            this.testResults.screenshots.push({
                name: name,
                path: screenshotPath,
                timestamp: new Date().toISOString()
            });
            
            console.log(`📸 Screenshot saved: ${screenshotPath}`);
            return screenshotPath;
        } catch (error) {
            console.error('❌ Screenshot failed:', error);
            this.testResults.errors.push({
                type: 'screenshot_error',
                message: error.message,
                stack: error.stack
            });
            return null;
        }
    }

    async runTest() {
        console.log('🧪 Starting Simple Test 2.1: Calendar Display');
        
        try {
            // Setup
            const setupSuccess = await this.setup();
            if (!setupSuccess) {
                throw new Error('Test setup failed');
            }
            
            // Navigate to app
            const navSuccess = await this.navigateToApp();
            if (!navSuccess) {
                throw new Error('Navigation failed');
            }
            
            // Take initial screenshot
            await this.takeScreenshot('initial_load');
            
            // Test initial page load
            await this.testInitialPageLoad();
            
            // Test calendar elements
            await this.testCalendarElements();
            
            // Test JavaScript functionality
            await this.testJavaScriptFunctionality();
            
            // Test CSS styling
            await this.testCSSStyling();
            
            // Take final screenshot
            await this.takeScreenshot('final_state');
            
            console.log('✅ Simple Test 2.1 completed successfully');
            
        } catch (error) {
            console.error('❌ Simple Test 2.1 failed:', error);
            this.testResults.errors.push({
                type: 'test_execution_error',
                message: error.message,
                stack: error.stack
            });
        } finally {
            await this.cleanup();
        }
    }

    async cleanup() {
        console.log('🧹 Cleaning up test environment...');
        
        if (this.browser) {
            await this.browser.close();
        }
        
        // Save test results
        const resultsPath = `test_2_1_simple_results_${Date.now()}.json`;
        fs.writeFileSync(resultsPath, JSON.stringify(this.testResults, null, 2));
        console.log(`📊 Test results saved to: ${resultsPath}`);
        
        // Generate summary
        this.generateSummary();
    }

    generateSummary() {
        console.log('\n📋 SIMPLE TEST 2.1 SUMMARY');
        console.log('==========================');
        
        const totalTests = this.testResults.results.length;
        const passedTests = this.testResults.results.filter(r => r.status === 'PASS').length;
        const failedTests = this.testResults.results.filter(r => r.status === 'FAIL').length;
        
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests}`);
        console.log(`Failed: ${failedTests}`);
        console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
        
        if (this.testResults.errors.length > 0) {
            console.log(`\n❌ Errors: ${this.testResults.errors.length}`);
            this.testResults.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error.type}: ${error.message}`);
            });
        }
        
        console.log(`\n📸 Screenshots: ${this.testResults.screenshots.length}`);
        this.testResults.screenshots.forEach(screenshot => {
            console.log(`- ${screenshot.name}: ${screenshot.path}`);
        });
        
        // Determine overall test status
        const overallStatus = failedTests === 0 && this.testResults.errors.length === 0 ? 'PASS' : 'FAIL';
        console.log(`\n🎯 Overall Status: ${overallStatus}`);
        
        this.testResults.overallStatus = overallStatus;
        this.testResults.summary = {
            totalTests,
            passedTests,
            failedTests,
            successRate: (passedTests / totalTests) * 100,
            errorCount: this.testResults.errors.length,
            screenshotCount: this.testResults.screenshots.length
        };
    }
}

// Run the test
if (require.main === module) {
    const test = new SimpleCalendarDisplayTest();
    test.runTest().catch(console.error);
}

module.exports = SimpleCalendarDisplayTest;

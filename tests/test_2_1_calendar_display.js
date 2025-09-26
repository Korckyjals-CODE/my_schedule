// Test 2.1: Calendar Display Test Script
// This script tests the calendar display functionality of the Schedule Editor application

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class CalendarDisplayTest {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = {
            testName: 'Test 2.1: Calendar Display',
            timestamp: new Date().toISOString(),
            results: [],
            screenshots: [],
            errors: []
        };
    }

    async setup() {
        console.log('🚀 Starting Test 2.1: Calendar Display');
        console.log('📋 Setting up test environment...');
        
        try {
            this.browser = await puppeteer.launch({
                headless: false, // Set to true for headless mode
                defaultViewport: { width: 1920, height: 1080 },
                args: ['--no-sandbox', '--disable-setuid-sandbox']
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
                timeout: 10000 
            });
            
            // Wait for the page to load
            await this.page.waitForSelector('#authSection, #appSection', { timeout: 5000 });
            
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

    async testAuthentication() {
        console.log('🔐 Testing authentication...');
        
        try {
            // Check if we're on the auth screen
            const authSection = await this.page.$('#authSection');
            const appSection = await this.page.$('#appSection');
            
            if (authSection && (await authSection.isVisible())) {
                console.log('📝 User needs to authenticate first');
                
                // Try to sign up a test user
                await this.page.click('#showSignUpLink');
                await this.page.waitForSelector('#signupForm', { visible: true });
                
                // Fill in registration form
                await this.page.type('#signupName', 'Test User');
                await this.page.type('#signupEmail', 'testuser@example.com');
                await this.page.type('#signupPassword', 'testpassword123');
                await this.page.type('#signupConfirmPassword', 'testpassword123');
                await this.page.click('#signupTerms');
                
                // Submit registration
                await this.page.click('#signupButton');
                
                // Wait for success message or login form
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Try to login
                await this.page.click('#showLoginLink');
                await this.page.waitForSelector('#loginForm', { visible: true });
                
                await this.page.type('#loginEmail', 'testuser@example.com');
                await this.page.type('#loginPassword', 'testpassword123');
                await this.page.click('#loginButton');
                
                // Wait for app to load
                await this.page.waitForSelector('#appSection', { visible: true, timeout: 10000 });
            }
            
            // Verify we're in the app
            const appSectionVisible = await this.page.$eval('#appSection', el => el.style.display !== 'none');
            
            if (appSectionVisible) {
                console.log('✅ Authentication successful');
                this.testResults.results.push({
                    test: 'Authentication',
                    status: 'PASS',
                    message: 'User successfully authenticated'
                });
                return true;
            } else {
                console.log('❌ Authentication failed');
                this.testResults.results.push({
                    test: 'Authentication',
                    status: 'FAIL',
                    message: 'User authentication failed'
                });
                return false;
            }
        } catch (error) {
            console.error('❌ Authentication test failed:', error);
            this.testResults.errors.push({
                type: 'auth_error',
                message: error.message,
                stack: error.stack
            });
            return false;
        }
    }

    async testCalendarGridDisplay() {
        console.log('📅 Testing calendar grid display...');
        
        try {
            // Wait for calendar to load
            await this.page.waitForSelector('#calendar', { visible: true, timeout: 5000 });
            
            // Check if calendar grid is displayed
            const calendarExists = await this.page.$('#calendar');
            const calendarVisible = await this.page.$eval('#calendar', el => el.style.display !== 'none');
            
            if (calendarExists && calendarVisible) {
                console.log('✅ Calendar grid is displayed');
                this.testResults.results.push({
                    test: 'Calendar Grid Display',
                    status: 'PASS',
                    message: 'Calendar grid is visible'
                });
            } else {
                console.log('❌ Calendar grid not displayed');
                this.testResults.results.push({
                    test: 'Calendar Grid Display',
                    status: 'FAIL',
                    message: 'Calendar grid is not visible'
                });
            }
            
            // Check calendar structure
            const calendarDays = await this.page.$$('.calendar-day');
            console.log(`📊 Found ${calendarDays.length} calendar day elements`);
            
            if (calendarDays.length > 0) {
                this.testResults.results.push({
                    test: 'Calendar Structure',
                    status: 'PASS',
                    message: `Calendar has ${calendarDays.length} day elements`
                });
            } else {
                this.testResults.results.push({
                    test: 'Calendar Structure',
                    status: 'FAIL',
                    message: 'No calendar day elements found'
                });
            }
            
            return true;
        } catch (error) {
            console.error('❌ Calendar grid test failed:', error);
            this.testResults.errors.push({
                type: 'calendar_grid_error',
                message: error.message,
                stack: error.stack
            });
            return false;
        }
    }

    async testMonthYearDisplay() {
        console.log('📆 Testing month and year display...');
        
        try {
            // Check month display
            const monthDisplay = await this.page.$('#monthDisplay');
            if (monthDisplay) {
                const monthText = await this.page.$eval('#monthDisplay', el => el.textContent);
                console.log(`📅 Month display: "${monthText}"`);
                
                // Check if it contains current month and year
                const currentDate = new Date();
                const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
                const currentYear = currentDate.getFullYear();
                
                if (monthText.includes(currentMonth) && monthText.includes(currentYear.toString())) {
                    console.log('✅ Month and year display is correct');
                    this.testResults.results.push({
                        test: 'Month/Year Display',
                        status: 'PASS',
                        message: `Correctly displays: ${monthText}`
                    });
                } else {
                    console.log('❌ Month and year display is incorrect');
                    this.testResults.results.push({
                        test: 'Month/Year Display',
                        status: 'FAIL',
                        message: `Expected current month/year, got: ${monthText}`
                    });
                }
            } else {
                console.log('❌ Month display element not found');
                this.testResults.results.push({
                    test: 'Month/Year Display',
                    status: 'FAIL',
                    message: 'Month display element not found'
                });
            }
            
            return true;
        } catch (error) {
            console.error('❌ Month/year display test failed:', error);
            this.testResults.errors.push({
                type: 'month_display_error',
                message: error.message,
                stack: error.stack
            });
            return false;
        }
    }

    async testWeekdayHeaders() {
        console.log('📋 Testing weekday headers...');
        
        try {
            // Check weekday headers
            const weekdayElements = await this.page.$$('.weekdays > div');
            const expectedWeekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            
            console.log(`📊 Found ${weekdayElements.length} weekday elements`);
            
            if (weekdayElements.length === 7) {
                const weekdayTexts = await Promise.all(
                    weekdayElements.map(el => this.page.evaluate(element => element.textContent, el))
                );
                
                console.log('📅 Weekday headers:', weekdayTexts);
                
                const allCorrect = expectedWeekdays.every((expected, index) => 
                    weekdayTexts[index] === expected
                );
                
                if (allCorrect) {
                    console.log('✅ Weekday headers are correct');
                    this.testResults.results.push({
                        test: 'Weekday Headers',
                        status: 'PASS',
                        message: 'All weekday headers are correctly displayed'
                    });
                } else {
                    console.log('❌ Weekday headers are incorrect');
                    this.testResults.results.push({
                        test: 'Weekday Headers',
                        status: 'FAIL',
                        message: `Expected: ${expectedWeekdays.join(', ')}, Got: ${weekdayTexts.join(', ')}`
                    });
                }
            } else {
                console.log('❌ Incorrect number of weekday elements');
                this.testResults.results.push({
                    test: 'Weekday Headers',
                    status: 'FAIL',
                    message: `Expected 7 weekday elements, got ${weekdayElements.length}`
                });
            }
            
            return true;
        } catch (error) {
            console.error('❌ Weekday headers test failed:', error);
            this.testResults.errors.push({
                type: 'weekday_headers_error',
                message: error.message,
                stack: error.stack
            });
            return false;
        }
    }

    async testMonthNavigation() {
        console.log('⬅️➡️ Testing month navigation...');
        
        try {
            // Test previous month button
            const prevButton = await this.page.$('#prevMonth');
            if (prevButton) {
                const initialMonth = await this.page.$eval('#monthDisplay', el => el.textContent);
                console.log(`📅 Initial month: ${initialMonth}`);
                
                await this.page.click('#prevMonth');
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for calendar to update
                
                const newMonth = await this.page.$eval('#monthDisplay', el => el.textContent);
                console.log(`📅 After prev click: ${newMonth}`);
                
                if (newMonth !== initialMonth) {
                    console.log('✅ Previous month navigation works');
                    this.testResults.results.push({
                        test: 'Previous Month Navigation',
                        status: 'PASS',
                        message: 'Previous month button works correctly'
                    });
                } else {
                    console.log('❌ Previous month navigation failed');
                    this.testResults.results.push({
                        test: 'Previous Month Navigation',
                        status: 'FAIL',
                        message: 'Previous month button did not change the month'
                    });
                }
            } else {
                console.log('❌ Previous month button not found');
                this.testResults.results.push({
                    test: 'Previous Month Navigation',
                    status: 'FAIL',
                    message: 'Previous month button not found'
                });
            }
            
            // Test next month button
            const nextButton = await this.page.$('#nextMonth');
            if (nextButton) {
                const beforeNext = await this.page.$eval('#monthDisplay', el => el.textContent);
                console.log(`📅 Before next click: ${beforeNext}`);
                
                await this.page.click('#nextMonth');
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for calendar to update
                
                const afterNext = await this.page.$eval('#monthDisplay', el => el.textContent);
                console.log(`📅 After next click: ${afterNext}`);
                
                if (afterNext !== beforeNext) {
                    console.log('✅ Next month navigation works');
                    this.testResults.results.push({
                        test: 'Next Month Navigation',
                        status: 'PASS',
                        message: 'Next month button works correctly'
                    });
                } else {
                    console.log('❌ Next month navigation failed');
                    this.testResults.results.push({
                        test: 'Next Month Navigation',
                        status: 'FAIL',
                        message: 'Next month button did not change the month'
                    });
                }
            } else {
                console.log('❌ Next month button not found');
                this.testResults.results.push({
                    test: 'Next Month Navigation',
                    status: 'FAIL',
                    message: 'Next month button not found'
                });
            }
            
            return true;
        } catch (error) {
            console.error('❌ Month navigation test failed:', error);
            this.testResults.errors.push({
                type: 'month_navigation_error',
                message: error.message,
                stack: error.stack
            });
            return false;
        }
    }

    async testTodayHighlighting() {
        console.log('🌟 Testing today highlighting...');
        
        try {
            // Check if today's date is highlighted
            const todayElements = await this.page.$$('.calendar-day.today');
            
            if (todayElements.length > 0) {
                console.log(`✅ Found ${todayElements.length} today element(s)`);
                this.testResults.results.push({
                    test: 'Today Highlighting',
                    status: 'PASS',
                    message: 'Today\'s date is highlighted'
                });
            } else {
                console.log('❌ Today\'s date is not highlighted');
                this.testResults.results.push({
                    test: 'Today Highlighting',
                    status: 'FAIL',
                    message: 'Today\'s date is not highlighted'
                });
            }
            
            return true;
        } catch (error) {
            console.error('❌ Today highlighting test failed:', error);
            this.testResults.errors.push({
                type: 'today_highlighting_error',
                message: error.message,
                stack: error.stack
            });
            return false;
        }
    }

    async testDayClicking() {
        console.log('🖱️ Testing day clicking...');
        
        try {
            // Find a clickable day (not empty)
            const calendarDays = await this.page.$$('.calendar-day');
            let clickableDay = null;
            
            for (const day of calendarDays) {
                const dayText = await this.page.evaluate(el => el.textContent, day);
                if (dayText && !isNaN(dayText) && dayText.trim() !== '') {
                    clickableDay = day;
                    break;
                }
            }
            
            if (clickableDay) {
                const dayText = await this.page.evaluate(el => el.textContent, clickableDay);
                console.log(`🖱️ Clicking on day: ${dayText}`);
                
                await clickableDay.click();
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Check if the day is selected
                const isSelected = await this.page.evaluate(el => el.classList.contains('selected'), clickableDay);
                
                if (isSelected) {
                    console.log('✅ Day clicking works - day is selected');
                    this.testResults.results.push({
                        test: 'Day Clicking',
                        status: 'PASS',
                        message: 'Day clicking works correctly'
                    });
                } else {
                    console.log('❌ Day clicking failed - day is not selected');
                    this.testResults.results.push({
                        test: 'Day Clicking',
                        status: 'FAIL',
                        message: 'Day clicking did not select the day'
                    });
                }
            } else {
                console.log('❌ No clickable days found');
                this.testResults.results.push({
                    test: 'Day Clicking',
                    status: 'FAIL',
                    message: 'No clickable days found in calendar'
                });
            }
            
            return true;
        } catch (error) {
            console.error('❌ Day clicking test failed:', error);
            this.testResults.errors.push({
                type: 'day_clicking_error',
                message: error.message,
                stack: error.stack
            });
            return false;
        }
    }

    async takeScreenshot(name) {
        try {
            const screenshotPath = `test_2_1_${name}_${Date.now()}.png`;
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
        console.log('🧪 Starting Test 2.1: Calendar Display');
        
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
            
            // Test authentication
            const authSuccess = await this.testAuthentication();
            if (!authSuccess) {
                throw new Error('Authentication failed');
            }
            
            // Take screenshot after authentication
            await this.takeScreenshot('after_auth');
            
            // Test calendar grid display
            await this.testCalendarGridDisplay();
            
            // Test month/year display
            await this.testMonthYearDisplay();
            
            // Test weekday headers
            await this.testWeekdayHeaders();
            
            // Test month navigation
            await this.testMonthNavigation();
            
            // Test today highlighting
            await this.testTodayHighlighting();
            
            // Test day clicking
            await this.testDayClicking();
            
            // Take final screenshot
            await this.takeScreenshot('final_state');
            
            console.log('✅ Test 2.1 completed successfully');
            
        } catch (error) {
            console.error('❌ Test 2.1 failed:', error);
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
        const resultsPath = `test_2_1_results_${Date.now()}.json`;
        fs.writeFileSync(resultsPath, JSON.stringify(this.testResults, null, 2));
        console.log(`📊 Test results saved to: ${resultsPath}`);
        
        // Generate summary
        this.generateSummary();
    }

    generateSummary() {
        console.log('\n📋 TEST 2.1 SUMMARY');
        console.log('==================');
        
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
    const test = new CalendarDisplayTest();
    test.runTest().catch(console.error);
}

module.exports = CalendarDisplayTest;

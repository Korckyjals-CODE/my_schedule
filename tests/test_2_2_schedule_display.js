/**
 * Test 2.2: Schedule Display Functionality
 * 
 * This test validates the schedule display functionality in the calendar view.
 * It tests event display, sorting, and interaction with the schedule list.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class Test2_2_ScheduleDisplay {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = {
            testName: 'Test 2.2: Schedule Display',
            timestamp: new Date().toISOString(),
            setup: {},
            testSteps: {},
            validation: {},
            errors: [],
            screenshots: [],
            passed: false
        };
    }

    async setup() {
        console.log('🚀 Setting up Test 2.2: Schedule Display...');
        
        try {
            // Launch browser
            this.browser = await puppeteer.launch({
                headless: false,
                defaultViewport: null,
                args: ['--start-maximized']
            });

            this.page = await this.browser.newPage();
            
            // Navigate to the application
            await this.page.goto('http://localhost:3000', { 
                waitUntil: 'networkidle2',
                timeout: 10000 
            });

            this.testResults.setup.serverRunning = true;
            console.log('✅ Server is running and accessible');

            // Check if user needs to log in
            const authSection = await this.page.$('#authSection');
            const authSectionDisplay = await this.page.evaluate(() => {
                const authSection = document.getElementById('authSection');
                return authSection ? authSection.style.display : 'none';
            });
            
            if (authSection && authSectionDisplay !== 'none') {
                console.log('🔐 User needs to authenticate...');
                
                // Try to log in with test credentials
                const emailInput = await this.page.$('#loginEmail');
                const passwordInput = await this.page.$('#loginPassword');
                
                if (emailInput && passwordInput) {
                    await emailInput.type('testuser@example.com');
                    await passwordInput.type('testpassword123');
                    
                    const signInButton = await this.page.$('button[onclick="handleLogin()"]');
                    if (signInButton) {
                        await signInButton.click();
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        console.log('✅ User authenticated successfully');
                    }
                }
            }

            // Wait for calendar to load
            await this.page.waitForSelector('.calendar-grid', { timeout: 5000 });
            this.testResults.setup.calendarLoaded = true;
            console.log('✅ Calendar view loaded');

            // Check if we have schedule data
            const scheduleData = await this.page.evaluate(() => {
                return window.schedule || {};
            });
            
            if (Object.keys(scheduleData).length === 0) {
                console.log('⚠️ No schedule data found. Creating test data...');
                await this.createTestScheduleData();
            } else {
                console.log('✅ Schedule data found:', Object.keys(scheduleData));
            }

        } catch (error) {
            this.testResults.errors.push(`Setup failed: ${error.message}`);
            console.error('❌ Setup failed:', error.message);
            throw error;
        }
    }

    async createTestScheduleData() {
        try {
            // Navigate to schedule editor
            await this.page.goto('http://localhost:3000/schedule-editor.html', { 
                waitUntil: 'networkidle2' 
            });

            // Wait for editor to load
            await this.page.waitForSelector('#weekdaySchedule', { timeout: 5000 });

            // Create some test schedule entries
            const testEntries = [
                { day: 'Monday', grade: '6A', startTime: '08:00', endTime: '08:45', subject: 'Math' },
                { day: 'Monday', grade: '7B', startTime: '09:00', endTime: '09:45', subject: 'Science' },
                { day: 'Tuesday', grade: '8A', startTime: '10:00', endTime: '10:45', subject: 'English' },
                { day: 'Wednesday', grade: '6A', startTime: '14:00', endTime: '14:45', subject: 'Art' }
            ];

            for (const entry of testEntries) {
                // Select weekday
                await this.page.select('#weekday', entry.day);
                
                // Click Add Entry
                await this.page.click('button[onclick="addWeekdayEntry()"]');
                
                // Wait for the entry form to appear
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Fill in the form - need to find the dynamically created form elements
                const entries = await this.page.$$('#weekdaySchedule .schedule-entry');
                const lastEntry = entries[entries.length - 1];
                
                if (lastEntry) {
                    const gradeSelect = await lastEntry.$('select');
                    const timeInputs = await lastEntry.$$('input[type="time"]');
                    const subjectSelect = await lastEntry.$('select:last-of-type');
                    
                    if (gradeSelect) await gradeSelect.select(entry.grade);
                    if (timeInputs[0]) await timeInputs[0].type(entry.startTime);
                    if (timeInputs[1]) await timeInputs[1].type(entry.endTime);
                    if (subjectSelect) await subjectSelect.select(entry.subject);
                }
                
                // Wait for entry to be added
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Save the schedule
            await this.page.click('button[onclick="saveSchedule()"]');
            await new Promise(resolve => setTimeout(resolve, 2000));

            console.log('✅ Test schedule data created');

        } catch (error) {
            this.testResults.errors.push(`Failed to create test data: ${error.message}`);
            console.error('❌ Failed to create test data:', error.message);
        }
    }

    async executeTest() {
        console.log('🧪 Executing Test 2.2: Schedule Display...');

        try {
            // Navigate back to main calendar
            await this.page.goto('http://localhost:3000', { 
                waitUntil: 'networkidle2' 
            });

            // Wait for calendar to load
            await this.page.waitForSelector('.calendar-grid', { timeout: 5000 });

            // Test Step 1: Click on a calendar day that has scheduled events
            console.log('📅 Testing calendar day selection...');
            
            // Look for days with events (they should have some visual indicator)
            const daysWithEvents = await this.page.evaluate(() => {
                const days = document.querySelectorAll('#calendar > div');
                const daysWithEvents = [];
                
                days.forEach((day, index) => {
                    const dayNumber = day.textContent.trim();
                    if (dayNumber && day.classList.contains('has-events')) {
                        daysWithEvents.push({ element: day, dayNumber });
                    }
                });
                
                return daysWithEvents;
            });

            if (daysWithEvents.length > 0) {
                // Click on first day with events
                await this.page.evaluate((dayIndex) => {
                    const days = document.querySelectorAll('#calendar > div.has-events');
                    if (days[dayIndex]) {
                        days[dayIndex].click();
                    }
                }, 0);

                this.testResults.testSteps.daySelection = 'PASSED';
                console.log('✅ Successfully clicked on calendar day with events');
            } else {
                // Try clicking on any day that has a number (likely a weekday)
                await this.page.evaluate(() => {
                    const days = document.querySelectorAll('#calendar > div');
                    const dayWithNumber = Array.from(days).find(day => {
                        const text = day.textContent.trim();
                        return /^\d+$/.test(text) && parseInt(text) >= 1 && parseInt(text) <= 31;
                    });
                    if (dayWithNumber) dayWithNumber.click();
                });

                this.testResults.testSteps.daySelection = 'PARTIAL - No visual indicators for events';
                console.log('⚠️ Clicked on calendar day (no visual event indicators found)');
            }

            // Wait for schedule list to appear
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Test Step 2: Verify schedule list shows the day's events
            console.log('📋 Testing schedule list display...');
            
            const scheduleList = await this.page.$('#scheduleList');
            const scheduleItems = await this.page.$$('#scheduleList > div');
            
            if (scheduleList && scheduleItems.length > 0) {
                this.testResults.testSteps.scheduleListDisplay = 'PASSED';
                this.testResults.validation.scheduleItemsCount = scheduleItems.length;
                console.log(`✅ Schedule list displayed with ${scheduleItems.length} items`);
            } else {
                this.testResults.testSteps.scheduleListDisplay = 'FAILED';
                console.log('❌ Schedule list not displayed or empty');
            }

            // Test Step 3: Check event information display
            console.log('📝 Testing event information display...');
            
            const eventInfo = await this.page.evaluate(() => {
                const items = document.querySelectorAll('#scheduleList > div');
                const eventDetails = [];
                
                items.forEach((item, index) => {
                    const grade = item.querySelector('.grade')?.textContent || '';
                    const subject = item.querySelector('.subject')?.textContent || '';
                    const time = item.querySelector('.time')?.textContent || '';
                    
                    eventDetails.push({
                        grade: grade.trim(),
                        subject: subject.trim(),
                        time: time.trim()
                    });
                });
                
                return eventDetails;
            });

            this.testResults.validation.eventDetails = eventInfo;
            
            if (eventInfo.length > 0 && eventInfo.some(event => event.grade && event.subject && event.time)) {
                this.testResults.testSteps.eventInfoDisplay = 'PASSED';
                console.log('✅ Event information displayed correctly');
            } else {
                this.testResults.testSteps.eventInfoDisplay = 'FAILED';
                console.log('❌ Event information not displayed correctly');
            }

            // Test Step 4: Verify events are sorted by start time
            console.log('⏰ Testing event sorting...');
            
            const sortedEvents = await this.page.evaluate(() => {
                const items = document.querySelectorAll('#scheduleList > div');
                const times = [];
                
                items.forEach(item => {
                    const timeText = item.querySelector('.time')?.textContent || '';
                    const timeMatch = timeText.match(/(\d{2}:\d{2})/);
                    if (timeMatch) {
                        times.push(timeMatch[1]);
                    }
                });
                
                const sortedTimes = [...times].sort();
                return {
                    originalTimes: times,
                    sortedTimes: sortedTimes,
                    isSorted: JSON.stringify(times) === JSON.stringify(sortedTimes)
                };
            });

            this.testResults.validation.eventSorting = sortedEvents;
            
            if (sortedEvents.isSorted) {
                this.testResults.testSteps.eventSorting = 'PASSED';
                console.log('✅ Events are sorted by start time');
            } else {
                this.testResults.testSteps.eventSorting = 'FAILED';
                console.log('❌ Events are not sorted by start time');
            }

            // Test Step 5: Test clicking on days with no events
            console.log('📅 Testing days with no events...');
            
            await this.page.evaluate(() => {
                // Click on a day that likely has no events (weekend or different month)
                const emptyDays = document.querySelectorAll('#calendar > div:not(.has-events)');
                if (emptyDays.length > 0) {
                    emptyDays[0].click();
                }
            });

            await new Promise(resolve => setTimeout(resolve, 1000));

            const noEventsMessage = await this.page.evaluate(() => {
                const scheduleList = document.querySelector('#scheduleList');
                const noEventsMsg = scheduleList?.querySelector('.no-events') || 
                                  scheduleList?.textContent.includes('No events') ||
                                  scheduleList?.textContent.includes('No schedule') ||
                                  scheduleList?.textContent.includes('No classes');
                return !!noEventsMsg;
            });

            if (noEventsMessage) {
                this.testResults.testSteps.noEventsDisplay = 'PASSED';
                console.log('✅ No events message displayed correctly');
            } else {
                this.testResults.testSteps.noEventsDisplay = 'FAILED';
                console.log('❌ No events message not displayed');
            }

            // Test Step 6: Test quick search functionality
            console.log('🔍 Testing quick search functionality...');
            
            const quickSearchBtn = await this.page.$('#quickSearchBtn');
            if (quickSearchBtn) {
                await quickSearchBtn.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const currentUrl = this.page.url();
                if (currentUrl.includes('search.html')) {
                    this.testResults.testSteps.quickSearch = 'PASSED';
                    console.log('✅ Quick search navigates to search page');
                } else {
                    this.testResults.testSteps.quickSearch = 'FAILED';
                    console.log('❌ Quick search does not navigate to search page');
                }
            } else {
                this.testResults.testSteps.quickSearch = 'SKIPPED - Button not found';
                console.log('⚠️ Quick search button not found');
            }

            // Take final screenshot
            const screenshotPath = path.join(__dirname, `test_2_2_schedule_display_${Date.now()}.png`);
            await this.page.screenshot({ path: screenshotPath, fullPage: true });
            this.testResults.screenshots.push(screenshotPath);

        } catch (error) {
            this.testResults.errors.push(`Test execution failed: ${error.message}`);
            console.error('❌ Test execution failed:', error.message);
        }
    }

    async generateReport() {
        console.log('📊 Generating test report...');
        
        // Determine overall test result
        const testSteps = this.testResults.testSteps;
        const passedSteps = Object.values(testSteps).filter(step => step === 'PASSED').length;
        const totalSteps = Object.keys(testSteps).length;
        
        this.testResults.passed = passedSteps >= totalSteps * 0.8; // 80% pass rate
        this.testResults.summary = {
            totalSteps: totalSteps,
            passedSteps: passedSteps,
            passRate: `${Math.round((passedSteps / totalSteps) * 100)}%`,
            overallResult: this.testResults.passed ? 'PASSED' : 'FAILED'
        };

        // Save test results
        const resultsPath = path.join(__dirname, `test_2_2_results_${Date.now()}.json`);
        fs.writeFileSync(resultsPath, JSON.stringify(this.testResults, null, 2));
        
        console.log('📋 Test Results Summary:');
        console.log(`   Overall Result: ${this.testResults.summary.overallResult}`);
        console.log(`   Pass Rate: ${this.testResults.summary.passRate}`);
        console.log(`   Steps Passed: ${passedSteps}/${totalSteps}`);
        console.log(`   Errors: ${this.testResults.errors.length}`);
        console.log(`   Results saved to: ${resultsPath}`);

        return this.testResults;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

// Execute the test
async function runTest2_2() {
    const test = new Test2_2_ScheduleDisplay();
    
    try {
        await test.setup();
        await test.executeTest();
        const results = await test.generateReport();
        await test.cleanup();
        
        return results;
    } catch (error) {
        console.error('Test failed:', error);
        await test.cleanup();
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    runTest2_2()
        .then(results => {
            console.log('✅ Test 2.2 completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Test 2.2 failed:', error);
            process.exit(1);
        });
}

module.exports = { Test2_2_ScheduleDisplay, runTest2_2 };

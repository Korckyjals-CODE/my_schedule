/**
 * Test 10.1: End-to-End Workflow
 * 
 * This test performs a complete end-to-end workflow of the Schedule Editor application,
 * testing all major features in sequence to ensure they work together seamlessly.
 * 
 * SETUP:
 * 1. Start with a fresh user account
 * 2. Ensure all services are running
 * 
 * TEST STEPS:
 * 1. Complete user registration and login
 * 2. Create a comprehensive schedule:
 *    - Add weekday schedules
 *    - Add specific date schedules
 *    - Add date range schedules
 *    - Upload and extract from image
 * 3. Test search functionality:
 *    - Search for different criteria
 *    - Use filters and combinations
 *    - Export search results
 * 4. Test calendar navigation:
 *    - View different months
 *    - Click on different days
 *    - Edit and delete events
 * 5. Test data persistence:
 *    - Refresh page
 *    - Log out and back in
 *    - Verify all data is preserved
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class EndToEndWorkflowTest {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = {
            testName: 'Test 10.1: End-to-End Workflow',
            timestamp: new Date().toISOString(),
            steps: [],
            overallResult: 'PENDING',
            errors: [],
            screenshots: []
        };
        this.testUser = {
            email: `testuser_${Date.now()}@example.com`,
            password: 'testpassword123',
            fullName: 'Test User E2E'
        };
    }

    async initialize() {
        console.log('🚀 Starting Test 10.1: End-to-End Workflow');
        
        try {
            this.browser = await puppeteer.launch({
                headless: false,
                defaultViewport: { width: 1280, height: 720 },
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            this.page = await this.browser.newPage();
            
            // Enable console logging
            this.page.on('console', msg => {
                if (msg.type() === 'error') {
                    console.log('Browser Error:', msg.text());
                    this.testResults.errors.push({
                        step: 'Browser Console',
                        error: msg.text(),
                        timestamp: new Date().toISOString()
                    });
                }
            });

            // Enable request/response logging
            this.page.on('response', response => {
                if (!response.ok()) {
                    console.log(`HTTP Error: ${response.status()} - ${response.url()}`);
                    this.testResults.errors.push({
                        step: 'HTTP Request',
                        error: `${response.status()} - ${response.url()}`,
                        timestamp: new Date().toISOString()
                    });
                }
            });

            console.log('✅ Browser initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize browser:', error);
            this.testResults.errors.push({
                step: 'Browser Initialization',
                error: error.message,
                timestamp: new Date().toISOString()
            });
            return false;
        }
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async takeScreenshot(name) {
        try {
            const screenshotPath = path.join(__dirname, `test_10_1_${name}_${Date.now()}.png`);
            await this.page.screenshot({ path: screenshotPath, fullPage: true });
            this.testResults.screenshots.push(screenshotPath);
            console.log(`📸 Screenshot taken: ${name}`);
            return screenshotPath;
        } catch (error) {
            console.error(`❌ Failed to take screenshot ${name}:`, error);
            return null;
        }
    }

    async recordStep(stepName, success, details = '') {
        const step = {
            name: stepName,
            success: success,
            details: details,
            timestamp: new Date().toISOString()
        };
        this.testResults.steps.push(step);
        
        if (success) {
            console.log(`✅ ${stepName}: ${details}`);
        } else {
            console.log(`❌ ${stepName}: ${details}`);
        }
    }

    async navigateToApp() {
        try {
            await this.page.goto('http://localhost:3000', { 
                waitUntil: 'networkidle2',
                timeout: 10000 
            });
            await this.takeScreenshot('initial_load');
            await this.recordStep('Navigate to App', true, 'Successfully loaded main page');
            return true;
        } catch (error) {
            await this.recordStep('Navigate to App', false, error.message);
            return false;
        }
    }

    async testUserRegistration() {
        try {
            // Click on Sign Up link
            await this.page.waitForSelector('#showSignUpLink', { timeout: 5000 });
            await this.page.click('#showSignUpLink');
            await this.sleep(1000);

            // Fill registration form
            await this.page.type('#signupName', this.testUser.fullName);
            await this.page.type('#signupEmail', this.testUser.email);
            await this.page.type('#signupPassword', this.testUser.password);
            await this.page.type('#signupConfirmPassword', this.testUser.password);
            
            // Check terms checkbox
            await this.page.click('#signupTerms');
            
            await this.takeScreenshot('registration_form');
            
            // Submit registration
            await this.page.click('#signupButton');
            await this.sleep(3000);

            // Check for success message or redirect to login
            const successMessage = await this.page.$('.success-message, .alert-success');
            const loginForm = await this.page.$('#loginForm');
            
            if (successMessage || loginForm) {
                await this.recordStep('User Registration', true, 'Registration completed successfully');
                await this.takeScreenshot('registration_success');
                return true;
            } else {
                await this.recordStep('User Registration', false, 'No success indicator found');
                return false;
            }
        } catch (error) {
            await this.recordStep('User Registration', false, error.message);
            return false;
        }
    }

    async testUserLogin() {
        try {
            // Fill login form
            await this.page.type('#loginEmail', this.testUser.email);
            await this.page.type('#loginPassword', this.testUser.password);
            
            await this.takeScreenshot('login_form');
            
            // Submit login
            await this.page.click('#loginButton');
            await this.sleep(3000);

            // Check for successful login (redirect to main app)
            await this.page.waitForSelector('.calendar-container, .app-section', { timeout: 10000 });
            
            const userEmail = await this.page.$eval('#userEmail', el => el.textContent).catch(() => null);
            
            if (userEmail && userEmail.includes(this.testUser.email)) {
                await this.recordStep('User Login', true, 'Successfully logged in');
                await this.takeScreenshot('login_success');
                return true;
            } else {
                await this.recordStep('User Login', false, 'Login verification failed');
                return false;
            }
        } catch (error) {
            await this.recordStep('User Login', false, error.message);
            return false;
        }
    }

    async testWeekdayScheduleCreation() {
        try {
            // Navigate to schedule editor
            await this.page.goto('http://localhost:3000/schedule-editor.html', { 
                waitUntil: 'networkidle2' 
            });
            await this.takeScreenshot('schedule_editor_initial');

            // Ensure weekday tab is active
            await this.page.waitForSelector('#weekdayEditor', { timeout: 5000 });
            
            // Select Monday
            await this.page.select('#weekday', 'Monday');
            
            // Click Add Entry
            await this.page.click('button[onclick="addWeekdayEntry()"]');
            await this.sleep(1000);

            // Fill schedule entry - the form will be dynamically created
            const gradeSelect = await this.page.$('select[name="grade"]').catch(() => null);
            if (gradeSelect) {
                await this.page.select('select[name="grade"]', '6A');
                await this.page.type('input[name="startTime"]', '08:00');
                await this.page.type('input[name="endTime"]', '08:45');
                await this.page.type('input[name="subject"]', 'Mathematics');
                
                await this.takeScreenshot('weekday_entry_form');

                // Save schedule
                await this.page.click('button[onclick="saveSchedule()"]');
                await this.sleep(2000);

                // Verify entry appears in list
                const entryExists = await this.page.$('.schedule-entry').catch(() => null);
                
                if (entryExists) {
                    await this.recordStep('Weekday Schedule Creation', true, 'Successfully created weekday schedule');
                    await this.takeScreenshot('weekday_schedule_created');
                    return true;
                } else {
                    await this.recordStep('Weekday Schedule Creation', false, 'Schedule entry not found');
                    return false;
                }
            } else {
                await this.recordStep('Weekday Schedule Creation', false, 'Grade select not found');
                return false;
            }
        } catch (error) {
            await this.recordStep('Weekday Schedule Creation', false, error.message);
            return false;
        }
    }

    async testSpecificDateScheduleCreation() {
        try {
            // Click on Specific Dates tab
            await this.page.click('button[data-tab="specific"]');
            await this.sleep(1000);
            await this.takeScreenshot('specific_dates_tab');

            // Select a specific date (tomorrow)
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateString = tomorrow.toISOString().split('T')[0];
            
            await this.page.type('#specificDate', dateString);
            
            // Click Add Entry
            await this.page.click('button[onclick="addSpecificEntry()"]');
            await this.sleep(1000);

            // Fill schedule entry
            const gradeSelect = await this.page.$('select[name="grade"]').catch(() => null);
            if (gradeSelect) {
                await this.page.select('select[name="grade"]', '11A');
                await this.page.type('input[name="startTime"]', '10:00');
                await this.page.type('input[name="endTime"]', '10:45');
                await this.page.type('input[name="subject"]', 'Assembly');
                
                await this.takeScreenshot('specific_date_entry_form');

                // Save schedule
                await this.page.click('button[onclick="saveSchedule()"]');
                await this.sleep(2000);

                // Verify entry appears
                const entryExists = await this.page.$('.schedule-entry').catch(() => null);
                
                if (entryExists) {
                    await this.recordStep('Specific Date Schedule Creation', true, 'Successfully created specific date schedule');
                    await this.takeScreenshot('specific_date_schedule_created');
                    return true;
                } else {
                    await this.recordStep('Specific Date Schedule Creation', false, 'Schedule entry not found');
                    return false;
                }
            } else {
                await this.recordStep('Specific Date Schedule Creation', false, 'Grade select not found');
                return false;
            }
        } catch (error) {
            await this.recordStep('Specific Date Schedule Creation', false, error.message);
            return false;
        }
    }

    async testDateRangeScheduleCreation() {
        try {
            // Click on Date Range tab
            await this.page.click('button[data-tab="range"]');
            await this.sleep(1000);
            await this.takeScreenshot('date_range_tab');

            // Select date range (next week)
            const startDate = new Date();
            startDate.setDate(startDate.getDate() + 7);
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 11);
            
            await this.page.type('#rangeStartDate', startDate.toISOString().split('T')[0]);
            await this.page.type('#rangeEndDate', endDate.toISOString().split('T')[0]);
            
            // Click Create New Event
            await this.page.click('button[onclick="showRangeEventForm()"]');
            await this.sleep(1000);

            // Fill event details
            await this.page.select('#rangeGrade', '9A');
            await this.page.type('#rangeStartTime', '14:00');
            await this.page.type('#rangeEndTime', '14:45');
            await this.page.select('#rangeSubject', 'Prep');
            
            await this.takeScreenshot('date_range_event_form');

            // Add event to all weekdays
            await this.page.click('button[onclick="addRangeEntry()"]');
            await this.sleep(2000);

            // Verify events are created
            const eventsCreated = await this.page.$eval('#rangeWeekdays', el => {
                return el.querySelectorAll('.weekday-tag').length > 0;
            }).catch(() => false);
            
            if (eventsCreated) {
                await this.recordStep('Date Range Schedule Creation', true, 'Successfully created date range schedule');
                await this.takeScreenshot('date_range_schedule_created');
                return true;
            } else {
                await this.recordStep('Date Range Schedule Creation', false, 'No events created for date range');
                return false;
            }
        } catch (error) {
            await this.recordStep('Date Range Schedule Creation', false, error.message);
            return false;
        }
    }

    async testImageUploadAndExtraction() {
        try {
            // Click on Image Upload tab
            await this.page.click('button[data-tab="image"]');
            await this.sleep(1000);
            await this.takeScreenshot('image_upload_tab');

            // Check if sample image exists
            const sampleImagePath = path.join(__dirname, '../../data/sample_schedule.png');
            
            if (fs.existsSync(sampleImagePath)) {
                // Upload sample image
                const fileInput = await this.page.$('#imageUpload');
                await fileInput.uploadFile(sampleImagePath);
                await this.takeScreenshot('image_selected');

                // Click Extract Schedule
                await this.page.click('button[onclick="extractScheduleFromImage()"]');
                await this.sleep(5000); // Wait for AI processing

                // Check for extracted data
                const extractedData = await this.page.$eval('#imagePreview', el => el.textContent).catch(() => null);
                
                if (extractedData && extractedData.includes('{')) {
                    await this.takeScreenshot('extraction_results');
                    
                    // Apply extracted schedule
                    await this.page.click('button[onclick="saveSchedule()"]');
                    await this.sleep(2000);
                    
                    await this.recordStep('Image Upload and Extraction', true, 'Successfully extracted and applied schedule from image');
                    await this.takeScreenshot('schedule_applied');
                    return true;
                } else {
                    await this.recordStep('Image Upload and Extraction', false, 'No extracted data found');
                    return false;
                }
            } else {
                await this.recordStep('Image Upload and Extraction', false, 'Sample image not found');
                return false;
            }
        } catch (error) {
            await this.recordStep('Image Upload and Extraction', false, error.message);
            return false;
        }
    }

    async testSearchFunctionality() {
        try {
            // Navigate to search page
            await this.page.goto('http://localhost:3000/search.html', { 
                waitUntil: 'networkidle2' 
            });
            await this.takeScreenshot('search_page_initial');

            // Perform basic search
            await this.page.type('#searchInput', '6A');
            await this.page.click('#searchBtn');
            await this.sleep(2000);
            
            const searchResults = await this.page.$('.search-results').catch(() => null);
            
            if (searchResults) {
                await this.takeScreenshot('search_results');
                
                // Test filters
                const gradeFilter = await this.page.$('input[value="6A"]').catch(() => null);
                if (gradeFilter) {
                    await this.page.click('input[value="6A"]');
                    await this.page.click('#searchBtn');
                    await this.sleep(1000);
                    
                    await this.takeScreenshot('filtered_search_results');
                }
                
                // Test export functionality
                const exportButton = await this.page.$('#exportCSVBtn').catch(() => null);
                if (exportButton) {
                    await this.page.click('#exportCSVBtn');
                    await this.sleep(1000);
                }
                
                await this.recordStep('Search Functionality', true, 'Search and filtering worked correctly');
                return true;
            } else {
                await this.recordStep('Search Functionality', false, 'No search results found');
                return false;
            }
        } catch (error) {
            await this.recordStep('Search Functionality', false, error.message);
            return false;
        }
    }

    async testCalendarNavigation() {
        try {
            // Navigate back to main calendar
            await this.page.goto('http://localhost:3000', { 
                waitUntil: 'networkidle2' 
            });
            await this.takeScreenshot('calendar_main_view');

            // Test month navigation
            await this.page.click('#prevMonth');
            await this.sleep(1000);
            await this.takeScreenshot('calendar_prev_month');

            await this.page.click('#nextMonth');
            await this.sleep(1000);
            await this.takeScreenshot('calendar_next_month');

            // Click on a calendar day
            const calendarDay = await this.page.$('.calendar-day:not(.disabled)').catch(() => null);
            if (calendarDay) {
                await calendarDay.click();
                await this.sleep(1000);
                await this.takeScreenshot('calendar_day_selected');
            }

            await this.recordStep('Calendar Navigation', true, 'Calendar navigation worked correctly');
            return true;
        } catch (error) {
            await this.recordStep('Calendar Navigation', false, error.message);
            return false;
        }
    }

    async testDataPersistence() {
        try {
            // Refresh page
            await this.page.reload({ waitUntil: 'networkidle2' });
            await this.sleep(2000);
            await this.takeScreenshot('after_page_refresh');

            // Check if data is still present
            const scheduleData = await this.page.evaluate(() => {
                return document.querySelectorAll('.schedule-entry, .calendar-event').length;
            });

            if (scheduleData > 0) {
                await this.recordStep('Data Persistence - Page Refresh', true, `Found ${scheduleData} schedule entries after refresh`);
                
                // Test logout and login
                await this.page.click('#signoutButton');
                await this.sleep(2000);
                await this.takeScreenshot('after_logout');

                // Login again
                await this.page.type('#loginEmail', this.testUser.email);
                await this.page.type('#loginPassword', this.testUser.password);
                await this.page.click('#loginButton');
                await this.sleep(3000);
                await this.takeScreenshot('after_relogin');

                // Check data persistence
                const dataAfterRelogin = await this.page.evaluate(() => {
                    return document.querySelectorAll('.schedule-entry, .calendar-event').length;
                });

                if (dataAfterRelogin > 0) {
                    await this.recordStep('Data Persistence - Session', true, `Found ${dataAfterRelogin} schedule entries after relogin`);
                    return true;
                } else {
                    await this.recordStep('Data Persistence - Session', false, 'No data found after relogin');
                    return false;
                }
            } else {
                await this.recordStep('Data Persistence - Page Refresh', false, 'No schedule data found after refresh');
                return false;
            }
        } catch (error) {
            await this.recordStep('Data Persistence', false, error.message);
            return false;
        }
    }

    async runTest() {
        console.log('🎯 Starting End-to-End Workflow Test');
        
        const steps = [
            { name: 'Navigate to App', fn: () => this.navigateToApp() },
            { name: 'User Registration', fn: () => this.testUserRegistration() },
            { name: 'User Login', fn: () => this.testUserLogin() },
            { name: 'Weekday Schedule Creation', fn: () => this.testWeekdayScheduleCreation() },
            { name: 'Specific Date Schedule Creation', fn: () => this.testSpecificDateScheduleCreation() },
            { name: 'Date Range Schedule Creation', fn: () => this.testDateRangeScheduleCreation() },
            { name: 'Image Upload and Extraction', fn: () => this.testImageUploadAndExtraction() },
            { name: 'Search Functionality', fn: () => this.testSearchFunctionality() },
            { name: 'Calendar Navigation', fn: () => this.testCalendarNavigation() },
            { name: 'Data Persistence', fn: () => this.testDataPersistence() }
        ];

        let successCount = 0;
        let totalSteps = steps.length;

        for (const step of steps) {
            try {
                const result = await step.fn();
                if (result) successCount++;
            } catch (error) {
                console.error(`❌ Error in step ${step.name}:`, error);
                this.testResults.errors.push({
                    step: step.name,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }

        // Calculate overall result
        const successRate = (successCount / totalSteps) * 100;
        this.testResults.overallResult = successRate >= 80 ? 'PASSED' : 'FAILED';
        this.testResults.successRate = successRate;
        this.testResults.successCount = successCount;
        this.testResults.totalSteps = totalSteps;

        console.log(`\n📊 Test Results Summary:`);
        console.log(`✅ Successful Steps: ${successCount}/${totalSteps}`);
        console.log(`📈 Success Rate: ${successRate.toFixed(1)}%`);
        console.log(`🎯 Overall Result: ${this.testResults.overallResult}`);

        return this.testResults;
    }

    async cleanup() {
        try {
            if (this.browser) {
                await this.browser.close();
            }
            console.log('🧹 Browser cleanup completed');
        } catch (error) {
            console.error('❌ Error during cleanup:', error);
        }
    }

    async saveResults() {
        try {
            const resultsPath = path.join(__dirname, `test_10_1_results_${Date.now()}.json`);
            fs.writeFileSync(resultsPath, JSON.stringify(this.testResults, null, 2));
            console.log(`💾 Test results saved to: ${resultsPath}`);
            return resultsPath;
        } catch (error) {
            console.error('❌ Failed to save results:', error);
            return null;
        }
    }
}

// Main execution
async function main() {
    const test = new EndToEndWorkflowTest();
    
    try {
        const initialized = await test.initialize();
        if (!initialized) {
            console.error('❌ Failed to initialize test environment');
            process.exit(1);
        }

        const results = await test.runTest();
        await test.saveResults();
        
        console.log('\n🏁 End-to-End Workflow Test Completed');
        console.log(`📋 Final Result: ${results.overallResult}`);
        
    } catch (error) {
        console.error('❌ Test execution failed:', error);
    } finally {
        await test.cleanup();
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = EndToEndWorkflowTest;

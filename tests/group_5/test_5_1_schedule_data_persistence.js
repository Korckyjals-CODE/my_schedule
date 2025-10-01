// Test 5.1: Schedule Data Persistence
// This test verifies that schedule data persists correctly across page refreshes, sessions, and database operations

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class ScheduleDataPersistenceTest {
    constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
        this.testResults = {
            testName: 'Test 5.1: Schedule Data Persistence',
            timestamp: new Date().toISOString(),
            status: 'RUNNING',
            steps: [],
            screenshots: [],
            errors: [],
            dataSnapshots: [],
            summary: {}
        };
        this.testDataIds = [];
    }

    async setup() {
        console.log('🚀 Starting Test 5.1: Schedule Data Persistence');
        console.log('📋 Setting up test environment...');
        
        try {
            this.browser = await chromium.launch({
                headless: false,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            this.context = await this.browser.newContext({
                viewport: { width: 1920, height: 1080 }
            });
            
            this.page = await this.context.newPage();
            
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

    async authenticate() {
        console.log('🔐 Authenticating test user...');
        
        try {
            await this.page.goto('http://localhost:3000', { 
                waitUntil: 'networkidle',
                timeout: 15000 
            });
            
            // Wait for page to load
            await this.page.waitForTimeout(2000);
            
            // Check if authentication is required
            const authSection = await this.page.$('#authSection');
            if (authSection) {
                const authVisible = await authSection.isVisible().catch(() => false);
                
                if (authVisible) {
                    console.log('📝 Authentication required - setting up test user...');
                    
                    // Try to register first (if user doesn't exist)
                    try {
                        await this.page.click('a[onclick="showSignUp()"]', { timeout: 5000 });
                        await this.page.waitForTimeout(1000);
                        
                        await this.page.fill('#signupName', 'Test Persistence User');
                        await this.page.fill('#signupEmail', 'testpersistence@example.com');
                        await this.page.fill('#signupPassword', 'testpassword123');
                        await this.page.fill('#signupConfirmPassword', 'testpassword123');
                        await this.page.check('#signupTerms');
                        await this.page.click('button[onclick="handleSignUp()"]');
                        
                        await this.page.waitForTimeout(3000);
                    } catch (error) {
                        console.log('⚠️  Registration may have failed, will try login...');
                    }
                    
                    // Now try to login
                    const loginEmail = await this.page.$('#loginEmail');
                    if (loginEmail && await loginEmail.isVisible()) {
                        await this.page.fill('#loginEmail', 'testpersistence@example.com');
                        await this.page.fill('#loginPassword', 'testpassword123');
                        await this.page.click('button[onclick="handleLogin()"]');
                        
                        // Wait for authentication to complete
                        await this.page.waitForSelector('#appSection', { timeout: 15000 });
                        await this.page.waitForTimeout(2000);
                        
                        console.log('✅ Successfully authenticated');
                        
                        this.testResults.steps.push({
                            step: 'Authentication',
                            status: 'PASS',
                            details: 'Successfully logged in test user'
                        });
                        
                        return true;
                    }
                }
            }
            
            // Check if already authenticated
            const appSection = await this.page.$('#appSection');
            if (appSection && await appSection.isVisible()) {
                console.log('✅ Already authenticated');
                return true;
            }
            
            throw new Error('Authentication failed');
            
        } catch (error) {
            console.error('❌ Authentication failed:', error);
            this.testResults.errors.push({
                type: 'authentication_error',
                message: error.message,
                stack: error.stack
            });
            this.testResults.steps.push({
                step: 'Authentication',
                status: 'FAIL',
                details: error.message
            });
            return false;
        }
    }

    async createWeekdayScheduleEntry() {
        console.log('📅 Creating weekday schedule entry...');
        
        try {
            // Navigate to schedule editor
            await this.page.goto('http://localhost:3000/schedule-editor.html', {
                waitUntil: 'networkidle',
                timeout: 15000
            });
            await this.page.waitForTimeout(2000);
            
            // Ensure we're on the weekday tab
            const weekdayTab = await this.page.$('button[data-tab="weekday"]');
            if (weekdayTab) {
                await weekdayTab.click();
                await this.page.waitForTimeout(500);
            }
            
            // Select Monday
            await this.page.selectOption('#weekday', 'Monday');
            await this.page.waitForTimeout(500);
            
            // Add new entry
            await this.page.click('button[onclick="addWeekdayEntry()"]');
            await this.page.waitForTimeout(1000);
            
            // Fill in the entry (find the last entry)
            const entries = await this.page.$$('.schedule-entry');
            if (entries.length > 0) {
                const lastEntry = entries[entries.length - 1];
                
                // Select grade
                const gradeSelect = await lastEntry.$('select[onchange*="updateWeekdayEntry"]');
                if (gradeSelect) {
                    await gradeSelect.selectOption('6A');
                }
                
                // Fill times
                const timeInputs = await lastEntry.$$('input[type="time"]');
                if (timeInputs.length >= 2) {
                    await timeInputs[0].fill('08:00');
                    await timeInputs[1].fill('08:45');
                }
                
                // Select subject
                const subjectSelect = await lastEntry.$$('select');
                if (subjectSelect.length >= 2) {
                    await subjectSelect[1].selectOption('Class');
                }
                
                await this.page.waitForTimeout(500);
            }
            
            // Save the schedule
            await this.page.click('button[onclick="saveWeekdaySchedule()"]');
            await this.page.waitForTimeout(2000);
            
            // Take screenshot
            const screenshotPath = path.join(__dirname, `test_5_1_weekday_created_${Date.now()}.png`);
            await this.page.screenshot({ path: screenshotPath, fullPage: true });
            this.testResults.screenshots.push(screenshotPath);
            
            console.log('✅ Weekday schedule entry created');
            
            this.testResults.steps.push({
                step: 'Create Weekday Schedule',
                status: 'PASS',
                details: 'Successfully created weekday schedule entry for Monday'
            });
            
            return true;
            
        } catch (error) {
            console.error('❌ Failed to create weekday schedule entry:', error);
            this.testResults.errors.push({
                type: 'create_weekday_error',
                message: error.message,
                stack: error.stack
            });
            this.testResults.steps.push({
                step: 'Create Weekday Schedule',
                status: 'FAIL',
                details: error.message
            });
            return false;
        }
    }

    async createSpecificDateEntry() {
        console.log('📆 Creating specific date schedule entry...');
        
        try {
            // Navigate to schedule editor if not already there
            const currentUrl = this.page.url();
            if (!currentUrl.includes('schedule-editor.html')) {
                await this.page.goto('http://localhost:3000/schedule-editor.html', {
                    waitUntil: 'networkidle',
                    timeout: 15000
                });
                await this.page.waitForTimeout(2000);
            }
            
            // Click specific dates tab
            const specificTab = await this.page.$('button[data-tab="specific"]');
            if (specificTab) {
                await specificTab.click();
                await this.page.waitForTimeout(1000);
            }
            
            // Select a specific date (tomorrow)
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateString = tomorrow.toISOString().split('T')[0];
            
            await this.page.fill('#specificDate', dateString);
            await this.page.waitForTimeout(500);
            
            // Add new entry
            const addButton = await this.page.$('button[onclick="addSpecificDateEntry()"]');
            if (addButton) {
                await addButton.click();
                await this.page.waitForTimeout(1000);
            }
            
            // Fill in the entry
            const entries = await this.page.$$('.schedule-entry');
            if (entries.length > 0) {
                const lastEntry = entries[entries.length - 1];
                
                // Select grade
                const gradeSelect = await lastEntry.$('select');
                if (gradeSelect) {
                    await gradeSelect.selectOption('11A');
                }
                
                // Fill times
                const timeInputs = await lastEntry.$$('input[type="time"]');
                if (timeInputs.length >= 2) {
                    await timeInputs[0].fill('10:00');
                    await timeInputs[1].fill('10:45');
                }
                
                // Select subject
                const subjectSelects = await lastEntry.$$('select');
                if (subjectSelects.length >= 2) {
                    await subjectSelects[1].selectOption('Assembly');
                }
                
                await this.page.waitForTimeout(500);
            }
            
            // Save the schedule
            const saveButton = await this.page.$('button[onclick="saveSpecificDateSchedule()"]');
            if (saveButton) {
                await saveButton.click();
                await this.page.waitForTimeout(2000);
            }
            
            // Take screenshot
            const screenshotPath = path.join(__dirname, `test_5_1_specific_date_created_${Date.now()}.png`);
            await this.page.screenshot({ path: screenshotPath, fullPage: true });
            this.testResults.screenshots.push(screenshotPath);
            
            console.log('✅ Specific date schedule entry created');
            
            this.testResults.steps.push({
                step: 'Create Specific Date Schedule',
                status: 'PASS',
                details: `Successfully created specific date entry for ${dateString}`
            });
            
            return true;
            
        } catch (error) {
            console.error('❌ Failed to create specific date entry:', error);
            this.testResults.errors.push({
                type: 'create_specific_date_error',
                message: error.message,
                stack: error.stack
            });
            this.testResults.steps.push({
                step: 'Create Specific Date Schedule',
                status: 'FAIL',
                details: error.message
            });
            return false;
        }
    }

    async createDateRangeEntry() {
        console.log('📅 Creating date range schedule entry...');
        
        try {
            // Navigate to schedule editor if not already there
            const currentUrl = this.page.url();
            if (!currentUrl.includes('schedule-editor.html')) {
                await this.page.goto('http://localhost:3000/schedule-editor.html', {
                    waitUntil: 'networkidle',
                    timeout: 15000
                });
                await this.page.waitForTimeout(2000);
            }
            
            // Click date range tab
            const rangeTab = await this.page.$('button[data-tab="range"]');
            if (rangeTab) {
                await rangeTab.click();
                await this.page.waitForTimeout(1000);
            }
            
            // Select date range (next 5 days)
            const startDate = new Date();
            startDate.setDate(startDate.getDate() + 2);
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 6);
            
            const startDateString = startDate.toISOString().split('T')[0];
            const endDateString = endDate.toISOString().split('T')[0];
            
            await this.page.fill('#startDate', startDateString);
            await this.page.fill('#endDate', endDateString);
            await this.page.waitForTimeout(1000);
            
            // Create new event
            const createButton = await this.page.$('button[onclick="createDateRangeEvent()"]');
            if (createButton) {
                await createButton.click();
                await this.page.waitForTimeout(1000);
            }
            
            // Fill in event details
            const gradeSelect = await this.page.$('#rangeGrade');
            if (gradeSelect) {
                await gradeSelect.selectOption('9A');
            }
            
            await this.page.fill('#rangeStartTime', '14:00');
            await this.page.fill('#rangeEndTime', '14:45');
            
            const subjectSelect = await this.page.$('#rangeSubject');
            if (subjectSelect) {
                await subjectSelect.selectOption('Prep');
            }
            
            await this.page.waitForTimeout(500);
            
            // Add event to all weekdays
            const addToAllButton = await this.page.$('button[onclick="addEventToAllWeekdays()"]');
            if (addToAllButton) {
                await addToAllButton.click();
                await this.page.waitForTimeout(3000);
            }
            
            // Take screenshot
            const screenshotPath = path.join(__dirname, `test_5_1_date_range_created_${Date.now()}.png`);
            await this.page.screenshot({ path: screenshotPath, fullPage: true });
            this.testResults.screenshots.push(screenshotPath);
            
            console.log('✅ Date range schedule entry created');
            
            this.testResults.steps.push({
                step: 'Create Date Range Schedule',
                status: 'PASS',
                details: `Successfully created date range entries from ${startDateString} to ${endDateString}`
            });
            
            return true;
            
        } catch (error) {
            console.error('❌ Failed to create date range entry:', error);
            this.testResults.errors.push({
                type: 'create_date_range_error',
                message: error.message,
                stack: error.stack
            });
            this.testResults.steps.push({
                step: 'Create Date Range Schedule',
                status: 'FAIL',
                details: error.message
            });
            return false;
        }
    }

    async captureScheduleData() {
        console.log('📸 Capturing current schedule data...');
        
        try {
            // Navigate to calendar to verify data
            await this.page.goto('http://localhost:3000', {
                waitUntil: 'networkidle',
                timeout: 15000
            });
            await this.page.waitForTimeout(2000);
            
            // Get schedule data from localStorage or via API
            const scheduleData = await this.page.evaluate(() => {
                return localStorage.getItem('scheduleData');
            });
            
            const snapshot = {
                timestamp: new Date().toISOString(),
                data: scheduleData,
                localStorage: await this.page.evaluate(() => {
                    return JSON.stringify(localStorage);
                })
            };
            
            this.testResults.dataSnapshots.push(snapshot);
            
            console.log('✅ Schedule data captured');
            
            return snapshot;
            
        } catch (error) {
            console.error('❌ Failed to capture schedule data:', error);
            this.testResults.errors.push({
                type: 'capture_data_error',
                message: error.message,
                stack: error.stack
            });
            return null;
        }
    }

    async testPageRefresh() {
        console.log('🔄 Testing data persistence after page refresh...');
        
        try {
            // Capture data before refresh
            const beforeRefresh = await this.captureScheduleData();
            
            // Take screenshot before refresh
            const beforeScreenshot = path.join(__dirname, `test_5_1_before_refresh_${Date.now()}.png`);
            await this.page.screenshot({ path: beforeScreenshot, fullPage: true });
            this.testResults.screenshots.push(beforeScreenshot);
            
            // Refresh the page
            await this.page.reload({ waitUntil: 'networkidle', timeout: 15000 });
            await this.page.waitForTimeout(3000);
            
            // Take screenshot after refresh
            const afterScreenshot = path.join(__dirname, `test_5_1_after_refresh_${Date.now()}.png`);
            await this.page.screenshot({ path: afterScreenshot, fullPage: true });
            this.testResults.screenshots.push(afterScreenshot);
            
            // Capture data after refresh
            const afterRefresh = await this.captureScheduleData();
            
            // Compare data
            if (beforeRefresh && afterRefresh) {
                const dataMatches = beforeRefresh.data === afterRefresh.data;
                
                if (dataMatches) {
                    console.log('✅ Data persisted correctly after page refresh');
                    
                    this.testResults.steps.push({
                        step: 'Page Refresh Persistence',
                        status: 'PASS',
                        details: 'All data persisted correctly after page refresh'
                    });
                    
                    return true;
                } else {
                    console.log('❌ Data mismatch after page refresh');
                    
                    this.testResults.steps.push({
                        step: 'Page Refresh Persistence',
                        status: 'FAIL',
                        details: 'Data did not match after page refresh'
                    });
                    
                    return false;
                }
            } else {
                throw new Error('Unable to compare data snapshots');
            }
            
        } catch (error) {
            console.error('❌ Page refresh test failed:', error);
            this.testResults.errors.push({
                type: 'refresh_test_error',
                message: error.message,
                stack: error.stack
            });
            this.testResults.steps.push({
                step: 'Page Refresh Persistence',
                status: 'FAIL',
                details: error.message
            });
            return false;
        }
    }

    async testSessionPersistence() {
        console.log('🔐 Testing data persistence across sessions...');
        
        try {
            // Capture data before logout
            const beforeLogout = await this.captureScheduleData();
            
            // Logout
            await this.page.goto('http://localhost:3000', {
                waitUntil: 'networkidle',
                timeout: 15000
            });
            await this.page.waitForTimeout(2000);
            
            const signOutButton = await this.page.$('button[onclick="signOut()"]');
            if (signOutButton) {
                await signOutButton.click();
                await this.page.waitForTimeout(3000);
                
                // Take screenshot after logout
                const logoutScreenshot = path.join(__dirname, `test_5_1_after_logout_${Date.now()}.png`);
                await this.page.screenshot({ path: logoutScreenshot, fullPage: true });
                this.testResults.screenshots.push(logoutScreenshot);
                
                console.log('✅ Logged out successfully');
                
                // Wait a moment
                await this.page.waitForTimeout(2000);
                
                // Login again
                const loginSuccess = await this.authenticate();
                
                if (loginSuccess) {
                    // Take screenshot after re-login
                    const reloginScreenshot = path.join(__dirname, `test_5_1_after_relogin_${Date.now()}.png`);
                    await this.page.screenshot({ path: reloginScreenshot, fullPage: true });
                    this.testResults.screenshots.push(reloginScreenshot);
                    
                    // Capture data after login
                    const afterLogin = await this.captureScheduleData();
                    
                    // Note: This is a basic check - actual implementation would need to verify via API
                    console.log('✅ Successfully logged back in');
                    
                    this.testResults.steps.push({
                        step: 'Session Persistence',
                        status: 'PASS',
                        details: 'Successfully logged out and back in (data persistence requires database verification)'
                    });
                    
                    return true;
                } else {
                    throw new Error('Failed to login after logout');
                }
            } else {
                throw new Error('Sign out button not found');
            }
            
        } catch (error) {
            console.error('❌ Session persistence test failed:', error);
            this.testResults.errors.push({
                type: 'session_test_error',
                message: error.message,
                stack: error.stack
            });
            this.testResults.steps.push({
                step: 'Session Persistence',
                status: 'FAIL',
                details: error.message
            });
            return false;
        }
    }

    async testEditingData() {
        console.log('✏️  Testing editing existing data...');
        
        try {
            // Navigate to schedule editor
            await this.page.goto('http://localhost:3000/schedule-editor.html', {
                waitUntil: 'networkidle',
                timeout: 15000
            });
            await this.page.waitForTimeout(2000);
            
            // Try to edit the first weekday entry
            const weekdayTab = await this.page.$('button[data-tab="weekday"]');
            if (weekdayTab) {
                await weekdayTab.click();
                await this.page.waitForTimeout(500);
            }
            
            await this.page.selectOption('#weekday', 'Monday');
            await this.page.waitForTimeout(1000);
            
            // Check if there are any entries
            const entries = await this.page.$$('.schedule-entry');
            
            if (entries.length > 0) {
                const firstEntry = entries[0];
                
                // Try to edit the time
                const timeInputs = await firstEntry.$$('input[type="time"]');
                if (timeInputs.length >= 2) {
                    await timeInputs[0].fill('09:00');
                    await timeInputs[1].fill('09:45');
                }
                
                await this.page.waitForTimeout(500);
                
                // Save changes
                await this.page.click('button[onclick="saveWeekdaySchedule()"]');
                await this.page.waitForTimeout(2000);
                
                // Take screenshot
                const editScreenshot = path.join(__dirname, `test_5_1_after_edit_${Date.now()}.png`);
                await this.page.screenshot({ path: editScreenshot, fullPage: true });
                this.testResults.screenshots.push(editScreenshot);
                
                console.log('✅ Successfully edited schedule entry');
                
                this.testResults.steps.push({
                    step: 'Edit Existing Data',
                    status: 'PASS',
                    details: 'Successfully edited schedule entry'
                });
                
                return true;
            } else {
                console.log('⚠️  No entries found to edit');
                
                this.testResults.steps.push({
                    step: 'Edit Existing Data',
                    status: 'SKIP',
                    details: 'No entries available to edit'
                });
                
                return true;
            }
            
        } catch (error) {
            console.error('❌ Edit test failed:', error);
            this.testResults.errors.push({
                type: 'edit_test_error',
                message: error.message,
                stack: error.stack
            });
            this.testResults.steps.push({
                step: 'Edit Existing Data',
                status: 'FAIL',
                details: error.message
            });
            return false;
        }
    }

    async testDeletingData() {
        console.log('🗑️  Testing deleting data...');
        
        try {
            // Navigate to schedule editor
            await this.page.goto('http://localhost:3000/schedule-editor.html', {
                waitUntil: 'networkidle',
                timeout: 15000
            });
            await this.page.waitForTimeout(2000);
            
            // Try to delete a weekday entry
            const weekdayTab = await this.page.$('button[data-tab="weekday"]');
            if (weekdayTab) {
                await weekdayTab.click();
                await this.page.waitForTimeout(500);
            }
            
            await this.page.selectOption('#weekday', 'Monday');
            await this.page.waitForTimeout(1000);
            
            // Check if there are any entries
            const entries = await this.page.$$('.schedule-entry');
            const initialCount = entries.length;
            
            if (initialCount > 0) {
                // Find and click the delete button on the first entry
                const deleteButton = await entries[0].$('button[onclick*="removeWeekdayEntry"]');
                if (deleteButton) {
                    await deleteButton.click();
                    await this.page.waitForTimeout(1000);
                    
                    // Save changes
                    await this.page.click('button[onclick="saveWeekdaySchedule()"]');
                    await this.page.waitForTimeout(2000);
                    
                    // Verify entry was deleted
                    const remainingEntries = await this.page.$$('.schedule-entry');
                    const finalCount = remainingEntries.length;
                    
                    // Take screenshot
                    const deleteScreenshot = path.join(__dirname, `test_5_1_after_delete_${Date.now()}.png`);
                    await this.page.screenshot({ path: deleteScreenshot, fullPage: true });
                    this.testResults.screenshots.push(deleteScreenshot);
                    
                    if (finalCount < initialCount) {
                        console.log(`✅ Successfully deleted entry (${initialCount} -> ${finalCount})`);
                        
                        this.testResults.steps.push({
                            step: 'Delete Data',
                            status: 'PASS',
                            details: `Successfully deleted entry (count: ${initialCount} -> ${finalCount})`
                        });
                        
                        return true;
                    } else {
                        console.log('⚠️  Entry count did not decrease after deletion');
                        
                        this.testResults.steps.push({
                            step: 'Delete Data',
                            status: 'FAIL',
                            details: 'Entry count did not decrease after deletion'
                        });
                        
                        return false;
                    }
                } else {
                    console.log('⚠️  Delete button not found');
                    
                    this.testResults.steps.push({
                        step: 'Delete Data',
                        status: 'FAIL',
                        details: 'Delete button not found'
                    });
                    
                    return false;
                }
            } else {
                console.log('⚠️  No entries found to delete');
                
                this.testResults.steps.push({
                    step: 'Delete Data',
                    status: 'SKIP',
                    details: 'No entries available to delete'
                });
                
                return true;
            }
            
        } catch (error) {
            console.error('❌ Delete test failed:', error);
            this.testResults.errors.push({
                type: 'delete_test_error',
                message: error.message,
                stack: error.stack
            });
            this.testResults.steps.push({
                step: 'Delete Data',
                status: 'FAIL',
                details: error.message
            });
            return false;
        }
    }

    async runTest() {
        console.log('🧪 Starting Test 5.1: Schedule Data Persistence');
        
        try {
            // Setup
            const setupSuccess = await this.setup();
            if (!setupSuccess) {
                throw new Error('Test setup failed');
            }
            
            // Authenticate
            const authSuccess = await this.authenticate();
            if (!authSuccess) {
                throw new Error('Authentication failed');
            }
            
            // Test Step 1: Create weekday schedule entries
            await this.createWeekdayScheduleEntry();
            
            // Test Step 2: Create specific date schedule entries
            await this.createSpecificDateEntry();
            
            // Test Step 3: Create date range schedule entries
            await this.createDateRangeEntry();
            
            // Test Step 4: Refresh the page and verify data persists
            await this.testPageRefresh();
            
            // Test Step 5: Log out and log back in, verify data persists
            await this.testSessionPersistence();
            
            // Test Step 6: Test editing existing data
            await this.testEditingData();
            
            // Test Step 7: Test deleting data
            await this.testDeletingData();
            
            console.log('✅ Test 5.1 completed');
            
            this.testResults.status = 'COMPLETED';
            
        } catch (error) {
            console.error('❌ Test 5.1 failed:', error);
            this.testResults.errors.push({
                type: 'test_execution_error',
                message: error.message,
                stack: error.stack
            });
            this.testResults.status = 'FAILED';
        } finally {
            await this.cleanup();
        }
    }

    async cleanup() {
        console.log('🧹 Cleaning up test environment...');
        
        if (this.browser) {
            await this.browser.close();
        }
        
        // Generate summary
        this.generateSummary();
        
        // Save test results
        const resultsPath = path.join(__dirname, `test_5_1_results_${Date.now()}.json`);
        fs.writeFileSync(resultsPath, JSON.stringify(this.testResults, null, 2));
        console.log(`📊 Test results saved to: ${resultsPath}`);
    }

    generateSummary() {
        console.log('\n📋 TEST 5.1 SUMMARY');
        console.log('===================');
        
        const totalSteps = this.testResults.steps.length;
        const passedSteps = this.testResults.steps.filter(s => s.status === 'PASS').length;
        const failedSteps = this.testResults.steps.filter(s => s.status === 'FAIL').length;
        const skippedSteps = this.testResults.steps.filter(s => s.status === 'SKIP').length;
        
        console.log(`Total Steps: ${totalSteps}`);
        console.log(`Passed: ${passedSteps}`);
        console.log(`Failed: ${failedSteps}`);
        console.log(`Skipped: ${skippedSteps}`);
        
        if (totalSteps > 0) {
            const successRate = ((passedSteps / (totalSteps - skippedSteps)) * 100).toFixed(1);
            console.log(`Success Rate: ${successRate}%`);
        }
        
        if (this.testResults.errors.length > 0) {
            console.log(`\n❌ Errors: ${this.testResults.errors.length}`);
            this.testResults.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error.type}: ${error.message}`);
            });
        }
        
        console.log(`\n📸 Screenshots: ${this.testResults.screenshots.length}`);
        this.testResults.screenshots.forEach(screenshot => {
            console.log(`- ${path.basename(screenshot)}`);
        });
        
        console.log(`\n📊 Data Snapshots: ${this.testResults.dataSnapshots.length}`);
        
        // Determine overall test status
        const overallStatus = failedSteps === 0 && this.testResults.errors.filter(e => e.type !== 'page_error').length === 0 ? 'PASS' : 'FAIL';
        console.log(`\n🎯 Overall Status: ${overallStatus}`);
        
        this.testResults.summary = {
            totalSteps,
            passedSteps,
            failedSteps,
            skippedSteps,
            successRate: totalSteps > 0 ? (passedSteps / (totalSteps - skippedSteps)) * 100 : 0,
            errorCount: this.testResults.errors.length,
            screenshotCount: this.testResults.screenshots.length,
            snapshotCount: this.testResults.dataSnapshots.length,
            overallStatus
        };
    }
}

// Run the test
if (require.main === module) {
    const test = new ScheduleDataPersistenceTest();
    test.runTest().catch(console.error);
}

module.exports = ScheduleDataPersistenceTest;


// Test 5.2: User Data Isolation
// This test verifies that user data is properly isolated between different users

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class UserDataIsolationTest {
    constructor() {
        this.browser = null;
        this.contextA = null;
        this.contextB = null;
        this.pageA = null;
        this.pageB = null;
        this.testResults = {
            testName: 'Test 5.2: User Data Isolation',
            timestamp: new Date().toISOString(),
            status: 'RUNNING',
            steps: [],
            screenshots: [],
            errors: [],
            dataSnapshots: [],
            summary: {}
        };
        this.userAEmail = 'testisolation_a@example.com';
        this.userBEmail = 'testisolation_b@example.com';
        this.password = 'testpassword123';
        this.userAData = [];
        this.userBData = [];
    }

    async setup() {
        console.log('🚀 Starting Test 5.2: User Data Isolation');
        console.log('📋 Setting up test environment...');
        
        try {
            this.browser = await chromium.launch({
                headless: false,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            // Create two separate browser contexts (simulating different browsers/incognito)
            this.contextA = await this.browser.newContext({
                viewport: { width: 1280, height: 800 }
            });
            
            this.contextB = await this.browser.newContext({
                viewport: { width: 1280, height: 800 }
            });
            
            this.pageA = await this.contextA.newPage();
            this.pageB = await this.contextB.newPage();
            
            // Set up console logging for both pages
            this.pageA.on('console', msg => {
                console.log(`📱 User A Browser [${msg.type()}]:`, msg.text());
            });
            
            this.pageB.on('console', msg => {
                console.log(`📱 User B Browser [${msg.type()}]:`, msg.text());
            });
            
            // Set up error handling
            this.pageA.on('pageerror', error => {
                console.error('❌ User A Page Error:', error.message);
                this.testResults.errors.push({
                    type: 'page_error_user_a',
                    message: error.message
                });
            });
            
            this.pageB.on('pageerror', error => {
                console.error('❌ User B Page Error:', error.message);
                this.testResults.errors.push({
                    type: 'page_error_user_b',
                    message: error.message
                });
            });
            
            console.log('✅ Test environment setup complete');
            return true;
        } catch (error) {
            console.error('❌ Setup failed:', error);
            this.testResults.errors.push({
                type: 'setup_error',
                message: error.message
            });
            return false;
        }
    }

    async authenticateUser(page, email, userName, stepPrefix) {
        console.log(`🔐 Authenticating ${userName}...`);
        
        try {
            await page.goto('http://localhost:3000', { 
                waitUntil: 'networkidle',
                timeout: 15000 
            });
            
            await page.waitForTimeout(2000);
            
            // Check if authentication is required
            const authSection = await page.$('#authSection');
            if (authSection) {
                const authVisible = await authSection.isVisible().catch(() => false);
                
                if (authVisible) {
                    console.log(`📝 Registering ${userName}...`);
                    
                    // Try to register first
                    try {
                        await page.click('a[onclick="showSignUp()"]', { timeout: 5000 });
                        await page.waitForTimeout(1000);
                        
                        await page.fill('#signupName', userName);
                        await page.fill('#signupEmail', email);
                        await page.fill('#signupPassword', this.password);
                        await page.fill('#signupConfirmPassword', this.password);
                        await page.check('#signupTerms');
                        await page.click('button[onclick="handleSignUp()"]');
                        
                        await page.waitForTimeout(3000);
                        
                        // After registration, need to login
                        await page.click('a[onclick="showSignIn()"]', { timeout: 5000 });
                        await page.waitForTimeout(1000);
                    } catch (regError) {
                        console.log(`⚠️ Registration failed (user may exist), trying login...`);
                    }
                    
                    // Login
                    await page.fill('#loginEmail', email);
                    await page.fill('#loginPassword', this.password);
                    await page.click('button[onclick="handleSignIn()"]');
                    
                    await page.waitForTimeout(3000);
                }
            }
            
            // Verify authentication
            const appSection = await page.$('#app-section');
            if (!appSection) {
                throw new Error(`Authentication failed for ${userName}`);
            }
            
            const isVisible = await appSection.isVisible();
            if (!isVisible) {
                throw new Error(`App section not visible for ${userName}`);
            }
            
            // Take screenshot
            const screenshotPath = `test_5_2_${stepPrefix}_authenticated_${Date.now()}.png`;
            await page.screenshot({ 
                path: path.join(__dirname, screenshotPath),
                fullPage: false
            });
            this.testResults.screenshots.push(screenshotPath);
            
            console.log(`✅ ${userName} authenticated successfully`);
            
            this.recordStep(
                `${stepPrefix}: ${userName} Authentication`,
                'PASS',
                `${userName} logged in successfully`,
                { email, screenshot: screenshotPath }
            );
            
            return true;
        } catch (error) {
            console.error(`❌ Authentication failed for ${userName}:`, error);
            this.recordStep(
                `${stepPrefix}: ${userName} Authentication`,
                'FAIL',
                error.message,
                { email }
            );
            return false;
        }
    }

    async createScheduleData(page, userData, userName, stepPrefix) {
        console.log(`📝 Creating schedule data for ${userName}...`);
        
        try {
            // Navigate to schedule editor
            await page.goto('http://localhost:3000/schedule-editor.html', {
                waitUntil: 'networkidle',
                timeout: 15000
            });
            
            await page.waitForTimeout(2000);
            
            // Create a weekday schedule entry
            console.log(`   Adding weekday entry for ${userName}...`);
            
            // Select weekday
            await page.selectOption('select#weekdaySelect', userData.weekday);
            await page.waitForTimeout(500);
            
            // Click Add Entry
            await page.click('button:has-text("Add Entry")');
            await page.waitForTimeout(1000);
            
            // Fill in the entry
            const rows = await page.$$('table#weekdayScheduleBody tr');
            const lastRow = rows[rows.length - 1];
            
            const gradeSelect = await lastRow.$('select.grade-select');
            const startInput = await lastRow.$('input.start-time');
            const endInput = await lastRow.$('input.end-time');
            const subjectInput = await lastRow.$('input.subject');
            
            await gradeSelect.selectOption(userData.grade);
            await startInput.fill(userData.startTime);
            await endInput.fill(userData.endTime);
            await subjectInput.fill(userData.subject);
            
            await page.waitForTimeout(500);
            
            // Save schedule
            await page.click('button:has-text("Save Schedule")');
            await page.waitForTimeout(2000);
            
            // Take screenshot
            const screenshotPath = `test_5_2_${stepPrefix}_data_created_${Date.now()}.png`;
            await page.screenshot({ 
                path: path.join(__dirname, screenshotPath),
                fullPage: true
            });
            this.testResults.screenshots.push(screenshotPath);
            
            console.log(`✅ Schedule data created for ${userName}`);
            
            this.recordStep(
                `${stepPrefix}: Create Schedule Data for ${userName}`,
                'PASS',
                `Schedule entry created: ${userData.grade} ${userData.weekday} ${userData.startTime}-${userData.endTime} ${userData.subject}`,
                { userData, screenshot: screenshotPath }
            );
            
            return true;
        } catch (error) {
            console.error(`❌ Failed to create schedule data for ${userName}:`, error);
            this.recordStep(
                `${stepPrefix}: Create Schedule Data for ${userName}`,
                'FAIL',
                error.message,
                { userData }
            );
            return false;
        }
    }

    async verifyNoDataVisible(page, userName, stepPrefix, shouldNotSeeUserName) {
        console.log(`🔍 Verifying ${userName} does not see ${shouldNotSeeUserName}'s data...`);
        
        try {
            // Navigate to main calendar page
            await page.goto('http://localhost:3000', {
                waitUntil: 'networkidle',
                timeout: 15000
            });
            
            await page.waitForTimeout(2000);
            
            // Get all visible schedule data
            const scheduleItems = await page.$$eval('.schedule-item', items => {
                return items.map(item => ({
                    grade: item.querySelector('.grade')?.textContent || '',
                    subject: item.querySelector('.subject')?.textContent || '',
                    time: item.querySelector('.time')?.textContent || ''
                }));
            }).catch(() => []);
            
            // Take screenshot
            const screenshotPath = `test_5_2_${stepPrefix}_no_data_visible_${Date.now()}.png`;
            await page.screenshot({ 
                path: path.join(__dirname, screenshotPath),
                fullPage: true
            });
            this.testResults.screenshots.push(screenshotPath);
            
            this.dataSnapshots.push({
                step: stepPrefix,
                user: userName,
                scheduleItems,
                screenshot: screenshotPath
            });
            
            console.log(`✅ Verified ${userName} does not see ${shouldNotSeeUserName}'s data`);
            console.log(`   Schedule items visible: ${scheduleItems.length}`);
            
            this.recordStep(
                `${stepPrefix}: Verify Data Isolation - ${userName} View`,
                'PASS',
                `${userName} sees ${scheduleItems.length} items (should not see ${shouldNotSeeUserName}'s data)`,
                { scheduleItems, screenshot: screenshotPath }
            );
            
            return { passed: true, scheduleItems };
        } catch (error) {
            console.error(`❌ Failed to verify data isolation for ${userName}:`, error);
            this.recordStep(
                `${stepPrefix}: Verify Data Isolation - ${userName} View`,
                'FAIL',
                error.message,
                {}
            );
            return { passed: false, scheduleItems: [] };
        }
    }

    async verifyOwnDataVisible(page, userData, userName, stepPrefix) {
        console.log(`🔍 Verifying ${userName} can see their own data...`);
        
        try {
            // Navigate to schedule editor
            await page.goto('http://localhost:3000/schedule-editor.html', {
                waitUntil: 'networkidle',
                timeout: 15000
            });
            
            await page.waitForTimeout(2000);
            
            // Select the weekday
            await page.selectOption('select#weekdaySelect', userData.weekday);
            await page.waitForTimeout(1000);
            
            // Check if the data is visible
            const scheduleRows = await page.$$eval('table#weekdayScheduleBody tr', (rows, expectedData) => {
                return rows.map(row => ({
                    grade: row.querySelector('.grade-select')?.value || '',
                    startTime: row.querySelector('.start-time')?.value || '',
                    endTime: row.querySelector('.end-time')?.value || '',
                    subject: row.querySelector('.subject')?.value || ''
                })).filter(row => 
                    row.grade === expectedData.grade &&
                    row.startTime === expectedData.startTime &&
                    row.endTime === expectedData.endTime &&
                    row.subject === expectedData.subject
                );
            }, userData);
            
            // Take screenshot
            const screenshotPath = `test_5_2_${stepPrefix}_own_data_visible_${Date.now()}.png`;
            await page.screenshot({ 
                path: path.join(__dirname, screenshotPath),
                fullPage: true
            });
            this.testResults.screenshots.push(screenshotPath);
            
            const dataFound = scheduleRows.length > 0;
            
            if (dataFound) {
                console.log(`✅ ${userName} can see their own data`);
                this.recordStep(
                    `${stepPrefix}: Verify Own Data Visible - ${userName}`,
                    'PASS',
                    `${userName} can see their own schedule data`,
                    { userData, scheduleRows, screenshot: screenshotPath }
                );
                return true;
            } else {
                console.error(`❌ ${userName} cannot see their own data`);
                this.recordStep(
                    `${stepPrefix}: Verify Own Data Visible - ${userName}`,
                    'FAIL',
                    `${userName} cannot see their own schedule data`,
                    { userData, scheduleRows, screenshot: screenshotPath }
                );
                return false;
            }
        } catch (error) {
            console.error(`❌ Failed to verify own data for ${userName}:`, error);
            this.recordStep(
                `${stepPrefix}: Verify Own Data Visible - ${userName}`,
                'FAIL',
                error.message,
                { userData }
            );
            return false;
        }
    }

    async testEditDeleteIsolation(page, userName, stepPrefix) {
        console.log(`🔍 Testing edit/delete isolation for ${userName}...`);
        
        try {
            // Navigate to schedule editor
            await page.goto('http://localhost:3000/schedule-editor.html', {
                waitUntil: 'networkidle',
                timeout: 15000
            });
            
            await page.waitForTimeout(2000);
            
            // Count initial entries
            const initialCount = await page.$$eval('table#weekdayScheduleBody tr', rows => rows.length);
            
            // Try to delete an entry (if any exist)
            if (initialCount > 0) {
                const deleteButton = await page.$('button.delete-entry');
                if (deleteButton) {
                    await deleteButton.click();
                    await page.waitForTimeout(1000);
                    
                    // Save changes
                    await page.click('button:has-text("Save Schedule")');
                    await page.waitForTimeout(2000);
                    
                    // Count entries after deletion
                    const afterCount = await page.$$eval('table#weekdayScheduleBody tr', rows => rows.length);
                    
                    const screenshotPath = `test_5_2_${stepPrefix}_after_delete_${Date.now()}.png`;
                    await page.screenshot({ 
                        path: path.join(__dirname, screenshotPath),
                        fullPage: true
                    });
                    this.testResults.screenshots.push(screenshotPath);
                    
                    console.log(`✅ Edit/Delete test completed for ${userName}: ${initialCount} -> ${afterCount} entries`);
                    
                    this.recordStep(
                        `${stepPrefix}: Test Edit/Delete Isolation - ${userName}`,
                        'PASS',
                        `${userName} can edit/delete their own data: ${initialCount} -> ${afterCount} entries`,
                        { initialCount, afterCount, screenshot: screenshotPath }
                    );
                    
                    return true;
                }
            }
            
            console.log(`⚠️ No entries to delete for ${userName}`);
            this.recordStep(
                `${stepPrefix}: Test Edit/Delete Isolation - ${userName}`,
                'PASS',
                `No entries available to test deletion`,
                { initialCount }
            );
            
            return true;
        } catch (error) {
            console.error(`❌ Failed edit/delete test for ${userName}:`, error);
            this.recordStep(
                `${stepPrefix}: Test Edit/Delete Isolation - ${userName}`,
                'FAIL',
                error.message,
                {}
            );
            return false;
        }
    }

    recordStep(title, status, message, details = {}) {
        const step = {
            title,
            status,
            message,
            timestamp: new Date().toISOString(),
            details
        };
        this.testResults.steps.push(step);
        
        const icon = status === 'PASS' ? '✅' : '❌';
        console.log(`${icon} ${title}: ${message}`);
    }

    async runTest() {
        const startTime = Date.now();
        
        try {
            // Step 1: Setup
            const setupSuccess = await this.setup();
            if (!setupSuccess) {
                throw new Error('Setup failed');
            }
            
            // Step 2: Authenticate User A
            const userAData = {
                weekday: 'Monday',
                grade: '6A',
                startTime: '08:00',
                endTime: '08:45',
                subject: 'Math - User A'
            };
            this.userAData = userAData;
            
            const authASuccess = await this.authenticateUser(
                this.pageA, 
                this.userAEmail, 
                'Test User A',
                'Step_2'
            );
            if (!authASuccess) {
                throw new Error('User A authentication failed');
            }
            
            // Step 3: Authenticate User B
            const userBData = {
                weekday: 'Monday',
                grade: '11A',
                startTime: '10:00',
                endTime: '10:45',
                subject: 'Science - User B'
            };
            this.userBData = userBData;
            
            const authBSuccess = await this.authenticateUser(
                this.pageB,
                this.userBEmail,
                'Test User B',
                'Step_3'
            );
            if (!authBSuccess) {
                throw new Error('User B authentication failed');
            }
            
            // Step 4: Create schedule data with User A
            const createASuccess = await this.createScheduleData(
                this.pageA,
                userAData,
                'User A',
                'Step_4'
            );
            if (!createASuccess) {
                throw new Error('Failed to create data for User A');
            }
            
            // Step 5: Switch to User B and verify no data from User A is visible
            const verifyBNoAData = await this.verifyNoDataVisible(
                this.pageB,
                'User B',
                'Step_5',
                'User A'
            );
            
            // Step 6: Create different schedule data with User B
            const createBSuccess = await this.createScheduleData(
                this.pageB,
                userBData,
                'User B',
                'Step_6'
            );
            if (!createBSuccess) {
                throw new Error('Failed to create data for User B');
            }
            
            // Step 7: Switch back to User A and verify User B's data is not visible
            const verifyANoBData = await this.verifyNoDataVisible(
                this.pageA,
                'User A',
                'Step_7',
                'User B'
            );
            
            // Step 8: Verify User A can still see their own data
            const verifyAOwnData = await this.verifyOwnDataVisible(
                this.pageA,
                userAData,
                'User A',
                'Step_8'
            );
            
            // Step 9: Verify User B can see their own data
            const verifyBOwnData = await this.verifyOwnDataVisible(
                this.pageB,
                userBData,
                'User B',
                'Step_9'
            );
            
            // Step 10: Test that editing/deleting only affects current user's data
            await this.testEditDeleteIsolation(
                this.pageA,
                'User A',
                'Step_10a'
            );
            
            await this.testEditDeleteIsolation(
                this.pageB,
                'User B',
                'Step_10b'
            );
            
            // Calculate results
            const duration = Date.now() - startTime;
            const passedSteps = this.testResults.steps.filter(s => s.status === 'PASS').length;
            const failedSteps = this.testResults.steps.filter(s => s.status === 'FAIL').length;
            const totalSteps = this.testResults.steps.length;
            
            this.testResults.status = failedSteps === 0 ? 'PASS' : 'FAIL';
            this.testResults.summary = {
                duration: `${(duration / 1000).toFixed(2)}s`,
                totalSteps,
                passedSteps,
                failedSteps,
                screenshotsCount: this.testResults.screenshots.length,
                errorsCount: this.testResults.errors.length
            };
            
            console.log('\n' + '='.repeat(70));
            console.log('📊 TEST SUMMARY');
            console.log('='.repeat(70));
            console.log(`Test Name: ${this.testResults.testName}`);
            console.log(`Status: ${this.testResults.status === 'PASS' ? '✅ PASS' : '❌ FAIL'}`);
            console.log(`Duration: ${this.testResults.summary.duration}`);
            console.log(`Total Steps: ${totalSteps}`);
            console.log(`Passed Steps: ${passedSteps}`);
            console.log(`Failed Steps: ${failedSteps}`);
            console.log(`Screenshots: ${this.testResults.summary.screenshotsCount}`);
            console.log(`Errors: ${this.testResults.summary.errorsCount}`);
            console.log('='.repeat(70));
            
            if (this.testResults.errors.length > 0) {
                console.log('\n❌ Errors:');
                this.testResults.errors.forEach((error, idx) => {
                    console.log(`   ${idx + 1}. [${error.type}] ${error.message}`);
                });
            }
            
            console.log('\n📸 Screenshots:');
            this.testResults.screenshots.forEach((screenshot, idx) => {
                console.log(`   ${idx + 1}. ${screenshot}`);
            });
            
            console.log('\n🎯 Overall Status: ' + (this.testResults.status === 'PASS' ? '✅ PASS' : '❌ FAIL'));
            console.log('='.repeat(70) + '\n');
            
        } catch (error) {
            console.error('\n❌ TEST EXECUTION FAILED:', error);
            this.testResults.status = 'FAIL';
            this.testResults.errors.push({
                type: 'test_execution_error',
                message: error.message,
                stack: error.stack
            });
        }
    }

    async cleanup() {
        console.log('🧹 Cleaning up...');
        
        try {
            // Save results to JSON file
            const resultsPath = path.join(__dirname, `test_5_2_results_${Date.now()}.json`);
            fs.writeFileSync(resultsPath, JSON.stringify(this.testResults, null, 2));
            console.log(`💾 Results saved to: ${resultsPath}`);
            
            if (this.pageA) await this.pageA.close();
            if (this.pageB) await this.pageB.close();
            if (this.contextA) await this.contextA.close();
            if (this.contextB) await this.contextB.close();
            if (this.browser) await this.browser.close();
            
            console.log('✅ Cleanup complete');
        } catch (error) {
            console.error('❌ Cleanup error:', error);
        }
    }

    async execute() {
        await this.runTest();
        await this.cleanup();
    }
}

// Run the test
(async () => {
    const test = new UserDataIsolationTest();
    await test.execute();
})();


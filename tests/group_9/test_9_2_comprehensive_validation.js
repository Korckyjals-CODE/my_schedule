const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class Test92ComprehensiveValidation {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = {
            testName: 'Test 9.2: Input Validation and Error Handling (Comprehensive)',
            timestamp: new Date().toISOString(),
            setup: {},
            pageAnalysis: {},
            authenticationValidation: {},
            scheduleEditorValidation: {},
            overallResult: 'PENDING',
            screenshots: [],
            errors: []
        };
    }

    async setup() {
        try {
            console.log('Setting up Test 9.2: Input Validation and Error Handling (Comprehensive)');
            
            this.browser = await puppeteer.launch({
                headless: false,
                defaultViewport: { width: 1280, height: 720 },
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            this.page = await this.browser.newPage();
            
            // Navigate to the application
            await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
            
            // Wait for page to load
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            this.results.setup.status = 'SUCCESS';
            this.results.setup.message = 'Setup completed successfully';
            
            console.log('Setup completed successfully');
            
        } catch (error) {
            this.results.setup.status = 'FAILED';
            this.results.setup.error = error.message;
            this.results.errors.push(`Setup failed: ${error.message}`);
            console.error('Setup failed:', error);
        }
    }

    async analyzePage() {
        try {
            console.log('Analyzing page structure...');
            
            const pageAnalysis = await this.page.evaluate(() => {
                // Check what sections are visible
                const authSection = document.querySelector('#authSection');
                const appSection = document.querySelector('#appSection');
                
                // Check for authentication elements
                const loginForm = document.querySelector('#loginForm');
                const signupForm = document.querySelector('#signupForm');
                const loginEmail = document.querySelector('#loginEmail');
                const loginPassword = document.querySelector('#loginPassword');
                const loginButton = document.querySelector('button[onclick="handleLogin()"]');
                
                // Check for schedule editor elements
                const weekdaySelect = document.querySelector('#weekday');
                const dateInputs = document.querySelectorAll('input[type="date"]');
                const timeInputs = document.querySelectorAll('input[type="time"]');
                const textInputs = document.querySelectorAll('input[type="text"]');
                const emailInputs = document.querySelectorAll('input[type="email"]');
                
                return {
                    authSectionVisible: authSection ? authSection.style.display !== 'none' : false,
                    appSectionVisible: appSection ? appSection.style.display !== 'none' : false,
                    loginFormVisible: loginForm ? loginForm.style.display !== 'none' : false,
                    signupFormVisible: signupForm ? signupForm.style.display !== 'none' : false,
                    loginElements: {
                        email: loginEmail ? 'found' : 'not found',
                        password: loginPassword ? 'found' : 'not found',
                        button: loginButton ? 'found' : 'not found'
                    },
                    scheduleEditorElements: {
                        weekdaySelect: weekdaySelect ? 'found' : 'not found',
                        dateInputs: dateInputs.length,
                        timeInputs: timeInputs.length,
                        textInputs: textInputs.length,
                        emailInputs: emailInputs.length
                    },
                    pageTitle: document.title,
                    currentUrl: window.location.href
                };
            });
            
            this.results.pageAnalysis = {
                status: 'SUCCESS',
                analysis: pageAnalysis
            };
            
            console.log('Page analysis completed:', pageAnalysis);
            
        } catch (error) {
            this.results.pageAnalysis.error = error.message;
            this.results.errors.push(`Page analysis failed: ${error.message}`);
            console.error('Page analysis failed:', error);
        }
    }

    async testAuthenticationValidation() {
        try {
            console.log('Testing authentication form validation...');
            
            const pageAnalysis = this.results.pageAnalysis.analysis;
            
            if (!pageAnalysis.authSectionVisible || !pageAnalysis.loginFormVisible) {
                this.results.authenticationValidation.status = 'SKIPPED';
                this.results.authenticationValidation.message = 'Authentication form not visible - user may already be logged in';
                console.log('Authentication form not visible, skipping authentication validation tests');
                return;
            }
            
            // Test 1: Empty email field
            await this.page.click('button[onclick="handleLogin()"]');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Check for validation messages
            const emailValidation = await this.page.evaluate(() => {
                const emailInput = document.querySelector('#loginEmail');
                return emailInput ? emailInput.validity.valid : null;
            });
            
            this.results.authenticationValidation.emptyEmail = {
                status: emailValidation === false ? 'SUCCESS' : 'FAILED',
                message: 'Email field should be invalid when empty',
                isValid: emailValidation
            };
            
            // Test 2: Invalid email format
            await this.page.type('#loginEmail', 'invalid-email');
            await this.page.click('button[onclick="handleLogin()"]');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const invalidEmailValidation = await this.page.evaluate(() => {
                const emailInput = document.querySelector('#loginEmail');
                return emailInput ? emailInput.validity.valid : null;
            });
            
            this.results.authenticationValidation.invalidEmail = {
                status: invalidEmailValidation === false ? 'SUCCESS' : 'FAILED',
                message: 'Email field should be invalid with invalid format',
                isValid: invalidEmailValidation
            };
            
            // Test 3: Empty password field
            await this.page.evaluate(() => {
                document.querySelector('#loginEmail').value = 'test@example.com';
                document.querySelector('#loginPassword').value = '';
            });
            
            await this.page.click('button[onclick="handleLogin()"]');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const passwordValidation = await this.page.evaluate(() => {
                const passwordInput = document.querySelector('#loginPassword');
                return passwordInput ? passwordInput.validity.valid : null;
            });
            
            this.results.authenticationValidation.emptyPassword = {
                status: passwordValidation === false ? 'SUCCESS' : 'FAILED',
                message: 'Password field should be invalid when empty',
                isValid: passwordValidation
            };
            
            console.log('Authentication validation tests completed');
            
        } catch (error) {
            this.results.authenticationValidation.error = error.message;
            this.results.errors.push(`Authentication validation test failed: ${error.message}`);
            console.error('Authentication validation test failed:', error);
        }
    }

    async testScheduleEditorValidation() {
        try {
            console.log('Testing schedule editor validation...');
            
            // Navigate to schedule editor
            await this.page.goto('http://localhost:3000/schedule-editor.html', { waitUntil: 'networkidle2' });
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Test 1: Date validation
            const dateInputs = await this.page.$$('input[type="date"]');
            if (dateInputs.length > 0) {
                // Test invalid date
                await this.page.evaluate(() => {
                    const dateInputs = document.querySelectorAll('input[type="date"]');
                    dateInputs.forEach(input => {
                        input.value = '2024-13-45'; // Invalid date
                    });
                });
                
                const dateValidation = await this.page.evaluate(() => {
                    const dateInputs = document.querySelectorAll('input[type="date"]');
                    return Array.from(dateInputs).map(input => ({
                        value: input.value,
                        valid: input.validity.valid,
                        validationMessage: input.validationMessage
                    }));
                });
                
                this.results.scheduleEditorValidation.dateValidation = {
                    status: dateValidation.some(result => !result.valid) ? 'SUCCESS' : 'FAILED',
                    message: 'Date inputs should reject invalid dates',
                    validationResults: dateValidation
                };
            }
            
            // Test 2: Time validation
            const timeInputs = await this.page.$$('input[type="time"]');
            if (timeInputs.length > 0) {
                // Test invalid time
                await this.page.evaluate(() => {
                    const timeInputs = document.querySelectorAll('input[type="time"]');
                    timeInputs.forEach(input => {
                        input.value = '25:70'; // Invalid time
                    });
                });
                
                const timeValidation = await this.page.evaluate(() => {
                    const timeInputs = document.querySelectorAll('input[type="time"]');
                    return Array.from(timeInputs).map(input => ({
                        value: input.value,
                        valid: input.validity.valid,
                        validationMessage: input.validationMessage
                    }));
                });
                
                this.results.scheduleEditorValidation.timeValidation = {
                    status: timeValidation.some(result => !result.valid) ? 'SUCCESS' : 'FAILED',
                    message: 'Time inputs should reject invalid times',
                    validationResults: timeValidation
                };
            }
            
            // Test 3: Email validation (if email inputs exist)
            const emailInputs = await this.page.$$('input[type="email"]');
            if (emailInputs.length > 0) {
                await this.page.evaluate(() => {
                    const emailInputs = document.querySelectorAll('input[type="email"]');
                    emailInputs.forEach(input => {
                        input.value = 'invalid-email-format';
                    });
                });
                
                const emailValidation = await this.page.evaluate(() => {
                    const emailInputs = document.querySelectorAll('input[type="email"]');
                    return Array.from(emailInputs).map(input => ({
                        value: input.value,
                        valid: input.validity.valid,
                        validationMessage: input.validationMessage
                    }));
                });
                
                this.results.scheduleEditorValidation.emailValidation = {
                    status: emailValidation.some(result => !result.valid) ? 'SUCCESS' : 'FAILED',
                    message: 'Email inputs should reject invalid formats',
                    validationResults: emailValidation
                };
            }
            
            // Test 4: Required field validation
            const requiredInputs = await this.page.evaluate(() => {
                const inputs = document.querySelectorAll('input[required], select[required]');
                return Array.from(inputs).map(input => ({
                    type: input.type,
                    tagName: input.tagName,
                    required: input.required,
                    value: input.value
                }));
            });
            
            this.results.scheduleEditorValidation.requiredFields = {
                status: 'SUCCESS',
                message: 'Required fields analysis',
                requiredInputs: requiredInputs
            };
            
            // Test 5: Form submission without required fields
            const formButtons = await this.page.$$('button');
            if (formButtons.length > 0) {
                // Try to submit form without filling required fields
                await this.page.evaluate(() => {
                    // Clear all inputs
                    const inputs = document.querySelectorAll('input, select');
                    inputs.forEach(input => {
                        if (input.type !== 'checkbox' && input.type !== 'radio') {
                            input.value = '';
                        }
                    });
                });
                
                // Try to click any save/submit button
                const saveButtons = await this.page.$$('button');
                for (let button of saveButtons) {
                    const buttonText = await button.evaluate(el => el.textContent);
                    if (buttonText.toLowerCase().includes('save') || buttonText.toLowerCase().includes('submit')) {
                        await button.click();
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        break;
                    }
                }
                
                // Check for validation messages
                const validationMessages = await this.page.evaluate(() => {
                    const messages = [];
                    const errorElements = document.querySelectorAll('.error, .validation-error, [class*="error"], .alert');
                    errorElements.forEach(el => {
                        if (el.textContent.trim()) {
                            messages.push(el.textContent.trim());
                        }
                    });
                    return messages;
                });
                
                this.results.scheduleEditorValidation.formSubmission = {
                    status: validationMessages.length > 0 ? 'SUCCESS' : 'PARTIAL',
                    message: 'Form should show validation messages for empty required fields',
                    validationMessages: validationMessages
                };
            }
            
            console.log('Schedule editor validation tests completed');
            
        } catch (error) {
            this.results.scheduleEditorValidation.error = error.message;
            this.results.errors.push(`Schedule editor validation test failed: ${error.message}`);
            console.error('Schedule editor validation test failed:', error);
        }
    }

    async takeScreenshot(name) {
        try {
            const timestamp = Date.now();
            const filename = `test_9_2_comprehensive_${name}_${timestamp}.png`;
            const filepath = path.join(__dirname, filename);
            
            await this.page.screenshot({ 
                path: filepath, 
                fullPage: true 
            });
            
            this.results.screenshots.push({
                name: name,
                filename: filename,
                timestamp: timestamp
            });
            
            console.log(`Screenshot saved: ${filename}`);
        } catch (error) {
            console.error(`Failed to take screenshot ${name}:`, error);
        }
    }

    async generateResults() {
        try {
            // Calculate overall result
            const allTests = [
                this.results.authenticationValidation,
                this.results.scheduleEditorValidation
            ];
            
            const hasErrors = this.results.errors.length > 0;
            const hasFailures = allTests.some(test => 
                Object.values(test).some(result => 
                    typeof result === 'object' && result.status === 'FAILED'
                )
            );
            
            this.results.overallResult = hasErrors ? 'FAILED' : 
                                        hasFailures ? 'PARTIAL' : 'SUCCESS';
            
            // Save results to JSON file
            const timestamp = Date.now();
            const resultsFile = path.join(__dirname, `test_9_2_comprehensive_results_${timestamp}.json`);
            fs.writeFileSync(resultsFile, JSON.stringify(this.results, null, 2));
            
            console.log(`Test results saved to: ${resultsFile}`);
            
            return this.results;
            
        } catch (error) {
            console.error('Failed to generate results:', error);
            return this.results;
        }
    }

    async cleanup() {
        try {
            if (this.browser) {
                await this.browser.close();
            }
            console.log('Cleanup completed');
        } catch (error) {
            console.error('Cleanup failed:', error);
        }
    }

    async run() {
        try {
            await this.setup();
            await this.takeScreenshot('initial_load');
            
            await this.analyzePage();
            await this.takeScreenshot('page_analysis');
            
            await this.testAuthenticationValidation();
            await this.takeScreenshot('authentication_validation');
            
            await this.testScheduleEditorValidation();
            await this.takeScreenshot('schedule_editor_validation');
            
            const results = await this.generateResults();
            
            console.log('Test 9.2 (Comprehensive) completed');
            console.log('Overall Result:', results.overallResult);
            
            return results;
            
        } catch (error) {
            console.error('Test execution failed:', error);
            this.results.errors.push(`Test execution failed: ${error.message}`);
            return await this.generateResults();
        } finally {
            await this.cleanup();
        }
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    const test = new Test92ComprehensiveValidation();
    test.run().then(results => {
        console.log('Test completed with result:', results.overallResult);
        process.exit(results.overallResult === 'SUCCESS' ? 0 : 1);
    }).catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    });
}

module.exports = Test92ComprehensiveValidation;

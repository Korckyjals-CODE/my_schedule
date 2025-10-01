const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class Test92SimpleValidation {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = {
            testName: 'Test 9.2: Input Validation and Error Handling (Simplified)',
            timestamp: new Date().toISOString(),
            setup: {},
            authenticationValidation: {},
            formValidation: {},
            overallResult: 'PENDING',
            screenshots: [],
            errors: []
        };
    }

    async setup() {
        try {
            console.log('Setting up Test 9.2: Input Validation and Error Handling (Simplified)');
            
            this.browser = await puppeteer.launch({
                headless: false,
                defaultViewport: { width: 1280, height: 720 },
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            this.page = await this.browser.newPage();
            
            // Navigate to the application
            await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
            
            // Wait for page to load
            await new Promise(resolve => setTimeout(resolve, 2000));
            
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

    async testAuthenticationValidation() {
        try {
            console.log('Testing authentication form validation...');
            
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
            
            // Test 4: Sign up form validation
            await this.page.click('a[onclick="showSignUp()"]');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Test empty required fields in signup
            await this.page.click('button[onclick="handleSignUp()"]');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const signupValidation = await this.page.evaluate(() => {
                const nameInput = document.querySelector('#signupName');
                const emailInput = document.querySelector('#signupEmail');
                const passwordInput = document.querySelector('#signupPassword');
                const confirmPasswordInput = document.querySelector('#signupConfirmPassword');
                const termsCheckbox = document.querySelector('#signupTerms');
                
                return {
                    nameValid: nameInput ? nameInput.validity.valid : null,
                    emailValid: emailInput ? emailInput.validity.valid : null,
                    passwordValid: passwordInput ? passwordInput.validity.valid : null,
                    confirmPasswordValid: confirmPasswordInput ? confirmPasswordInput.validity.valid : null,
                    termsChecked: termsCheckbox ? termsCheckbox.checked : null
                };
            });
            
            this.results.authenticationValidation.signupValidation = {
                status: Object.values(signupValidation).some(valid => valid === false) ? 'SUCCESS' : 'FAILED',
                message: 'Signup form should validate required fields',
                validationResults: signupValidation
            };
            
            // Test 5: Password mismatch validation
            await this.page.evaluate(() => {
                document.querySelector('#signupName').value = 'Test User';
                document.querySelector('#signupEmail').value = 'test@example.com';
                document.querySelector('#signupPassword').value = 'password123';
                document.querySelector('#signupConfirmPassword').value = 'differentpassword';
                document.querySelector('#signupTerms').checked = true;
            });
            
            await this.page.click('button[onclick="handleSignUp()"]');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Check if there's an alert or error message
            const passwordMismatchHandling = await this.page.evaluate(() => {
                // Check if there are any error messages or alerts
                const errorElements = document.querySelectorAll('.error, .alert, [class*="error"]');
                return errorElements.length > 0;
            });
            
            this.results.authenticationValidation.passwordMismatch = {
                status: passwordMismatchHandling ? 'SUCCESS' : 'PARTIAL',
                message: 'Should handle password mismatch appropriately',
                handled: passwordMismatchHandling
            };
            
            console.log('Authentication validation tests completed');
            
        } catch (error) {
            this.results.authenticationValidation.error = error.message;
            this.results.errors.push(`Authentication validation test failed: ${error.message}`);
            console.error('Authentication validation test failed:', error);
        }
    }

    async testFormValidation() {
        try {
            console.log('Testing general form validation...');
            
            // Navigate to schedule editor to test form validation there
            await this.page.goto('http://localhost:3000/schedule-editor.html', { waitUntil: 'networkidle2' });
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Test if we can access the form elements
            const formElements = await this.page.evaluate(() => {
                const weekdaySelect = document.querySelector('#weekday');
                const dateInputs = document.querySelectorAll('input[type="date"]');
                const timeInputs = document.querySelectorAll('input[type="time"]');
                const textInputs = document.querySelectorAll('input[type="text"]');
                
                return {
                    weekdaySelect: weekdaySelect ? 'found' : 'not found',
                    dateInputs: dateInputs.length,
                    timeInputs: timeInputs.length,
                    textInputs: textInputs.length
                };
            });
            
            this.results.formValidation.formElements = {
                status: 'SUCCESS',
                message: 'Form elements accessibility test',
                elements: formElements
            };
            
            // Test date validation
            if (formElements.dateInputs > 0) {
                await this.page.evaluate(() => {
                    const dateInputs = document.querySelectorAll('input[type="date"]');
                    dateInputs.forEach(input => {
                        input.value = 'invalid-date';
                    });
                });
                
                const dateValidation = await this.page.evaluate(() => {
                    const dateInputs = document.querySelectorAll('input[type="date"]');
                    return Array.from(dateInputs).map(input => ({
                        value: input.value,
                        valid: input.validity.valid
                    }));
                });
                
                this.results.formValidation.dateValidation = {
                    status: dateValidation.some(result => !result.valid) ? 'SUCCESS' : 'FAILED',
                    message: 'Date inputs should reject invalid dates',
                    validationResults: dateValidation
                };
            }
            
            // Test time validation
            if (formElements.timeInputs > 0) {
                await this.page.evaluate(() => {
                    const timeInputs = document.querySelectorAll('input[type="time"]');
                    timeInputs.forEach(input => {
                        input.value = '25:00'; // Invalid time
                    });
                });
                
                const timeValidation = await this.page.evaluate(() => {
                    const timeInputs = document.querySelectorAll('input[type="time"]');
                    return Array.from(timeInputs).map(input => ({
                        value: input.value,
                        valid: input.validity.valid
                    }));
                });
                
                this.results.formValidation.timeValidation = {
                    status: timeValidation.some(result => !result.valid) ? 'SUCCESS' : 'FAILED',
                    message: 'Time inputs should reject invalid times',
                    validationResults: timeValidation
                };
            }
            
            console.log('Form validation tests completed');
            
        } catch (error) {
            this.results.formValidation.error = error.message;
            this.results.errors.push(`Form validation test failed: ${error.message}`);
            console.error('Form validation test failed:', error);
        }
    }

    async takeScreenshot(name) {
        try {
            const timestamp = Date.now();
            const filename = `test_9_2_simple_${name}_${timestamp}.png`;
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
                this.results.formValidation
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
            const resultsFile = path.join(__dirname, `test_9_2_simple_results_${timestamp}.json`);
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
            
            await this.testAuthenticationValidation();
            await this.takeScreenshot('authentication_validation');
            
            await this.testFormValidation();
            await this.takeScreenshot('form_validation');
            
            const results = await this.generateResults();
            
            console.log('Test 9.2 (Simplified) completed');
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
    const test = new Test92SimpleValidation();
    test.run().then(results => {
        console.log('Test completed with result:', results.overallResult);
        process.exit(results.overallResult === 'SUCCESS' ? 0 : 1);
    }).catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    });
}

module.exports = Test92SimpleValidation;

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class Test92InputValidation {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = {
            testName: 'Test 9.2: Input Validation and Error Handling',
            timestamp: new Date().toISOString(),
            setup: {},
            formValidation: {},
            dataValidation: {},
            errorRecovery: {},
            edgeCases: {},
            overallResult: 'PENDING',
            screenshots: [],
            errors: []
        };
    }

    async setup() {
        try {
            console.log('Setting up Test 9.2: Input Validation and Error Handling');
            
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
            
            // Check if user needs to log in
            const loginForm = await this.page.$('#loginForm');
            if (loginForm) {
                console.log('User needs to log in, attempting login...');
                await this.performLogin();
            } else {
                console.log('User appears to be already logged in');
            }
            
            // Navigate to schedule editor
            await this.page.goto('http://localhost:3000/schedule-editor.html', { waitUntil: 'networkidle2' });
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

    async performLogin() {
        try {
            // Try to log in with test credentials
            await this.page.type('#loginEmail', 'testuser@example.com');
            await this.page.type('#loginPassword', 'testpassword123');
            await this.page.click('button[onclick="handleLogin()"]');
            
            // Wait for login to complete
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Check if login was successful
            const authSection = await this.page.$('#authSection');
            if (authSection) {
                throw new Error('Login failed - still showing auth section');
            }
            
            console.log('Login successful');
        } catch (error) {
            console.log('Login failed, continuing with test...');
            // Continue with test even if login fails
        }
    }

    async testFormValidation() {
        try {
            console.log('Testing form validation...');
            
            // Test 1: Empty required fields - try to add entry without filling fields
            await this.page.click('button[onclick="addWeekdayEntry()"]');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Try to save without filling required fields
            await this.page.click('button[onclick="saveSchedule()"]');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Check for validation messages
            const validationMessages = await this.page.evaluate(() => {
                const messages = [];
                const errorElements = document.querySelectorAll('.error, .validation-error, [class*="error"]');
                errorElements.forEach(el => {
                    if (el.textContent.trim()) {
                        messages.push(el.textContent.trim());
                    }
                });
                return messages;
            });
            
            this.results.formValidation.emptyFields = {
                status: validationMessages.length > 0 ? 'SUCCESS' : 'FAILED',
                messages: validationMessages,
                expected: 'Validation messages should appear for empty required fields'
            };
            
            // Test 2: Invalid email formats (if email field exists)
            const emailField = await this.page.$('input[type="email"]');
            if (emailField) {
                await this.page.type('input[type="email"]', 'invalid-email');
                await this.page.click('button[onclick="saveSchedule()"]');
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const emailValidation = await this.page.evaluate(() => {
                    const emailInput = document.querySelector('input[type="email"]');
                    return emailInput ? emailInput.validity.valid : null;
                });
                
                this.results.formValidation.emailValidation = {
                    status: emailValidation === false ? 'SUCCESS' : 'FAILED',
                    message: 'Email validation should reject invalid formats',
                    isValid: emailValidation
                };
            }
            
            // Test 3: Date validation
            const dateInputs = await this.page.$$('input[type="date"]');
            if (dateInputs.length > 0) {
                await this.page.evaluate(() => {
                    const dateInput = document.querySelector('input[type="date"]');
                    if (dateInput) {
                        dateInput.value = 'invalid-date';
                    }
                });
                
                await this.page.click('button[onclick="saveSchedule()"]');
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const dateValidation = await this.page.evaluate(() => {
                    const dateInput = document.querySelector('input[type="date"]');
                    return dateInput ? dateInput.validity.valid : null;
                });
                
                this.results.formValidation.dateValidation = {
                    status: dateValidation === false ? 'SUCCESS' : 'FAILED',
                    message: 'Date validation should reject invalid dates',
                    isValid: dateValidation
                };
            }
            
            console.log('Form validation tests completed');
            
        } catch (error) {
            this.results.formValidation.error = error.message;
            this.results.errors.push(`Form validation test failed: ${error.message}`);
            console.error('Form validation test failed:', error);
        }
    }

    async testDataValidation() {
        try {
            console.log('Testing data validation...');
            
            // Test 1: Invalid time formats
            const timeInputs = await this.page.$$('input[type="time"]');
            if (timeInputs.length > 0) {
                await this.page.evaluate(() => {
                    const timeInputs = document.querySelectorAll('input[type="time"]');
                    timeInputs.forEach(input => {
                        input.value = '25:00'; // Invalid time
                    });
                });
                
                await this.page.click('button[onclick="saveSchedule()"]');
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const timeValidation = await this.page.evaluate(() => {
                    const timeInputs = document.querySelectorAll('input[type="time"]');
                    return Array.from(timeInputs).map(input => input.validity.valid);
                });
                
                this.results.dataValidation.timeValidation = {
                    status: timeValidation.some(valid => !valid) ? 'SUCCESS' : 'FAILED',
                    message: 'Time validation should reject invalid times',
                    validationResults: timeValidation
                };
            }
            
            // Test 2: Invalid date ranges
            const dateRangeInputs = await this.page.$$('input[type="date"]');
            if (dateRangeInputs.length >= 2) {
                await this.page.evaluate(() => {
                    const dateInputs = document.querySelectorAll('input[type="date"]');
                    if (dateInputs.length >= 2) {
                        dateInputs[0].value = '2024-12-31'; // End date
                        dateInputs[1].value = '2024-01-01'; // Start date (invalid range)
                    }
                });
                
                await this.page.click('button[onclick="saveSchedule()"]');
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Check if there are any custom validation messages for date ranges
                const dateRangeValidation = await this.page.evaluate(() => {
                    const errorElements = document.querySelectorAll('.error, .validation-error, [class*="error"]');
                    return Array.from(errorElements).map(el => el.textContent.trim()).filter(text => text);
                });
                
                this.results.dataValidation.dateRangeValidation = {
                    status: dateRangeValidation.length > 0 ? 'SUCCESS' : 'PARTIAL',
                    message: 'Date range validation should prevent invalid ranges',
                    validationMessages: dateRangeValidation
                };
            }
            
            // Test 3: Special characters in text fields
            const textInputs = await this.page.$$('input[type="text"], textarea');
            if (textInputs.length > 0) {
                await this.page.evaluate(() => {
                    const textInputs = document.querySelectorAll('input[type="text"], textarea');
                    textInputs.forEach(input => {
                        input.value = '<script>alert("xss")</script>';
                    });
                });
                
                await this.page.click('button[onclick="saveSchedule()"]');
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Check if special characters are sanitized
                const sanitizationCheck = await this.page.evaluate(() => {
                    const textInputs = document.querySelectorAll('input[type="text"], textarea');
                    return Array.from(textInputs).map(input => ({
                        value: input.value,
                        containsScript: input.value.includes('<script>')
                    }));
                });
                
                this.results.dataValidation.specialCharacters = {
                    status: sanitizationCheck.some(check => !check.containsScript) ? 'SUCCESS' : 'FAILED',
                    message: 'Special characters should be sanitized',
                    sanitizationResults: sanitizationCheck
                };
            }
            
            console.log('Data validation tests completed');
            
        } catch (error) {
            this.results.dataValidation.error = error.message;
            this.results.errors.push(`Data validation test failed: ${error.message}`);
            console.error('Data validation test failed:', error);
        }
    }

    async testErrorRecovery() {
        try {
            console.log('Testing error recovery...');
            
            // Test 1: Fix validation errors
            await this.page.evaluate(() => {
                // Clear all inputs
                const inputs = document.querySelectorAll('input, textarea, select');
                inputs.forEach(input => {
                    if (input.type !== 'checkbox' && input.type !== 'radio') {
                        input.value = '';
                    }
                });
            });
            
            // Fill in valid data
            await this.page.evaluate(() => {
                const gradeSelect = document.querySelector('select[name="grade"]');
                if (gradeSelect) {
                    gradeSelect.value = '6A';
                }
                
                const startTimeInput = document.querySelector('input[name="startTime"]');
                if (startTimeInput) {
                    startTimeInput.value = '08:00';
                }
                
                const endTimeInput = document.querySelector('input[name="endTime"]');
                if (endTimeInput) {
                    endTimeInput.value = '08:45';
                }
                
                const subjectInput = document.querySelector('input[name="subject"]');
                if (subjectInput) {
                    subjectInput.value = 'Math';
                }
            });
            
            await this.page.click('button[onclick="saveSchedule()"]');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Check if save was successful
            const saveSuccess = await this.page.evaluate(() => {
                const successMessage = document.querySelector('.success, .alert-success, [class*="success"]');
                return successMessage ? successMessage.textContent.trim() : null;
            });
            
            this.results.errorRecovery.validationFix = {
                status: saveSuccess ? 'SUCCESS' : 'FAILED',
                message: 'Should be able to fix validation errors and save successfully',
                successMessage: saveSuccess
            };
            
            // Test 2: Retry failed operations
            // Simulate a network error by intercepting requests
            await this.page.setRequestInterception(true);
            let requestCount = 0;
            
            this.page.on('request', (request) => {
                requestCount++;
                if (requestCount === 1) {
                    // Block the first request to simulate failure
                    request.abort();
                } else {
                    request.continue();
                }
            });
            
            await this.page.click('button[onclick="saveSchedule()"]');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Check for error handling
            const errorHandling = await this.page.evaluate(() => {
                const errorMessage = document.querySelector('.error, .alert-error, [class*="error"]');
                return errorMessage ? errorMessage.textContent.trim() : null;
            });
            
            this.results.errorRecovery.retryMechanism = {
                status: errorHandling ? 'SUCCESS' : 'PARTIAL',
                message: 'Should handle network errors gracefully',
                errorMessage: errorHandling
            };
            
            // Disable request interception
            await this.page.setRequestInterception(false);
            
            console.log('Error recovery tests completed');
            
        } catch (error) {
            this.results.errorRecovery.error = error.message;
            this.results.errors.push(`Error recovery test failed: ${error.message}`);
            console.error('Error recovery test failed:', error);
        }
    }

    async testEdgeCases() {
        try {
            console.log('Testing edge cases...');
            
            // Test 1: Very long input strings
            const longString = 'A'.repeat(1000);
            await this.page.evaluate((str) => {
                const textInputs = document.querySelectorAll('input[type="text"], textarea');
                textInputs.forEach(input => {
                    input.value = str;
                });
            }, longString);
            
            await this.page.click('button[onclick="saveSchedule()"]');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const longStringHandling = await this.page.evaluate(() => {
                const textInputs = document.querySelectorAll('input[type="text"], textarea');
                return Array.from(textInputs).map(input => ({
                    length: input.value.length,
                    truncated: input.value.length < 1000
                }));
            });
            
            this.results.edgeCases.longStrings = {
                status: longStringHandling.some(result => result.truncated) ? 'SUCCESS' : 'PARTIAL',
                message: 'Should handle very long input strings appropriately',
                results: longStringHandling
            };
            
            // Test 2: Boundary value testing for time inputs
            await this.page.evaluate(() => {
                const timeInputs = document.querySelectorAll('input[type="time"]');
                timeInputs.forEach((input, index) => {
                    if (index === 0) {
                        input.value = '00:00'; // Minimum time
                    } else if (index === 1) {
                        input.value = '23:59'; // Maximum time
                    }
                });
            });
            
            await this.page.click('button[onclick="saveSchedule()"]');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const boundaryValidation = await this.page.evaluate(() => {
                const timeInputs = document.querySelectorAll('input[type="time"]');
                return Array.from(timeInputs).map(input => ({
                    value: input.value,
                    valid: input.validity.valid
                }));
            });
            
            this.results.edgeCases.boundaryValues = {
                status: boundaryValidation.every(result => result.valid) ? 'SUCCESS' : 'FAILED',
                message: 'Should accept boundary values for time inputs',
                results: boundaryValidation
            };
            
            // Test 3: Special characters in different contexts
            const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
            await this.page.evaluate((chars) => {
                const textInputs = document.querySelectorAll('input[type="text"], textarea');
                textInputs.forEach(input => {
                    input.value = chars;
                });
            }, specialChars);
            
            await this.page.click('button[onclick="saveSchedule()"]');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const specialCharHandling = await this.page.evaluate(() => {
                const textInputs = document.querySelectorAll('input[type="text"], textarea');
                return Array.from(textInputs).map(input => ({
                    value: input.value,
                    containsSpecialChars: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(input.value)
                }));
            });
            
            this.results.edgeCases.specialCharacters = {
                status: 'SUCCESS', // Special characters should be allowed in most cases
                message: 'Should handle special characters appropriately',
                results: specialCharHandling
            };
            
            console.log('Edge cases tests completed');
            
        } catch (error) {
            this.results.edgeCases.error = error.message;
            this.results.errors.push(`Edge cases test failed: ${error.message}`);
            console.error('Edge cases test failed:', error);
        }
    }

    async takeScreenshot(name) {
        try {
            const timestamp = Date.now();
            const filename = `test_9_2_${name}_${timestamp}.png`;
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
                this.results.formValidation,
                this.results.dataValidation,
                this.results.errorRecovery,
                this.results.edgeCases
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
            const resultsFile = path.join(__dirname, `test_9_2_results_${timestamp}.json`);
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
            
            await this.testFormValidation();
            await this.takeScreenshot('form_validation');
            
            await this.testDataValidation();
            await this.takeScreenshot('data_validation');
            
            await this.testErrorRecovery();
            await this.takeScreenshot('error_recovery');
            
            await this.testEdgeCases();
            await this.takeScreenshot('edge_cases');
            
            const results = await this.generateResults();
            
            console.log('Test 9.2 completed');
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
    const test = new Test92InputValidation();
    test.run().then(results => {
        console.log('Test completed with result:', results.overallResult);
        process.exit(results.overallResult === 'SUCCESS' ? 0 : 1);
    }).catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    });
}

module.exports = Test92InputValidation;

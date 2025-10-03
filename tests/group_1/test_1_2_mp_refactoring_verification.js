/**
 * Automated Test Script for Test 1.2 Medium-Priority Refactoring Verification
 * 
 * This script tests ONLY the medium-priority refactoring requirements:
 * 1. Enhanced error handling with specific error message mapping
 * 2. Form validation improvements with real-time feedback
 * 3. CSS styling for error states and loading animations
 * 
 * Note: This does NOT test high-priority or low-priority requirements.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class MediumPriorityRefactoringTestSuite {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = {
            timestamp: new Date().toISOString(),
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            testDetails: []
        };
        this.testUser = {
            email: `test_mp_${Date.now()}@example.com`,
            password: 'TestPassword123!'
        };
    }

    async initialize() {
        console.log('🚀 Initializing Medium-Priority Refactoring Test Suite...');
        
        this.browser = await puppeteer.launch({
            headless: process.env.HEADLESS !== 'false',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        this.page = await this.browser.newPage();
        
        // Set up console logging (filter out expected API errors)
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                const errorText = msg.text();
                // Filter out expected API errors for new test users
                // These errors occur because test users don't have schedule data in the database
                if (!errorText.includes('Failed to load resource') && 
                    !errorText.includes('Sign in failed') &&
                    !errorText.includes('400') &&
                    !errorText.includes('404')) {
                    console.log('Browser Error:', errorText);
                }
            }
        });
        
        // Navigate to the application
        await this.page.goto('http://localhost:3000', { 
            waitUntil: 'networkidle2',
            timeout: 10000 
        });
        
        console.log('✅ Browser initialized and page loaded');
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
        console.log('🧹 Cleanup completed');
    }

    async runTest(testName, testFunction) {
        this.testResults.totalTests++;
        console.log(`\n🧪 Running Test: ${testName}`);
        
        try {
            const result = await testFunction();
            if (result.success) {
                this.testResults.passedTests++;
                console.log(`✅ PASSED: ${testName}`);
                this.testResults.testDetails.push({
                    name: testName,
                    status: 'PASSED',
                    details: result.details
                });
            } else {
                this.testResults.failedTests++;
                console.log(`❌ FAILED: ${testName}`);
                console.log(`   Reason: ${result.error}`);
                this.testResults.testDetails.push({
                    name: testName,
                    status: 'FAILED',
                    error: result.error,
                    details: result.details
                });
            }
        } catch (error) {
            this.testResults.failedTests++;
            console.log(`❌ FAILED: ${testName} - Exception: ${error.message}`);
            this.testResults.testDetails.push({
                name: testName,
                status: 'FAILED',
                error: error.message
            });
        }
    }

    // Test 1: Enhanced Error Handling - Specific Error Message Mapping
    async testEnhancedErrorHandling() {
        try {
            // Navigate to login page
            await this.page.evaluate(() => {
                const loginLink = document.getElementById('showLoginLink');
                if (loginLink) {
                    loginLink.click();
                }
            });
            
            // Test specific error scenarios
            const errorTests = [
                {
                    email: 'invalid@example.com',
                    password: 'wrongpassword',
                    expectedPattern: 'email or password.*incorrect'
                },
                {
                    email: 'nonexistent@example.com',
                    password: 'wrongpassword',
                    expectedPattern: 'email or password.*incorrect'
                },
                {
                    email: 'test@example.com',
                    password: 'wrong',
                    expectedPattern: 'email or password.*incorrect'
                }
            ];
            
            let allErrorsUserFriendly = true;
            let errorDetails = [];
            
            for (const test of errorTests) {
                // Clear form
                await this.page.evaluate(() => {
                    const emailInput = document.getElementById('loginEmail');
                    const passwordInput = document.getElementById('loginPassword');
                    if (emailInput) emailInput.value = '';
                    if (passwordInput) passwordInput.value = '';
                });
                
                // Enter test credentials
                await this.page.type('#loginEmail', test.email);
                await this.page.type('#loginPassword', test.password);
                await this.page.click('#loginButton');
                
                // Wait for error message
                await this.page.waitForSelector('.error-message', { timeout: 5000 });
                
                // Check error message content
                const errorMessage = await this.page.evaluate(() => {
                    const errorEl = document.querySelector('.error-message');
                    return errorEl ? errorEl.textContent.trim() : '';
                });
                
                // Check if error message is user-friendly (not technical)
                const isUserFriendly = errorMessage.toLowerCase().includes('email or password') ||
                                     errorMessage.toLowerCase().includes('incorrect') ||
                                     errorMessage.toLowerCase().includes('try again');
                
                if (!isUserFriendly) {
                    allErrorsUserFriendly = false;
                    errorDetails.push(`Expected user-friendly message, got: "${errorMessage}"`);
                }
            }
            
            if (allErrorsUserFriendly) {
                return {
                    success: true,
                    details: 'All error messages are user-friendly and provide actionable guidance'
                };
            } else {
                return {
                    success: false,
                    error: 'Some error messages are not user-friendly',
                    details: errorDetails.join('; ')
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                details: 'Enhanced error handling test failed'
            };
        }
    }

    // Test 2: Form Validation Improvements - Real-time Feedback
    async testFormValidationImprovements() {
        try {
            // Navigate to login page
            await this.page.evaluate(() => {
                const loginLink = document.getElementById('showLoginLink');
                if (loginLink) {
                    loginLink.click();
                }
            });
            
            // Test email validation
            await this.page.evaluate(() => {
                const emailInput = document.getElementById('loginEmail');
                if (emailInput) {
                    emailInput.value = 'invalid-email';
                    emailInput.dispatchEvent(new Event('blur', { bubbles: true }));
                    emailInput.dispatchEvent(new Event('focusout', { bubbles: true }));
                }
            });
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Check for email validation error
            const emailValidationError = await this.page.evaluate(() => {
                const emailInput = document.getElementById('loginEmail');
                return emailInput ? emailInput.classList.contains('field-error') : false;
            });
            
            // Test password validation
            await this.page.evaluate(() => {
                const passwordInput = document.getElementById('loginPassword');
                if (passwordInput) {
                    passwordInput.value = '123';
                    passwordInput.dispatchEvent(new Event('blur', { bubbles: true }));
                    passwordInput.dispatchEvent(new Event('focusout', { bubbles: true }));
                }
            });
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Check for password validation error
            const passwordValidationError = await this.page.evaluate(() => {
                const passwordInput = document.getElementById('loginPassword');
                return passwordInput ? passwordInput.classList.contains('field-error') : false;
            });
            
            // Test validation message display
            const validationMessages = await this.page.evaluate(() => {
                const messages = document.querySelectorAll('.field-error-message');
                return Array.from(messages).map(msg => msg.textContent.trim());
            });
            
            if (emailValidationError && passwordValidationError && validationMessages.length > 0) {
                return {
                    success: true,
                    details: `Form validation working: email validation (${emailValidationError}), password validation (${passwordValidationError}), messages: ${validationMessages.join(', ')}`
                };
            } else {
                return {
                    success: false,
                    error: 'Form validation not working properly',
                    details: `Email validation: ${emailValidationError}, Password validation: ${passwordValidationError}, Messages: ${validationMessages.length}`
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                details: 'Form validation improvements test failed'
            };
        }
    }

    // Test 3: CSS Styling for Error States
    async testCSSStylingForErrorStates() {
        try {
            // Navigate to login page
            await this.page.evaluate(() => {
                const loginLink = document.getElementById('showLoginLink');
                if (loginLink) {
                    loginLink.click();
                }
            });
            
            // Trigger an error message
            await this.page.type('#loginEmail', 'invalid@example.com');
            await this.page.type('#loginPassword', 'wrongpassword');
            await this.page.click('#loginButton');
            
            await this.page.waitForSelector('.error-message', { timeout: 5000 });
            
            // Check CSS styling of error message
            const errorStyles = await this.page.evaluate(() => {
                const errorEl = document.querySelector('.error-message');
                if (!errorEl) return null;
                
                const styles = window.getComputedStyle(errorEl);
                return {
                    backgroundColor: styles.backgroundColor,
                    color: styles.color,
                    border: styles.border,
                    borderRadius: styles.borderRadius,
                    padding: styles.padding,
                    display: styles.display,
                    justifyContent: styles.justifyContent,
                    alignItems: styles.alignItems
                };
            });
            
            // Check dismiss button styling
            const dismissButtonStyles = await this.page.evaluate(() => {
                const button = document.querySelector('.error-message button');
                if (!button) return null;
                
                const styles = window.getComputedStyle(button);
                return {
                    backgroundColor: styles.backgroundColor,
                    border: styles.border,
                    color: styles.color,
                    fontSize: styles.fontSize,
                    cursor: styles.cursor
                };
            });
            
            // Check field error styling
            await this.page.evaluate(() => {
                const emailInput = document.getElementById('loginEmail');
                if (emailInput) {
                    emailInput.value = 'invalid-email';
                    emailInput.dispatchEvent(new Event('blur', { bubbles: true }));
                }
            });
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const fieldErrorStyles = await this.page.evaluate(() => {
                const emailInput = document.getElementById('loginEmail');
                if (!emailInput) return null;
                
                const styles = window.getComputedStyle(emailInput);
                return {
                    borderColor: styles.borderColor,
                    boxShadow: styles.boxShadow
                };
            });
            
            // Verify all styling is applied correctly
            const hasErrorStyling = errorStyles && errorStyles.backgroundColor && errorStyles.color;
            const hasDismissButtonStyling = dismissButtonStyles && dismissButtonStyles.cursor === 'pointer';
            const hasFieldErrorStyling = fieldErrorStyles && fieldErrorStyles.borderColor;
            
            if (hasErrorStyling && hasDismissButtonStyling && hasFieldErrorStyling) {
                return {
                    success: true,
                    details: `CSS styling applied: error message (${hasErrorStyling}), dismiss button (${hasDismissButtonStyling}), field error (${hasFieldErrorStyling})`
                };
            } else {
                return {
                    success: false,
                    error: 'CSS styling not properly applied',
                    details: `Error styling: ${hasErrorStyling}, Dismiss button: ${hasDismissButtonStyling}, Field error: ${hasFieldErrorStyling}`
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                details: 'CSS styling test failed'
            };
        }
    }

    // Test 4: Loading State Animations
    async testLoadingStateAnimations() {
        try {
            // Navigate to login page
            await this.page.evaluate(() => {
                const loginLink = document.getElementById('showLoginLink');
                if (loginLink) {
                    loginLink.click();
                }
            });
            
            // Clear form and enter valid credentials
            await this.page.evaluate(() => {
                const emailInput = document.getElementById('loginEmail');
                const passwordInput = document.getElementById('loginPassword');
                if (emailInput) emailInput.value = '';
                if (passwordInput) passwordInput.value = '';
            });
            
            await this.page.type('#loginEmail', this.testUser.email);
            await this.page.type('#loginPassword', this.testUser.password);
            
            // Click login and immediately check loading state
            await this.page.click('#loginButton');
            
            // Check loading state immediately
            const loadingState = await this.page.evaluate(() => {
                const loginButton = document.getElementById('loginButton');
                const emailInput = document.getElementById('loginEmail');
                const passwordInput = document.getElementById('loginPassword');
                
                return {
                    buttonDisabled: loginButton ? loginButton.disabled : false,
                    buttonText: loginButton ? loginButton.textContent : '',
                    emailDisabled: emailInput ? emailInput.disabled : false,
                    passwordDisabled: passwordInput ? passwordInput.disabled : false,
                    buttonHasLoadingClass: loginButton ? loginButton.classList.contains('loading') : false,
                    formHasLoadingClass: document.querySelector('#loginForm') ? document.querySelector('#loginForm').classList.contains('loading') : false
                };
            });
            
            // Wait for login to complete
            try {
                await this.page.waitForSelector('#appSection', { timeout: 10000 });
            } catch (e) {
                // Login might fail, that's okay for this test
            }
            
            // Check if loading animations are working
            const hasLoadingAnimations = loadingState.buttonDisabled && 
                                       loadingState.emailDisabled && 
                                       loadingState.passwordDisabled &&
                                       (loadingState.buttonText.includes('Signing In') || 
                                        loadingState.buttonHasLoadingClass ||
                                        loadingState.formHasLoadingClass);
            
            if (hasLoadingAnimations) {
                return {
                    success: true,
                    details: `Loading animations working: button disabled (${loadingState.buttonDisabled}), inputs disabled (${loadingState.emailDisabled && loadingState.passwordDisabled}), loading text/class present`
                };
            } else {
                return {
                    success: false,
                    error: 'Loading animations not working properly',
                    details: `Button disabled: ${loadingState.buttonDisabled}, Inputs disabled: ${loadingState.emailDisabled && loadingState.passwordDisabled}, Loading indicators: ${loadingState.buttonText.includes('Signing In') || loadingState.buttonHasLoadingClass}`
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                details: 'Loading state animations test failed'
            };
        }
    }

    // Test 5: Error Message Accessibility
    async testErrorMessageAccessibility() {
        try {
            // Navigate to login page
            await this.page.evaluate(() => {
                const loginLink = document.getElementById('showLoginLink');
                if (loginLink) {
                    loginLink.click();
                }
            });
            
            // Trigger an error message
            await this.page.type('#loginEmail', 'invalid@example.com');
            await this.page.type('#loginPassword', 'wrongpassword');
            await this.page.click('#loginButton');
            
            await this.page.waitForSelector('.error-message', { timeout: 5000 });
            
            // Check accessibility features
            const accessibilityFeatures = await this.page.evaluate(() => {
                const errorMessage = document.querySelector('.error-message');
                const dismissButton = errorMessage ? errorMessage.querySelector('button') : null;
                
                return {
                    hasErrorMessage: !!errorMessage,
                    hasDismissButton: !!dismissButton,
                    dismissButtonHasTitle: dismissButton ? dismissButton.hasAttribute('title') : false,
                    dismissButtonTitle: dismissButton ? dismissButton.getAttribute('title') : '',
                    errorMessageHasRole: errorMessage ? errorMessage.hasAttribute('role') : false,
                    errorMessageRole: errorMessage ? errorMessage.getAttribute('role') : '',
                    errorMessageHasAriaLabel: errorMessage ? errorMessage.hasAttribute('aria-label') : false,
                    errorMessageAriaLabel: errorMessage ? errorMessage.getAttribute('aria-label') : ''
                };
            });
            
            // Check color contrast (basic check)
            const colorContrast = await this.page.evaluate(() => {
                const errorMessage = document.querySelector('.error-message');
                if (!errorMessage) return false;
                
                const styles = window.getComputedStyle(errorMessage);
                const backgroundColor = styles.backgroundColor;
                const color = styles.color;
                
                // Basic check - error messages should have contrasting colors
                return backgroundColor !== color && backgroundColor !== 'rgba(0, 0, 0, 0)' && color !== 'rgba(0, 0, 0, 0)';
            });
            
            const hasAccessibilityFeatures = accessibilityFeatures.hasErrorMessage && 
                                           accessibilityFeatures.hasDismissButton &&
                                           (accessibilityFeatures.dismissButtonHasTitle || 
                                            accessibilityFeatures.errorMessageHasRole ||
                                            accessibilityFeatures.errorMessageHasAriaLabel);
            
            if (hasAccessibilityFeatures && colorContrast) {
                return {
                    success: true,
                    details: `Accessibility features present: error message (${accessibilityFeatures.hasErrorMessage}), dismiss button (${accessibilityFeatures.hasDismissButton}), title/role/aria-label (${accessibilityFeatures.dismissButtonHasTitle || accessibilityFeatures.errorMessageHasRole}), color contrast (${colorContrast})`
                };
            } else {
                return {
                    success: false,
                    error: 'Accessibility features missing',
                    details: `Error message: ${accessibilityFeatures.hasErrorMessage}, Dismiss button: ${accessibilityFeatures.hasDismissButton}, Accessibility attributes: ${hasAccessibilityFeatures}, Color contrast: ${colorContrast}`
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                details: 'Error message accessibility test failed'
            };
        }
    }

    async runAllTests() {
        console.log('🎯 Starting Medium-Priority Refactoring Verification Tests...\n');
        
        await this.runTest('Enhanced Error Handling', () => this.testEnhancedErrorHandling());
        await this.runTest('Form Validation Improvements', () => this.testFormValidationImprovements());
        await this.runTest('CSS Styling for Error States', () => this.testCSSStylingForErrorStates());
        await this.runTest('Loading State Animations', () => this.testLoadingStateAnimations());
        await this.runTest('Error Message Accessibility', () => this.testErrorMessageAccessibility());
        
        await this.generateReport();
    }

    async generateReport() {
        const reportPath = path.join(__dirname, `TEST_1_2_MP_REFACTORING_VERIFICATION_${Date.now()}.json`);
        
        console.log('\n📊 Test Results Summary:');
        console.log(`Total Tests: ${this.testResults.totalTests}`);
        console.log(`Passed: ${this.testResults.passedTests}`);
        console.log(`Failed: ${this.testResults.failedTests}`);
        console.log(`Success Rate: ${((this.testResults.passedTests / this.testResults.totalTests) * 100).toFixed(1)}%`);
        
        if (this.testResults.failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults.testDetails
                .filter(test => test.status === 'FAILED')
                .forEach(test => {
                    console.log(`  - ${test.name}: ${test.error}`);
                });
        }
        
        // Save detailed report
        fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
        
        // Generate markdown report
        const markdownReport = this.generateMarkdownReport();
        const markdownPath = reportPath.replace('.json', '.md');
        fs.writeFileSync(markdownPath, markdownReport);
        console.log(`📄 Markdown report saved to: ${markdownPath}`);
    }

    generateMarkdownReport() {
        const timestamp = new Date(this.testResults.timestamp).toLocaleString();
        const successRate = ((this.testResults.passedTests / this.testResults.totalTests) * 100).toFixed(1);
        
        let report = `# Test 1.2 Medium-Priority Refactoring Verification Report\n\n`;
        report += `**Generated:** ${timestamp}\n`;
        report += `**Total Tests:** ${this.testResults.totalTests}\n`;
        report += `**Passed:** ${this.testResults.passedTests}\n`;
        report += `**Failed:** ${this.testResults.failedTests}\n`;
        report += `**Success Rate:** ${successRate}%\n\n`;
        
        report += `## Test Results\n\n`;
        
        this.testResults.testDetails.forEach(test => {
            const status = test.status === 'PASSED' ? '✅' : '❌';
            report += `### ${status} ${test.name}\n`;
            report += `**Status:** ${test.status}\n`;
            if (test.error) {
                report += `**Error:** ${test.error}\n`;
            }
            if (test.details) {
                report += `**Details:** ${test.details}\n`;
            }
            report += `\n`;
        });
        
        return report;
    }
}

// Main execution
async function main() {
    const testSuite = new MediumPriorityRefactoringTestSuite();
    
    try {
        await testSuite.initialize();
        await testSuite.runAllTests();
    } catch (error) {
        console.error('❌ Test suite failed:', error);
    } finally {
        await testSuite.cleanup();
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = MediumPriorityRefactoringTestSuite;

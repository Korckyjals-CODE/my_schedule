/**
 * Simplified Test Script for Test 1.2 High-Priority Refactoring Verification
 * This version tests the frontend code directly without requiring a running server
 * Tests ONLY the high-priority refactoring requirements
 */

const fs = require('fs');
const path = require('path');

class SimplifiedRefactoringTestSuite {
    constructor() {
        this.testResults = {
            timestamp: new Date().toISOString(),
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            testDetails: []
        };
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

    // Test 1: Check if alert() calls have been removed
    async testNoAlertCalls() {
        try {
            const jsFiles = [
                '../../public/js/script.js',
                '../../public/js/editor.js',
                '../../public/js/search.js',
                '../../public/js/supabase-client.js'
            ];

            let alertFound = false;
            let alertLocations = [];

            for (const file of jsFiles) {
                const filePath = path.join(__dirname, file);
                if (fs.existsSync(filePath)) {
                    const content = fs.readFileSync(filePath, 'utf8');
                    const alertMatches = content.match(/alert\s*\(/g);
                    if (alertMatches) {
                        alertFound = true;
                        alertLocations.push(`${file}: ${alertMatches.length} alert() calls found`);
                    }
                }
            }

            if (!alertFound) {
                return {
                    success: true,
                    details: 'No alert() calls found in JavaScript files'
                };
            } else {
                return {
                    success: false,
                    error: 'Alert calls still present in code',
                    details: alertLocations.join(', ')
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                details: 'Failed to check for alert calls'
            };
        }
    }

    // Test 2: Check if error message CSS classes exist
    async testErrorMessageCSS() {
        try {
            const cssPath = path.join(__dirname, '../../public/css/styles.css');
            if (!fs.existsSync(cssPath)) {
                return {
                    success: false,
                    error: 'styles.css file not found',
                    details: 'CSS file missing'
                };
            }

            const cssContent = fs.readFileSync(cssPath, 'utf8');
            
            const requiredClasses = [
                '.error-message',
                '.field-error',
                '.loading',
                '.loading-spinner'
            ];

            const missingClasses = [];
            for (const className of requiredClasses) {
                if (!cssContent.includes(className)) {
                    missingClasses.push(className);
                }
            }

            if (missingClasses.length === 0) {
                return {
                    success: true,
                    details: 'All required CSS classes for error states are present'
                };
            } else {
                return {
                    success: false,
                    error: 'Missing CSS classes for error states',
                    details: `Missing: ${missingClasses.join(', ')}`
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                details: 'Failed to check CSS classes'
            };
        }
    }

    // Test 3: Check if environment variables are configured
    async testEnvironmentConfiguration() {
        try {
            const envPath = path.join(__dirname, '../../.env');
            if (!fs.existsSync(envPath)) {
                return {
                    success: false,
                    error: '.env file not found',
                    details: 'Environment configuration file missing'
                };
            }

            const envContent = fs.readFileSync(envPath, 'utf8');
            
            const requiredVars = [
                'NODE_ENV=development',
                'DISABLE_EMAIL_CONFIRMATION=true'
            ];

            const missingVars = [];
            for (const varLine of requiredVars) {
                if (!envContent.includes(varLine)) {
                    missingVars.push(varLine);
                }
            }

            if (missingVars.length === 0) {
                return {
                    success: true,
                    details: 'Required environment variables are configured'
                };
            } else {
                return {
                    success: false,
                    error: 'Missing required environment variables',
                    details: `Missing: ${missingVars.join(', ')}`
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                details: 'Failed to check environment configuration'
            };
        }
    }

    // Test 4: Check if error message display functions exist
    async testErrorMessageFunctions() {
        try {
            const jsFiles = [
                '../../public/js/script.js',
                '../../public/js/editor.js',
                '../../public/js/supabase-client.js'
            ];

            let errorFunctionFound = false;
            let functionLocations = [];

            for (const file of jsFiles) {
                const filePath = path.join(__dirname, file);
                if (fs.existsSync(filePath)) {
                    const content = fs.readFileSync(filePath, 'utf8');
                    
                    // Look for error message display functions
                    const errorFunctions = [
                        'showErrorMessage',
                        'displayError',
                        'showError'
                    ];

                    for (const func of errorFunctions) {
                        if (content.includes(`function ${func}`) || content.includes(`${func}(`)) {
                            errorFunctionFound = true;
                            functionLocations.push(`${file}: ${func} function found`);
                        }
                    }
                }
            }

            if (errorFunctionFound) {
                return {
                    success: true,
                    details: `Error message display functions found: ${functionLocations.join(', ')}`
                };
            } else {
                return {
                    success: false,
                    error: 'No error message display functions found',
                    details: 'Expected functions like showErrorMessage, displayError, or showError'
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                details: 'Failed to check for error message functions'
            };
        }
    }

    // Test 5: Check if loading state functions exist
    async testLoadingStateFunctions() {
        try {
            const jsFiles = [
                '../../public/js/script.js',
                '../../public/js/editor.js',
                '../../public/js/supabase-client.js'
            ];

            let loadingFunctionFound = false;
            let functionLocations = [];

            for (const file of jsFiles) {
                const filePath = path.join(__dirname, file);
                if (fs.existsSync(filePath)) {
                    const content = fs.readFileSync(filePath, 'utf8');
                    
                    // Look for loading state related code
                    const loadingPatterns = [
                        'Signing In',
                        'disabled = true',
                        'innerHTML.*Loading',
                        'showLoading',
                        'setLoading'
                    ];

                    for (const pattern of loadingPatterns) {
                        if (content.includes(pattern)) {
                            loadingFunctionFound = true;
                            functionLocations.push(`${file}: ${pattern} found`);
                        }
                    }
                }
            }

            if (loadingFunctionFound) {
                return {
                    success: true,
                    details: `Loading state code found: ${functionLocations.join(', ')}`
                };
            } else {
                return {
                    success: false,
                    error: 'No loading state code found',
                    details: 'Expected loading state functionality in JavaScript files'
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                details: 'Failed to check for loading state functions'
            };
        }
    }

    // Test 6: Check if form validation functions exist
    async testFormValidationFunctions() {
        try {
            const jsFiles = [
                '../../public/js/script.js',
                '../../public/js/editor.js'
            ];

            let validationFunctionFound = false;
            let functionLocations = [];

            for (const file of jsFiles) {
                const filePath = path.join(__dirname, file);
                if (fs.existsSync(filePath)) {
                    const content = fs.readFileSync(filePath, 'utf8');
                    
                    // Look for validation related code
                    const validationPatterns = [
                        'validateEmail',
                        'validatePassword',
                        'addEventListener.*blur',
                        'field-error',
                        'validation'
                    ];

                    for (const pattern of validationPatterns) {
                        if (content.includes(pattern)) {
                            validationFunctionFound = true;
                            functionLocations.push(`${file}: ${pattern} found`);
                        }
                    }
                }
            }

            if (validationFunctionFound) {
                return {
                    success: true,
                    details: `Form validation code found: ${functionLocations.join(', ')}`
                };
            } else {
                return {
                    success: false,
                    error: 'No form validation code found',
                    details: 'Expected form validation functionality in JavaScript files'
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                details: 'Failed to check for form validation functions'
            };
        }
    }

    async runAllTests() {
        console.log('🎯 Starting High-Priority Simplified Refactoring Verification Tests...\n');
        
        await this.runTest('No Alert Calls', () => this.testNoAlertCalls());
        await this.runTest('Error Message CSS Classes', () => this.testErrorMessageCSS());
        await this.runTest('Environment Configuration', () => this.testEnvironmentConfiguration());
        await this.runTest('Error Message Functions', () => this.testErrorMessageFunctions());
        await this.runTest('Loading State Functions', () => this.testLoadingStateFunctions());
        await this.runTest('Form Validation Functions', () => this.testFormValidationFunctions());
        
        await this.generateReport();
    }

    async generateReport() {
        const reportPath = path.join(__dirname, `TEST_1_2_HP_SIMPLIFIED_VERIFICATION_${Date.now()}.json`);
        
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
        
        let report = `# Test 1.2 High-Priority Simplified Refactoring Verification Report\n\n`;
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
    const testSuite = new SimplifiedRefactoringTestSuite();
    
    try {
        await testSuite.runAllTests();
    } catch (error) {
        console.error('❌ Test suite failed:', error);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = SimplifiedRefactoringTestSuite;

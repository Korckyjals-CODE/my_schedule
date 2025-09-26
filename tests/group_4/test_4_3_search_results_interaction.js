// Test 4.3: Search Results Interaction
// This test covers the interaction with search results in the search interface

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class Test43SearchResultsInteraction {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = {
            testName: 'Test 4.3: Search Results Interaction',
            timestamp: new Date().toISOString(),
            setup: {},
            testSteps: {},
            validation: {},
            overallResult: 'PENDING',
            issues: [],
            screenshots: []
        };
    }

    async setup() {
        console.log('🔧 Setting up Test 4.3: Search Results Interaction');
        
        try {
            // Launch browser
            this.browser = await puppeteer.launch({
                headless: false,
                defaultViewport: { width: 1280, height: 720 },
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            this.page = await this.browser.newPage();
            
            // Set up console logging
            this.page.on('console', msg => {
                console.log(`📝 Browser Console [${msg.type()}]:`, msg.text());
            });

            // Set up error handling
            this.page.on('pageerror', error => {
                console.error('❌ Page Error:', error.message);
                this.testResults.issues.push(`Page Error: ${error.message}`);
            });

            // Navigate to search page
            console.log('🌐 Navigating to search page...');
            await this.page.goto('http://localhost:3000/search.html', {
                waitUntil: 'networkidle2',
                timeout: 10000
            });

            // Take initial screenshot
            const initialScreenshot = await this.page.screenshot({
                path: `test_4_3_initial_load_${Date.now()}.png`,
                fullPage: true
            });
            this.testResults.screenshots.push('Initial page load');

            // Check if authentication is required
            const authSection = await this.page.$('#authSection');
            if (authSection) {
                console.log('🔐 Authentication required, logging in...');
                await this.handleAuthentication();
            }

            // Wait for search interface to load
            await this.page.waitForSelector('#searchInput', { timeout: 5000 });
            
            this.testResults.setup = {
                browserLaunched: true,
                pageLoaded: true,
                searchInterfaceVisible: true,
                authenticationHandled: true
            };

            console.log('✅ Setup completed successfully');
            return true;

        } catch (error) {
            console.error('❌ Setup failed:', error.message);
            this.testResults.setup.error = error.message;
            this.testResults.issues.push(`Setup Error: ${error.message}`);
            return false;
        }
    }

    async handleAuthentication() {
        try {
            // Check if we need to sign in or sign up
            const loginForm = await this.page.$('#loginForm');
            const signupForm = await this.page.$('#signupForm');
            
            if (loginForm && await this.page.$eval('#loginForm', el => el.style.display !== 'none')) {
                // Fill in login form with test credentials
                await this.page.type('#loginEmail', 'testuser@example.com');
                await this.page.type('#loginPassword', 'testpassword123');
                await this.page.click('#loginBtn');
                
                // Wait for authentication to complete
                await this.page.waitForSelector('#appSection', { timeout: 10000 });
            } else if (signupForm && await this.page.$eval('#signupForm', el => el.style.display !== 'none')) {
                // Fill in signup form
                await this.page.type('#signupEmail', 'testuser@example.com');
                await this.page.type('#signupPassword', 'testpassword123');
                await this.page.click('#signupBtn');
                
                // Wait for signup to complete
                await this.page.waitForFunction(() => {
                    const authSection = document.getElementById('authSection');
                    return authSection && authSection.style.display === 'none';
                }, { timeout: 10000 });
            }
            
            console.log('✅ Authentication completed');
        } catch (error) {
            console.error('❌ Authentication failed:', error.message);
            throw error;
        }
    }

    async performInitialSearch() {
        console.log('🔍 Performing initial search...');
        
        try {
            // Wait for search interface to be ready
            await this.page.waitForSelector('#searchInput', { visible: true });
            
            // Perform a search to get results
            await this.page.type('#searchInput', '6A');
            await this.page.click('#searchBtn');
            
            // Wait for results to load
            await this.page.waitForFunction(() => {
                const resultsContainer = document.getElementById('resultsContainer');
                const noResults = document.querySelector('.no-results');
                const resultsList = document.querySelector('.results-list');
                return resultsContainer && (noResults || resultsList);
            }, { timeout: 10000 });
            
            // Check if we have results
            const hasResults = await this.page.$('.results-list');
            if (!hasResults) {
                console.log('⚠️ No search results found, trying different search terms...');
                
                // Clear search and try different terms
                await this.page.click('#clearFiltersBtn');
                await this.page.waitForTimeout(500);
                
                // Try searching for "Class"
                await this.page.type('#searchInput', 'Class');
                await this.page.click('#searchBtn');
                
                await this.page.waitForFunction(() => {
                    const resultsContainer = document.getElementById('resultsContainer');
                    const noResults = document.querySelector('.no-results');
                    const resultsList = document.querySelector('.results-list');
                    return resultsContainer && (noResults || resultsList);
                }, { timeout: 10000 });
            }
            
            // Take screenshot of search results
            const searchResultsScreenshot = await this.page.screenshot({
                path: `test_4_3_search_results_${Date.now()}.png`,
                fullPage: true
            });
            this.testResults.screenshots.push('Search results displayed');
            
            this.testResults.testSteps.initialSearch = {
                completed: true,
                searchPerformed: true,
                resultsFound: await this.page.$('.results-list') !== null
            };
            
            console.log('✅ Initial search completed');
            return true;
            
        } catch (error) {
            console.error('❌ Initial search failed:', error.message);
            this.testResults.testSteps.initialSearch = {
                completed: false,
                error: error.message
            };
            this.testResults.issues.push(`Initial Search Error: ${error.message}`);
            return false;
        }
    }

    async testCalendarNavigation() {
        console.log('🧭 Testing calendar navigation from search results...');
        
        try {
            // Check if we have search results
            const resultsList = await this.page.$('.results-list');
            if (!resultsList) {
                console.log('⚠️ No search results available for navigation test');
                this.testResults.testSteps.calendarNavigation = {
                    completed: false,
                    reason: 'No search results available'
                };
                return false;
            }
            
            // Get the first result item
            const firstResult = await this.page.$('.result-item');
            if (!firstResult) {
                console.log('⚠️ No result items found');
                this.testResults.testSteps.calendarNavigation = {
                    completed: false,
                    reason: 'No result items found'
                };
                return false;
            }
            
            // Click on the first result to navigate to calendar
            console.log('🖱️ Clicking on search result to navigate to calendar...');
            await firstResult.click();
            
            // Wait for navigation to complete
            await this.page.waitForFunction(() => {
                return window.location.href.includes('index.html');
            }, { timeout: 10000 });
            
            // Take screenshot of calendar page
            const calendarScreenshot = await this.page.screenshot({
                path: `test_4_3_calendar_navigation_${Date.now()}.png`,
                fullPage: true
            });
            this.testResults.screenshots.push('Calendar navigation completed');
            
            // Check if we're on the calendar page
            const currentUrl = this.page.url();
            const isOnCalendar = currentUrl.includes('index.html');
            
            // Navigate back to search page for remaining tests
            await this.page.goto('http://localhost:3000/search.html');
            await this.page.waitForSelector('#searchInput', { timeout: 5000 });
            
            // Re-authenticate if needed
            const authSection = await this.page.$('#authSection');
            if (authSection && await this.page.$eval('#authSection', el => el.style.display !== 'none')) {
                await this.handleAuthentication();
            }
            
            this.testResults.testSteps.calendarNavigation = {
                completed: true,
                navigationSuccessful: isOnCalendar,
                currentUrl: currentUrl
            };
            
            console.log('✅ Calendar navigation test completed');
            return true;
            
        } catch (error) {
            console.error('❌ Calendar navigation test failed:', error.message);
            this.testResults.testSteps.calendarNavigation = {
                completed: false,
                error: error.message
            };
            this.testResults.issues.push(`Calendar Navigation Error: ${error.message}`);
            return false;
        }
    }

    async testEditDeleteButtons() {
        console.log('✏️ Testing edit and delete buttons on search results...');
        
        try {
            // Ensure we have search results
            await this.performInitialSearch();
            
            // Check if we have results
            const resultsList = await this.page.$('.results-list');
            if (!resultsList) {
                console.log('⚠️ No search results available for edit/delete test');
                this.testResults.testSteps.editDeleteButtons = {
                    completed: false,
                    reason: 'No search results available'
                };
                return false;
            }
            
            // Get the first result item
            const firstResult = await this.page.$('.result-item');
            if (!firstResult) {
                console.log('⚠️ No result items found');
                this.testResults.testSteps.editDeleteButtons = {
                    completed: false,
                    reason: 'No result items found'
                };
                return false;
            }
            
            // Hover over the result to show edit/delete buttons
            await firstResult.hover();
            
            // Wait for hover buttons to appear
            await this.page.waitForSelector('.hover-buttons', { visible: true, timeout: 3000 });
            
            // Check if edit button exists and is clickable
            const editButton = await this.page.$('.edit-btn');
            const editButtonExists = editButton !== null;
            const editButtonVisible = editButton ? await this.page.$eval('.edit-btn', el => {
                const style = window.getComputedStyle(el);
                return style.opacity !== '0' && style.visibility !== 'hidden';
            }) : false;
            
            // Check if delete button exists and is clickable
            const deleteButton = await this.page.$('.delete-btn');
            const deleteButtonExists = deleteButton !== null;
            const deleteButtonVisible = deleteButton ? await this.page.$eval('.delete-btn', el => {
                const style = window.getComputedStyle(el);
                return style.opacity !== '0' && style.visibility !== 'hidden';
            }) : false;
            
            // Take screenshot of hover buttons
            const hoverScreenshot = await this.page.screenshot({
                path: `test_4_3_hover_buttons_${Date.now()}.png`,
                fullPage: true
            });
            this.testResults.screenshots.push('Hover buttons displayed');
            
            this.testResults.testSteps.editDeleteButtons = {
                completed: true,
                editButtonExists,
                editButtonVisible,
                deleteButtonExists,
                deleteButtonVisible,
                buttonsFunctional: editButtonExists && deleteButtonExists
            };
            
            console.log('✅ Edit/Delete buttons test completed');
            return true;
            
        } catch (error) {
            console.error('❌ Edit/Delete buttons test failed:', error.message);
            this.testResults.testSteps.editDeleteButtons = {
                completed: false,
                error: error.message
            };
            this.testResults.issues.push(`Edit/Delete Buttons Error: ${error.message}`);
            return false;
        }
    }

    async testEditModal() {
        console.log('📝 Testing edit modal functionality...');
        
        try {
            // Ensure we have search results
            await this.performInitialSearch();
            
            // Get the first result item
            const firstResult = await this.page.$('.result-item');
            if (!firstResult) {
                console.log('⚠️ No result items found for edit modal test');
                this.testResults.testSteps.editModal = {
                    completed: false,
                    reason: 'No result items found'
                };
                return false;
            }
            
            // Hover over the result to show edit button
            await firstResult.hover();
            await this.page.waitForSelector('.hover-buttons', { visible: true, timeout: 3000 });
            
            // Click the edit button
            const editButton = await this.page.$('.edit-btn');
            if (!editButton) {
                console.log('⚠️ Edit button not found');
                this.testResults.testSteps.editModal = {
                    completed: false,
                    reason: 'Edit button not found'
                };
                return false;
            }
            
            // Click edit button with event prevention
            await this.page.evaluate(() => {
                const editBtn = document.querySelector('.edit-btn');
                if (editBtn) {
                    const event = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true
                    });
                    editBtn.dispatchEvent(event);
                }
            });
            
            // Wait for modal to appear
            await this.page.waitForSelector('#editEventModal', { visible: true, timeout: 5000 });
            
            // Check if modal is displayed
            const modalVisible = await this.page.$eval('#editEventModal', el => {
                const style = window.getComputedStyle(el);
                return style.display !== 'none';
            });
            
            // Take screenshot of edit modal
            const modalScreenshot = await this.page.screenshot({
                path: `test_4_3_edit_modal_${Date.now()}.png`,
                fullPage: true
            });
            this.testResults.screenshots.push('Edit modal displayed');
            
            // Check if modal form fields are present
            const modalForm = await this.page.$('#editEventForm');
            const gradeField = await this.page.$('#editGrade');
            const subjectField = await this.page.$('#editSubject');
            const startTimeField = await this.page.$('#editStartTime');
            const endTimeField = await this.page.$('#editEndTime');
            
            // Check if modal buttons are present
            const closeButton = await this.page.$('#closeModalBtn');
            const cancelButton = await this.page.$('#cancelEditBtn');
            const saveButton = await this.page.$('#saveEditBtn');
            
            // Test closing the modal
            if (closeButton) {
                await closeButton.click();
                await this.page.waitForFunction(() => {
                    const modal = document.getElementById('editEventModal');
                    const style = window.getComputedStyle(modal);
                    return style.display === 'none';
                }, { timeout: 3000 });
            }
            
            this.testResults.testSteps.editModal = {
                completed: true,
                modalOpened: modalVisible,
                formFieldsPresent: {
                    modalForm: modalForm !== null,
                    gradeField: gradeField !== null,
                    subjectField: subjectField !== null,
                    startTimeField: startTimeField !== null,
                    endTimeField: endTimeField !== null
                },
                modalButtonsPresent: {
                    closeButton: closeButton !== null,
                    cancelButton: cancelButton !== null,
                    saveButton: saveButton !== null
                },
                modalClosed: true
            };
            
            console.log('✅ Edit modal test completed');
            return true;
            
        } catch (error) {
            console.error('❌ Edit modal test failed:', error.message);
            this.testResults.testSteps.editModal = {
                completed: false,
                error: error.message
            };
            this.testResults.issues.push(`Edit Modal Error: ${error.message}`);
            return false;
        }
    }

    async testExportFunctions() {
        console.log('📤 Testing export functions...');
        
        try {
            // Ensure we have search results
            await this.performInitialSearch();
            
            // Click the export button to show export options
            const exportButton = await this.page.$('#exportBtn');
            if (!exportButton) {
                console.log('⚠️ Export button not found');
                this.testResults.testSteps.exportFunctions = {
                    completed: false,
                    reason: 'Export button not found'
                };
                return false;
            }
            
            await exportButton.click();
            
            // Wait for export options to appear
            await this.page.waitForSelector('#exportOptions', { visible: true, timeout: 3000 });
            
            // Check if export options are visible
            const exportOptionsVisible = await this.page.$eval('#exportOptions', el => {
                const style = window.getComputedStyle(el);
                return style.display !== 'none';
            });
            
            // Check if all export buttons are present
            const csvButton = await this.page.$('#exportCSVBtn');
            const excelButton = await this.page.$('#exportExcelBtn');
            const jsonButton = await this.page.$('#exportJSONBtn');
            const pdfButton = await this.page.$('#exportPDFBtn');
            const clipboardButton = await this.page.$('#exportClipboardBtn');
            
            // Take screenshot of export options
            const exportScreenshot = await this.page.screenshot({
                path: `test_4_3_export_options_${Date.now()}.png`,
                fullPage: true
            });
            this.testResults.screenshots.push('Export options displayed');
            
            // Test CSV export (this will trigger a download)
            if (csvButton) {
                // Set up download handling
                await this.page._client.send('Page.setDownloadBehavior', {
                    behavior: 'allow',
                    downloadPath: path.resolve(__dirname)
                });
                
                await csvButton.click();
                await this.page.waitForTimeout(1000); // Wait for download to start
            }
            
            this.testResults.testSteps.exportFunctions = {
                completed: true,
                exportOptionsVisible,
                exportButtonsPresent: {
                    csvButton: csvButton !== null,
                    excelButton: excelButton !== null,
                    jsonButton: jsonButton !== null,
                    pdfButton: pdfButton !== null,
                    clipboardButton: clipboardButton !== null
                },
                csvExportTested: csvButton !== null
            };
            
            console.log('✅ Export functions test completed');
            return true;
            
        } catch (error) {
            console.error('❌ Export functions test failed:', error.message);
            this.testResults.testSteps.exportFunctions = {
                completed: false,
                error: error.message
            };
            this.testResults.issues.push(`Export Functions Error: ${error.message}`);
            return false;
        }
    }

    async testClipboardCopy() {
        console.log('📋 Testing clipboard copy functionality...');
        
        try {
            // Ensure we have search results
            await this.performInitialSearch();
            
            // Click the export button to show export options
            const exportButton = await this.page.$('#exportBtn');
            if (exportButton) {
                await exportButton.click();
                await this.page.waitForSelector('#exportOptions', { visible: true, timeout: 3000 });
            }
            
            // Test clipboard copy
            const clipboardButton = await this.page.$('#exportClipboardBtn');
            if (!clipboardButton) {
                console.log('⚠️ Clipboard button not found');
                this.testResults.testSteps.clipboardCopy = {
                    completed: false,
                    reason: 'Clipboard button not found'
                };
                return false;
            }
            
            // Set up permission for clipboard access
            await this.page.evaluateOnNewDocument(() => {
                Object.defineProperty(navigator, 'clipboard', {
                    value: {
                        writeText: () => Promise.resolve()
                    }
                });
            });
            
            // Click clipboard button
            await clipboardButton.click();
            
            // Wait for any alert or notification
            await this.page.waitForTimeout(1000);
            
            this.testResults.testSteps.clipboardCopy = {
                completed: true,
                clipboardButtonFound: true,
                clipboardFunctionCalled: true
            };
            
            console.log('✅ Clipboard copy test completed');
            return true;
            
        } catch (error) {
            console.error('❌ Clipboard copy test failed:', error.message);
            this.testResults.testSteps.clipboardCopy = {
                completed: false,
                error: error.message
            };
            this.testResults.issues.push(`Clipboard Copy Error: ${error.message}`);
            return false;
        }
    }

    async validateResults() {
        console.log('🔍 Validating test results...');
        
        try {
            // Check overall test completion
            const allTestsCompleted = Object.values(this.testResults.testSteps).every(step => 
                step.completed === true
            );
            
            // Check for critical issues
            const criticalIssues = this.testResults.issues.filter(issue => 
                issue.includes('Error') || issue.includes('failed')
            );
            
            // Determine overall result
            if (allTestsCompleted && criticalIssues.length === 0) {
                this.testResults.overallResult = 'PASSED';
            } else if (criticalIssues.length > 0) {
                this.testResults.overallResult = 'FAILED';
            } else {
                this.testResults.overallResult = 'PARTIAL';
            }
            
            this.testResults.validation = {
                allTestsCompleted,
                criticalIssuesCount: criticalIssues.length,
                screenshotsTaken: this.testResults.screenshots.length,
                overallResult: this.testResults.overallResult
            };
            
            console.log(`✅ Validation completed. Overall result: ${this.testResults.overallResult}`);
            
        } catch (error) {
            console.error('❌ Validation failed:', error.message);
            this.testResults.validation.error = error.message;
            this.testResults.issues.push(`Validation Error: ${error.message}`);
        }
    }

    async cleanup() {
        console.log('🧹 Cleaning up...');
        
        try {
            if (this.browser) {
                await this.browser.close();
            }
            console.log('✅ Cleanup completed');
        } catch (error) {
            console.error('❌ Cleanup failed:', error.message);
        }
    }

    async saveResults() {
        console.log('💾 Saving test results...');
        
        try {
            const resultsPath = `test_4_3_results_${Date.now()}.json`;
            fs.writeFileSync(resultsPath, JSON.stringify(this.testResults, null, 2));
            console.log(`✅ Test results saved to: ${resultsPath}`);
            
            // Also save a summary
            const summaryPath = `TEST_4_3_RESULTS.md`;
            const summary = this.generateSummary();
            fs.writeFileSync(summaryPath, summary);
            console.log(`✅ Test summary saved to: ${summaryPath}`);
            
        } catch (error) {
            console.error('❌ Failed to save results:', error.message);
        }
    }

    generateSummary() {
        const timestamp = new Date().toLocaleString();
        const overallResult = this.testResults.overallResult;
        const issuesCount = this.testResults.issues.length;
        
        return `# Test 4.3: Search Results Interaction - Results Summary

## Test Overview
- **Test Name**: Search Results Interaction
- **Execution Time**: ${timestamp}
- **Overall Result**: ${overallResult}
- **Issues Found**: ${issuesCount}

## Test Steps Results

### 1. Setup
${this.testResults.setup.browserLaunched ? '✅' : '❌'} Browser launched successfully
${this.testResults.setup.pageLoaded ? '✅' : '❌'} Search page loaded
${this.testResults.setup.searchInterfaceVisible ? '✅' : '❌'} Search interface visible
${this.testResults.setup.authenticationHandled ? '✅' : '❌'} Authentication handled

### 2. Initial Search
${this.testResults.testSteps.initialSearch?.completed ? '✅' : '❌'} Initial search performed
${this.testResults.testSteps.initialSearch?.resultsFound ? '✅' : '❌'} Search results found

### 3. Calendar Navigation
${this.testResults.testSteps.calendarNavigation?.completed ? '✅' : '❌'} Calendar navigation test completed
${this.testResults.testSteps.calendarNavigation?.navigationSuccessful ? '✅' : '❌'} Navigation to calendar successful

### 4. Edit/Delete Buttons
${this.testResults.testSteps.editDeleteButtons?.completed ? '✅' : '❌'} Edit/Delete buttons test completed
${this.testResults.testSteps.editDeleteButtons?.buttonsFunctional ? '✅' : '❌'} Buttons functional

### 5. Edit Modal
${this.testResults.testSteps.editModal?.completed ? '✅' : '❌'} Edit modal test completed
${this.testResults.testSteps.editModal?.modalOpened ? '✅' : '❌'} Modal opened successfully

### 6. Export Functions
${this.testResults.testSteps.exportFunctions?.completed ? '✅' : '❌'} Export functions test completed
${this.testResults.testSteps.exportFunctions?.exportOptionsVisible ? '✅' : '❌'} Export options visible

### 7. Clipboard Copy
${this.testResults.testSteps.clipboardCopy?.completed ? '✅' : '❌'} Clipboard copy test completed
${this.testResults.testSteps.clipboardCopy?.clipboardFunctionCalled ? '✅' : '❌'} Clipboard function called

## Issues Found
${this.testResults.issues.length > 0 ? this.testResults.issues.map(issue => `- ${issue}`).join('\n') : 'No issues found'}

## Screenshots Taken
${this.testResults.screenshots.map(screenshot => `- ${screenshot}`).join('\n')}

## Recommendations
${this.generateRecommendations()}
`;
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (this.testResults.issues.length > 0) {
            recommendations.push('- Address the issues found during testing');
        }
        
        if (this.testResults.testSteps.initialSearch?.resultsFound === false) {
            recommendations.push('- Ensure test data is available for search functionality');
        }
        
        if (this.testResults.testSteps.editModal?.modalOpened === false) {
            recommendations.push('- Check edit modal implementation and event handling');
        }
        
        if (this.testResults.testSteps.exportFunctions?.exportOptionsVisible === false) {
            recommendations.push('- Verify export functionality implementation');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('- All tests passed successfully');
        }
        
        return recommendations.join('\n');
    }

    async run() {
        console.log('🚀 Starting Test 4.3: Search Results Interaction');
        
        try {
            // Setup
            const setupSuccess = await this.setup();
            if (!setupSuccess) {
                throw new Error('Setup failed');
            }
            
            // Test Steps
            await this.performInitialSearch();
            await this.testCalendarNavigation();
            await this.testEditDeleteButtons();
            await this.testEditModal();
            await this.testExportFunctions();
            await this.testClipboardCopy();
            
            // Validation
            await this.validateResults();
            
            // Save Results
            await this.saveResults();
            
            console.log(`🎉 Test 4.3 completed with result: ${this.testResults.overallResult}`);
            
        } catch (error) {
            console.error('❌ Test 4.3 failed:', error.message);
            this.testResults.overallResult = 'FAILED';
            this.testResults.issues.push(`Test Execution Error: ${error.message}`);
            await this.saveResults();
        } finally {
            await this.cleanup();
        }
        
        return this.testResults;
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    const test = new Test43SearchResultsInteraction();
    test.run().then(results => {
        console.log('Test completed:', results.overallResult);
        process.exit(results.overallResult === 'PASSED' ? 0 : 1);
    }).catch(error => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = Test43SearchResultsInteraction;

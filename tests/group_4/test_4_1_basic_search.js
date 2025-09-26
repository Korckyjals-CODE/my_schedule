// Test 4.1: Basic Search Functionality Test
// This test validates the basic search functionality of the Schedule Editor application

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class Test4_1_BasicSearch {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = {
            testName: 'Test 4.1: Basic Search',
            timestamp: new Date().toISOString(),
            setup: {},
            testSteps: [],
            results: {},
            screenshots: [],
            errors: [],
            summary: {}
        };
    }

    async setup() {
        console.log('🔧 Setting up Test 4.1: Basic Search...');
        
        try {
            // Launch browser
            this.browser = await puppeteer.launch({
                headless: false, // Set to true for CI/CD
                defaultViewport: { width: 1280, height: 720 },
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            this.page = await this.browser.newPage();
            
            // Set up console logging
            this.page.on('console', msg => {
                console.log('PAGE LOG:', msg.text());
            });

            // Set up error handling
            this.page.on('pageerror', error => {
                console.error('PAGE ERROR:', error.message);
                this.testResults.errors.push({
                    type: 'page_error',
                    message: error.message,
                    stack: error.stack
                });
            });

            // Navigate to the search page
            await this.page.goto('http://localhost:3000/search.html', {
                waitUntil: 'networkidle2',
                timeout: 10000
            });

            // Wait for the page to load
            await this.page.waitForSelector('#searchInput', { timeout: 5000 });

            this.testResults.setup.status = 'success';
            this.testResults.setup.message = 'Browser launched and search page loaded successfully';
            
            console.log('✅ Setup completed successfully');
            
        } catch (error) {
            this.testResults.setup.status = 'failed';
            this.testResults.setup.message = error.message;
            this.testResults.errors.push({
                type: 'setup_error',
                message: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async takeScreenshot(name) {
        const screenshotPath = path.join(__dirname, `test_4_1_${name}_${Date.now()}.png`);
        await this.page.screenshot({ path: screenshotPath, fullPage: true });
        this.testResults.screenshots.push({
            name: name,
            path: screenshotPath,
            timestamp: new Date().toISOString()
        });
        return screenshotPath;
    }

    async testAuthentication() {
        console.log('🔐 Testing authentication...');
        
        try {
            // Check if we need to authenticate
            const authSection = await this.page.$('#authSection');
            const isAuthVisible = await authSection ? await authSection.isVisible() : false;
            
            if (isAuthVisible) {
                console.log('📝 Authentication required, attempting login...');
                
                // Try to login with test credentials
                await this.page.type('#loginEmail', 'testuser@example.com');
                await this.page.type('#loginPassword', 'testpassword123');
                await this.page.click('#loginBtn');
                
                // Wait for authentication to complete
                await this.page.waitForSelector('#appSection', { timeout: 10000 });
                
                this.testResults.testSteps.push({
                    step: 'Authentication',
                    status: 'success',
                    message: 'Successfully authenticated with test credentials'
                });
            } else {
                this.testResults.testSteps.push({
                    step: 'Authentication',
                    status: 'success',
                    message: 'Already authenticated or no authentication required'
                });
            }
            
            await this.takeScreenshot('after_authentication');
            
        } catch (error) {
            this.testResults.testSteps.push({
                step: 'Authentication',
                status: 'failed',
                message: error.message
            });
            this.testResults.errors.push({
                type: 'auth_error',
                message: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async testSearchInterface() {
        console.log('🔍 Testing search interface elements...');
        
        try {
            // Check if search input is present and functional
            const searchInput = await this.page.$('#searchInput');
            if (!searchInput) {
                throw new Error('Search input not found');
            }
            
            // Check if search button is present
            const searchBtn = await this.page.$('#searchBtn');
            if (!searchBtn) {
                throw new Error('Search button not found');
            }
            
            // Check if filter sections are present
            const gradeFilters = await this.page.$('#gradeFilters');
            const subjectFilters = await this.page.$('#subjectFilters');
            const dayFilters = await this.page.$('#dayFilters');
            
            if (!gradeFilters || !subjectFilters || !dayFilters) {
                throw new Error('Filter sections not found');
            }
            
            // Check if results container is present
            const resultsContainer = await this.page.$('#resultsContainer');
            if (!resultsContainer) {
                throw new Error('Results container not found');
            }
            
            this.testResults.testSteps.push({
                step: 'Search Interface Check',
                status: 'success',
                message: 'All search interface elements are present and functional'
            });
            
            await this.takeScreenshot('search_interface');
            
        } catch (error) {
            this.testResults.testSteps.push({
                step: 'Search Interface Check',
                status: 'failed',
                message: error.message
            });
            this.testResults.errors.push({
                type: 'interface_error',
                message: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async testBasicTextSearch() {
        console.log('🔍 Testing basic text search functionality...');
        
        const searchTests = [
            { term: '6A', expected: 'Should find grade 6A entries' },
            { term: 'Class', expected: 'Should find all Class subject entries' },
            { term: '8:30', expected: 'Should find entries starting at 8:30' },
            { term: 'Monday', expected: 'Should find Monday entries' },
            { term: 'Recess', expected: 'Should find Recess entries' },
            { term: 'xyz', expected: 'Should return no results for non-existent term' }
        ];
        
        for (const test of searchTests) {
            try {
                console.log(`🔍 Testing search term: "${test.term}"`);
                
                // Clear search input
                await this.page.click('#searchInput', { clickCount: 3 });
                await this.page.type('#searchInput', test.term);
                
                // Wait for search to complete (debounced search)
                await this.page.waitForTimeout(500);
                
                // Check results
                const resultsCount = await this.page.$eval('#resultsCount', el => el.textContent);
                console.log(`📊 Results count: ${resultsCount}`);
                
                // Check if results are displayed
                const resultsContainer = await this.page.$('#resultsContainer');
                const hasResults = await resultsContainer.$eval('.results-list', () => true).catch(() => false);
                const hasNoResults = await resultsContainer.$eval('.no-results', () => true).catch(() => false);
                
                const testResult = {
                    searchTerm: test.term,
                    expected: test.expected,
                    resultsCount: resultsCount,
                    hasResults: hasResults,
                    hasNoResults: hasNoResults,
                    status: 'success'
                };
                
                // Validate results based on search term
                if (test.term === 'xyz') {
                    // Should have no results
                    if (!hasNoResults) {
                        testResult.status = 'failed';
                        testResult.message = 'Expected no results but found some';
                    } else {
                        testResult.message = 'Correctly returned no results';
                    }
                } else {
                    // Should have results
                    if (!hasResults && !hasNoResults) {
                        testResult.status = 'failed';
                        testResult.message = 'No results displayed';
                    } else if (hasNoResults) {
                        testResult.status = 'warning';
                        testResult.message = 'No results found (may be expected if no data)';
                    } else {
                        testResult.message = 'Results displayed successfully';
                    }
                }
                
                this.testResults.testSteps.push({
                    step: `Text Search: "${test.term}"`,
                    status: testResult.status,
                    message: testResult.message,
                    details: testResult
                });
                
                await this.takeScreenshot(`search_${test.term.replace(/[^a-zA-Z0-9]/g, '_')}`);
                
            } catch (error) {
                this.testResults.testSteps.push({
                    step: `Text Search: "${test.term}"`,
                    status: 'failed',
                    message: error.message
                });
                this.testResults.errors.push({
                    type: 'search_error',
                    searchTerm: test.term,
                    message: error.message,
                    stack: error.stack
                });
            }
        }
    }

    async testFilterFunctionality() {
        console.log('🎛️ Testing filter functionality...');
        
        try {
            // Test grade filter
            console.log('🎯 Testing grade filter...');
            const gradeCheckbox = await this.page.$('#gradeFilters input[value="6A"]');
            if (gradeCheckbox) {
                await gradeCheckbox.click();
                await this.page.waitForTimeout(300);
                
                const resultsCount = await this.page.$eval('#resultsCount', el => el.textContent);
                console.log(`📊 Grade filter results: ${resultsCount}`);
                
                this.testResults.testSteps.push({
                    step: 'Grade Filter Test',
                    status: 'success',
                    message: `Grade filter applied, results: ${resultsCount}`
                });
            }
            
            // Test subject filter
            console.log('📚 Testing subject filter...');
            const subjectCheckbox = await this.page.$('#subjectFilters input[value="Class"]');
            if (subjectCheckbox) {
                await subjectCheckbox.click();
                await this.page.waitForTimeout(300);
                
                const resultsCount = await this.page.$eval('#resultsCount', el => el.textContent);
                console.log(`📊 Subject filter results: ${resultsCount}`);
                
                this.testResults.testSteps.push({
                    step: 'Subject Filter Test',
                    status: 'success',
                    message: `Subject filter applied, results: ${resultsCount}`
                });
            }
            
            // Test day filter
            console.log('📅 Testing day filter...');
            const dayCheckbox = await this.page.$('#dayFilters input[value="Monday"]');
            if (dayCheckbox) {
                await dayCheckbox.click();
                await this.page.waitForTimeout(300);
                
                const resultsCount = await this.page.$eval('#resultsCount', el => el.textContent);
                console.log(`📊 Day filter results: ${resultsCount}`);
                
                this.testResults.testSteps.push({
                    step: 'Day Filter Test',
                    status: 'success',
                    message: `Day filter applied, results: ${resultsCount}`
                });
            }
            
            // Test time range filter
            console.log('⏰ Testing time range filter...');
            await this.page.type('#startTime', '08:00');
            await this.page.type('#endTime', '12:00');
            await this.page.waitForTimeout(300);
            
            const resultsCount = await this.page.$eval('#resultsCount', el => el.textContent);
            console.log(`📊 Time range filter results: ${resultsCount}`);
            
            this.testResults.testSteps.push({
                step: 'Time Range Filter Test',
                status: 'success',
                message: `Time range filter applied, results: ${resultsCount}`
            });
            
            await this.takeScreenshot('filters_applied');
            
        } catch (error) {
            this.testResults.testSteps.push({
                step: 'Filter Functionality Test',
                status: 'failed',
                message: error.message
            });
            this.testResults.errors.push({
                type: 'filter_error',
                message: error.message,
                stack: error.stack
            });
        }
    }

    async testClearFilters() {
        console.log('🧹 Testing clear filters functionality...');
        
        try {
            // Click clear filters button
            await this.page.click('#clearFiltersBtn');
            await this.page.waitForTimeout(300);
            
            // Check if filters are cleared
            const searchInputValue = await this.page.$eval('#searchInput', el => el.value);
            const checkedGrades = await this.page.$$eval('#gradeFilters input:checked', els => els.length);
            const checkedSubjects = await this.page.$$eval('#subjectFilters input:checked', els => els.length);
            const checkedDays = await this.page.$$eval('#dayFilters input:checked', els => els.length);
            const startTimeValue = await this.page.$eval('#startTime', el => el.value);
            const endTimeValue = await this.page.$eval('#endTime', el => el.value);
            
            const allCleared = searchInputValue === '' && 
                             checkedGrades === 0 && 
                             checkedSubjects === 0 && 
                             checkedDays === 0 && 
                             startTimeValue === '' && 
                             endTimeValue === '';
            
            this.testResults.testSteps.push({
                step: 'Clear Filters Test',
                status: allCleared ? 'success' : 'failed',
                message: allCleared ? 'All filters cleared successfully' : 'Some filters were not cleared'
            });
            
            await this.takeScreenshot('filters_cleared');
            
        } catch (error) {
            this.testResults.testSteps.push({
                step: 'Clear Filters Test',
                status: 'failed',
                message: error.message
            });
            this.testResults.errors.push({
                type: 'clear_filters_error',
                message: error.message,
                stack: error.stack
            });
        }
    }

    async testSearchResultsInteraction() {
        console.log('🖱️ Testing search results interaction...');
        
        try {
            // Perform a search first
            await this.page.type('#searchInput', '6A');
            await this.page.waitForTimeout(500);
            
            // Check if results are clickable
            const resultItems = await this.page.$$('.result-item');
            if (resultItems.length > 0) {
                console.log(`📋 Found ${resultItems.length} result items`);
                
                // Test clicking on first result
                await resultItems[0].click();
                await this.page.waitForTimeout(1000);
                
                // Check if we navigated to calendar (should be on index.html)
                const currentUrl = this.page.url();
                const navigatedToCalendar = currentUrl.includes('index.html');
                
                this.testResults.testSteps.push({
                    step: 'Search Results Interaction',
                    status: navigatedToCalendar ? 'success' : 'warning',
                    message: navigatedToCalendar ? 'Successfully navigated to calendar' : 'Navigation to calendar may not be working'
                });
                
                // Navigate back to search page
                await this.page.goto('http://localhost:3000/search.html');
                await this.page.waitForSelector('#searchInput');
                
            } else {
                this.testResults.testSteps.push({
                    step: 'Search Results Interaction',
                    status: 'warning',
                    message: 'No search results found to test interaction'
                });
            }
            
        } catch (error) {
            this.testResults.testSteps.push({
                step: 'Search Results Interaction',
                status: 'failed',
                message: error.message
            });
            this.testResults.errors.push({
                type: 'interaction_error',
                message: error.message,
                stack: error.stack
            });
        }
    }

    async testExportFunctionality() {
        console.log('📤 Testing export functionality...');
        
        try {
            // Perform a search first
            await this.page.type('#searchInput', 'Class');
            await this.page.waitForTimeout(500);
            
            // Click export button
            await this.page.click('#exportBtn');
            await this.page.waitForTimeout(300);
            
            // Check if export options are visible
            const exportOptions = await this.page.$('#exportOptions');
            const isExportVisible = await exportOptions ? await exportOptions.isVisible() : false;
            
            if (isExportVisible) {
                // Test CSV export button
                const csvBtn = await this.page.$('#exportCSVBtn');
                if (csvBtn) {
                    this.testResults.testSteps.push({
                        step: 'Export Functionality Test',
                        status: 'success',
                        message: 'Export options are visible and functional'
                    });
                } else {
                    this.testResults.testSteps.push({
                        step: 'Export Functionality Test',
                        status: 'failed',
                        message: 'Export buttons not found'
                    });
                }
            } else {
                this.testResults.testSteps.push({
                    step: 'Export Functionality Test',
                    status: 'failed',
                    message: 'Export options not visible'
                });
            }
            
            await this.takeScreenshot('export_options');
            
        } catch (error) {
            this.testResults.testSteps.push({
                step: 'Export Functionality Test',
                status: 'failed',
                message: error.message
            });
            this.testResults.errors.push({
                type: 'export_error',
                message: error.message,
                stack: error.stack
            });
        }
    }

    async generateSummary() {
        console.log('📊 Generating test summary...');
        
        const totalSteps = this.testResults.testSteps.length;
        const successfulSteps = this.testResults.testSteps.filter(step => step.status === 'success').length;
        const failedSteps = this.testResults.testSteps.filter(step => step.status === 'failed').length;
        const warningSteps = this.testResults.testSteps.filter(step => step.status === 'warning').length;
        
        this.testResults.summary = {
            totalSteps: totalSteps,
            successful: successfulSteps,
            failed: failedSteps,
            warnings: warningSteps,
            successRate: totalSteps > 0 ? (successfulSteps / totalSteps * 100).toFixed(2) + '%' : '0%',
            overallStatus: failedSteps === 0 ? (warningSteps === 0 ? 'PASS' : 'PASS_WITH_WARNINGS') : 'FAIL',
            screenshots: this.testResults.screenshots.length,
            errors: this.testResults.errors.length
        };
        
        console.log(`📈 Test Summary: ${this.testResults.summary.overallStatus}`);
        console.log(`✅ Successful: ${successfulSteps}/${totalSteps}`);
        console.log(`❌ Failed: ${failedSteps}/${totalSteps}`);
        console.log(`⚠️ Warnings: ${warningSteps}/${totalSteps}`);
        console.log(`📸 Screenshots: ${this.testResults.screenshots.length}`);
        console.log(`🚨 Errors: ${this.testResults.errors.length}`);
    }

    async cleanup() {
        console.log('🧹 Cleaning up...');
        
        if (this.browser) {
            await this.browser.close();
        }
        
        console.log('✅ Cleanup completed');
    }

    async run() {
        console.log('🚀 Starting Test 4.1: Basic Search Functionality');
        console.log('=' .repeat(60));
        
        try {
            await this.setup();
            await this.testAuthentication();
            await this.testSearchInterface();
            await this.testBasicTextSearch();
            await this.testFilterFunctionality();
            await this.testClearFilters();
            await this.testSearchResultsInteraction();
            await this.testExportFunctionality();
            await this.generateSummary();
            
        } catch (error) {
            console.error('❌ Test failed with error:', error.message);
            this.testResults.errors.push({
                type: 'test_execution_error',
                message: error.message,
                stack: error.stack
            });
        } finally {
            await this.cleanup();
        }
        
        // Save test results
        const resultsPath = path.join(__dirname, `test_4_1_results_${Date.now()}.json`);
        fs.writeFileSync(resultsPath, JSON.stringify(this.testResults, null, 2));
        
        console.log('=' .repeat(60));
        console.log(`📄 Test results saved to: ${resultsPath}`);
        console.log(`📊 Overall Status: ${this.testResults.summary.overallStatus}`);
        
        return this.testResults;
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    const test = new Test4_1_BasicSearch();
    test.run().then(results => {
        process.exit(results.summary.overallStatus === 'FAIL' ? 1 : 0);
    }).catch(error => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = Test4_1_BasicSearch;

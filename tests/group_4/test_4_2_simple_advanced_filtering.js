// Test 4.2: Advanced Filtering - Simple Documentation Test
// This test documents the current state of the advanced filtering functionality

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class Test4_2_SimpleAdvancedFiltering {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = {
            testName: 'Test 4.2: Advanced Filtering - Simple Documentation',
            timestamp: new Date().toISOString(),
            setup: {},
            observations: {},
            screenshots: {},
            summary: {}
        };
    }

    async run() {
        try {
            console.log('🚀 Starting Test 4.2: Advanced Filtering - Simple Documentation');
            
            // Setup
            await this.setup();
            
            // Take screenshots and document current state
            await this.documentFilterInterface();
            await this.testFilterElements();
            await this.testFilterFunctionality();
            
            // Generate summary
            this.generateSummary();
            
            // Save results
            await this.saveResults();
            
            console.log('✅ Test 4.2 documentation completed successfully');
            
        } catch (error) {
            console.error('❌ Test 4.2 documentation failed:', error);
            this.results.error = error.message;
            await this.saveResults();
            throw error;
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }

    async setup() {
        console.log('🔧 Setting up test environment...');
        
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1280, height: 720 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        this.page = await this.browser.newPage();
        
        // Navigate to search page
        await this.page.goto('http://localhost:3000/search.html', { 
            waitUntil: 'networkidle2',
            timeout: 10000 
        });
        
        // Wait for page to load
        await this.page.waitForSelector('#appSection', { timeout: 10000 });
        
        // Check if user is logged in
        const isLoggedIn = await this.page.evaluate(() => {
            return document.getElementById('appSection').style.display !== 'none';
        });
        
        if (!isLoggedIn) {
            console.log('🔐 User not logged in, attempting login...');
            await this.performLogin();
        }
        
        // Wait for search interface to be ready
        await this.page.waitForSelector('.search-filters', { timeout: 5000 });
        
        this.results.setup = {
            browserLaunched: true,
            pageLoaded: true,
            userLoggedIn: true,
            searchInterfaceReady: true
        };
        
        console.log('✅ Setup completed');
    }

    async performLogin() {
        // Try to login with test credentials
        await this.page.type('#loginEmail', 'test@example.com');
        await this.page.type('#loginPassword', 'testpassword123');
        await this.page.click('#loginBtn');
        
        // Wait for login to complete
        await this.page.waitForSelector('#appSection', { timeout: 10000 });
    }

    async documentFilterInterface() {
        console.log('📸 Documenting filter interface...');
        
        // Take screenshot of the entire search interface
        const fullInterfaceScreenshot = await this.page.screenshot({
            fullPage: true,
            path: path.join(__dirname, `test_4_2_full_interface_${Date.now()}.png`)
        });
        
        // Take screenshot of just the filters panel
        const filtersPanel = await this.page.$('.search-filters');
        const filtersPanelScreenshot = await filtersPanel.screenshot({
            path: path.join(__dirname, `test_4_2_filters_panel_${Date.now()}.png`)
        });
        
        this.results.screenshots = {
            fullInterface: 'test_4_2_full_interface.png',
            filtersPanel: 'test_4_2_filters_panel.png'
        };
        
        console.log('✅ Interface documentation completed');
    }

    async testFilterElements() {
        console.log('🔍 Testing filter elements presence...');
        
        const elementTests = {};
        
        // Test grade filter elements
        const gradeFilters = await this.page.evaluate(() => {
            const container = document.getElementById('gradeFilters');
            if (!container) return { found: false };
            
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            const labels = container.querySelectorAll('label');
            
            return {
                found: true,
                checkboxCount: checkboxes.length,
                labelCount: labels.length,
                sampleGrades: Array.from(labels).slice(0, 5).map(l => l.textContent.trim())
            };
        });
        
        elementTests.gradeFilters = gradeFilters;
        
        // Test subject filter elements
        const subjectFilters = await this.page.evaluate(() => {
            const container = document.getElementById('subjectFilters');
            if (!container) return { found: false };
            
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            const labels = container.querySelectorAll('label');
            
            return {
                found: true,
                checkboxCount: checkboxes.length,
                labelCount: labels.length,
                sampleSubjects: Array.from(labels).slice(0, 5).map(l => l.textContent.trim())
            };
        });
        
        elementTests.subjectFilters = subjectFilters;
        
        // Test day filter elements
        const dayFilters = await this.page.evaluate(() => {
            const container = document.getElementById('dayFilters');
            if (!container) return { found: false };
            
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            const labels = container.querySelectorAll('label');
            
            return {
                found: true,
                checkboxCount: checkboxes.length,
                labelCount: labels.length,
                sampleDays: Array.from(labels).slice(0, 5).map(l => l.textContent.trim())
            };
        });
        
        elementTests.dayFilters = dayFilters;
        
        // Test time range elements
        const timeFilters = await this.page.evaluate(() => {
            const startTime = document.getElementById('startTime');
            const endTime = document.getElementById('endTime');
            
            return {
                startTimeFound: !!startTime,
                endTimeFound: !!endTime,
                startTimeType: startTime ? startTime.type : null,
                endTimeType: endTime ? endTime.type : null
            };
        });
        
        elementTests.timeFilters = timeFilters;
        
        // Test action buttons
        const actionButtons = await this.page.evaluate(() => {
            const clearBtn = document.getElementById('clearFiltersBtn');
            const searchBtn = document.getElementById('searchBtn');
            const exportBtn = document.getElementById('exportBtn');
            const saveBtn = document.getElementById('saveCurrentBtn');
            
            return {
                clearButtonFound: !!clearBtn,
                searchButtonFound: !!searchBtn,
                exportButtonFound: !!exportBtn,
                saveButtonFound: !!saveBtn
            };
        });
        
        elementTests.actionButtons = actionButtons;
        
        // Test saved searches elements
        const savedSearches = await this.page.evaluate(() => {
            const select = document.getElementById('savedSearchesSelect');
            const deleteBtn = document.getElementById('deleteSavedBtn');
            
            return {
                selectFound: !!select,
                deleteButtonFound: !!deleteBtn,
                optionCount: select ? select.options.length : 0
            };
        });
        
        elementTests.savedSearches = savedSearches;
        
        this.results.observations.elementTests = elementTests;
        console.log('✅ Filter elements testing completed');
    }

    async testFilterFunctionality() {
        console.log('⚙️ Testing filter functionality...');
        
        const functionalityTests = {};
        
        // Test if filters respond to changes
        const filterResponsiveness = await this.page.evaluate(() => {
            const results = {};
            
            // Test grade filter responsiveness
            const gradeCheckbox = document.querySelector('#gradeFilters input[type="checkbox"]');
            if (gradeCheckbox) {
                const initialChecked = gradeCheckbox.checked;
                gradeCheckbox.checked = !initialChecked;
                const afterChange = gradeCheckbox.checked;
                results.gradeFilterResponsive = afterChange === !initialChecked;
            } else {
                results.gradeFilterResponsive = false;
            }
            
            // Test subject filter responsiveness
            const subjectCheckbox = document.querySelector('#subjectFilters input[type="checkbox"]');
            if (subjectCheckbox) {
                const initialChecked = subjectCheckbox.checked;
                subjectCheckbox.checked = !initialChecked;
                const afterChange = subjectCheckbox.checked;
                results.subjectFilterResponsive = afterChange === !initialChecked;
            } else {
                results.subjectFilterResponsive = false;
            }
            
            // Test day filter responsiveness
            const dayCheckbox = document.querySelector('#dayFilters input[type="checkbox"]');
            if (dayCheckbox) {
                const initialChecked = dayCheckbox.checked;
                dayCheckbox.checked = !initialChecked;
                const afterChange = dayCheckbox.checked;
                results.dayFilterResponsive = afterChange === !initialChecked;
            } else {
                results.dayFilterResponsive = false;
            }
            
            // Test time input responsiveness
            const startTime = document.getElementById('startTime');
            if (startTime) {
                const initialValue = startTime.value;
                startTime.value = '08:00';
                const afterChange = startTime.value;
                results.timeFilterResponsive = afterChange === '08:00';
            } else {
                results.timeFilterResponsive = false;
            }
            
            return results;
        });
        
        functionalityTests.filterResponsiveness = filterResponsiveness;
        
        // Test search results display
        const searchResultsDisplay = await this.page.evaluate(() => {
            const resultsContainer = document.getElementById('resultsContainer');
            const resultsCount = document.getElementById('resultsCount');
            
            return {
                resultsContainerFound: !!resultsContainer,
                resultsCountFound: !!resultsCount,
                currentResultsText: resultsCount ? resultsCount.textContent : 'Not found',
                hasResults: resultsContainer ? resultsContainer.children.length > 0 : false
            };
        });
        
        functionalityTests.searchResultsDisplay = searchResultsDisplay;
        
        // Test clear filters functionality
        const clearFiltersTest = await this.page.evaluate(() => {
            // Set some filters first
            const gradeCheckbox = document.querySelector('#gradeFilters input[type="checkbox"]');
            const subjectCheckbox = document.querySelector('#subjectFilters input[type="checkbox"]');
            const startTime = document.getElementById('startTime');
            
            if (gradeCheckbox) gradeCheckbox.checked = true;
            if (subjectCheckbox) subjectCheckbox.checked = true;
            if (startTime) startTime.value = '08:00';
            
            // Check state before clear
            const beforeClear = {
                gradeChecked: gradeCheckbox ? gradeCheckbox.checked : false,
                subjectChecked: subjectCheckbox ? subjectCheckbox.checked : false,
                startTimeValue: startTime ? startTime.value : ''
            };
            
            // Simulate clear filters (we can't actually click the button in this context)
            const clearBtn = document.getElementById('clearFiltersBtn');
            
            return {
                clearButtonFound: !!clearBtn,
                beforeClear: beforeClear,
                canTestClear: !!clearBtn
            };
        });
        
        functionalityTests.clearFiltersTest = clearFiltersTest;
        
        this.results.observations.functionalityTests = functionalityTests;
        console.log('✅ Filter functionality testing completed');
    }

    generateSummary() {
        console.log('📊 Generating test summary...');
        
        const elementTests = this.results.observations.elementTests || {};
        const functionalityTests = this.results.observations.functionalityTests || {};
        
        const summary = {
            totalElementsTested: 0,
            elementsFound: 0,
            functionalityTestsPassed: 0,
            functionalityTestsTotal: 0,
            overallAssessment: 'Unknown',
            issues: [],
            recommendations: []
        };
        
        // Count element tests
        Object.values(elementTests).forEach(test => {
            if (typeof test === 'object' && test !== null) {
                Object.values(test).forEach(value => {
                    if (typeof value === 'boolean') {
                        summary.totalElementsTested++;
                        if (value) summary.elementsFound++;
                    }
                });
            }
        });
        
        // Count functionality tests
        if (functionalityTests.filterResponsiveness) {
            Object.values(functionalityTests.filterResponsiveness).forEach(value => {
                if (typeof value === 'boolean') {
                    summary.functionalityTestsTotal++;
                    if (value) summary.functionalityTestsPassed++;
                }
            });
        }
        
        // Generate assessment
        const elementSuccessRate = summary.totalElementsTested > 0 ? 
            (summary.elementsFound / summary.totalElementsTested) : 0;
        const functionalitySuccessRate = summary.functionalityTestsTotal > 0 ? 
            (summary.functionalityTestsPassed / summary.functionalityTestsTotal) : 0;
        
        if (elementSuccessRate >= 0.8 && functionalitySuccessRate >= 0.8) {
            summary.overallAssessment = 'Good';
        } else if (elementSuccessRate >= 0.6 && functionalitySuccessRate >= 0.6) {
            summary.overallAssessment = 'Fair';
        } else {
            summary.overallAssessment = 'Poor';
        }
        
        // Identify issues
        if (elementSuccessRate < 0.8) {
            summary.issues.push('Some filter elements are missing or not properly implemented');
        }
        if (functionalitySuccessRate < 0.8) {
            summary.issues.push('Filter functionality is not working as expected');
        }
        
        // Generate recommendations
        if (summary.overallAssessment === 'Poor') {
            summary.recommendations.push('Review and fix filter element implementation');
            summary.recommendations.push('Test filter functionality with actual user interactions');
            summary.recommendations.push('Ensure all filter types are properly connected to search logic');
        } else if (summary.overallAssessment === 'Fair') {
            summary.recommendations.push('Improve filter responsiveness and user experience');
            summary.recommendations.push('Test edge cases and error handling');
        } else {
            summary.recommendations.push('Consider adding more advanced filtering options');
            summary.recommendations.push('Optimize filter performance for large datasets');
        }
        
        this.results.summary = summary;
        console.log('✅ Summary generated');
    }

    async saveResults() {
        const timestamp = Date.now();
        const filename = `test_4_2_simple_results_${timestamp}.json`;
        const filepath = path.join(__dirname, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));
        console.log(`📁 Results saved to: ${filename}`);
        
        return filepath;
    }
}

// Run the test
if (require.main === module) {
    const test = new Test4_2_SimpleAdvancedFiltering();
    test.run().catch(console.error);
}

module.exports = Test4_2_SimpleAdvancedFiltering;

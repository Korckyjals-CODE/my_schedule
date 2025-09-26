// Test 4.2: Advanced Filtering
// This test validates the advanced filtering functionality in the search interface

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class Test4_2_AdvancedFiltering {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = {
            testName: 'Test 4.2: Advanced Filtering',
            timestamp: new Date().toISOString(),
            setup: {},
            testSteps: {},
            validation: {},
            summary: {}
        };
    }

    async run() {
        try {
            console.log('🚀 Starting Test 4.2: Advanced Filtering');
            
            // Setup
            await this.setup();
            
            // Test Steps
            await this.testGradeFilters();
            await this.testSubjectFilters();
            await this.testDayFilters();
            await this.testTimeRangeFilters();
            await this.testCombinedFilters();
            await this.testClearFilters();
            await this.testSavedSearches();
            
            // Validation
            await this.validateResults();
            
            // Generate summary
            this.generateSummary();
            
            // Save results
            await this.saveResults();
            
            console.log('✅ Test 4.2 completed successfully');
            
        } catch (error) {
            console.error('❌ Test 4.2 failed:', error);
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

    async testGradeFilters() {
        console.log('📋 Testing grade filter checkboxes...');
        
        const gradeFilterResults = {};
        
        // Test individual grade selection
        const testGrades = ['6A', '11A', 'PKA'];
        
        for (const grade of testGrades) {
            console.log(`  Testing grade: ${grade}`);
            
            // Clear all filters first
            await this.page.click('#clearFiltersBtn');
            await this.page.waitForTimeout(500);
            
            // Select the grade
            const gradeCheckbox = await this.page.$(`#grade-${grade}`);
            if (gradeCheckbox) {
                await gradeCheckbox.click();
                await this.page.waitForTimeout(500);
                
                // Check if results are filtered
                const resultsCount = await this.page.evaluate(() => {
                    const countEl = document.getElementById('resultsCount');
                    return countEl ? countEl.textContent : 'No results';
                });
                
                gradeFilterResults[grade] = {
                    checkboxFound: true,
                    resultsCount: resultsCount,
                    success: resultsCount.includes('result')
                };
                
                console.log(`    Grade ${grade}: ${resultsCount}`);
            } else {
                gradeFilterResults[grade] = {
                    checkboxFound: false,
                    error: 'Checkbox not found'
                };
                console.log(`    Grade ${grade}: Checkbox not found`);
            }
        }
        
        // Test multiple grade selection
        console.log('  Testing multiple grade selection...');
        await this.page.click('#clearFiltersBtn');
        await this.page.waitForTimeout(500);
        
        // Select multiple grades
        await this.page.click('#grade-6A');
        await this.page.click('#grade-11A');
        await this.page.waitForTimeout(500);
        
        const multiGradeResults = await this.page.evaluate(() => {
            const countEl = document.getElementById('resultsCount');
            return countEl ? countEl.textContent : 'No results';
        });
        
        gradeFilterResults.multipleGrades = {
            resultsCount: multiGradeResults,
            success: multiGradeResults.includes('result')
        };
        
        this.results.testSteps.gradeFilters = gradeFilterResults;
        console.log('✅ Grade filters test completed');
    }

    async testSubjectFilters() {
        console.log('📚 Testing subject filter checkboxes...');
        
        const subjectFilterResults = {};
        
        // Test individual subject selection
        const testSubjects = ['Class', 'Recess', 'Lunch'];
        
        for (const subject of testSubjects) {
            console.log(`  Testing subject: ${subject}`);
            
            // Clear all filters first
            await this.page.click('#clearFiltersBtn');
            await this.page.waitForTimeout(500);
            
            // Select the subject
            const subjectCheckbox = await this.page.$(`#subject-${subject}`);
            if (subjectCheckbox) {
                await subjectCheckbox.click();
                await this.page.waitForTimeout(500);
                
                // Check if results are filtered
                const resultsCount = await this.page.evaluate(() => {
                    const countEl = document.getElementById('resultsCount');
                    return countEl ? countEl.textContent : 'No results';
                });
                
                subjectFilterResults[subject] = {
                    checkboxFound: true,
                    resultsCount: resultsCount,
                    success: resultsCount.includes('result')
                };
                
                console.log(`    Subject ${subject}: ${resultsCount}`);
            } else {
                subjectFilterResults[subject] = {
                    checkboxFound: false,
                    error: 'Checkbox not found'
                };
                console.log(`    Subject ${subject}: Checkbox not found`);
            }
        }
        
        // Test multiple subject selection
        console.log('  Testing multiple subject selection...');
        await this.page.click('#clearFiltersBtn');
        await this.page.waitForTimeout(500);
        
        // Select multiple subjects
        await this.page.click('#subject-Class');
        await this.page.click('#subject-Recess');
        await this.page.waitForTimeout(500);
        
        const multiSubjectResults = await this.page.evaluate(() => {
            const countEl = document.getElementById('resultsCount');
            return countEl ? countEl.textContent : 'No results';
        });
        
        subjectFilterResults.multipleSubjects = {
            resultsCount: multiSubjectResults,
            success: multiSubjectResults.includes('result')
        };
        
        this.results.testSteps.subjectFilters = subjectFilterResults;
        console.log('✅ Subject filters test completed');
    }

    async testDayFilters() {
        console.log('📅 Testing day filter checkboxes...');
        
        const dayFilterResults = {};
        
        // Test individual day selection
        const testDays = ['Monday', 'Tuesday', 'Wednesday'];
        
        for (const day of testDays) {
            console.log(`  Testing day: ${day}`);
            
            // Clear all filters first
            await this.page.click('#clearFiltersBtn');
            await this.page.waitForTimeout(500);
            
            // Select the day
            const dayCheckbox = await this.page.$(`#day-${day}`);
            if (dayCheckbox) {
                await dayCheckbox.click();
                await this.page.waitForTimeout(500);
                
                // Check if results are filtered
                const resultsCount = await this.page.evaluate(() => {
                    const countEl = document.getElementById('resultsCount');
                    return countEl ? countEl.textContent : 'No results';
                });
                
                dayFilterResults[day] = {
                    checkboxFound: true,
                    resultsCount: resultsCount,
                    success: resultsCount.includes('result')
                };
                
                console.log(`    Day ${day}: ${resultsCount}`);
            } else {
                dayFilterResults[day] = {
                    checkboxFound: false,
                    error: 'Checkbox not found'
                };
                console.log(`    Day ${day}: Checkbox not found`);
            }
        }
        
        // Test multiple day selection
        console.log('  Testing multiple day selection...');
        await this.page.click('#clearFiltersBtn');
        await this.page.waitForTimeout(500);
        
        // Select multiple days
        await this.page.click('#day-Monday');
        await this.page.click('#day-Tuesday');
        await this.page.waitForTimeout(500);
        
        const multiDayResults = await this.page.evaluate(() => {
            const countEl = document.getElementById('resultsCount');
            return countEl ? countEl.textContent : 'No results';
        });
        
        dayFilterResults.multipleDays = {
            resultsCount: multiDayResults,
            success: multiDayResults.includes('result')
        };
        
        this.results.testSteps.dayFilters = dayFilterResults;
        console.log('✅ Day filters test completed');
    }

    async testTimeRangeFilters() {
        console.log('⏰ Testing time range filters...');
        
        const timeFilterResults = {};
        
        // Test start time filter
        console.log('  Testing start time filter...');
        await this.page.click('#clearFiltersBtn');
        await this.page.waitForTimeout(500);
        
        await this.page.type('#startTime', '08:00');
        await this.page.waitForTimeout(500);
        
        const startTimeResults = await this.page.evaluate(() => {
            const countEl = document.getElementById('resultsCount');
            return countEl ? countEl.textContent : 'No results';
        });
        
        timeFilterResults.startTime = {
            resultsCount: startTimeResults,
            success: startTimeResults.includes('result')
        };
        
        // Test end time filter
        console.log('  Testing end time filter...');
        await this.page.click('#clearFiltersBtn');
        await this.page.waitForTimeout(500);
        
        await this.page.type('#endTime', '12:00');
        await this.page.waitForTimeout(500);
        
        const endTimeResults = await this.page.evaluate(() => {
            const countEl = document.getElementById('resultsCount');
            return countEl ? countEl.textContent : 'No results';
        });
        
        timeFilterResults.endTime = {
            resultsCount: endTimeResults,
            success: endTimeResults.includes('result')
        };
        
        // Test combined time range
        console.log('  Testing combined time range...');
        await this.page.click('#clearFiltersBtn');
        await this.page.waitForTimeout(500);
        
        await this.page.type('#startTime', '08:00');
        await this.page.type('#endTime', '12:00');
        await this.page.waitForTimeout(500);
        
        const timeRangeResults = await this.page.evaluate(() => {
            const countEl = document.getElementById('resultsCount');
            return countEl ? countEl.textContent : 'No results';
        });
        
        timeFilterResults.timeRange = {
            resultsCount: timeRangeResults,
            success: timeRangeResults.includes('result')
        };
        
        this.results.testSteps.timeFilters = timeFilterResults;
        console.log('✅ Time range filters test completed');
    }

    async testCombinedFilters() {
        console.log('🔗 Testing combined filters...');
        
        const combinedFilterResults = {};
        
        // Test grade + subject combination
        console.log('  Testing grade + subject combination...');
        await this.page.click('#clearFiltersBtn');
        await this.page.waitForTimeout(500);
        
        await this.page.click('#grade-6A');
        await this.page.click('#subject-Class');
        await this.page.waitForTimeout(500);
        
        const gradeSubjectResults = await this.page.evaluate(() => {
            const countEl = document.getElementById('resultsCount');
            return countEl ? countEl.textContent : 'No results';
        });
        
        combinedFilterResults.gradeSubject = {
            resultsCount: gradeSubjectResults,
            success: gradeSubjectResults.includes('result')
        };
        
        // Test grade + day + time combination
        console.log('  Testing grade + day + time combination...');
        await this.page.click('#clearFiltersBtn');
        await this.page.waitForTimeout(500);
        
        await this.page.click('#grade-11A');
        await this.page.click('#day-Monday');
        await this.page.type('#startTime', '08:00');
        await this.page.type('#endTime', '12:00');
        await this.page.waitForTimeout(500);
        
        const complexResults = await this.page.evaluate(() => {
            const countEl = document.getElementById('resultsCount');
            return countEl ? countEl.textContent : 'No results';
        });
        
        combinedFilterResults.complex = {
            resultsCount: complexResults,
            success: complexResults.includes('result')
        };
        
        this.results.testSteps.combinedFilters = combinedFilterResults;
        console.log('✅ Combined filters test completed');
    }

    async testClearFilters() {
        console.log('🧹 Testing clear filters functionality...');
        
        const clearFilterResults = {};
        
        // Set up some filters first
        await this.page.click('#grade-6A');
        await this.page.click('#subject-Class');
        await this.page.click('#day-Monday');
        await this.page.type('#startTime', '08:00');
        await this.page.waitForTimeout(500);
        
        // Check that filters are set
        const beforeClear = await this.page.evaluate(() => {
            const gradeChecked = document.querySelector('#grade-6A').checked;
            const subjectChecked = document.querySelector('#subject-Class').checked;
            const dayChecked = document.querySelector('#day-Monday').checked;
            const startTimeValue = document.querySelector('#startTime').value;
            
            return {
                gradeChecked,
                subjectChecked,
                dayChecked,
                startTimeValue
            };
        });
        
        // Clear all filters
        await this.page.click('#clearFiltersBtn');
        await this.page.waitForTimeout(500);
        
        // Check that filters are cleared
        const afterClear = await this.page.evaluate(() => {
            const gradeChecked = document.querySelector('#grade-6A').checked;
            const subjectChecked = document.querySelector('#subject-Class').checked;
            const dayChecked = document.querySelector('#day-Monday').checked;
            const startTimeValue = document.querySelector('#startTime').value;
            const endTimeValue = document.querySelector('#endTime').value;
            const searchInputValue = document.querySelector('#searchInput').value;
            
            return {
                gradeChecked,
                subjectChecked,
                dayChecked,
                startTimeValue,
                endTimeValue,
                searchInputValue
            };
        });
        
        clearFilterResults.beforeClear = beforeClear;
        clearFilterResults.afterClear = afterClear;
        clearFilterResults.success = !afterClear.gradeChecked && 
                                   !afterClear.subjectChecked && 
                                   !afterClear.dayChecked && 
                                   afterClear.startTimeValue === '' && 
                                   afterClear.endTimeValue === '' && 
                                   afterClear.searchInputValue === '';
        
        this.results.testSteps.clearFilters = clearFilterResults;
        console.log('✅ Clear filters test completed');
    }

    async testSavedSearches() {
        console.log('💾 Testing saved searches functionality...');
        
        const savedSearchResults = {};
        
        // Set up a search to save
        await this.page.click('#clearFiltersBtn');
        await this.page.waitForTimeout(500);
        
        await this.page.click('#grade-6A');
        await this.page.click('#subject-Class');
        await this.page.waitForTimeout(500);
        
        // Try to save the current search
        console.log('  Testing save current search...');
        await this.page.click('#saveCurrentBtn');
        await this.page.waitForTimeout(1000);
        
        // Check if save dialog appeared (this would be a browser alert)
        // We'll check if the saved searches dropdown has been updated
        const savedSearchesCount = await this.page.evaluate(() => {
            const select = document.getElementById('savedSearchesSelect');
            return select ? select.options.length - 1 : 0; // -1 for the default option
        });
        
        savedSearchResults.saveCurrent = {
            savedSearchesCount: savedSearchesCount,
            success: savedSearchesCount > 0
        };
        
        // Test loading a saved search
        if (savedSearchesCount > 0) {
            console.log('  Testing load saved search...');
            
            // Select the first saved search
            await this.page.select('#savedSearchesSelect', '0');
            await this.page.waitForTimeout(500);
            
            // Check if filters were applied
            const filtersApplied = await this.page.evaluate(() => {
                const gradeChecked = document.querySelector('#grade-6A').checked;
                const subjectChecked = document.querySelector('#subject-Class').checked;
                
                return {
                    gradeChecked,
                    subjectChecked
                };
            });
            
            savedSearchResults.loadSaved = {
                filtersApplied: filtersApplied,
                success: filtersApplied.gradeChecked && filtersApplied.subjectChecked
            };
        } else {
            savedSearchResults.loadSaved = {
                success: false,
                error: 'No saved searches available to test'
            };
        }
        
        this.results.testSteps.savedSearches = savedSearchResults;
        console.log('✅ Saved searches test completed');
    }

    async validateResults() {
        console.log('🔍 Validating test results...');
        
        const validation = {
            gradeFiltersWorking: false,
            subjectFiltersWorking: false,
            dayFiltersWorking: false,
            timeFiltersWorking: false,
            combinedFiltersWorking: false,
            clearFiltersWorking: false,
            savedSearchesWorking: false
        };
        
        // Validate grade filters
        if (this.results.testSteps.gradeFilters) {
            const gradeResults = this.results.testSteps.gradeFilters;
            validation.gradeFiltersWorking = Object.values(gradeResults).some(result => 
                result.success === true
            );
        }
        
        // Validate subject filters
        if (this.results.testSteps.subjectFilters) {
            const subjectResults = this.results.testSteps.subjectFilters;
            validation.subjectFiltersWorking = Object.values(subjectResults).some(result => 
                result.success === true
            );
        }
        
        // Validate day filters
        if (this.results.testSteps.dayFilters) {
            const dayResults = this.results.testSteps.dayFilters;
            validation.dayFiltersWorking = Object.values(dayResults).some(result => 
                result.success === true
            );
        }
        
        // Validate time filters
        if (this.results.testSteps.timeFilters) {
            const timeResults = this.results.testSteps.timeFilters;
            validation.timeFiltersWorking = Object.values(timeResults).some(result => 
                result.success === true
            );
        }
        
        // Validate combined filters
        if (this.results.testSteps.combinedFilters) {
            const combinedResults = this.results.testSteps.combinedFilters;
            validation.combinedFiltersWorking = Object.values(combinedResults).some(result => 
                result.success === true
            );
        }
        
        // Validate clear filters
        if (this.results.testSteps.clearFilters) {
            validation.clearFiltersWorking = this.results.testSteps.clearFilters.success;
        }
        
        // Validate saved searches
        if (this.results.testSteps.savedSearches) {
            const savedResults = this.results.testSteps.savedSearches;
            validation.savedSearchesWorking = Object.values(savedResults).some(result => 
                result.success === true
            );
        }
        
        this.results.validation = validation;
        console.log('✅ Validation completed');
    }

    generateSummary() {
        console.log('📊 Generating test summary...');
        
        const validation = this.results.validation;
        const totalTests = Object.keys(validation).length;
        const passedTests = Object.values(validation).filter(result => result === true).length;
        const failedTests = totalTests - passedTests;
        
        const summary = {
            totalTests: totalTests,
            passedTests: passedTests,
            failedTests: failedTests,
            successRate: `${Math.round((passedTests / totalTests) * 100)}%`,
            overallSuccess: failedTests === 0,
            issues: []
        };
        
        // Identify specific issues
        if (!validation.gradeFiltersWorking) {
            summary.issues.push('Grade filter checkboxes not working properly');
        }
        if (!validation.subjectFiltersWorking) {
            summary.issues.push('Subject filter checkboxes not working properly');
        }
        if (!validation.dayFiltersWorking) {
            summary.issues.push('Day filter checkboxes not working properly');
        }
        if (!validation.timeFiltersWorking) {
            summary.issues.push('Time range filtering not working properly');
        }
        if (!validation.combinedFiltersWorking) {
            summary.issues.push('Combined filters not working properly');
        }
        if (!validation.clearFiltersWorking) {
            summary.issues.push('Clear filters functionality not working properly');
        }
        if (!validation.savedSearchesWorking) {
            summary.issues.push('Saved searches functionality not working properly');
        }
        
        this.results.summary = summary;
        console.log('✅ Summary generated');
    }

    async saveResults() {
        const timestamp = Date.now();
        const filename = `test_4_2_results_${timestamp}.json`;
        const filepath = path.join(__dirname, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));
        console.log(`📁 Results saved to: ${filename}`);
        
        return filepath;
    }
}

// Run the test
if (require.main === module) {
    const test = new Test4_2_AdvancedFiltering();
    test.run().catch(console.error);
}

module.exports = Test4_2_AdvancedFiltering;

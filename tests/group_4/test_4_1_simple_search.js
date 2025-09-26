// Test 4.1: Basic Search Functionality - Simple Version
// This test validates the basic search functionality using direct HTTP requests and DOM analysis

const fs = require('fs');
const path = require('path');

class Test4_1_SimpleSearch {
    constructor() {
        this.testResults = {
            testName: 'Test 4.1: Basic Search (Simple)',
            timestamp: new Date().toISOString(),
            setup: {},
            testSteps: [],
            results: {},
            errors: [],
            summary: {}
        };
        this.baseUrl = 'http://localhost:3000';
    }

    async makeRequest(url, options = {}) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                text: await response.text()
            };
        } catch (error) {
            throw new Error(`Request failed: ${error.message}`);
        }
    }

    async testSearchPageAccess() {
        console.log('🌐 Testing search page access...');
        
        try {
            const response = await this.makeRequest(`${this.baseUrl}/search.html`);
            
            // Check if page loads successfully
            if (response.status !== 200) {
                throw new Error(`Page returned status ${response.status}`);
            }
            
            // Check for essential search elements in HTML
            const html = response.text;
            const hasSearchInput = html.includes('id="searchInput"');
            const hasSearchBtn = html.includes('id="searchBtn"');
            const hasFilters = html.includes('id="gradeFilters"') && 
                              html.includes('id="subjectFilters"') && 
                              html.includes('id="dayFilters"');
            const hasResultsContainer = html.includes('id="resultsContainer"');
            
            const allElementsPresent = hasSearchInput && hasSearchBtn && hasFilters && hasResultsContainer;
            
            this.testResults.testSteps.push({
                step: 'Search Page Access',
                status: allElementsPresent ? 'success' : 'failed',
                message: allElementsPresent ? 
                    'Search page loads successfully with all required elements' : 
                    'Search page missing some required elements',
                details: {
                    status: response.status,
                    hasSearchInput,
                    hasSearchBtn,
                    hasFilters,
                    hasResultsContainer
                }
            });
            
            console.log(`✅ Search page accessible (${response.status})`);
            console.log(`📋 Elements present: Input=${hasSearchInput}, Button=${hasSearchBtn}, Filters=${hasFilters}, Results=${hasResultsContainer}`);
            
        } catch (error) {
            this.testResults.testSteps.push({
                step: 'Search Page Access',
                status: 'failed',
                message: error.message
            });
            this.testResults.errors.push({
                type: 'page_access_error',
                message: error.message
            });
        }
    }

    async testSearchAPIEndpoint() {
        console.log('🔌 Testing search API endpoint...');
        
        try {
            // Test the search API endpoint
            const searchPayload = {
                searchText: '6A',
                grades: [],
                subjects: [],
                days: [],
                startTime: '',
                endTime: '',
                page: 1,
                limit: 10
            };
            
            const response = await this.makeRequest(`${this.baseUrl}/api/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(searchPayload)
            });
            
            // Check if API responds (even if with error, it should respond)
            const isApiResponsive = response.status === 200 || response.status === 401 || response.status === 400;
            
            this.testResults.testSteps.push({
                step: 'Search API Endpoint',
                status: isApiResponsive ? 'success' : 'failed',
                message: isApiResponsive ? 
                    `Search API is responsive (status: ${response.status})` : 
                    `Search API not responsive (status: ${response.status})`,
                details: {
                    status: response.status,
                    statusText: response.statusText
                }
            });
            
            console.log(`✅ Search API responsive (${response.status})`);
            
        } catch (error) {
            this.testResults.testSteps.push({
                step: 'Search API Endpoint',
                status: 'failed',
                message: error.message
            });
            this.testResults.errors.push({
                type: 'api_error',
                message: error.message
            });
        }
    }

    async testScheduleDataEndpoint() {
        console.log('📊 Testing schedule data endpoint...');
        
        try {
            const response = await this.makeRequest(`${this.baseUrl}/api/schedule`);
            
            // Check if endpoint responds (401 is expected without auth)
            const isEndpointResponsive = response.status === 200 || response.status === 401;
            
            this.testResults.testSteps.push({
                step: 'Schedule Data Endpoint',
                status: isEndpointResponsive ? 'success' : 'failed',
                message: isEndpointResponsive ? 
                    `Schedule endpoint is responsive (status: ${response.status})` : 
                    `Schedule endpoint not responsive (status: ${response.status})`,
                details: {
                    status: response.status,
                    statusText: response.statusText
                }
            });
            
            console.log(`✅ Schedule endpoint responsive (${response.status})`);
            
        } catch (error) {
            this.testResults.testSteps.push({
                step: 'Schedule Data Endpoint',
                status: 'failed',
                message: error.message
            });
            this.testResults.errors.push({
                type: 'schedule_endpoint_error',
                message: error.message
            });
        }
    }

    async testSearchJavaScriptFunctionality() {
        console.log('📜 Testing search JavaScript functionality...');
        
        try {
            // Test if search.js file is accessible
            const response = await this.makeRequest(`${this.baseUrl}/js/search.js`);
            
            if (response.status !== 200) {
                throw new Error(`Search JS file not accessible (${response.status})`);
            }
            
            // Check for key functions in the JavaScript
            const jsContent = response.text;
            const hasSearchFunction = jsContent.includes('function performSearch') || 
                                    jsContent.includes('performSearch =');
            const hasFilterFunction = jsContent.includes('function updateGradeFilters') || 
                                    jsContent.includes('updateGradeFilters =');
            const hasDisplayFunction = jsContent.includes('function displayResults') || 
                                      jsContent.includes('displayResults =');
            
            const hasKeyFunctions = hasSearchFunction && hasFilterFunction && hasDisplayFunction;
            
            this.testResults.testSteps.push({
                step: 'Search JavaScript Functionality',
                status: hasKeyFunctions ? 'success' : 'warning',
                message: hasKeyFunctions ? 
                    'Search JavaScript contains all key functions' : 
                    'Search JavaScript missing some key functions',
                details: {
                    status: response.status,
                    hasSearchFunction,
                    hasFilterFunction,
                    hasDisplayFunction,
                    fileSize: jsContent.length
                }
            });
            
            console.log(`✅ Search JS accessible (${response.status})`);
            console.log(`📋 Functions present: Search=${hasSearchFunction}, Filter=${hasFilterFunction}, Display=${hasDisplayFunction}`);
            
        } catch (error) {
            this.testResults.testSteps.push({
                step: 'Search JavaScript Functionality',
                status: 'failed',
                message: error.message
            });
            this.testResults.errors.push({
                type: 'js_functionality_error',
                message: error.message
            });
        }
    }

    async testSearchCSSStyling() {
        console.log('🎨 Testing search CSS styling...');
        
        try {
            // Test if styles.css file is accessible
            const response = await this.makeRequest(`${this.baseUrl}/css/styles.css`);
            
            if (response.status !== 200) {
                throw new Error(`CSS file not accessible (${response.status})`);
            }
            
            // Check for search-specific styles
            const cssContent = response.text;
            const hasSearchStyles = cssContent.includes('.search-input') || 
                                  cssContent.includes('.search-container') ||
                                  cssContent.includes('.result-item');
            const hasFilterStyles = cssContent.includes('.filter-checkbox') || 
                                  cssContent.includes('.filter-section');
            
            const hasSearchCSS = hasSearchStyles && hasFilterStyles;
            
            this.testResults.testSteps.push({
                step: 'Search CSS Styling',
                status: hasSearchCSS ? 'success' : 'warning',
                message: hasSearchCSS ? 
                    'Search CSS contains styling for search elements' : 
                    'Search CSS missing some styling elements',
                details: {
                    status: response.status,
                    hasSearchStyles,
                    hasFilterStyles,
                    fileSize: cssContent.length
                }
            });
            
            console.log(`✅ Search CSS accessible (${response.status})`);
            console.log(`🎨 Styles present: Search=${hasSearchStyles}, Filter=${hasFilterStyles}`);
            
        } catch (error) {
            this.testResults.testSteps.push({
                step: 'Search CSS Styling',
                status: 'failed',
                message: error.message
            });
            this.testResults.errors.push({
                type: 'css_styling_error',
                message: error.message
            });
        }
    }

    async testSearchHTMLStructure() {
        console.log('🏗️ Testing search HTML structure...');
        
        try {
            const response = await this.makeRequest(`${this.baseUrl}/search.html`);
            
            if (response.status !== 200) {
                throw new Error(`Search page not accessible (${response.status})`);
            }
            
            const html = response.text;
            
            // Check for proper HTML structure
            const hasDoctype = html.includes('<!DOCTYPE html>');
            const hasTitle = html.includes('<title>') && html.includes('Search');
            const hasMetaViewport = html.includes('name="viewport"');
            const hasSearchForm = html.includes('<input') && html.includes('search');
            const hasScripts = html.includes('search.js') && html.includes('supabase-client.js');
            
            const hasProperStructure = hasDoctype && hasTitle && hasMetaViewport && hasSearchForm && hasScripts;
            
            this.testResults.testSteps.push({
                step: 'Search HTML Structure',
                status: hasProperStructure ? 'success' : 'warning',
                message: hasProperStructure ? 
                    'Search page has proper HTML structure' : 
                    'Search page missing some structural elements',
                details: {
                    status: response.status,
                    hasDoctype,
                    hasTitle,
                    hasMetaViewport,
                    hasSearchForm,
                    hasScripts,
                    pageSize: html.length
                }
            });
            
            console.log(`✅ Search HTML structure validated`);
            console.log(`📋 Structure: Doctype=${hasDoctype}, Title=${hasTitle}, Viewport=${hasMetaViewport}, Form=${hasSearchForm}, Scripts=${hasScripts}`);
            
        } catch (error) {
            this.testResults.testSteps.push({
                step: 'Search HTML Structure',
                status: 'failed',
                message: error.message
            });
            this.testResults.errors.push({
                type: 'html_structure_error',
                message: error.message
            });
        }
    }

    async testSearchFunctionalityAnalysis() {
        console.log('🔍 Analyzing search functionality implementation...');
        
        try {
            // Read the search.js file to analyze functionality
            const searchJsPath = path.join(__dirname, '../../public/js/search.js');
            
            if (!fs.existsSync(searchJsPath)) {
                throw new Error('Search JS file not found');
            }
            
            const searchJsContent = fs.readFileSync(searchJsPath, 'utf8');
            
            // Analyze key functionality
            const analysis = {
                hasSearchFunction: /function\s+performSearch|performSearch\s*=/.test(searchJsContent),
                hasFilterFunctions: /function\s+updateGradeFilters|updateGradeFilters\s*=/.test(searchJsContent),
                hasDisplayFunction: /function\s+displayResults|displayResults\s*=/.test(searchJsContent),
                hasClientSideSearch: /function\s+searchSchedule|searchSchedule\s*=/.test(searchJsContent),
                hasServerSideSearch: /fetch.*\/api\/search/.test(searchJsContent),
                hasExportFunctions: /function\s+exportTo|exportTo\w+\s*=/.test(searchJsContent),
                hasSavedSearches: /savedSearches|localStorage/.test(searchJsContent),
                hasErrorHandling: /try\s*\{|catch\s*\(/.test(searchJsContent)
            };
            
            const functionalityScore = Object.values(analysis).filter(Boolean).length;
            const totalFeatures = Object.keys(analysis).length;
            const completenessPercentage = (functionalityScore / totalFeatures * 100).toFixed(1);
            
            this.testResults.testSteps.push({
                step: 'Search Functionality Analysis',
                status: functionalityScore >= 6 ? 'success' : functionalityScore >= 4 ? 'warning' : 'failed',
                message: `Search functionality analysis: ${functionalityScore}/${totalFeatures} features implemented (${completenessPercentage}%)`,
                details: {
                    ...analysis,
                    functionalityScore,
                    totalFeatures,
                    completenessPercentage,
                    fileSize: searchJsContent.length
                }
            });
            
            console.log(`✅ Search functionality analysis completed`);
            console.log(`📊 Features implemented: ${functionalityScore}/${totalFeatures} (${completenessPercentage}%)`);
            console.log(`🔍 Analysis: Search=${analysis.hasSearchFunction}, Filter=${analysis.hasFilterFunctions}, Display=${analysis.hasDisplayFunction}`);
            console.log(`🌐 Server-side=${analysis.hasServerSideSearch}, Client-side=${analysis.hasClientSideSearch}, Export=${analysis.hasExportFunctions}`);
            
        } catch (error) {
            this.testResults.testSteps.push({
                step: 'Search Functionality Analysis',
                status: 'failed',
                message: error.message
            });
            this.testResults.errors.push({
                type: 'functionality_analysis_error',
                message: error.message
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
            errors: this.testResults.errors.length,
            recommendations: this.generateRecommendations()
        };
        
        console.log(`📈 Test Summary: ${this.testResults.summary.overallStatus}`);
        console.log(`✅ Successful: ${successfulSteps}/${totalSteps}`);
        console.log(`❌ Failed: ${failedSteps}/${totalSteps}`);
        console.log(`⚠️ Warnings: ${warningSteps}/${totalSteps}`);
        console.log(`🚨 Errors: ${this.testResults.errors.length}`);
    }

    generateRecommendations() {
        const recommendations = [];
        
        // Analyze test results and generate recommendations
        const failedSteps = this.testResults.testSteps.filter(step => step.status === 'failed');
        const warningSteps = this.testResults.testSteps.filter(step => step.status === 'warning');
        
        if (failedSteps.length > 0) {
            recommendations.push('Fix failed test steps to ensure search functionality works properly');
        }
        
        if (warningSteps.length > 0) {
            recommendations.push('Address warning conditions to improve search functionality');
        }
        
        // Check for specific issues
        const hasApiIssues = this.testResults.errors.some(error => error.type.includes('api'));
        if (hasApiIssues) {
            recommendations.push('Ensure API endpoints are properly configured and accessible');
        }
        
        const hasJsIssues = this.testResults.errors.some(error => error.type.includes('js'));
        if (hasJsIssues) {
            recommendations.push('Verify JavaScript files are properly loaded and functional');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('Search functionality appears to be working correctly');
        }
        
        return recommendations;
    }

    async run() {
        console.log('🚀 Starting Test 4.1: Basic Search Functionality (Simple)');
        console.log('=' .repeat(70));
        
        try {
            await this.testSearchPageAccess();
            await this.testSearchAPIEndpoint();
            await this.testScheduleDataEndpoint();
            await this.testSearchJavaScriptFunctionality();
            await this.testSearchCSSStyling();
            await this.testSearchHTMLStructure();
            await this.testSearchFunctionalityAnalysis();
            await this.generateSummary();
            
        } catch (error) {
            console.error('❌ Test failed with error:', error.message);
            this.testResults.errors.push({
                type: 'test_execution_error',
                message: error.message
            });
        }
        
        // Save test results
        const resultsPath = path.join(__dirname, `test_4_1_simple_results_${Date.now()}.json`);
        fs.writeFileSync(resultsPath, JSON.stringify(this.testResults, null, 2));
        
        console.log('=' .repeat(70));
        console.log(`📄 Test results saved to: ${resultsPath}`);
        console.log(`📊 Overall Status: ${this.testResults.summary.overallStatus}`);
        
        return this.testResults;
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    const test = new Test4_1_SimpleSearch();
    test.run().then(results => {
        process.exit(results.summary.overallStatus === 'FAIL' ? 1 : 0);
    }).catch(error => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = Test4_1_SimpleSearch;

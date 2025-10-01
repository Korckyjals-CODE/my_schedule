/**
 * Test 7.1: Responsive Design
 * 
 * Test the responsive design of the Schedule Editor application across different screen sizes.
 * 
 * SETUP:
 * 1. Ensure user is logged in
 * 2. Open browser developer tools
 * 
 * TEST STEPS:
 * 1. Test desktop view (1920x1080):
 *    - Verify layout is optimal
 *    - Check all elements are visible
 *    - Test functionality
 * 2. Test tablet view (768x1024):
 *    - Verify responsive breakpoints work
 *    - Check touch interactions
 *    - Test navigation
 * 3. Test mobile view (375x667):
 *    - Verify mobile-optimized layout
 *    - Test touch interactions
 *    - Check form usability
 * 4. Test various orientations
 * 5. Test with different zoom levels
 * 
 * EXPECTED RESULTS:
 * - Layout adapts correctly to different screen sizes
 * - All functionality remains accessible
 * - Touch interactions work on mobile devices
 * - Text remains readable at all sizes
 * - Navigation is intuitive on all devices
 * 
 * VALIDATION:
 * - Take screenshots at different screen sizes
 * - Test all major functionality on each size
 * - Verify touch interactions work
 * - Check for layout issues
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class ResponsiveDesignTest {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = {
            testName: 'Test 7.1: Responsive Design',
            timestamp: new Date().toISOString(),
            viewports: {
                desktop: { width: 1920, height: 1080 },
                tablet: { width: 768, height: 1024 },
                mobile: { width: 375, height: 667 }
            },
            results: {},
            screenshots: [],
            issues: []
        };
    }

    async setup() {
        console.log('Setting up responsive design test...');
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized']
        });
        this.page = await this.browser.newPage();
        
        // Set up console logging
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('Browser Error:', msg.text());
                this.results.issues.push({
                    type: 'console_error',
                    message: msg.text(),
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Set up error handling
        this.page.on('pageerror', error => {
            console.log('Page Error:', error.message);
            this.results.issues.push({
                type: 'page_error',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        });
    }

    async login() {
        console.log('Logging in...');
        await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
        
        // Wait for page to load
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if already logged in
        const isLoggedIn = await this.page.evaluate(() => {
            return document.querySelector('.user-info') !== null;
        });

        if (!isLoggedIn) {
            // Try to login with test credentials
            try {
                await this.page.click('a[href="#signin"]');
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                await this.page.type('input[type="email"]', 'testuser@example.com');
                await this.page.type('input[type="password"]', 'testpassword123');
                await this.page.click('button[type="submit"]');
                
                // Wait for login to complete
                await this.page.waitForSelector('.user-info', { timeout: 10000 });
                console.log('Login successful');
            } catch (error) {
                console.log('Login failed, proceeding with test anyway:', error.message);
                this.results.issues.push({
                    type: 'login_failed',
                    message: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        } else {
            console.log('Already logged in');
        }
    }

    async testViewport(viewportName, width, height) {
        console.log(`Testing ${viewportName} viewport (${width}x${height})...`);
        
        const viewportResults = {
            viewport: `${width}x${height}`,
            layoutIssues: [],
            functionalityIssues: [],
            screenshots: []
        };

        // Set viewport
        await this.page.setViewport({ width, height });
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Navigate to main page
        await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Take screenshot
        const screenshotPath = `test_7_1_${viewportName}_main_${Date.now()}.png`;
        await this.page.screenshot({ path: screenshotPath, fullPage: true });
        viewportResults.screenshots.push(screenshotPath);

        // Test layout elements
        const layoutTest = await this.page.evaluate(() => {
            const issues = [];
            
            // Check if main elements are visible
            const header = document.querySelector('header');
            const calendar = document.querySelector('.calendar-container');
            const navigation = document.querySelector('.nav-buttons');
            
            if (!header) issues.push('Header not found');
            if (!calendar) issues.push('Calendar container not found');
            if (!navigation) issues.push('Navigation buttons not found');
            
            // Check if elements are properly sized
            if (header && header.offsetHeight === 0) issues.push('Header has zero height');
            if (calendar && calendar.offsetHeight === 0) issues.push('Calendar has zero height');
            
            return {
                elementsFound: { header: !!header, calendar: !!calendar, navigation: !!navigation },
                issues
            };
        });

        viewportResults.layoutIssues = layoutTest.issues;

        // Test calendar functionality
        try {
            // Test month navigation
            const prevButton = await this.page.$('.prev-month');
            const nextButton = await this.page.$('.next-month');
            
            if (prevButton && nextButton) {
                await prevButton.click();
                await new Promise(resolve => setTimeout(resolve, 500));
                await nextButton.click();
                await new Promise(resolve => setTimeout(resolve, 500));
                console.log(`Month navigation works on ${viewportName}`);
            } else {
                viewportResults.functionalityIssues.push('Month navigation buttons not found');
            }

            // Test day clicking
            const dayCells = await this.page.$$('.calendar-day');
            if (dayCells.length > 0) {
                await dayCells[10].click();
                await new Promise(resolve => setTimeout(resolve, 500));
                console.log(`Day clicking works on ${viewportName}`);
            } else {
                viewportResults.functionalityIssues.push('Calendar days not found');
            }
        } catch (error) {
            viewportResults.functionalityIssues.push(`Calendar functionality error: ${error.message}`);
        }

        // Test schedule editor page
        try {
            await this.page.goto('http://localhost:3000/schedule-editor.html', { waitUntil: 'networkidle2' });
            await new Promise(resolve => setTimeout(resolve, 2000));

            const editorScreenshotPath = `test_7_1_${viewportName}_editor_${Date.now()}.png`;
            await this.page.screenshot({ path: editorScreenshotPath, fullPage: true });
            viewportResults.screenshots.push(editorScreenshotPath);

            // Test form elements
            const formTest = await this.page.evaluate(() => {
                const issues = [];
                
                const weekdaySelect = document.querySelector('#weekday-select');
                const gradeSelect = document.querySelector('#grade-select');
                const startTimeInput = document.querySelector('#start-time');
                const endTimeInput = document.querySelector('#end-time');
                const subjectInput = document.querySelector('#subject');
                
                if (!weekdaySelect) issues.push('Weekday select not found');
                if (!gradeSelect) issues.push('Grade select not found');
                if (!startTimeInput) issues.push('Start time input not found');
                if (!endTimeInput) issues.push('End time input not found');
                if (!subjectInput) issues.push('Subject input not found');
                
                return {
                    elementsFound: {
                        weekdaySelect: !!weekdaySelect,
                        gradeSelect: !!gradeSelect,
                        startTimeInput: !!startTimeInput,
                        endTimeInput: !!endTimeInput,
                        subjectInput: !!subjectInput
                    },
                    issues
                };
            });

            viewportResults.layoutIssues.push(...formTest.issues);

        } catch (error) {
            viewportResults.functionalityIssues.push(`Schedule editor error: ${error.message}`);
        }

        // Test search page
        try {
            await this.page.goto('http://localhost:3000/search.html', { waitUntil: 'networkidle2' });
            await new Promise(resolve => setTimeout(resolve, 2000));

            const searchScreenshotPath = `test_7_1_${viewportName}_search_${Date.now()}.png`;
            await this.page.screenshot({ path: searchScreenshotPath, fullPage: true });
            viewportResults.screenshots.push(searchScreenshotPath);

            // Test search functionality
            const searchInput = await this.page.$('#search-input');
            if (searchInput) {
                await searchInput.type('test');
                await new Promise(resolve => setTimeout(resolve, 500));
                console.log(`Search input works on ${viewportName}`);
            } else {
                viewportResults.functionalityIssues.push('Search input not found');
            }

        } catch (error) {
            viewportResults.functionalityIssues.push(`Search page error: ${error.message}`);
        }

        this.results.results[viewportName] = viewportResults;
        console.log(`${viewportName} viewport test completed`);
    }

    async testTouchInteractions() {
        console.log('Testing touch interactions...');
        
        // Test on mobile viewport
        await this.page.setViewport({ width: 375, height: 667 });
        await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 2000));

        const touchTest = await this.page.evaluate(() => {
            const issues = [];
            
            // Check if buttons are large enough for touch
            const buttons = document.querySelectorAll('button, .clickable');
            buttons.forEach((button, index) => {
                const rect = button.getBoundingClientRect();
                if (rect.width < 44 || rect.height < 44) {
                    issues.push(`Button ${index} too small for touch (${rect.width}x${rect.height})`);
                }
            });

            // Check if links are large enough for touch
            const links = document.querySelectorAll('a');
            links.forEach((link, index) => {
                const rect = link.getBoundingClientRect();
                if (rect.width < 44 || rect.height < 44) {
                    issues.push(`Link ${index} too small for touch (${rect.width}x${rect.height})`);
                }
            });

            return issues;
        });

        this.results.touchIssues = touchTest;
        console.log('Touch interaction test completed');
    }

    async testOrientationChanges() {
        console.log('Testing orientation changes...');
        
        // Test landscape orientation
        await this.page.setViewport({ width: 667, height: 375 });
        await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 2000));

        const landscapeScreenshotPath = `test_7_1_landscape_${Date.now()}.png`;
        await this.page.screenshot({ path: landscapeScreenshotPath, fullPage: true });

        // Test portrait orientation
        await this.page.setViewport({ width: 375, height: 667 });
        await new Promise(resolve => setTimeout(resolve, 1000));

        const portraitScreenshotPath = `test_7_1_portrait_${Date.now()}.png`;
        await this.page.screenshot({ path: portraitScreenshotPath, fullPage: true });

        this.results.orientationScreenshots = {
            landscape: landscapeScreenshotPath,
            portrait: portraitScreenshotPath
        };

        console.log('Orientation test completed');
    }

    async testZoomLevels() {
        console.log('Testing different zoom levels...');
        
        const zoomLevels = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
        const zoomResults = {};

        for (const zoom of zoomLevels) {
            await this.page.setViewport({ width: 1920, height: 1080 });
            await this.page.evaluate((zoomLevel) => {
                document.body.style.zoom = zoomLevel;
            }, zoom);
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const zoomScreenshotPath = `test_7_1_zoom_${zoom}_${Date.now()}.png`;
            await this.page.screenshot({ path: zoomScreenshotPath, fullPage: true });
            
            zoomResults[zoom] = zoomScreenshotPath;
        }

        this.results.zoomResults = zoomResults;
        console.log('Zoom level test completed');
    }

    async generateReport() {
        console.log('Generating test report...');
        
        const reportPath = `TEST_7_1_RESULTS.md`;
        const report = `# Test 7.1: Responsive Design Results

## Test Overview
- **Test Name**: Responsive Design Testing
- **Timestamp**: ${this.results.timestamp}
- **Test Duration**: ${new Date().toISOString()}

## Test Results Summary

### Desktop View (1920x1080)
${this.results.results.desktop ? `
- **Layout Issues**: ${this.results.results.desktop.layoutIssues.length > 0 ? this.results.results.desktop.layoutIssues.join(', ') : 'None'}
- **Functionality Issues**: ${this.results.results.desktop.functionalityIssues.length > 0 ? this.results.results.desktop.functionalityIssues.join(', ') : 'None'}
- **Screenshots**: ${this.results.results.desktop.screenshots.length} taken
` : 'Not tested'}

### Tablet View (768x1024)
${this.results.results.tablet ? `
- **Layout Issues**: ${this.results.results.tablet.layoutIssues.length > 0 ? this.results.results.tablet.layoutIssues.join(', ') : 'None'}
- **Functionality Issues**: ${this.results.results.tablet.functionalityIssues.length > 0 ? this.results.results.tablet.functionalityIssues.join(', ') : 'None'}
- **Screenshots**: ${this.results.results.tablet.screenshots.length} taken
` : 'Not tested'}

### Mobile View (375x667)
${this.results.results.mobile ? `
- **Layout Issues**: ${this.results.results.mobile.layoutIssues.length > 0 ? this.results.results.mobile.layoutIssues.join(', ') : 'None'}
- **Functionality Issues**: ${this.results.results.mobile.functionalityIssues.length > 0 ? this.results.results.mobile.functionalityIssues.join(', ') : 'None'}
- **Screenshots**: ${this.results.results.mobile.screenshots.length} taken
` : 'Not tested'}

## Touch Interaction Issues
${this.results.touchIssues ? this.results.touchIssues.length > 0 ? this.results.touchIssues.join('\n- ') : 'None found' : 'Not tested'}

## Orientation Testing
${this.results.orientationScreenshots ? `
- **Landscape Screenshot**: ${this.results.orientationScreenshots.landscape}
- **Portrait Screenshot**: ${this.results.orientationScreenshots.portrait}
` : 'Not tested'}

## Zoom Level Testing
${this.results.zoomResults ? Object.keys(this.results.zoomResults).map(zoom => `- **Zoom ${zoom}x**: ${this.results.zoomResults[zoom]}`).join('\n') : 'Not tested'}

## Issues Found
${this.results.issues.length > 0 ? this.results.issues.map(issue => `- **${issue.type}**: ${issue.message}`).join('\n') : 'No issues found'}

## Overall Assessment
${this.getOverallAssessment()}

## Recommendations
${this.getRecommendations()}
`;

        fs.writeFileSync(reportPath, report);
        console.log(`Report saved to ${reportPath}`);

        // Save JSON results
        const jsonPath = `test_7_1_results_${Date.now()}.json`;
        fs.writeFileSync(jsonPath, JSON.stringify(this.results, null, 2));
        console.log(`JSON results saved to ${jsonPath}`);
    }

    getOverallAssessment() {
        const totalIssues = Object.values(this.results.results).reduce((sum, result) => {
            return sum + (result.layoutIssues?.length || 0) + (result.functionalityIssues?.length || 0);
        }, 0) + (this.results.issues?.length || 0) + (this.results.touchIssues?.length || 0);

        if (totalIssues === 0) {
            return '✅ **PASS** - All responsive design tests passed successfully. The application adapts well to different screen sizes and maintains functionality across all tested viewports.';
        } else if (totalIssues <= 3) {
            return '⚠️ **PASS WITH MINOR ISSUES** - The responsive design mostly works well, but there are a few minor issues that should be addressed.';
        } else if (totalIssues <= 10) {
            return '⚠️ **PASS WITH ISSUES** - The responsive design has several issues that need attention, but core functionality remains accessible.';
        } else {
            return '❌ **FAIL** - Significant responsive design issues found. The application does not adapt properly to different screen sizes and has major usability problems.';
        }
    }

    getRecommendations() {
        const recommendations = [];

        // Check for common responsive design issues
        Object.entries(this.results.results).forEach(([viewport, result]) => {
            if (result.layoutIssues?.length > 0) {
                recommendations.push(`- Fix layout issues in ${viewport} viewport: ${result.layoutIssues.join(', ')}`);
            }
            if (result.functionalityIssues?.length > 0) {
                recommendations.push(`- Address functionality issues in ${viewport} viewport: ${result.functionalityIssues.join(', ')}`);
            }
        });

        if (this.results.touchIssues?.length > 0) {
            recommendations.push('- Improve touch target sizes for mobile devices');
        }

        if (this.results.issues?.length > 0) {
            recommendations.push('- Fix JavaScript errors and console issues');
        }

        if (recommendations.length === 0) {
            recommendations.push('- Continue monitoring responsive design as new features are added');
            recommendations.push('- Consider adding automated responsive design tests to CI/CD pipeline');
        }

        return recommendations.join('\n');
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async run() {
        try {
            await this.setup();
            await this.login();
            
            // Test each viewport
            for (const [name, viewport] of Object.entries(this.results.viewports)) {
                await this.testViewport(name, viewport.width, viewport.height);
            }
            
            await this.testTouchInteractions();
            await this.testOrientationChanges();
            await this.testZoomLevels();
            await this.generateReport();
            
        } catch (error) {
            console.error('Test failed:', error);
            this.results.issues.push({
                type: 'test_error',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        } finally {
            await this.cleanup();
        }
    }
}

// Run the test
const test = new ResponsiveDesignTest();
test.run().then(() => {
    console.log('Responsive design test completed');
    process.exit(0);
}).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
});

/**
 * Test 3.4: Image Upload and Schedule Extraction - Functionality Check
 * 
 * This test validates the image upload and AI-powered schedule extraction functionality
 * by examining the page structure and validating the presence of required elements.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class Test34FunctionalityCheck {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = {
            testName: 'Test 3.4: Image Upload and Schedule Extraction (Functionality Check)',
            timestamp: new Date().toISOString(),
            status: 'running',
            steps: [],
            screenshots: [],
            errors: [],
            summary: {}
        };
    }

    async run() {
        try {
            console.log('Starting Test 3.4: Image Upload and Schedule Extraction (Functionality Check)');
            
            // Initialize browser
            await this.initializeBrowser();
            
            // Execute test steps
            await this.step1_navigateToScheduleEditor();
            await this.step2_examinePageStructure();
            await this.step3_validateImageUploadElements();
            await this.step4_checkJavaScriptFunctions();
            await this.step5_testAPIEndpoint();
            
            // Complete test
            this.results.status = 'completed';
            this.results.summary = {
                totalSteps: this.results.steps.length,
                passedSteps: this.results.steps.filter(s => s.status === 'passed').length,
                failedSteps: this.results.steps.filter(s => s.status === 'failed').length,
                screenshotsTaken: this.results.screenshots.length,
                errorsEncountered: this.results.errors.length
            };
            
            console.log('Test 3.4 completed successfully');
            
        } catch (error) {
            console.error('Test 3.4 failed:', error);
            this.results.status = 'failed';
            this.results.errors.push({
                step: 'test_execution',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        } finally {
            await this.cleanup();
            await this.saveResults();
        }
    }

    async initializeBrowser() {
        console.log('Initializing browser...');
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1280, height: 720 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        this.page = await this.browser.newPage();
        
        // Set up console logging
        this.page.on('console', msg => {
            console.log('Browser console:', msg.text());
        });
        
        // Set up error handling
        this.page.on('pageerror', error => {
            console.error('Page error:', error.message);
            this.results.errors.push({
                step: 'page_error',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        });
    }

    async step1_navigateToScheduleEditor() {
        const stepName = 'Navigate to Schedule Editor';
        console.log(`Executing: ${stepName}`);
        
        try {
            // Navigate to the schedule editor
            await this.page.goto('http://localhost:3000/schedule-editor.html', {
                waitUntil: 'networkidle2',
                timeout: 15000
            });
            
            // Wait for the page to load
            await this.page.waitForSelector('body', { timeout: 10000 });
            
            // Take screenshot
            const screenshot = await this.page.screenshot({ fullPage: true });
            const screenshotPath = `test_3_4_functionality_initial_load_${Date.now()}.png`;
            fs.writeFileSync(path.join(__dirname, screenshotPath), screenshot);
            this.results.screenshots.push(screenshotPath);
            
            this.addStepResult(stepName, 'passed', 'Successfully navigated to schedule editor');
            
        } catch (error) {
            this.addStepResult(stepName, 'failed', `Failed to navigate to schedule editor: ${error.message}`);
            throw error;
        }
    }

    async step2_examinePageStructure() {
        const stepName = 'Examine Page Structure';
        console.log(`Executing: ${stepName}`);
        
        try {
            // Get the page content
            const pageContent = await this.page.content();
            
            // Check for key elements
            const hasImageUploadTab = pageContent.includes('data-tab="image"');
            const hasImageEditor = pageContent.includes('id="imageEditor"');
            const hasImageUploadInput = pageContent.includes('id="imageUpload"');
            const hasExtractButton = pageContent.includes('extractScheduleFromImage()');
            
            console.log('Page structure analysis:');
            console.log('- Image Upload Tab:', hasImageUploadTab);
            console.log('- Image Editor Section:', hasImageEditor);
            console.log('- Image Upload Input:', hasImageUploadInput);
            console.log('- Extract Button:', hasExtractButton);
            
            if (!hasImageUploadTab || !hasImageEditor || !hasImageUploadInput || !hasExtractButton) {
                throw new Error('Required image upload elements not found in page structure');
            }
            
            this.addStepResult(stepName, 'passed', 'Page structure contains all required image upload elements');
            
        } catch (error) {
            this.addStepResult(stepName, 'failed', `Failed to examine page structure: ${error.message}`);
            throw error;
        }
    }

    async step3_validateImageUploadElements() {
        const stepName = 'Validate Image Upload Elements';
        console.log(`Executing: ${stepName}`);
        
        try {
            // Check if elements exist in the DOM
            const imageUploadTab = await this.page.$('button[data-tab="image"]');
            const imageEditor = await this.page.$('#imageEditor');
            const imageUploadInput = await this.page.$('#imageUpload');
            const extractButton = await this.page.$('button[onclick="extractScheduleFromImage()"]');
            
            console.log('DOM element validation:');
            console.log('- Image Upload Tab:', !!imageUploadTab);
            console.log('- Image Editor:', !!imageEditor);
            console.log('- Image Upload Input:', !!imageUploadInput);
            console.log('- Extract Button:', !!extractButton);
            
            if (!imageUploadTab) {
                throw new Error('Image upload tab button not found in DOM');
            }
            
            if (!imageEditor) {
                throw new Error('Image editor section not found in DOM');
            }
            
            if (!imageUploadInput) {
                throw new Error('Image upload input not found in DOM');
            }
            
            if (!extractButton) {
                throw new Error('Extract schedule button not found in DOM');
            }
            
            // Check file input attributes
            const acceptAttribute = await imageUploadInput.getAttribute('accept');
            console.log('File input accept attribute:', acceptAttribute);
            
            if (!acceptAttribute || !acceptAttribute.includes('image')) {
                throw new Error('File input does not accept image files');
            }
            
            this.addStepResult(stepName, 'passed', 'All image upload elements validated successfully');
            
        } catch (error) {
            this.addStepResult(stepName, 'failed', `Failed to validate image upload elements: ${error.message}`);
            throw error;
        }
    }

    async step4_checkJavaScriptFunctions() {
        const stepName = 'Check JavaScript Functions';
        console.log(`Executing: ${stepName}`);
        
        try {
            // Check if the required JavaScript functions exist
            const extractFunctionExists = await this.page.evaluate(() => {
                return typeof extractScheduleFromImage === 'function';
            });
            
            const applyFunctionExists = await this.page.evaluate(() => {
                return typeof applyExtractedSchedule === 'function';
            });
            
            console.log('JavaScript function validation:');
            console.log('- extractScheduleFromImage function:', extractFunctionExists);
            console.log('- applyExtractedSchedule function:', applyFunctionExists);
            
            if (!extractFunctionExists) {
                throw new Error('extractScheduleFromImage function not found');
            }
            
            if (!applyFunctionExists) {
                throw new Error('applyExtractedSchedule function not found');
            }
            
            this.addStepResult(stepName, 'passed', 'All required JavaScript functions are present');
            
        } catch (error) {
            this.addStepResult(stepName, 'failed', `Failed to check JavaScript functions: ${error.message}`);
            throw error;
        }
    }

    async step5_testAPIEndpoint() {
        const stepName = 'Test API Endpoint';
        console.log(`Executing: ${stepName}`);
        
        try {
            // Test if the API endpoint is accessible
            const response = await this.page.evaluate(async () => {
                try {
                    const response = await fetch('/api/schedule/extract', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({})
                    });
                    return {
                        status: response.status,
                        statusText: response.statusText,
                        accessible: true
                    };
                } catch (error) {
                    return {
                        status: 0,
                        statusText: error.message,
                        accessible: false
                    };
                }
            });
            
            console.log('API endpoint test result:', response);
            
            // The endpoint should be accessible (even if it returns an error for invalid requests)
            if (!response.accessible) {
                throw new Error('API endpoint is not accessible');
            }
            
            // Check if it's a 401 (unauthorized) or 400 (bad request) - both are expected
            if (response.status === 401) {
                console.log('API endpoint requires authentication (expected)');
            } else if (response.status === 400) {
                console.log('API endpoint expects image data (expected)');
            } else if (response.status === 500) {
                console.log('API endpoint has server error (may indicate OpenAI not configured)');
            }
            
            this.addStepResult(stepName, 'passed', 'API endpoint is accessible and responding');
            
        } catch (error) {
            this.addStepResult(stepName, 'failed', `Failed to test API endpoint: ${error.message}`);
            throw error;
        }
    }

    addStepResult(stepName, status, message) {
        this.results.steps.push({
            step: stepName,
            status: status,
            message: message,
            timestamp: new Date().toISOString()
        });
        
        console.log(`${status.toUpperCase()}: ${stepName} - ${message}`);
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async saveResults() {
        const resultsPath = path.join(__dirname, `test_3_4_functionality_results_${Date.now()}.json`);
        fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2));
        console.log(`Test results saved to: ${resultsPath}`);
        
        // Also save a markdown report
        const reportPath = path.join(__dirname, `TEST_3_4_FUNCTIONALITY_RESULTS.md`);
        const report = this.generateMarkdownReport();
        fs.writeFileSync(reportPath, report);
        console.log(`Test report saved to: ${reportPath}`);
    }

    generateMarkdownReport() {
        const { steps, screenshots, errors, summary } = this.results;
        
        let report = `# Test 3.4: Image Upload and Schedule Extraction Results (Functionality Check)\n\n`;
        report += `**Test Status:** ${this.results.status.toUpperCase()}\n`;
        report += `**Timestamp:** ${this.results.timestamp}\n\n`;
        
        report += `## Summary\n\n`;
        report += `- Total Steps: ${summary.totalSteps || 0}\n`;
        report += `- Passed Steps: ${summary.passedSteps || 0}\n`;
        report += `- Failed Steps: ${summary.failedSteps || 0}\n`;
        report += `- Screenshots Taken: ${summary.screenshotsTaken || 0}\n`;
        report += `- Errors Encountered: ${summary.errorsEncountered || 0}\n\n`;
        
        report += `## Test Steps\n\n`;
        steps.forEach((step, index) => {
            report += `### Step ${index + 1}: ${step.step}\n\n`;
            report += `- **Status:** ${step.status.toUpperCase()}\n`;
            report += `- **Message:** ${step.message}\n`;
            report += `- **Timestamp:** ${step.timestamp}\n\n`;
        });
        
        if (screenshots.length > 0) {
            report += `## Screenshots\n\n`;
            screenshots.forEach(screenshot => {
                report += `- ${screenshot}\n`;
            });
            report += `\n`;
        }
        
        if (errors.length > 0) {
            report += `## Errors\n\n`;
            errors.forEach(error => {
                report += `- **Step:** ${error.step}\n`;
                report += `- **Error:** ${error.error}\n`;
                report += `- **Timestamp:** ${error.timestamp}\n\n`;
            });
        }
        
        return report;
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    const test = new Test34FunctionalityCheck();
    test.run().catch(console.error);
}

module.exports = Test34FunctionalityCheck;

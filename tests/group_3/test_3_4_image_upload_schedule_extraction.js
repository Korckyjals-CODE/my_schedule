/**
 * Test 3.4: Image Upload and Schedule Extraction
 * 
 * This test validates the image upload and AI-powered schedule extraction functionality
 * of the Schedule Editor application.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class Test34ImageUploadScheduleExtraction {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = {
            testName: 'Test 3.4: Image Upload and Schedule Extraction',
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
            console.log('Starting Test 3.4: Image Upload and Schedule Extraction');
            
            // Initialize browser
            await this.initializeBrowser();
            
            // Execute test steps
            await this.step1_navigateToScheduleEditor();
            await this.step2_verifyImageUploadTab();
            await this.step3_testImageUpload();
            await this.step4_testScheduleExtraction();
            await this.step5_testApplyAndSave();
            await this.step6_verifyCalendarView();
            await this.step7_testErrorHandling();
            
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
                timeout: 10000
            });
            
            // Wait for the page to load
            await this.page.waitForSelector('#appSection, #authSection', { timeout: 5000 });
            
            // Check if we need to authenticate
            const authSection = await this.page.$('#authSection');
            if (authSection) {
                console.log('Authentication required, attempting login...');
                await this.performLogin();
            }
            
            // Verify we're on the schedule editor page
            await this.page.waitForSelector('.editor-container', { timeout: 5000 });
            
            // Take screenshot
            const screenshot = await this.page.screenshot({ fullPage: true });
            const screenshotPath = `test_3_4_initial_load_${Date.now()}.png`;
            fs.writeFileSync(path.join(__dirname, screenshotPath), screenshot);
            this.results.screenshots.push(screenshotPath);
            
            this.addStepResult(stepName, 'passed', 'Successfully navigated to schedule editor');
            
        } catch (error) {
            this.addStepResult(stepName, 'failed', `Failed to navigate to schedule editor: ${error.message}`);
            throw error;
        }
    }

    async step2_verifyImageUploadTab() {
        const stepName = 'Verify Image Upload Tab';
        console.log(`Executing: ${stepName}`);
        
        try {
            // Click on the Image Upload tab
            await this.page.click('button[data-tab="image"]');
            
            // Wait for the image editor section to be visible
            await this.page.waitForSelector('#imageEditor.active', { timeout: 5000 });
            
            // Verify the image upload interface is present
            const fileInput = await this.page.$('#imageUpload');
            const extractButton = await this.page.$('button[onclick="extractScheduleFromImage()"]');
            
            if (!fileInput || !extractButton) {
                throw new Error('Image upload interface elements not found');
            }
            
            // Verify file input accepts images
            const acceptAttribute = await fileInput.getAttribute('accept');
            if (!acceptAttribute.includes('image')) {
                throw new Error('File input does not accept image files');
            }
            
            // Take screenshot
            const screenshot = await this.page.screenshot({ fullPage: true });
            const screenshotPath = `test_3_4_image_upload_interface_${Date.now()}.png`;
            fs.writeFileSync(path.join(__dirname, screenshotPath), screenshot);
            this.results.screenshots.push(screenshotPath);
            
            this.addStepResult(stepName, 'passed', 'Image upload tab and interface verified successfully');
            
        } catch (error) {
            this.addStepResult(stepName, 'failed', `Failed to verify image upload tab: ${error.message}`);
            throw error;
        }
    }

    async step3_testImageUpload() {
        const stepName = 'Test Image Upload';
        console.log(`Executing: ${stepName}`);
        
        try {
            // Check if sample image exists
            const sampleImagePath = path.join(__dirname, '../../data/sample_schedule.png');
            if (!fs.existsSync(sampleImagePath)) {
                // Create a simple test image if sample doesn't exist
                await this.createTestImage();
            }
            
            // Upload the image
            const fileInput = await this.page.$('#imageUpload');
            await fileInput.uploadFile(sampleImagePath);
            
            // Wait a moment for the file to be processed
            await this.page.waitForTimeout(1000);
            
            // Verify the file was selected
            const files = await fileInput.getProperty('files');
            const fileCount = await files.getProperty('length');
            if (await fileCount.jsonValue() === 0) {
                throw new Error('File was not selected successfully');
            }
            
            // Take screenshot after file selection
            const screenshot = await this.page.screenshot({ fullPage: true });
            const screenshotPath = `test_3_4_file_selected_${Date.now()}.png`;
            fs.writeFileSync(path.join(__dirname, screenshotPath), screenshot);
            this.results.screenshots.push(screenshotPath);
            
            this.addStepResult(stepName, 'passed', 'Image file uploaded successfully');
            
        } catch (error) {
            this.addStepResult(stepName, 'failed', `Failed to upload image: ${error.message}`);
            throw error;
        }
    }

    async step4_testScheduleExtraction() {
        const stepName = 'Test Schedule Extraction';
        console.log(`Executing: ${stepName}`);
        
        try {
            // Click the Extract Schedule button
            await this.page.click('button[onclick="extractScheduleFromImage()"]');
            
            // Wait for the extraction process to start
            await this.page.waitForSelector('#imagePreview', { timeout: 5000 });
            
            // Wait for the extraction to complete (look for JSON data or error)
            await this.page.waitForFunction(() => {
                const preview = document.querySelector('#imagePreview');
                return preview && (
                    preview.textContent.includes('Extracted Schedule') ||
                    preview.textContent.includes('Error:') ||
                    preview.textContent.includes('Processing image...')
                );
            }, { timeout: 30000 });
            
            // Check if extraction was successful
            const previewContent = await this.page.$eval('#imagePreview', el => el.textContent);
            
            if (previewContent.includes('Error:')) {
                throw new Error(`Extraction failed: ${previewContent}`);
            }
            
            if (!previewContent.includes('Extracted Schedule')) {
                throw new Error('Extraction did not complete successfully');
            }
            
            // Take screenshot of extraction results
            const screenshot = await this.page.screenshot({ fullPage: true });
            const screenshotPath = `test_3_4_extraction_results_${Date.now()}.png`;
            fs.writeFileSync(path.join(__dirname, screenshotPath), screenshot);
            this.results.screenshots.push(screenshotPath);
            
            this.addStepResult(stepName, 'passed', 'Schedule extraction completed successfully');
            
        } catch (error) {
            this.addStepResult(stepName, 'failed', `Failed to extract schedule: ${error.message}`);
            throw error;
        }
    }

    async step5_testApplyAndSave() {
        const stepName = 'Test Apply and Save';
        console.log(`Executing: ${stepName}`);
        
        try {
            // Look for the Apply & Save button
            const applyButton = await this.page.$('button[onclick*="applyExtractedSchedule"]');
            
            if (!applyButton) {
                throw new Error('Apply & Save button not found');
            }
            
            // Click the Apply & Save button
            await applyButton.click();
            
            // Wait for the save process to complete
            await this.page.waitForFunction(() => {
                const preview = document.querySelector('#imagePreview');
                return preview && preview.textContent.includes('Schedule Applied Successfully');
            }, { timeout: 10000 });
            
            // Take screenshot after applying
            const screenshot = await this.page.screenshot({ fullPage: true });
            const screenshotPath = `test_3_4_applied_successfully_${Date.now()}.png`;
            fs.writeFileSync(path.join(__dirname, screenshotPath), screenshot);
            this.results.screenshots.push(screenshotPath);
            
            this.addStepResult(stepName, 'passed', 'Schedule applied and saved successfully');
            
        } catch (error) {
            this.addStepResult(stepName, 'failed', `Failed to apply and save schedule: ${error.message}`);
            throw error;
        }
    }

    async step6_verifyCalendarView() {
        const stepName = 'Verify Calendar View';
        console.log(`Executing: ${stepName}`);
        
        try {
            // Navigate to the calendar view
            await this.page.click('button[onclick*="index.html"]');
            
            // Wait for the calendar to load
            await this.page.waitForSelector('.calendar-grid', { timeout: 10000 });
            
            // Check if there are any schedule entries visible
            const scheduleEntries = await this.page.$$('.schedule-entry, .event-item');
            
            if (scheduleEntries.length === 0) {
                console.log('No schedule entries found in calendar view');
            }
            
            // Take screenshot of calendar view
            const screenshot = await this.page.screenshot({ fullPage: true });
            const screenshotPath = `test_3_4_calendar_view_${Date.now()}.png`;
            fs.writeFileSync(path.join(__dirname, screenshotPath), screenshot);
            this.results.screenshots.push(screenshotPath);
            
            this.addStepResult(stepName, 'passed', 'Calendar view verified successfully');
            
        } catch (error) {
            this.addStepResult(stepName, 'failed', `Failed to verify calendar view: ${error.message}`);
            throw error;
        }
    }

    async step7_testErrorHandling() {
        const stepName = 'Test Error Handling';
        console.log(`Executing: ${stepName}`);
        
        try {
            // Navigate back to schedule editor
            await this.page.goto('http://localhost:3000/schedule-editor.html', {
                waitUntil: 'networkidle2',
                timeout: 10000
            });
            
            // Click on Image Upload tab
            await this.page.click('button[data-tab="image"]');
            
            // Try to extract without selecting a file
            await this.page.click('button[onclick="extractScheduleFromImage()"]');
            
            // Check for error message
            await this.page.waitForFunction(() => {
                return document.querySelector('body').textContent.includes('Please choose a schedule image first');
            }, { timeout: 5000 });
            
            // Test with invalid file type (if possible)
            // This would require creating a non-image file for testing
            
            this.addStepResult(stepName, 'passed', 'Error handling works correctly');
            
        } catch (error) {
            this.addStepResult(stepName, 'failed', `Error handling test failed: ${error.message}`);
            throw error;
        }
    }

    async performLogin() {
        try {
            // Fill in login credentials (you may need to adjust these)
            await this.page.type('#loginEmail', 'test@example.com');
            await this.page.type('#loginPassword', 'testpassword123');
            
            // Click sign in button
            await this.page.click('button[onclick="handleLogin()"]');
            
            // Wait for authentication to complete
            await this.page.waitForSelector('#appSection', { timeout: 10000 });
            
        } catch (error) {
            console.log('Login failed, continuing with test...');
            // If login fails, we'll continue with the test to see what happens
        }
    }

    async createTestImage() {
        // Create a simple test image using canvas
        const canvas = require('canvas');
        const { createCanvas } = canvas;
        
        const testCanvas = createCanvas(400, 300);
        const ctx = testCanvas.getContext('2d');
        
        // Draw a simple schedule-like image
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 400, 300);
        
        ctx.fillStyle = 'black';
        ctx.font = '16px Arial';
        ctx.fillText('Test Schedule', 50, 50);
        ctx.fillText('Monday: 8:00-9:00 Class 6A', 50, 100);
        ctx.fillText('Tuesday: 8:00-9:00 Class 6A', 50, 150);
        
        // Save the image
        const buffer = testCanvas.toBuffer('image/png');
        const imagePath = path.join(__dirname, '../../data/sample_schedule.png');
        fs.writeFileSync(imagePath, buffer);
        
        console.log('Created test image for testing');
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
        const resultsPath = path.join(__dirname, `test_3_4_results_${Date.now()}.json`);
        fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2));
        console.log(`Test results saved to: ${resultsPath}`);
        
        // Also save a markdown report
        const reportPath = path.join(__dirname, `TEST_3_4_RESULTS.md`);
        const report = this.generateMarkdownReport();
        fs.writeFileSync(reportPath, report);
        console.log(`Test report saved to: ${reportPath}`);
    }

    generateMarkdownReport() {
        const { steps, screenshots, errors, summary } = this.results;
        
        let report = `# Test 3.4: Image Upload and Schedule Extraction Results\n\n`;
        report += `**Test Status:** ${this.results.status.toUpperCase()}\n`;
        report += `**Timestamp:** ${this.results.timestamp}\n\n`;
        
        report += `## Summary\n\n`;
        report += `- Total Steps: ${summary.totalSteps}\n`;
        report += `- Passed Steps: ${summary.passedSteps}\n`;
        report += `- Failed Steps: ${summary.failedSteps}\n`;
        report += `- Screenshots Taken: ${summary.screenshotsTaken}\n`;
        report += `- Errors Encountered: ${summary.errorsEncountered}\n\n`;
        
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
    const test = new Test34ImageUploadScheduleExtraction();
    test.run().catch(console.error);
}

module.exports = Test34ImageUploadScheduleExtraction;

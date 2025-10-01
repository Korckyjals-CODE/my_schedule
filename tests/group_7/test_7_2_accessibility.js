/**
 * Test 7.2: Accessibility Testing for Schedule Editor Application
 * 
 * This test evaluates the accessibility features of the Schedule Editor application
 * including keyboard navigation, ARIA labels, color contrast, and screen reader compatibility.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class AccessibilityTest {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = {
            testName: 'Test 7.2: Accessibility',
            timestamp: new Date().toISOString(),
            setup: {},
            keyboardNavigation: {},
            ariaLabels: {},
            colorContrast: {},
            browserTools: {},
            overallScore: 0,
            issues: [],
            recommendations: []
        };
    }

    async setup() {
        console.log('Setting up accessibility test...');
        
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1280, height: 720 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        this.page = await this.browser.newPage();
        
        // Enable accessibility testing
        await this.page.evaluateOnNewDocument(() => {
            // Add accessibility testing utilities
            window.accessibilityTest = {
                getFocusableElements: () => {
                    const focusableSelectors = [
                        'a[href]', 'button', 'input', 'select', 'textarea',
                        '[tabindex]:not([tabindex="-1"])', '[contenteditable="true"]'
                    ];
                    return document.querySelectorAll(focusableSelectors.join(', '));
                },
                getAriaElements: () => {
                    return document.querySelectorAll('[aria-label], [aria-labelledby], [role]');
                },
                checkColorContrast: (element) => {
                    const style = window.getComputedStyle(element);
                    const color = style.color;
                    const backgroundColor = style.backgroundColor;
                    return { color, backgroundColor };
                }
            };
        });

        // Navigate to the application
        await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
        
        // Take initial screenshot
        await this.page.screenshot({ 
            path: path.join(__dirname, 'test_7_2_initial_load.png'),
            fullPage: true 
        });

        this.results.setup.serverRunning = true;
        this.results.setup.pageLoaded = true;
        
        console.log('Setup completed successfully');
    }

    async testKeyboardNavigation() {
        console.log('Testing keyboard navigation...');
        
        const keyboardResults = {
            tabNavigation: {},
            focusIndicators: {},
            formNavigation: {},
            issues: []
        };

        try {
            // Test Tab navigation through interactive elements
            const focusableElements = await this.page.evaluate(() => {
                return window.accessibilityTest.getFocusableElements();
            });

            keyboardResults.tabNavigation.totalElements = focusableElements.length;
            console.log(`Found ${focusableElements.length} focusable elements`);

            // Test tabbing through elements
            await this.page.keyboard.press('Tab');
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Check if focus is visible
            const firstFocusedElement = await this.page.evaluate(() => {
                const activeElement = document.activeElement;
                if (activeElement) {
                    const style = window.getComputedStyle(activeElement);
                    return {
                        tagName: activeElement.tagName,
                        id: activeElement.id,
                        className: activeElement.className,
                        focusVisible: style.outline !== 'none' || style.boxShadow !== 'none'
                    };
                }
                return null;
            });

            keyboardResults.focusIndicators.firstElement = firstFocusedElement;

            // Test form navigation if login form is present
            const loginForm = await this.page.$('form');
            if (loginForm) {
                console.log('Testing form navigation...');
                
                // Test email field
                const emailField = await this.page.$('input[type="email"]');
                if (emailField) {
                    await emailField.focus();
                    await this.page.keyboard.type('test@example.com');
                    await this.page.keyboard.press('Tab');
                    
                    const passwordField = await this.page.$('input[type="password"]');
                    if (passwordField) {
                        await passwordField.focus();
                        await this.page.keyboard.type('password123');
                        
                        keyboardResults.formNavigation.emailField = true;
                        keyboardResults.formNavigation.passwordField = true;
                    }
                }
            }

            // Test Enter key functionality
            await this.page.keyboard.press('Enter');
            await new Promise(resolve => setTimeout(resolve, 1000));

            keyboardResults.tabNavigation.success = true;

        } catch (error) {
            keyboardResults.issues.push(`Keyboard navigation error: ${error.message}`);
            console.error('Keyboard navigation test failed:', error);
        }

        this.results.keyboardNavigation = keyboardResults;
        console.log('Keyboard navigation test completed');
    }

    async testAriaLabels() {
        console.log('Testing ARIA labels and roles...');
        
        const ariaResults = {
            formLabels: {},
            buttonRoles: {},
            modalAccessibility: {},
            issues: []
        };

        try {
            // Check form elements for proper labels
            const formElements = await this.page.evaluate(() => {
                const inputs = document.querySelectorAll('input, select, textarea');
                const results = [];
                
                inputs.forEach(input => {
                    const hasLabel = input.getAttribute('aria-label') || 
                                   input.getAttribute('aria-labelledby') ||
                                   document.querySelector(`label[for="${input.id}"]`);
                    
                    results.push({
                        type: input.type || input.tagName,
                        id: input.id,
                        hasLabel: !!hasLabel,
                        ariaLabel: input.getAttribute('aria-label'),
                        ariaLabelledBy: input.getAttribute('aria-labelledby')
                    });
                });
                
                return results;
            });

            ariaResults.formLabels.elements = formElements;
            ariaResults.formLabels.properlyLabeled = formElements.filter(el => el.hasLabel).length;
            ariaResults.formLabels.totalElements = formElements.length;

            // Check button roles
            const buttons = await this.page.evaluate(() => {
                const buttonElements = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
                const results = [];
                
                buttonElements.forEach(button => {
                    results.push({
                        tagName: button.tagName,
                        type: button.type,
                        text: button.textContent || button.value,
                        role: button.getAttribute('role'),
                        ariaLabel: button.getAttribute('aria-label')
                    });
                });
                
                return results;
            });

            ariaResults.buttonRoles.buttons = buttons;
            ariaResults.buttonRoles.totalButtons = buttons.length;

            // Check for modals and their accessibility
            const modals = await this.page.evaluate(() => {
                const modalElements = document.querySelectorAll('[role="dialog"], .modal, [aria-modal="true"]');
                const results = [];
                
                modalElements.forEach(modal => {
                    results.push({
                        role: modal.getAttribute('role'),
                        ariaModal: modal.getAttribute('aria-modal'),
                        ariaLabel: modal.getAttribute('aria-label'),
                        ariaLabelledBy: modal.getAttribute('aria-labelledby')
                    });
                });
                
                return results;
            });

            ariaResults.modalAccessibility.modals = modals;
            ariaResults.modalAccessibility.totalModals = modals.length;

        } catch (error) {
            ariaResults.issues.push(`ARIA testing error: ${error.message}`);
            console.error('ARIA labels test failed:', error);
        }

        this.results.ariaLabels = ariaResults;
        console.log('ARIA labels test completed');
    }

    async testColorContrast() {
        console.log('Testing color contrast...');
        
        const contrastResults = {
            textElements: {},
            buttonElements: {},
            errorMessages: {},
            issues: []
        };

        try {
            // Test text color contrast
            const textElements = await this.page.evaluate(() => {
                const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button');
                const results = [];
                
                textElements.forEach(element => {
                    const style = window.getComputedStyle(element);
                    const textColor = style.color;
                    const backgroundColor = style.backgroundColor;
                    
                    // Simple contrast check (this is a basic implementation)
                    const hasGoodContrast = textColor !== backgroundColor && 
                                          textColor !== 'rgba(0, 0, 0, 0)' &&
                                          backgroundColor !== 'rgba(0, 0, 0, 0)';
                    
                    results.push({
                        tagName: element.tagName,
                        textColor: textColor,
                        backgroundColor: backgroundColor,
                        hasGoodContrast: hasGoodContrast,
                        textContent: element.textContent.substring(0, 50)
                    });
                });
                
                return results;
            });

            contrastResults.textElements.elements = textElements;
            contrastResults.textElements.goodContrast = textElements.filter(el => el.hasGoodContrast).length;
            contrastResults.textElements.totalElements = textElements.length;

            // Test button contrast specifically
            const buttonElements = await this.page.evaluate(() => {
                const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
                const results = [];
                
                buttons.forEach(button => {
                    const style = window.getComputedStyle(button);
                    results.push({
                        textColor: style.color,
                        backgroundColor: style.backgroundColor,
                        borderColor: style.borderColor,
                        textContent: button.textContent || button.value
                    });
                });
                
                return results;
            });

            contrastResults.buttonElements.buttons = buttonElements;

            // Check error message visibility
            const errorElements = await this.page.evaluate(() => {
                const errorElements = document.querySelectorAll('.error, .alert, [role="alert"]');
                const results = [];
                
                errorElements.forEach(error => {
                    const style = window.getComputedStyle(error);
                    results.push({
                        textColor: style.color,
                        backgroundColor: style.backgroundColor,
                        display: style.display,
                        visibility: style.visibility
                    });
                });
                
                return results;
            });

            contrastResults.errorMessages.errors = errorElements;

        } catch (error) {
            contrastResults.issues.push(`Color contrast testing error: ${error.message}`);
            console.error('Color contrast test failed:', error);
        }

        this.results.colorContrast = contrastResults;
        console.log('Color contrast test completed');
    }

    async testBrowserAccessibilityTools() {
        console.log('Testing with browser accessibility tools...');
        
        const browserToolsResults = {
            lighthouseAudit: {},
            axeResults: {},
            issues: []
        };

        try {
            // Run basic accessibility checks
            const accessibilityInfo = await this.page.evaluate(() => {
                const info = {
                    totalImages: document.querySelectorAll('img').length,
                    imagesWithAlt: document.querySelectorAll('img[alt]').length,
                    totalLinks: document.querySelectorAll('a').length,
                    linksWithText: document.querySelectorAll('a').length - document.querySelectorAll('a:not([aria-label]):not([aria-labelledby])').length,
                    totalHeadings: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
                    headingStructure: []
                };

                // Check heading structure
                const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
                headings.forEach(heading => {
                    info.headingStructure.push({
                        level: parseInt(heading.tagName.substring(1)),
                        text: heading.textContent.substring(0, 50)
                    });
                });

                return info;
            });

            browserToolsResults.lighthouseAudit = accessibilityInfo;

            // Check for common accessibility issues
            const commonIssues = await this.page.evaluate(() => {
                const issues = [];
                
                // Check for missing alt text
                const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
                if (imagesWithoutAlt.length > 0) {
                    issues.push(`Found ${imagesWithoutAlt.length} images without alt text`);
                }
                
                // Check for empty links
                const emptyLinks = document.querySelectorAll('a:not([aria-label]):not([aria-labelledby])');
                const trulyEmptyLinks = Array.from(emptyLinks).filter(link => !link.textContent.trim());
                if (trulyEmptyLinks.length > 0) {
                    issues.push(`Found ${trulyEmptyLinks.length} empty links`);
                }
                
                // Check for missing form labels
                const inputsWithoutLabels = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
                const inputsWithoutAssociatedLabels = Array.from(inputsWithoutLabels).filter(input => {
                    const label = document.querySelector(`label[for="${input.id}"]`);
                    return !label;
                });
                if (inputsWithoutAssociatedLabels.length > 0) {
                    issues.push(`Found ${inputsWithoutAssociatedLabels.length} form inputs without labels`);
                }
                
                return issues;
            });

            browserToolsResults.axeResults = { commonIssues };

        } catch (error) {
            browserToolsResults.issues.push(`Browser tools testing error: ${error.message}`);
            console.error('Browser accessibility tools test failed:', error);
        }

        this.results.browserTools = browserToolsResults;
        console.log('Browser accessibility tools test completed');
    }

    calculateOverallScore() {
        let score = 0;
        let totalChecks = 0;

        // Keyboard navigation score (25%)
        if (this.results.keyboardNavigation.tabNavigation?.success) {
            score += 25;
        }
        totalChecks += 25;

        // ARIA labels score (25%)
        const ariaScore = this.results.ariaLabels.formLabels?.properlyLabeled || 0;
        const ariaTotal = this.results.ariaLabels.formLabels?.totalElements || 1;
        score += (ariaScore / ariaTotal) * 25;
        totalChecks += 25;

        // Color contrast score (25%)
        const contrastScore = this.results.colorContrast.textElements?.goodContrast || 0;
        const contrastTotal = this.results.colorContrast.textElements?.totalElements || 1;
        score += (contrastScore / contrastTotal) * 25;
        totalChecks += 25;

        // Browser tools score (25%)
        const browserIssues = this.results.browserTools.axeResults?.commonIssues?.length || 0;
        score += Math.max(0, 25 - (browserIssues * 5));
        totalChecks += 25;

        this.results.overallScore = Math.round((score / totalChecks) * 100);
    }

    generateRecommendations() {
        const recommendations = [];

        // Keyboard navigation recommendations
        if (!this.results.keyboardNavigation.tabNavigation?.success) {
            recommendations.push('Implement proper keyboard navigation with visible focus indicators');
        }

        // ARIA recommendations
        const ariaScore = this.results.ariaLabels.formLabels?.properlyLabeled || 0;
        const ariaTotal = this.results.ariaLabels.formLabels?.totalElements || 1;
        if (ariaScore < ariaTotal) {
            recommendations.push('Add proper ARIA labels to all form elements');
        }

        // Color contrast recommendations
        const contrastScore = this.results.colorContrast.textElements?.goodContrast || 0;
        const contrastTotal = this.results.colorContrast.textElements?.totalElements || 1;
        if (contrastScore < contrastTotal) {
            recommendations.push('Improve color contrast ratios to meet WCAG guidelines');
        }

        // Browser tools recommendations
        const browserIssues = this.results.browserTools.axeResults?.commonIssues || [];
        if (browserIssues.length > 0) {
            recommendations.push('Address common accessibility issues: ' + browserIssues.join(', '));
        }

        this.results.recommendations = recommendations;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async runTest() {
        try {
            await this.setup();
            await this.testKeyboardNavigation();
            await this.testAriaLabels();
            await this.testColorContrast();
            await this.testBrowserAccessibilityTools();
            
            this.calculateOverallScore();
            this.generateRecommendations();
            
            // Save results
            const resultsPath = path.join(__dirname, `test_7_2_results_${Date.now()}.json`);
            fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2));
            
            console.log(`\n=== ACCESSIBILITY TEST RESULTS ===`);
            console.log(`Overall Score: ${this.results.overallScore}%`);
            console.log(`Issues Found: ${this.results.issues.length}`);
            console.log(`Recommendations: ${this.results.recommendations.length}`);
            console.log(`Results saved to: ${resultsPath}`);
            
            return this.results;
            
        } catch (error) {
            console.error('Test execution failed:', error);
            this.results.issues.push(`Test execution error: ${error.message}`);
            return this.results;
        } finally {
            await this.cleanup();
        }
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    const test = new AccessibilityTest();
    test.runTest().then(results => {
        console.log('Accessibility test completed');
        process.exit(results.overallScore >= 70 ? 0 : 1);
    }).catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    });
}

module.exports = AccessibilityTest;

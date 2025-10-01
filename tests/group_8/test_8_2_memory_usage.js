/**
 * Test 8.2: Memory Usage
 * 
 * This test evaluates the memory usage of the Schedule Editor application
 * to identify potential memory leaks and ensure efficient memory management.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class MemoryUsageTest {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = {
            testName: 'Test 8.2: Memory Usage',
            timestamp: new Date().toISOString(),
            memorySnapshots: [],
            operations: [],
            findings: [],
            recommendations: []
        };
    }

    async setup() {
        console.log('Setting up Test 8.2: Memory Usage...');
        
        // Launch browser with memory monitoring capabilities
        this.browser = await puppeteer.launch({
            headless: false,
            devtools: true,
            args: [
                '--enable-precise-memory-info',
                '--enable-memory-info',
                '--js-flags=--expose-gc'
            ]
        });

        this.page = await this.browser.newPage();
        
        // Enable memory monitoring
        await this.page.evaluateOnNewDocument(() => {
            window.memoryMonitor = {
                snapshots: [],
                takeSnapshot: function(label) {
                    if (performance.memory) {
                        const snapshot = {
                            label: label,
                            timestamp: Date.now(),
                            usedJSHeapSize: performance.memory.usedJSHeapSize,
                            totalJSHeapSize: performance.memory.totalJSHeapSize,
                            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                        };
                        this.snapshots.push(snapshot);
                        console.log(`Memory Snapshot [${label}]:`, snapshot);
                        return snapshot;
                    }
                    return null;
                },
                forceGC: function() {
                    if (window.gc) {
                        window.gc();
                        console.log('Forced garbage collection');
                    }
                }
            };
        });

        // Navigate to the application
        await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
        
        // Wait for authentication if needed
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('Setup completed successfully');
    }

    async takeMemorySnapshot(label) {
        const snapshot = await this.page.evaluate((label) => {
            return window.memoryMonitor.takeSnapshot(label);
        }, label);
        
        if (snapshot) {
            this.results.memorySnapshots.push(snapshot);
            console.log(`Memory snapshot taken: ${label}`);
            console.log(`Used JS Heap: ${(snapshot.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
            console.log(`Total JS Heap: ${(snapshot.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
        }
        
        return snapshot;
    }

    async performMemoryOperations() {
        console.log('Performing memory-intensive operations...');

        // 1. Initial memory snapshot
        await this.takeMemorySnapshot('Initial Load');

        // 2. Create schedule entries
        console.log('Creating schedule entries...');
        await this.page.goto('http://localhost:3000/schedule-editor.html', { waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Create multiple weekday entries
        for (let i = 0; i < 5; i++) {
            await this.page.select('#weekday', 'Monday');
            await this.page.click('button[onclick="addWeekdayEntry()"]');
            
            // Wait for the entry form to appear and fill it
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // The entry form will be dynamically created, so we need to find the latest one
            const entries = await this.page.$$('.schedule-entry');
            if (entries.length > 0) {
                const latestEntry = entries[entries.length - 1];
                await latestEntry.$eval('select', (select) => select.value = '6A');
                await latestEntry.$eval('input[type="time"]:first-of-type', (input) => input.value = '08:00');
                await latestEntry.$eval('input[type="time"]:last-of-type', (input) => input.value = '08:45');
                await latestEntry.$eval('input[type="text"]', (input) => input.value = `Test Subject ${i}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        await this.takeMemorySnapshot('After Creating Schedule Entries');

        // 3. Navigate between pages multiple times
        console.log('Navigating between pages...');
        for (let i = 0; i < 3; i++) {
            await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
            await new Promise(resolve => setTimeout(resolve, 1000));
            await this.page.goto('http://localhost:3000/search.html', { waitUntil: 'networkidle0' });
            await new Promise(resolve => setTimeout(resolve, 1000));
            await this.page.goto('http://localhost:3000/schedule-editor.html', { waitUntil: 'networkidle0' });
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        await this.takeMemorySnapshot('After Page Navigation');

        // 4. Perform search operations
        console.log('Performing search operations...');
        await this.page.goto('http://localhost:3000/search.html', { waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Perform multiple searches
        const searchTerms = ['6A', 'Test', 'Monday', 'Class'];
        for (const term of searchTerms) {
            await this.page.type('#searchInput', term);
            await this.page.keyboard.press('Enter');
            await new Promise(resolve => setTimeout(resolve, 1000));
            await this.page.evaluate(() => {
                const input = document.querySelector('#searchInput');
                if (input) input.value = '';
            });
        }

        await this.takeMemorySnapshot('After Search Operations');

        // 5. Test image upload (if available)
        console.log('Testing image upload...');
        await this.page.goto('http://localhost:3000/schedule-editor.html', { waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Try to upload an image (this might fail if no image is available, which is fine)
        try {
            await this.page.click('a[href="#image-upload"]');
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Note: We won't actually upload a file, just test the interface
        } catch (error) {
            console.log('Image upload interface not available or accessible');
        }

        await this.takeMemorySnapshot('After Image Upload Test');

        // 6. Test memory cleanup operations
        console.log('Testing memory cleanup...');
        
        // Navigate away and back
        await this.page.goto('about:blank');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Force garbage collection
        await this.page.evaluate(() => {
            window.memoryMonitor.forceGC();
        });

        await this.takeMemorySnapshot('After Cleanup Operations');

        // 7. Test with large dataset simulation
        console.log('Simulating large dataset operations...');
        await this.page.goto('http://localhost:3000/schedule-editor.html', { waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Create more entries to simulate large dataset
        for (let day = 0; day < 5; day++) {
            const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
            await this.page.select('#weekday', weekdays[day]);
            
            for (let i = 0; i < 3; i++) {
                await this.page.click('button[onclick="addWeekdayEntry()"]');
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Fill the latest entry
                const entries = await this.page.$$('.schedule-entry');
                if (entries.length > 0) {
                    const latestEntry = entries[entries.length - 1];
                    await latestEntry.$eval('select', (select) => select.value = '6A');
                    await latestEntry.$eval('input[type="time"]:first-of-type', (input) => input.value = `${8 + i}:00`);
                    await latestEntry.$eval('input[type="time"]:last-of-type', (input) => input.value = `${8 + i}:45`);
                    await latestEntry.$eval('input[type="text"]', (input) => input.value = `Large Dataset Entry ${day}-${i}`);
                }
                
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }

        await this.takeMemorySnapshot('After Large Dataset Creation');

        // 8. Final cleanup and measurement
        await this.page.evaluate(() => {
            window.memoryMonitor.forceGC();
        });
        await this.takeMemorySnapshot('Final State After GC');
    }

    analyzeMemoryUsage() {
        console.log('Analyzing memory usage patterns...');
        
        const snapshots = this.results.memorySnapshots;
        if (snapshots.length < 2) {
            this.results.findings.push('Insufficient memory snapshots for analysis');
            return;
        }

        // Calculate memory growth patterns
        const initialMemory = snapshots[0].usedJSHeapSize;
        const finalMemory = snapshots[snapshots.length - 1].usedJSHeapSize;
        const memoryGrowth = finalMemory - initialMemory;
        const memoryGrowthPercent = (memoryGrowth / initialMemory) * 100;

        this.results.findings.push(`Initial memory usage: ${(initialMemory / 1024 / 1024).toFixed(2)} MB`);
        this.results.findings.push(`Final memory usage: ${(finalMemory / 1024 / 1024).toFixed(2)} MB`);
        this.results.findings.push(`Memory growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)} MB (${memoryGrowthPercent.toFixed(2)}%)`);

        // Check for potential memory leaks
        if (memoryGrowthPercent > 50) {
            this.results.findings.push('WARNING: Significant memory growth detected - potential memory leak');
            this.results.recommendations.push('Investigate potential memory leaks in schedule creation and navigation');
        } else if (memoryGrowthPercent > 20) {
            this.results.findings.push('CAUTION: Moderate memory growth detected');
            this.results.recommendations.push('Monitor memory usage patterns and consider optimization');
        } else {
            this.results.findings.push('Memory usage appears stable');
        }

        // Analyze memory patterns between operations
        for (let i = 1; i < snapshots.length; i++) {
            const prevSnapshot = snapshots[i - 1];
            const currentSnapshot = snapshots[i];
            const operationGrowth = currentSnapshot.usedJSHeapSize - prevSnapshot.usedJSHeapSize;
            const operationGrowthMB = (operationGrowth / 1024 / 1024).toFixed(2);
            
            this.results.findings.push(`${currentSnapshot.label}: ${operationGrowthMB} MB change`);
            
            if (operationGrowth > 10 * 1024 * 1024) { // More than 10MB growth
                this.results.findings.push(`High memory usage detected in: ${currentSnapshot.label}`);
                this.results.recommendations.push(`Optimize memory usage for: ${currentSnapshot.label}`);
            }
        }

        // Check if garbage collection is working
        const gcSnapshot = snapshots.find(s => s.label.includes('After GC') || s.label.includes('GC'));
        if (gcSnapshot) {
            const gcIndex = snapshots.indexOf(gcSnapshot);
            if (gcIndex > 0) {
                const beforeGC = snapshots[gcIndex - 1].usedJSHeapSize;
                const afterGC = gcSnapshot.usedJSHeapSize;
                const gcReduction = beforeGC - afterGC;
                const gcReductionPercent = (gcReduction / beforeGC) * 100;
                
                this.results.findings.push(`Garbage collection freed: ${(gcReduction / 1024 / 1024).toFixed(2)} MB (${gcReductionPercent.toFixed(2)}%)`);
                
                if (gcReductionPercent < 5) {
                    this.results.findings.push('WARNING: Low garbage collection effectiveness');
                    this.results.recommendations.push('Investigate potential memory leaks preventing effective garbage collection');
                }
            }
        }
    }

    async generateReport() {
        console.log('Generating test report...');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(__dirname, `test_8_2_results_${Date.now()}.json`);
        
        // Add summary information
        this.results.summary = {
            totalSnapshots: this.results.memorySnapshots.length,
            testDuration: 'Memory usage monitoring completed',
            memoryLeaksDetected: this.results.findings.some(f => f.includes('memory leak')),
            performanceIssues: this.results.findings.some(f => f.includes('WARNING') || f.includes('CAUTION')),
            recommendationsCount: this.results.recommendations.length
        };

        // Save results
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        console.log(`Test results saved to: ${reportPath}`);

        // Generate markdown report
        const mdReportPath = path.join(__dirname, `TEST_8_2_RESULTS.md`);
        const mdContent = this.generateMarkdownReport();
        fs.writeFileSync(mdReportPath, mdContent);
        console.log(`Markdown report saved to: ${mdReportPath}`);

        return { jsonReport: reportPath, mdReport: mdReportPath };
    }

    generateMarkdownReport() {
        const timestamp = new Date().toISOString();
        
        return `# Test 8.2: Memory Usage - Results

**Test Date:** ${timestamp}
**Test Status:** ${this.results.summary.memoryLeaksDetected ? 'FAILED - Memory leaks detected' : 'PASSED - Memory usage stable'}

## Executive Summary

This test evaluated the memory usage patterns of the Schedule Editor application to identify potential memory leaks and ensure efficient memory management.

### Key Findings
${this.results.findings.map(finding => `- ${finding}`).join('\n')}

### Recommendations
${this.results.recommendations.map(rec => `- ${rec}`).join('\n')}

## Memory Snapshots

| Snapshot | Used JS Heap (MB) | Total JS Heap (MB) | Change (MB) |
|----------|-------------------|-------------------|-------------|
${this.results.memorySnapshots.map((snapshot, index) => {
    const usedMB = (snapshot.usedJSHeapSize / 1024 / 1024).toFixed(2);
    const totalMB = (snapshot.totalJSHeapSize / 1024 / 1024).toFixed(2);
    const change = index > 0 ? 
        ((snapshot.usedJSHeapSize - this.results.memorySnapshots[index - 1].usedJSHeapSize) / 1024 / 1024).toFixed(2) : 
        '0.00';
    return `| ${snapshot.label} | ${usedMB} | ${totalMB} | ${change} |`;
}).join('\n')}

## Test Operations Performed

1. **Initial Load**: Baseline memory measurement
2. **Schedule Creation**: Created multiple schedule entries
3. **Page Navigation**: Navigated between different pages multiple times
4. **Search Operations**: Performed various search queries
5. **Image Upload Test**: Tested image upload interface
6. **Memory Cleanup**: Tested garbage collection and navigation cleanup
7. **Large Dataset**: Created extensive schedule data
8. **Final Cleanup**: Forced garbage collection and final measurement

## Analysis

${this.results.summary.memoryLeaksDetected ? 
    '**CRITICAL ISSUE**: Memory leaks detected during testing. The application shows significant memory growth that may lead to performance degradation and browser crashes.' :
    '**PASSED**: Memory usage patterns appear stable with no significant memory leaks detected.'
}

## Recommendations for Development Team

${this.results.recommendations.length > 0 ? 
    this.results.recommendations.map(rec => `- ${rec}`).join('\n') :
    '- Continue monitoring memory usage in production\n- Implement regular memory profiling in development\n- Consider implementing memory usage alerts'
}

## Next Steps

${this.results.summary.memoryLeaksDetected ? 
    '1. **IMMEDIATE ACTION REQUIRED**: Investigate and fix memory leaks\n2. Implement memory monitoring in production\n3. Re-run this test after fixes are applied' :
    '1. Continue regular memory monitoring\n2. Implement automated memory testing in CI/CD pipeline\n3. Monitor memory usage in production environment'
}
`;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
        console.log('Test cleanup completed');
    }

    async run() {
        try {
            await this.setup();
            await this.performMemoryOperations();
            this.analyzeMemoryUsage();
            const reports = await this.generateReport();
            await this.cleanup();
            
            console.log('\n=== Test 8.2: Memory Usage - COMPLETED ===');
            console.log(`Results saved to: ${reports.jsonReport}`);
            console.log(`Report saved to: ${reports.mdReport}`);
            
            return this.results;
        } catch (error) {
            console.error('Test 8.2 failed:', error);
            await this.cleanup();
            throw error;
        }
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    const test = new MemoryUsageTest();
    test.run().catch(console.error);
}

module.exports = MemoryUsageTest;

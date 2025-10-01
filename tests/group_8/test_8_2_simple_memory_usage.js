/**
 * Test 8.2: Memory Usage - Simplified Version
 * 
 * This test evaluates the memory usage of the Schedule Editor application
 * with a focus on basic memory monitoring and navigation patterns.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class SimpleMemoryUsageTest {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = {
            testName: 'Test 8.2: Memory Usage (Simplified)',
            timestamp: new Date().toISOString(),
            memorySnapshots: [],
            operations: [],
            findings: [],
            recommendations: []
        };
    }

    async setup() {
        console.log('Setting up Test 8.2: Memory Usage (Simplified)...');
        
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

        console.log('Setup completed successfully');
    }

    async takeMemorySnapshot(label) {
        const snapshot = await this.page.evaluate((label) => {
            if (window.memoryMonitor && window.memoryMonitor.takeSnapshot) {
                return window.memoryMonitor.takeSnapshot(label);
            } else if (performance.memory) {
                // Fallback if memoryMonitor is not available
                return {
                    label: label,
                    timestamp: Date.now(),
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize,
                    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                };
            }
            return null;
        }, label);
        
        if (snapshot) {
            this.results.memorySnapshots.push(snapshot);
            console.log(`Memory snapshot taken: ${label}`);
            console.log(`Used JS Heap: ${(snapshot.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
            console.log(`Total JS Heap: ${(snapshot.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
        } else {
            console.log(`Memory snapshot failed for: ${label}`);
        }
        
        return snapshot;
    }

    async performMemoryOperations() {
        console.log('Performing memory-intensive operations...');

        // 1. Initial memory snapshot
        await this.takeMemorySnapshot('Initial State');

        // 2. Navigate to main page
        console.log('Navigating to main page...');
        await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.takeMemorySnapshot('After Main Page Load');

        // 3. Navigate to schedule editor
        console.log('Navigating to schedule editor...');
        await this.page.goto('http://localhost:3000/schedule-editor.html', { waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.takeMemorySnapshot('After Schedule Editor Load');

        // 4. Navigate to search page
        console.log('Navigating to search page...');
        await this.page.goto('http://localhost:3000/search.html', { waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.takeMemorySnapshot('After Search Page Load');

        // 5. Navigate back to main page
        console.log('Navigating back to main page...');
        await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.takeMemorySnapshot('After Return to Main Page');

        // 6. Test multiple rapid navigations
        console.log('Testing rapid navigation...');
        for (let i = 0; i < 5; i++) {
            await this.page.goto('http://localhost:3000/schedule-editor.html', { waitUntil: 'networkidle0' });
            await new Promise(resolve => setTimeout(resolve, 500));
            await this.page.goto('http://localhost:3000/search.html', { waitUntil: 'networkidle0' });
            await new Promise(resolve => setTimeout(resolve, 500));
            await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        await this.takeMemorySnapshot('After Rapid Navigation');

        // 7. Test JavaScript execution and DOM manipulation
        console.log('Testing JavaScript execution...');
        await this.page.evaluate(() => {
            // Create some DOM elements to test memory
            for (let i = 0; i < 100; i++) {
                const div = document.createElement('div');
                div.textContent = `Test element ${i}`;
                div.className = 'memory-test-element';
                document.body.appendChild(div);
            }
        });
        await this.takeMemorySnapshot('After DOM Manipulation');

        // 8. Clean up DOM elements
        console.log('Cleaning up DOM elements...');
        await this.page.evaluate(() => {
            const elements = document.querySelectorAll('.memory-test-element');
            elements.forEach(el => el.remove());
        });
        await this.takeMemorySnapshot('After DOM Cleanup');

        // 9. Force garbage collection
        console.log('Forcing garbage collection...');
        await this.page.evaluate(() => {
            window.memoryMonitor.forceGC();
        });
        await this.takeMemorySnapshot('After Forced Garbage Collection');

        // 10. Test with large data simulation
        console.log('Testing large data simulation...');
        await this.page.evaluate(() => {
            // Create large objects to test memory
            window.largeData = [];
            for (let i = 0; i < 1000; i++) {
                window.largeData.push({
                    id: i,
                    data: new Array(100).fill(`Data item ${i}`),
                    timestamp: Date.now()
                });
            }
        });
        await this.takeMemorySnapshot('After Large Data Creation');

        // 11. Clear large data
        console.log('Clearing large data...');
        await this.page.evaluate(() => {
            window.largeData = null;
        });
        await this.takeMemorySnapshot('After Large Data Clear');

        // 12. Final garbage collection
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
            this.results.recommendations.push('Investigate potential memory leaks in page navigation and DOM manipulation');
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

        // Check for memory spikes
        let maxSpike = 0;
        let maxSpikeLabel = '';
        for (let i = 1; i < snapshots.length; i++) {
            const spike = snapshots[i].usedJSHeapSize - snapshots[i-1].usedJSHeapSize;
            if (spike > maxSpike) {
                maxSpike = spike;
                maxSpikeLabel = snapshots[i].label;
            }
        }
        
        if (maxSpike > 5 * 1024 * 1024) { // More than 5MB spike
            this.results.findings.push(`Memory spike detected: ${(maxSpike / 1024 / 1024).toFixed(2)} MB in ${maxSpikeLabel}`);
            this.results.recommendations.push(`Investigate memory spike in: ${maxSpikeLabel}`);
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

This test evaluated the memory usage patterns of the Schedule Editor application to identify potential memory leaks and ensure efficient memory management. The simplified test focused on basic navigation patterns and JavaScript execution without requiring user authentication.

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

1. **Initial State**: Baseline memory measurement
2. **Main Page Load**: Navigated to main application page
3. **Schedule Editor Load**: Navigated to schedule editor page
4. **Search Page Load**: Navigated to search page
5. **Return to Main Page**: Navigated back to main page
6. **Rapid Navigation**: Performed multiple rapid page navigations
7. **DOM Manipulation**: Created and manipulated DOM elements
8. **DOM Cleanup**: Removed created DOM elements
9. **Forced Garbage Collection**: Triggered garbage collection
10. **Large Data Creation**: Created large JavaScript objects
11. **Large Data Clear**: Cleared large JavaScript objects
12. **Final Garbage Collection**: Final garbage collection and measurement

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

## Test Limitations

This simplified test focused on basic memory monitoring without user authentication or complex form interactions. For comprehensive testing, consider:
- Testing with authenticated users
- Testing form submissions and data persistence
- Testing with actual schedule data
- Testing image upload functionality
- Testing search operations with real data
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
            
            console.log('\n=== Test 8.2: Memory Usage (Simplified) - COMPLETED ===');
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
    const test = new SimpleMemoryUsageTest();
    test.run().catch(console.error);
}

module.exports = SimpleMemoryUsageTest;

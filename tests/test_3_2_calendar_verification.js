const { chromium } = require('playwright');

async function verifyCalendarDisplay() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        console.log('📅 Verifying calendar display for Test 3.2...');
        
        // Navigate to main calendar
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
        
        // Handle authentication
        const authSection = await page.locator('#authSection').isVisible();
        if (authSection) {
            await page.evaluate(() => {
                localStorage.setItem('supabase.auth.token', 'mock-token');
                localStorage.setItem('user', JSON.stringify({
                    email: 'testuser@example.com',
                    id: 'mock-user-id'
                }));
                document.getElementById('authSection').style.display = 'none';
                document.getElementById('appSection').style.display = 'block';
                document.getElementById('userEmail').textContent = 'testuser@example.com';
            });
            await page.waitForTimeout(1000);
        }
        
        // Check if calendar is visible
        const calendarVisible = await page.locator('#calendar').isVisible();
        console.log(`Calendar visible: ${calendarVisible}`);
        
        // Take screenshot
        const screenshot = `test_3_2_calendar_view_${Date.now()}.png`;
        await page.screenshot({ path: `tests/${screenshot}` });
        console.log(`Screenshot saved: ${screenshot}`);
        
        return {
            calendarVisible,
            screenshot
        };
        
    } catch (error) {
        console.error('Error verifying calendar:', error);
        return { error: error.message };
    } finally {
        await browser.close();
    }
}

if (require.main === module) {
    verifyCalendarDisplay().then(result => {
        console.log('Calendar verification result:', result);
    });
}

module.exports = { verifyCalendarDisplay };

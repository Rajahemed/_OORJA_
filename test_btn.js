const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
    
    await page.goto('http://127.0.0.1:3000/register', { waitUntil: 'networkidle0' }).catch(() => {});
    
    // Fill the form minimally to pass step 1
    await page.evaluate(() => {
        try {
            document.getElementById('regFullName').value = 'Test User';
            document.getElementById('regPhone').value = '9876543210';
            document.getElementById('regPassword').value = 'password123';
            
            // Trigger the button
            console.log('Clicking button...');
            document.getElementById('submitRegBtn').click();
        } catch(e) {
            console.error('Test script error:', e.message);
        }
    });
    
    await new Promise(r => setTimeout(r, 2000));
    await browser.close();
})();

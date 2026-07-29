const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

// Also revert the href="javascript:void(0)" back to href="#" just to be 100% sure we don't break JS
html = html.replace(/href="javascript:void\(0\)"/g, 'href="#"');

// Add the 50% off text to exit popup
html = html.replace('<h2>Join the Waitlist</h2>', '<h2>Wait! Get 50% Off Your First Month!</h2><p style="text-align: center; color: var(--text-secondary); margin-bottom: 1rem;">Leave your details below to claim this exclusive offer before you go.</p>');
html = html.replace('<p>Enter your details below to get early access and exclusive benefits.</p>', '');

fs.writeFileSync('public/index.html', html, 'utf8');
console.log("Fixed popup text and reverted links.");

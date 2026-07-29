const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');

let newHtml = html.replace('<h2>Join the Waitlist</h2>', '<h2>Wait! Get 50% Off Your First Month!</h2><p style="text-align: center; color: var(--text-secondary); margin-bottom: 1rem;">Leave your details below to claim this exclusive offer before you go.</p>');
newHtml = newHtml.replace('<p>Enter your details below to get early access and exclusive benefits.</p>', '');

fs.writeFileSync('public/index.html', newHtml, 'utf8');
console.log('Added exit intent offer to leadCaptureModal');

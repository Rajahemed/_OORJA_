const html = require('fs').readFileSync('public/index.html', 'utf8');
const scripts = html.match(/<script/gi);
console.log('Script count:', scripts ? scripts.length : 0);
console.log('GTM:', html.includes('googletagmanager.com/gtm.js'));
console.log('Clarity:', html.includes('clarity.ms'));
console.log('Hotjar:', html.includes('hotjar.com'));
console.log('Consent Update:', html.includes("gtag('consent', 'update'"));

const html = require('fs').readFileSync('public/index.html', 'utf8');
console.log('tracking-pixels.js exists in HTML?', html.includes('tracking-pixels.js'));

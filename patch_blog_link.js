const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');
html = html.replace('<a href="#" style="color: var(--primary-color); text-decoration: none;">Blog / Resources</a>', '<a href="/blog" style="color: var(--primary-color); text-decoration: none;">Blog / Resources</a>');
fs.writeFileSync('public/index.html', html, 'utf8');
console.log('Replaced link successfully.');

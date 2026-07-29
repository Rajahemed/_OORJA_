const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'public', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// Remove hardcoded Clarity script since app.js loads it
html = html.replace(/<!-- Microsoft Clarity Placeholder -->[\s\S]*?<\/script>/, '');

// Remove hardcoded GA4 script since app.js loads it
html = html.replace(/<!-- GA4 Placeholder -->[\s\S]*?<\/script>/, '');

fs.writeFileSync(indexPath, html, 'utf8');
console.log('Removed duplicate Clarity and GA4 hardcoded scripts.');

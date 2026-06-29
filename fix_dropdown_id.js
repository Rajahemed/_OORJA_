const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');
html = html.replace("document.getElementById('languageSelect')", "document.getElementById('langSelector')");
fs.writeFileSync('public/index.html', html, 'utf8');
console.log('Fixed langSelector in index.html');

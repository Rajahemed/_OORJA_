const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');
const start = html.indexOf('<form id="loginForm"');
const end = html.indexOf('</form>', start);
console.log(html.substring(start, end));

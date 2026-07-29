const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');
const match = html.match(/<h4[^>]*>[\s\S]*?Maintenance[\s\S]*?<\/h4>/);
console.log(match ? match[0] : 'not found');

const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');
html = html.replace(/href="javascript:void\(0\)"/g, 'href="#"');
fs.writeFileSync('public/index.html', html, 'utf8');
console.log("Reverted javascript:void(0) to #");

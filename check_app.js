const fs = require('fs');
const js = fs.readFileSync('public/js/app.js', 'utf8');
const html = fs.readFileSync('public/index.html', 'utf8');

console.log("querySelector('form') in app.js:", js.includes("querySelector('form'") || js.includes('querySelector("form"'));
console.log("Forms in html:", html.match(/<form[^>]*>/gi));

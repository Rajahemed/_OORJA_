const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf-8');

const searchHtml = 'class="custom-select form-control" onclick="togglePlatformDropdown()" style="display:flex; align-items:center; justify-content:space-between; cursor:pointer; background-color:#ffffff; color:#111827;"';
const replaceHtml = 'class="custom-select form-control" onclick="togglePlatformDropdown()" style="display:flex; align-items:center; justify-content:space-between; cursor:pointer;"';

html = html.replace(searchHtml, replaceHtml);
fs.writeFileSync('public/index.html', html, 'utf-8');

console.log('Fixed custom select styling.');

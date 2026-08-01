const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

const regex1 = / <span style="color:var\(--danger-color(?:, #[a-f0-9]+)?\);">\*<\/span>/g;

let count = 0;
html = html.replace(regex1, () => { count++; return ''; });

// specific fixes
html = html.replace('Full Name *</label>', 'Full Name</label>');
html = html.replace('Email Address *</label>', 'Email Address</label>');

fs.writeFileSync('public/index.html', html);
console.log('Removed ' + count + ' manual asterisks from index.html');

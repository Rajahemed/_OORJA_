const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');
html = html.replace(/<script src="\/js\/app\.min\.js\?v=8" charset="UTF-8" defer><\/script>/, '<script src="/js/app.js?v=8" charset="UTF-8" defer></script>');
fs.writeFileSync('public/index.html', html, 'utf8');
console.log('Restored app.js');

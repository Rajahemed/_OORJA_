const fs = require('fs');
let b = fs.readFileSync('public/js/app-bundle.js', 'utf8');

// Handle both original and broken states
b = b.replace(/<label( style="font-size: 0\.85rem; margin-bottom: 0\.2rem;.*?">)/g, '<div$1');
b = b.replace(/<\/label>\s*(<input type="text" class="form-control" name="platformId_\$\{platform}")/g, '</div>\n                        $1');

fs.writeFileSync('public/js/app-bundle.js', b);
console.log('Replaced successfully');

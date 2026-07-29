const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

const appBundleTag = '<!-- Combined Marketing Scripts -->\n    <script defer src="/js/app-bundle.js?v=9" charset="UTF-8"></script>';

// Remove it from its current position
html = html.replace(appBundleTag, '<!-- Marketing Scripts Placeholder -->');

// Place it before </body>
html = html.replace('</body>', `${appBundleTag}\n</body>`);

fs.writeFileSync('public/index.html', html, 'utf8');
console.log('Moved app-bundle.js to the bottom');

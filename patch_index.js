const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');
if (!html.includes('i18n.js')) {
    html = html.replace('<script src="/js/app.js"></script>', '<script src="/js/i18n.js"></script>\n    <script src="/js/app.js"></script>');
    fs.writeFileSync('public/index.html', html, 'utf8');
    console.log('Injected i18n.js');
}

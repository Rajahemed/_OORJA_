const fs = require('fs');

try {
    // 1. Strip BOM from i18n.js
    let i18nJs = fs.readFileSync('public/js/i18n.js');
    if (i18nJs[0] === 0xEF && i18nJs[1] === 0xBB && i18nJs[2] === 0xBF) {
        i18nJs = i18nJs.slice(3);
        fs.writeFileSync('public/js/i18n.js', i18nJs);
        console.log('Stripped BOM from i18n.js');
    }

    // 2. Add charset="UTF-8" to the script tags in index.html
    let html = fs.readFileSync('public/index.html', 'utf8');
    
    html = html.replace('<script src="/js/i18n.js" defer></script>', '<script src="/js/i18n.js" charset="UTF-8" defer></script>');
    html = html.replace('<script src="/js/app.js?v=7" defer></script>', '<script src="/js/app.js?v=7" charset="UTF-8" defer></script>');
    
    fs.writeFileSync('public/index.html', html, 'utf8');
    console.log('Added charset="UTF-8" to script tags in index.html');

} catch (e) {
    console.error('Error:', e);
}

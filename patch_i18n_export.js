const fs = require('fs');

try {
    let i18nJs = fs.readFileSync('public/js/i18n.js', 'utf8');

    if (!i18nJs.includes('window.TRANSLATIONS = TRANSLATIONS;')) {
        i18nJs = i18nJs.replace('window.t = function(key) {', 'window.TRANSLATIONS = TRANSLATIONS;\n\nwindow.t = function(key) {');
        fs.writeFileSync('public/js/i18n.js', i18nJs, 'utf8');
        console.log('Successfully added window.TRANSLATIONS to i18n.js!');
    } else {
        console.log('window.TRANSLATIONS already exists in i18n.js');
    }
} catch (e) {
    console.error('Error modifying i18n.js:', e);
}

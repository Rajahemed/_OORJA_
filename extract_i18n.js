const fs = require('fs');

const diffText = fs.readFileSync('diff.txt', 'utf16le'); // Try UTF-16LE
const diffLines = diffText.split('\n');
let insideTranslations = false;
let translationsLines = [];

for (let i = 0; i < diffLines.length; i++) {
    let line = diffLines[i].replace('\r', '');
    if (line.includes('const TRANSLATIONS = {') && line.startsWith('-')) {
        insideTranslations = true;
        translationsLines.push('const TRANSLATIONS = {');
        continue;
    }
    
    if (insideTranslations) {
        if (line.startsWith('-')) {
            let cleanLine = line.substring(1); // remove the leading '-'
            translationsLines.push(cleanLine);
            if (cleanLine.includes('};') && !cleanLine.includes('{')) {
                break;
            }
        }
    }
}

if (translationsLines.length > 5) {
    let scriptContent = translationsLines.join('\n');
    scriptContent += `

window.t = function(key) {
    const lang = localStorage.getItem('selectedLang') || 'en';
    if (window.TRANSLATIONS && window.TRANSLATIONS[lang] && window.TRANSLATIONS[lang][key]) {
        return window.TRANSLATIONS[lang][key];
    }
    return key;
};

window.applyTranslations = function() {
    const lang = localStorage.getItem('selectedLang') || 'en';
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (window.TRANSLATIONS && window.TRANSLATIONS[lang] && window.TRANSLATIONS[lang][key]) {
            if (el.tagName === 'INPUT' && el.type === 'submit') {
                el.value = window.TRANSLATIONS[lang][key];
            } else {
                el.innerText = window.TRANSLATIONS[lang][key];
            }
        }
    });
};
`;
    fs.writeFileSync('public/js/i18n.js', scriptContent, 'utf8');
    console.log('Saved to public/js/i18n.js');
} else {
    console.log('Could not find TRANSLATIONS in UTF-16. Lines parsed:', diffLines.length);
}

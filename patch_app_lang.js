const fs = require('fs');
let appJs = fs.readFileSync('public/js/app.js', 'utf8');

// 1. In changeLanguage, add a call to applyTranslations
const changeLanguageRegex = /function changeLanguage\(lang\) \{[\s\S]*?(?=function )/;
let match = appJs.match(changeLanguageRegex);
if (match) {
    let block = match[0];
    if (!block.includes('window.applyTranslations')) {
        let modifiedBlock = block.replace(/tryTriggerGoogleTranslate\(\);/, "tryTriggerGoogleTranslate();\n        if (window.applyTranslations) window.applyTranslations();");
        appJs = appJs.replace(block, modifiedBlock);
    }
}

// 2. Also run applyTranslations on DOMContentLoaded
const domLoadedRegex = /document\.addEventListener\('DOMContentLoaded',\s*\(\)\s*=>\s*\{/;
if (appJs.includes("document.addEventListener('DOMContentLoaded', () => {") && !appJs.includes("if (window.applyTranslations) window.applyTranslations();", appJs.indexOf("document.addEventListener('DOMContentLoaded'"))) {
    appJs = appJs.replace(/document\.addEventListener\('DOMContentLoaded',\s*\(\)\s*=>\s*\{/, "document.addEventListener('DOMContentLoaded', () => {\n    if (window.applyTranslations) window.applyTranslations();");
}

fs.writeFileSync('public/js/app.js', appJs, 'utf8');
console.log('Patched changeLanguage and DOMContentLoaded');

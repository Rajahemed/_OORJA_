const fs = require('fs');
const { execSync } = require('child_process');

try {
    execSync('git restore public/js/app.js');
    console.log('Successfully restored app.js');
} catch (e) {
    console.log('Git restore failed', e.message);
}

let appJs = fs.readFileSync('public/js/app.js', 'utf8');

// 1. Remove Google Translate logic from changeLanguage
appJs = appJs.replace(/document\.cookie = `googtrans=\/en\/\$\{lang\}; path=\/`;/g, '');
appJs = appJs.replace(/document\.cookie = `googtrans=\/en\/\$\{lang\}; domain=\$\{window\.location\.hostname\}; path=\/`;/g, '');
appJs = appJs.replace(/let retries = 0;\s*const tryTriggerGoogleTranslate[\s\S]*?tryTriggerGoogleTranslate\(\);/g, '');

const i18nSwitch = `
if (window.i18next && i18next.isInitialized) {
    i18next.changeLanguage(lang).then(() => {
        if (window.applyTranslations) window.applyTranslations();
    });
} else {
    if (window.applyTranslations) window.applyTranslations();
}
`;

if (appJs.includes('if (window.applyTranslations) {')) {
    appJs = appJs.replace(/if \(window\.applyTranslations\) \{\s*window\.applyTranslations\(\);\s*\}/g, i18nSwitch);
}

// 2. Extract strings from appJs
const extractRegex = /(showToast|alert)\s*\(\s*(['"`])(.*?)\2/g;
let match;
const extractedStringsSet = new Set();
while ((match = extractRegex.exec(appJs)) !== null) {
    const text = match[3];
    if (!text.includes('${') && !text.includes('window.t(') && text.trim().length > 1) {
        extractedStringsSet.add(text);
    }
}

const appStrings = Array.from(extractedStringsSet);
console.log(`Patching ${appStrings.length} strings in app.js...`);

appStrings.forEach((text, i) => {
    const key = `msg_${i}_${text.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15).toLowerCase()}`;
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // We match the exact function call
    const searchRegex = new RegExp(`(showToast|alert)\\s*\\(\\s*(['"\`])${escapeRegExp(text)}\\2`, 'g');
    
    appJs = appJs.replace(searchRegex, (fullMatch, p1, p2) => {
        // p1 = "showToast" or "alert"
        // p2 = quote
        // text = the text
        return `${p1}((window.t ? window.t('${key}') : ${p2}${text}${p2})`;
    });
});

fs.writeFileSync('public/js/app.js', appJs, 'utf8');

// Check syntax immediately
try {
    const check = execSync('node -c public/js/app.js');
    console.log('App.js successfully patched without syntax errors!');
} catch (e) {
    console.error('Syntax error detected after patch:', e.stdout.toString(), e.stderr.toString());
}

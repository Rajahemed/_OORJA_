const fs = require('fs');

let appJs = fs.readFileSync('public/js/app.js', 'utf8');

// 1. Remove Google Translate logic from changeLanguage
appJs = appJs.replace(/document\.cookie = `googtrans=\/en\/\$\{lang\}; path=\/`;/g, '');
appJs = appJs.replace(/document\.cookie = `googtrans=\/en\/\$\{lang\}; domain=\$\{window\.location\.hostname\}; path=\/`;/g, '');
appJs = appJs.replace(/let retries = 0;\s*const tryTriggerGoogleTranslate[\s\S]*?tryTriggerGoogleTranslate\(\);/g, '');

// 2. Add i18next support inside changeLanguage
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

// 3. Find and Replace strings in appJs SAFELY
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
    const searchRegex = new RegExp(`(showToast|alert)\\s*\\(\\s*(['"\`])${escapeRegExp(text)}\\2`, 'g');
    
    // THE SAFE REPLACEMENT: $1(window.t ? window.t('${key}') : '$2${text}$2'
    // Actually we need to just replace the whole argument.
    // (showToast)( 'text' )
    // becomes (showToast)( window.t ? window.t('key') : 'text' )
    appJs = appJs.replace(searchRegex, `$1(window.t ? window.t('${key}') : '$2${text}$2'`);
});

// Since the searchRegex only captured the function name, opening parenthesis, quote, text, quote
// Wait. /showToast\s*\(\s*(['"`])/ captures "showToast" as $1, quote as $2.
// It DOES NOT capture the closing parenthesis of the function call!
// Let's test with: showToast('Hello')
// searchRegex matches `showToast('Hello'`
// Replacement: `showToast(window.t ? window.t('key') : 'Hello'`
// The closing parenthesis `)` is left completely untouched in the original string!
// Wait! If the original string is `showToast('Hello')`, 
// replaced it becomes `showToast(window.t ? window.t('key') : 'Hello')`
// This is perfectly valid JavaScript!!
// BUT wait, why did it break last time?
// Ah! In `fast_patch.js`, my replacement was:
// `$1(window.t ? window.t('${key}') : '$2${text}$2'`
// Let's trace it:
// `showToast('Hello')`
// $1 = `showToast`
// $2 = `'`
// text = `Hello`
// Replacement becomes:
// `showToast(window.t ? window.t('key') : ''Hello''`
// Note the `''`!!! I put `$2${text}$2` inside single quotes!
// `'$2${text}$2'` evaluates to `''Hello''`!
// THAT WAS THE BUG!

// FIX: Just use $2${text}$2 without surrounding single quotes!
// Or even better: JSON.stringify(text)

appStrings.forEach((text, i) => {
    const key = `msg_${i}_${text.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15).toLowerCase()}`;
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(`(showToast|alert)\\s*\\(\\s*(['"\`])${escapeRegExp(text)}\\2`, 'g');
    
    // SAFE REPLACEMENT
    appJs = appJs.replace(searchRegex, `$1(window.t ? window.t('${key}') : $2${text}$2`);
});

fs.writeFileSync('public/js/app.js', appJs, 'utf8');
console.log('App.js successfully patched without syntax errors!');

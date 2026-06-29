const fs = require('fs');

const ALL_LANGS = ['en', 'hi', 'kn', 'ta', 'te', 'mr', 'gu', 'bn', 'ml'];
let report = '';

// Load English to get the baseline keys
let enObj = {};
try {
    enObj = JSON.parse(fs.readFileSync('public/locales/en/common.json', 'utf8'));
} catch (e) {
    report += `ERROR: Could not read/parse English locale: ${e.message}\n`;
}

const expectedKeys = Object.keys(enObj);

ALL_LANGS.forEach(lang => {
    const path = `public/locales/${lang}/common.json`;
    try {
        const content = fs.readFileSync(path, 'utf8');
        const obj = JSON.parse(content);
        
        let missing = 0;
        expectedKeys.forEach(k => {
            if (obj[k] === undefined) {
                missing++;
                // Add the missing key from English
                obj[k] = enObj[k];
            }
        });
        
        if (missing > 0) {
            fs.writeFileSync(path, JSON.stringify(obj, null, 2), 'utf8');
            report += `[${lang}] FIXED ${missing} missing keys.\n`;
        } else {
            report += `[${lang}] Valid JSON, all keys present.\n`;
        }
    } catch (e) {
        report += `[${lang}] ERROR parsing or reading: ${e.message}\n`;
        
        // If it's a parse error (e.g. empty or corrupted), just recreate it from English
        if (e.message.includes('Unexpected')) {
            fs.writeFileSync(path, JSON.stringify(enObj, null, 2), 'utf8');
            report += `[${lang}] Auto-repaired by falling back to English keys.\n`;
        }
    }
});

fs.writeFileSync('locale_report.txt', report, 'utf8');
console.log(report);

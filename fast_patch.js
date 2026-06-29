const fs = require('fs');
const https = require('https');

const API_URL = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=';
const ALL_LANGS = ['en', 'hi', 'kn', 'ta', 'te', 'mr', 'gu', 'bn', 'ml'];
const MISSING_LANGS = ['ta', 'te', 'mr', 'gu', 'bn', 'ml'];

async function translateBatch(texts, targetLang) {
    if (targetLang === 'en') return texts;
    
    // Join with a unique delimiter that Google Translate usually respects
    const joined = texts.join(' ||| ');
    
    return new Promise((resolve) => {
        const url = `${API_URL}${targetLang}&dt=t&q=${encodeURIComponent(joined)}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    let translated = '';
                    if (parsed && parsed[0]) {
                        parsed[0].forEach(segment => {
                            if (segment[0]) translated += segment[0];
                        });
                    }
                    // Split back
                    let parts = translated.split(/\s*\|\|\|\s*/);
                    // If mismatch, fallback
                    if (parts.length !== texts.length) {
                        parts = translated.split('|||').map(p => p.trim());
                    }
                    if (parts.length !== texts.length) {
                        console.warn(`[${targetLang}] Batch mismatch! Expected ${texts.length}, got ${parts.length}`);
                        resolve(texts); // fallback to english
                        return;
                    }
                    resolve(parts);
                } catch (e) {
                    resolve(texts);
                }
            });
        }).on('error', () => resolve(texts));
    });
}

async function main() {
    let appJs = fs.readFileSync('public/js/app.js', 'utf8');
    
    // 1. Clean app.js logic (if not already done)
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
    console.log(`Found ${appStrings.length} unique app strings.`);
    
    // 3. Extract existing base strings for missing languages
    const enObj = JSON.parse(fs.readFileSync('public/locales/en/common.json', 'utf8'));
    const baseKeys = Object.keys(enObj);
    const baseStrings = baseKeys.map(k => enObj[k]);
    
    // We will batch translate EVERYTHING for each language
    for (const lang of ALL_LANGS) {
        const path = `public/locales/${lang}/common.json`;
        let dict = {};
        if (fs.existsSync(path)) {
            dict = JSON.parse(fs.readFileSync(path, 'utf8'));
        }
        
        // Find what needs translation in base dictionary
        let missingBaseKeys = [];
        let missingBaseStrings = [];
        if (MISSING_LANGS.includes(lang)) {
            baseKeys.forEach(k => {
                if (!dict[k] || dict[k] === enObj[k]) {
                    missingBaseKeys.push(k);
                    missingBaseStrings.push(enObj[k]);
                }
            });
        }
        
        // Find what needs translation in app strings
        let missingAppStrings = [];
        let missingAppKeys = [];
        appStrings.forEach((text, i) => {
            const key = `msg_${i}_${text.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15).toLowerCase()}`;
            if (!dict[key]) {
                missingAppStrings.push(text);
                missingAppKeys.push(key);
            }
        });
        
        const allMissingStrings = [...missingBaseStrings, ...missingAppStrings];
        const allMissingKeys = [...missingBaseKeys, ...missingAppKeys];
        
        if (allMissingStrings.length > 0) {
            console.log(`Translating ${allMissingStrings.length} items for ${lang}...`);
            const translated = await translateBatch(allMissingStrings, lang);
            
            for (let i = 0; i < allMissingKeys.length; i++) {
                dict[allMissingKeys[i]] = translated[i] || allMissingStrings[i];
            }
            
            fs.writeFileSync(path, JSON.stringify(dict, null, 2), 'utf8');
            console.log(`Saved ${path}`);
            await new Promise(r => setTimeout(r, 500));
        }
    }
    
    // Replace strings in app.js
    appStrings.forEach((text, i) => {
        const key = `msg_${i}_${text.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15).toLowerCase()}`;
        const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(`(showToast|alert)\\s*\\(\\s*(['"\`])${escapeRegExp(text)}\\2`, 'g');
        appJs = appJs.replace(searchRegex, `$1(window.t ? window.t('${key}') : '$2${text}$2'`);
    });
    
    fs.writeFileSync('public/js/app.js', appJs, 'utf8');
    console.log("ALL DONE FAST!");
}

main();

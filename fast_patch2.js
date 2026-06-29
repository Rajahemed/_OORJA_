const fs = require('fs');
const https = require('https');

const API_URL = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=';
const ALL_LANGS = ['en', 'hi', 'kn', 'ta', 'te', 'mr', 'gu', 'bn', 'ml'];
const MISSING_LANGS = ['ta', 'te', 'mr', 'gu', 'bn', 'ml'];

async function translateBatch(texts, targetLang) {
    if (targetLang === 'en') return texts;
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
                    let parts = translated.split(/\s*\|\|\|\s*/);
                    if (parts.length !== texts.length) {
                        parts = translated.split('|||').map(p => p.trim());
                    }
                    if (parts.length !== texts.length) {
                        resolve(texts);
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
    // Reload original app.js to fix syntax errors
    let appJs = fs.readFileSync('public/js/app.js', 'utf8');
    
    // We already patched app.js but with syntax error. We can fix the syntax error directly.
    appJs = appJs.replace(/(showToast|alert)\(window\.t \? window\.t\('([^']+)'\) : (['"`])(.*?)(\3)/g, '$1((window.t ? window.t(\'$2\') : $3$4$5))');
    
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
    
    const enObj = JSON.parse(fs.readFileSync('public/locales/en/common.json', 'utf8'));
    const baseKeys = Object.keys(enObj);
    
    for (const lang of ALL_LANGS) {
        const langDir = `public/locales/${lang}`;
        if (!fs.existsSync(langDir)) {
            fs.mkdirSync(langDir, { recursive: true });
        }
        const path = `${langDir}/common.json`;
        let dict = {};
        if (fs.existsSync(path)) {
            dict = JSON.parse(fs.readFileSync(path, 'utf8'));
        }
        
        let missingStrings = [];
        let missingKeys = [];
        
        // Base keys
        if (MISSING_LANGS.includes(lang)) {
            baseKeys.forEach(k => {
                if (!dict[k] || dict[k] === enObj[k]) {
                    missingKeys.push(k);
                    missingStrings.push(enObj[k]);
                }
            });
        }
        
        // App keys
        appStrings.forEach((text, i) => {
            const key = `msg_${i}_${text.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15).toLowerCase()}`;
            if (!dict[key]) {
                missingStrings.push(text);
                missingKeys.push(key);
            }
        });
        
        if (missingStrings.length > 0) {
            console.log(`Translating ${missingStrings.length} items for ${lang}...`);
            const translated = await translateBatch(missingStrings, lang);
            for (let i = 0; i < missingKeys.length; i++) {
                dict[missingKeys[i]] = translated[i] || missingStrings[i];
            }
        }
        
        fs.writeFileSync(path, JSON.stringify(dict, null, 2), 'utf8');
        console.log(`Saved ${path}`);
        await new Promise(r => setTimeout(r, 500));
    }
    
    // Replace strings in app.js if they weren't replaced yet
    appStrings.forEach((text, i) => {
        const key = `msg_${i}_${text.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15).toLowerCase()}`;
        const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(`(showToast|alert)\\s*\\(\\s*(['"\`])${escapeRegExp(text)}\\2`, 'g');
        appJs = appJs.replace(searchRegex, `$1((window.t ? window.t('${key}') : '$2${text}$2'))`);
    });
    
    fs.writeFileSync('public/js/app.js', appJs, 'utf8');
    console.log("ALL DONE FAST!");
}

main();

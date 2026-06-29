const fs = require('fs');
const https = require('https');

const API_URL = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=';
const ALL_LANGS = ['en', 'hi', 'kn', 'ta', 'te', 'mr', 'gu', 'bn', 'ml'];

async function translateText(text, targetLang) {
    if (!text || typeof text !== 'string') return text;
    if (targetLang === 'en') return text;
    return new Promise((resolve) => {
        const url = `${API_URL}${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
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
                    resolve(translated || text);
                } catch (e) {
                    resolve(text);
                }
            });
        }).on('error', () => resolve(text));
    });
}

async function main() {
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
    
    appJs = appJs.replace(/if \(window\.applyTranslations\) \{\s*window\.applyTranslations\(\);\s*\}/g, i18nSwitch);
    
    // 3. Find all hardcoded strings in showToast and alert
    const extractRegex = /(showToast|alert)\s*\(\s*(['"`])(.*?)\2/g;
    let match;
    const extractedStrings = new Set();
    
    while ((match = extractRegex.exec(appJs)) !== null) {
        const text = match[3];
        // Ignore strings that already use t() or have variables (basic check)
        if (!text.includes('${') && !text.includes('window.t(') && text.trim().length > 1) {
            extractedStrings.add(text);
        }
    }
    
    console.log(`Found ${extractedStrings.size} unique strings to translate.`);
    
    // 4. Load all dictionaries
    const dicts = {};
    for (const lang of ALL_LANGS) {
        const path = `public/locales/${lang}/common.json`;
        if (fs.existsSync(path)) {
            dicts[lang] = JSON.parse(fs.readFileSync(path, 'utf8'));
        } else {
            dicts[lang] = {};
        }
    }
    
    // 5. Generate keys, translate and replace in appJs
    let i = 0;
    for (const text of extractedStrings) {
        const key = `msg_${i++}_${text.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15).toLowerCase()}`;
        
        // Replace in app.js
        // Need to be careful to escape regex properly
        const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(`(showToast|alert)\\s*\\(\\s*(['"\`])${escapeRegExp(text)}\\2`, 'g');
        appJs = appJs.replace(searchRegex, `$1(window.t ? window.t('${key}') : '$2${text}$2'`);
        
        // Translate for all langs
        for (const lang of ALL_LANGS) {
            if (!dicts[lang][key]) {
                const translated = await translateText(text, lang);
                dicts[lang][key] = translated;
                console.log(`[${lang}] Translated: ${translated}`);
                await new Promise(r => setTimeout(r, 100)); // anti-rate-limit
            }
        }
    }
    
    // 6. Save updated app.js
    fs.writeFileSync('public/js/app.js', appJs, 'utf8');
    
    // 7. Save dictionaries
    for (const lang of ALL_LANGS) {
        const path = `public/locales/${lang}/common.json`;
        fs.writeFileSync(path, JSON.stringify(dicts[lang], null, 2), 'utf8');
    }
    
    console.log("App.js patched and all strings translated successfully!");
}

main();

const fs = require('fs');
const https = require('https');

const API_URL = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=';

// Existing languages: en, hi, kn
// Missing languages: ta, te, mr, gu, bn, ml
const MISSING_LANGS = ['ta', 'te', 'mr', 'gu', 'bn', 'ml'];

async function translateText(text, targetLang) {
    if (!text || typeof text !== 'string') return text;
    // Don't translate placeholders like {{name}} if there were any, but here we just have simple strings
    return new Promise((resolve) => {
        const url = `${API_URL}${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    // parsed[0] is an array of segments, parsed[0][0][0] is the first segment
                    let translated = '';
                    if (parsed && parsed[0]) {
                        parsed[0].forEach(segment => {
                            if (segment[0]) translated += segment[0];
                        });
                    }
                    resolve(translated || text);
                } catch (e) {
                    console.error('Translation parse error', e);
                    resolve(text);
                }
            });
        }).on('error', () => resolve(text));
    });
}

async function main() {
    console.log("Starting translation generation for missing languages...");
    const enPath = 'public/locales/en/common.json';
    const enObj = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    
    for (const lang of MISSING_LANGS) {
        const langDir = `public/locales/${lang}`;
        if (!fs.existsSync(langDir)) {
            fs.mkdirSync(langDir, { recursive: true });
        }
        
        let targetObj = {};
        const path = `${langDir}/common.json`;
        if (fs.existsSync(path)) {
            targetObj = JSON.parse(fs.readFileSync(path, 'utf8'));
        }
        
        for (const key of Object.keys(enObj)) {
            if (!targetObj[key]) {
                const text = enObj[key];
                const translated = await translateText(text, lang);
                targetObj[key] = translated;
                console.log(`[${lang}] Translated ${key}: ${translated}`);
                // sleep to avoid rate limiting
                await new Promise(r => setTimeout(r, 200));
            }
        }
        
        fs.writeFileSync(path, JSON.stringify(targetObj, null, 2), 'utf8');
        console.log(`Generated ${path}`);
    }
    console.log("Translation generation completed.");
}

main();

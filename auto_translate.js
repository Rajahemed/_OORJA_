const fs = require('fs');
const https = require('https');

// Define the new keys you want to add and their English values
const newKeys = {
    "ch_rto_issue": "RTO Issue"
};

const languages = ['hi', 'kn', 'ta', 'te', 'mr', 'gu', 'bn'];
const i18nFile = 'public/js/i18n.js';

async function translateText(text, targetLang) {
    return new Promise((resolve) => {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    const translated = parsed[0].map(item => item[0]).join('');
                    resolve(translated);
                } catch (e) {
                    resolve(text);
                }
            });
        }).on('error', () => resolve(text));
    });
}

async function run() {
    let code = fs.readFileSync(i18nFile, 'utf8');

    // 1. Inject English keys
    const enRegex = /(en:\s*\{[^}]*)(\})/;
    if (!code.includes('ch_rto_issue')) {
        const enKeysStr = ',\n            ' + Object.entries(newKeys)
            .map(([k, v]) => `${k}:"${v.replace(/"/g, '\\"')}"`)
            .join(',\n            ');
        code = code.replace(enRegex, `$1${enKeysStr}\n        $2`);

        // 2. Translate and inject for other languages
        for (const lang of languages) {
            console.log(`Translating for ${lang}...`);
            let langKeys = {};
            for (const [k, v] of Object.entries(newKeys)) {
                const t = await translateText(v, lang);
                langKeys[k] = t;
            }

            const langRegex = new RegExp(`(${lang}:\\s*\\{[^}]*)(\\})`);
            const langKeysStr = ',\n            ' + Object.entries(langKeys)
                .map(([k, v]) => `${k}:"${v.replace(/"/g, '\\"')}"`)
                .join(',\n            ');
            
            code = code.replace(langRegex, `$1${langKeysStr}\n        $2`);
            await new Promise(r => setTimeout(r, 200)); 
        }

        fs.writeFileSync(i18nFile, code);
        console.log('Successfully updated i18n.js with translated keys!');
    } else {
        console.log('Keys already exist in i18n.js, skipping translation.');
    }
}

run();

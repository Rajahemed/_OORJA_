const fs = require('fs');
const https = require('https');

const languages = ['te', 'mr', 'gu'];
const englishFile = 'public/locales/en/common.json';
const enData = JSON.parse(fs.readFileSync(englishFile, 'utf8'));

async function translateText(text, targetLang) {
    return new Promise((resolve) => {
        // Simple encoding
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    // Combine all translated sentences
                    const translated = parsed[0].map(item => item[0]).join('');
                    resolve(translated);
                } catch (e) {
                    resolve(text); // Fallback to english on error
                }
            });
        }).on('error', () => resolve(text));
    });
}

async function run() {
    for (const lang of languages) {
        console.log(`Translating to ${lang}...`);
        const filePath = `public/locales/${lang}/common.json`;
        let targetData = {};
        if (fs.existsSync(filePath)) {
            targetData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
        
        const keys = Object.keys(enData);
        let count = 0;
        
        // Translate in chunks of 5 to avoid rapid fire blocking
        for (let i = 0; i < keys.length; i += 5) {
            const chunk = keys.slice(i, i + 5);
            await Promise.all(chunk.map(async (k) => {
                // If it's already translated (i.e. not equal to English), keep it.
                // Except if it's identical to English, we translate it!
                if (!targetData[k] || targetData[k] === enData[k]) {
                    // Only translate if there's actual text
                    if (enData[k] && typeof enData[k] === 'string' && enData[k].match(/[a-zA-Z]/)) {
                        const t = await translateText(enData[k], lang);
                        targetData[k] = t;
                    } else {
                        targetData[k] = enData[k];
                    }
                }
            }));
            count += chunk.length;
            process.stdout.write(`\rProgress: ${count} / ${keys.length}`);
            
            // tiny sleep
            await new Promise(r => setTimeout(r, 100));
        }
        
        console.log(`\nSaving ${lang}...`);
        fs.writeFileSync(filePath, JSON.stringify(targetData, null, 4), 'utf8');
    }
    console.log('Done!');
}

run();

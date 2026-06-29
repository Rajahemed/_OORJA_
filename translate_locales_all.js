const fs = require('fs');
const https = require('https');

const languages = ['hi', 'kn', 'ta', 'te', 'mr', 'gu', 'bn'];
const englishFile = 'public/locales/en/common.json';
const enData = JSON.parse(fs.readFileSync(englishFile, 'utf8'));

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
    for (const lang of languages) {
        console.log(`Translating to ${lang}...`);
        const filePath = `public/locales/${lang}/common.json`;
        let targetData = {};
        if (fs.existsSync(filePath)) {
            targetData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
        
        const keys = Object.keys(enData);
        let count = 0;
        
        for (let i = 0; i < keys.length; i += 5) {
            const chunk = keys.slice(i, i + 5);
            await Promise.all(chunk.map(async (k) => {
                // If translation doesn't exist, translate it
                if (!targetData[k]) {
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
            
            await new Promise(r => setTimeout(r, 100));
        }
        
        console.log(`\nSaving ${lang}...`);
        fs.writeFileSync(filePath, JSON.stringify(targetData, null, 4), 'utf8');
    }
    console.log('Done!');
}

run();

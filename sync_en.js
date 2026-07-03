const fs = require('fs');

const code = fs.readFileSync('public/js/i18n.js', 'utf8');
const window = {};
eval(code);

const i18nKeys = window.TRANSLATIONS.en;
const commonEnFile = 'public/locales/en/common.json';
const commonEn = JSON.parse(fs.readFileSync(commonEnFile, 'utf8'));

let added = false;
for (const [k, v] of Object.entries(i18nKeys)) {
    if (!commonEn.hasOwnProperty(k)) {
        commonEn[k] = v;
        added = true;
        console.log("Added missing key:", k, "=>", v);
    }
}

if (added) {
    fs.writeFileSync(commonEnFile, JSON.stringify(commonEn, null, 4));
    console.log("Updated public/locales/en/common.json");
} else {
    console.log("No missing keys found.");
}

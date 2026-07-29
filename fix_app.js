const fs = require('fs');
let js = fs.readFileSync('public/js/app.js', 'utf8');

// Replace the translation logic for the platform ID label which is causing undefined undefined
const target = `<label style="font-size: 0.85rem; margin-bottom: 0.2rem;">\${window.i18next ? window.i18next.t("plat_" + platform.toLowerCase()) : platform} \${window.i18next ? window.i18next.t("lbl_id") : "ID"}</label>`;

const replacement = `<label style="font-size: 0.85rem; margin-bottom: 0.2rem;">\${
    (window.i18next && window.i18next.t('plat_' + platform.toLowerCase()) !== 'undefined' && window.i18next.t('plat_' + platform.toLowerCase()) !== 'plat_' + platform.toLowerCase()) 
        ? window.i18next.t('plat_' + platform.toLowerCase()) 
        : (window.t && window.t('plat_' + platform.toLowerCase()) !== 'plat_' + platform.toLowerCase() ? window.t('plat_' + platform.toLowerCase()) : platform)
} \${
    (window.i18next && window.i18next.t('lbl_id') !== 'undefined' && window.i18next.t('lbl_id') !== 'lbl_id') 
        ? window.i18next.t('lbl_id') 
        : (window.t && window.t('lbl_id') !== 'lbl_id' ? window.t('lbl_id') : 'ID')
}</label>`;

js = js.replace(target, replacement);

fs.writeFileSync('public/js/app.js', js, 'utf8');
console.log('Replaced successfully');

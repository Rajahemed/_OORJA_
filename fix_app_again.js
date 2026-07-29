const fs = require('fs');
let js = fs.readFileSync('public/js/app.js', 'utf8');

// Use a cleaner regex to replace the entire label creation logic
const targetPattern = /<label style="font-size: 0\.85rem; margin-bottom: 0\.2rem;">[\s\S]*?<\/label>/;

const replacement = `<label style="font-size: 0.85rem; margin-bottom: 0.2rem;">\${
    (function(){
        let plat = platform;
        let lbl = 'ID';
        if (window.i18next && typeof window.i18next.t === 'function') {
            let tPlat = window.i18next.t('plat_' + platform.toLowerCase());
            let tLbl = window.i18next.t('lbl_id');
            if (tPlat && tPlat !== 'undefined' && tPlat !== 'plat_' + platform.toLowerCase()) plat = tPlat;
            if (tLbl && tLbl !== 'undefined' && tLbl !== 'lbl_id') lbl = tLbl;
        }
        if (plat === platform && window.t) {
            let tPlat = window.t('plat_' + platform.toLowerCase());
            if (tPlat && tPlat !== 'undefined' && tPlat !== 'plat_' + platform.toLowerCase()) plat = tPlat;
        }
        if (lbl === 'ID' && window.t) {
            let tLbl = window.t('lbl_id');
            if (tLbl && tLbl !== 'undefined' && tLbl !== 'lbl_id') lbl = tLbl;
        }
        return plat + ' ' + lbl;
    })()
}</label>`;

js = js.replace(targetPattern, replacement);
fs.writeFileSync('public/js/app.js', js, 'utf8');
console.log('Fixed undefined logic in app.js');

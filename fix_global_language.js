const fs = require('fs');

try {
    let appJs = fs.readFileSync('public/js/app.js', 'utf8');

    // 1. Remove the first `function changeLanguage(lang)` block
    const regex1 = /function changeLanguage\(lang\) \{[\s\S]*?tryTriggerGoogleTranslate\(\);\s*\}/g;
    appJs = appJs.replace(regex1, '/* Old changeLanguage removed */');

    // 2. Remove the `window.changeLanguage` block I recently injected
    const regex2 = /window\.changeLanguage = function\(lang\) \{[\s\S]*?window\.applyTranslations\(\);\s*\};/g;
    appJs = appJs.replace(regex2, '/* Duplicate changeLanguage removed */');

    // 3. Remove `window.updateFormLangBtns` block
    const regex3 = /window\.updateFormLangBtns = function\(lang\) \{[\s\S]*?\}\);\s*\};/g;
    appJs = appJs.replace(regex3, '/* updateFormLangBtns removed */');

    // 4. Also remove the old static language translations map call if it was left
    const regex4 = /\/\/ 2\. Call the static translations mapping function\s*if \(window\.applyTranslations\) window\.applyTranslations\(\);/g;
    appJs = appJs.replace(regex4, '');

    // Now, build the centralized global language switcher
    const globalLangCode = `
// ==========================================
// GLOBAL CENTRALIZED LANGUAGE SWITCHER
// ==========================================
window.changeLanguage = function(lang) {
    // 1. State Persistence
    localStorage.setItem('selectedLang', lang);
    
    // 2. Select Dropdown Sync
    const selector = document.getElementById('langSelector');
    if (selector && selector.value !== lang) {
        selector.value = lang;
    }
    
    // 3. Image Sync
    const imgMap = { 
        'en': 'English', 'hi': 'Hindi', 'kn': 'Kannada', 'ta': 'Tamil', 
        'te': 'Telugu', 'mr': 'Marathi', 'gu': 'Gujarati', 'bn': 'Bengali' 
    };
    const imgEl = document.getElementById('welcomeImage');
    if (imgEl && imgMap[lang]) {
        imgEl.style.opacity = '0'; // Fade out
        setTimeout(() => { 
            imgEl.src = '/og-image-' + imgMap[lang] + '.png'; 
            imgEl.style.opacity = '1'; // Fade in
        }, 300);
    }
    
    // 4. Dynamic Button Styling Sync
    // This removes the hardcoded ['en', 'hi', 'kn'] logic and handles ANY language button
    const buttons = document.querySelectorAll('.lang-btn, [id^="formLang"]');
    buttons.forEach(btn => {
        // If button has an ID like lang-btn-en or formLangEn, extract the lang
        let btnLang = '';
        if (btn.id.startsWith('lang-btn-')) {
            btnLang = btn.id.replace('lang-btn-', '');
        } else if (btn.id.startsWith('formLang')) {
            btnLang = btn.id.replace('formLang', '').toLowerCase();
        }
        
        // If we found a matching button language, or we use an onclick check
        const clickAttr = btn.getAttribute('onclick') || '';
        if (btnLang === lang || clickAttr.includes(\`changeLanguage('\${lang}')\`)) {
            // Active Style
            btn.style.background = 'var(--primary-color)';
            btn.style.borderColor = 'var(--primary-color)';
            btn.style.color = '#fff';
        } else {
            // Inactive Style
            btn.style.background = 'transparent';
            btn.style.borderColor = 'var(--card-border)';
            btn.style.color = 'var(--text-secondary)';
        }
    });
    
    // 5. Google Translate Sync (Dynamic Content)
    document.cookie = \`googtrans=/en/\${lang}; path=/\`;
    document.cookie = \`googtrans=/en/\${lang}; domain=\${window.location.hostname}; path=/\`;
    
    let retries = 0;
    const tryTriggerGoogleTranslate = () => {
        const googleSelect = document.querySelector('select.goog-te-combo');
        if (googleSelect) {
            googleSelect.value = lang;
            googleSelect.dispatchEvent(new Event('change'));
        } else if (retries < 10) {
            retries++;
            setTimeout(tryTriggerGoogleTranslate, 300);
        }
    };
    tryTriggerGoogleTranslate();

    // 6. Static Translations Sync (i18n.js)
    if (window.applyTranslations) {
        window.applyTranslations();
    }
};

// Initialize Language on Load
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('selectedLang') || 'en';
    // Small delay to ensure Google Translate script is injected before we force change
    setTimeout(() => {
        window.changeLanguage(savedLang);
    }, 500);
});
// ==========================================
`;

    // Append the clean logic at the very bottom of the file
    appJs += '\n' + globalLangCode;

    fs.writeFileSync('public/js/app.js', appJs, 'utf8');
    console.log('Language switcher centralized successfully in app.js!');
} catch (e) {
    console.error('Error modifying app.js:', e);
}

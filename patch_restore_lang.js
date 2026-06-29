const fs = require('fs');
let appJs = fs.readFileSync('public/js/app.js', 'utf8');

const missingCode = `
    window.updateFormLangBtns = function(lang) {
        ['en', 'hi', 'kn'].forEach(l => {
            const btn = document.getElementById('formLang' + l.charAt(0).toUpperCase() + l.slice(1));
            if (btn) {
                if (l === lang) {
                    btn.style.background = 'var(--primary-color)';
                    btn.style.borderColor = 'var(--primary-color)';
                    btn.style.color = '#fff';
                } else {
                    btn.style.background = 'transparent';
                    btn.style.borderColor = 'var(--card-border)';
                    btn.style.color = 'var(--text-secondary)';
                }
            }
        });
    };

    window.changeLanguage = function(lang) {
        localStorage.setItem('selectedLang', lang);
        const selector = document.getElementById('langSelector');
        if (selector) selector.value = lang;
        
        // 1. Trigger Google Translate Widget for dynamic content
        // Set cookies to ensure it persists across reloads and is active
        document.cookie = \`googtrans=/en/\${lang}; path=/\`;
        document.cookie = \`googtrans=/en/\${lang}; domain=\${window.location.hostname}; path=/\`;
        
        // Trigger the Google Translate dropdown with graceful retries (no reload to prevent infinite loops)
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

        if (window.applyTranslations) window.applyTranslations();
    };
`;

// Append it to the top level of app.js (after DOMContentLoaded or at the end of the file)
if (!appJs.includes('window.changeLanguage')) {
    appJs += '\n' + missingCode;
    fs.writeFileSync('public/js/app.js', appJs, 'utf8');
    console.log('Restored changeLanguage and updateFormLangBtns');
} else {
    console.log('changeLanguage already exists');
}

const fs = require('fs');

try {
    let html = fs.readFileSync('public/index.html', 'utf8');

    // Remove the old i18n logic and replace with i18next CDN
    html = html.replace(/<script type="text\/javascript">\s*const TRANSLATIONS = \{[\s\S]*?<\/script>/, '');
    html = html.replace(/<script src="\/js\/i18n.js".*?><\/script>/g, '');
    
    // Add Google Noto Fonts
    const fonts = `
    <!-- Google Noto Fonts for i18n -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;800&family=Noto+Sans+Bengali:wght@400;600;800&family=Noto+Sans+Devanagari:wght@400;600;800&family=Noto+Sans+Gujarati:wght@400;600;800&family=Noto+Sans+Kannada:wght@400;600;800&family=Noto+Sans+Malayalam:wght@400;600;800&family=Noto+Sans+Tamil:wght@400;600;800&family=Noto+Sans+Telugu:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Noto Sans', 'Noto Sans Devanagari', 'Noto Sans Kannada', 'Noto Sans Tamil', 'Noto Sans Telugu', 'Noto Sans Bengali', 'Noto Sans Gujarati', 'Noto Sans Malayalam', sans-serif !important;
        }
    </style>
`;
    if (!html.includes('Noto Sans')) {
        html = html.replace('</head>', fonts + '</head>');
    }

    // Add i18next CDNs before app.js
    const i18nScripts = `
    <!-- i18next Libraries -->
    <script src="https://unpkg.com/i18next@23.10.1/dist/umd/i18next.min.js"></script>
    <script src="https://unpkg.com/i18next-http-backend@2.5.0/i18nextHttpBackend.min.js"></script>
    <script src="https://unpkg.com/i18next-browser-languagedetector@7.2.0/i18nextBrowserLanguageDetector.min.js"></script>
    
    <!-- i18n Initialization -->
    <script>
        i18next
            .use(i18nextHttpBackend)
            .use(i18nextBrowserLanguageDetector)
            .init({
                fallbackLng: 'en',
                debug: false,
                backend: {
                    loadPath: '/locales/{{lng}}/common.json',
                },
                detection: {
                    order: ['localStorage', 'navigator'],
                    lookupLocalStorage: 'selectedLang',
                    caches: ['localStorage'],
                }
            }, function(err, t) {
                if (err) return console.error(err);
                
                window.t = i18next.t.bind(i18next);
                
                // Update dropdown to match detected lang
                const langSelect = document.getElementById('languageSelect');
                if (langSelect) {
                    langSelect.value = i18next.language.split('-')[0] || 'en';
                }
                
                applyTranslations();
            });

        window.changeLanguage = function(lang) {
            i18next.changeLanguage(lang, (err, t) => {
                if (err) return console.log('something went wrong loading', err);
                applyTranslations();
                localStorage.setItem('selectedLang', lang);
            });
        };

        window.applyTranslations = function() {
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                const translation = i18next.t(key);
                if (translation && translation !== key) {
                    if (el.tagName === 'INPUT' && (el.type === 'submit' || el.type === 'button')) {
                        el.value = translation;
                    } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                        el.placeholder = translation;
                    } else {
                        el.innerText = translation;
                    }
                }
            });
        };
        
        i18next.on('languageChanged', () => {
            applyTranslations();
        });
    </script>
`;

    if (!html.includes('i18next.min.js')) {
        html = html.replace('<script src="/js/app.js?v=7" charset="UTF-8" defer></script>', i18nScripts + '\n<script src="/js/app.js?v=7" charset="UTF-8" defer></script>');
    }

    fs.writeFileSync('public/index.html', html, 'utf8');
    console.log("Successfully injected i18next into index.html");
} catch(e) {
    console.error(e);
}

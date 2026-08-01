const fs = require('fs');

const replacement = `
        function updateLanguageUI(lang) {
            const langNames = {
                'en': 'English', 'hi': 'Hindi', 'kn': 'Kannada', 'ta': 'Tamil',
                'te': 'Telugu', 'mr': 'Marathi', 'gu': 'Gujarati', 'bn': 'Bengali'
            };
            const langName = langNames[lang] || 'English';
            
            const welcomeImg = document.getElementById('welcomeImage');
            if (welcomeImg) welcomeImg.src = '/og-image-' + langName + '.webp';
            
            const qrPosterImg = document.getElementById('qrModalPosterImg');
            if (qrPosterImg) qrPosterImg.src = '/og-image-' + langName + '.webp';

            document.querySelectorAll('.lang-btn').forEach(btn => {
                if (btn.id === 'lang-btn-' + lang) {
                    btn.style.border = '2px solid var(--primary-color)';
                    btn.style.background = 'var(--primary-color)';
                    btn.style.color = '#fff';
                } else {
                    btn.style.border = '2px solid var(--card-border)';
                    btn.style.background = 'transparent';
                    btn.style.color = 'var(--text-secondary)';
                }
            });
            
            const langSelect = document.getElementById('langSelector');
            if (langSelect) langSelect.value = lang;
        }

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
                    order: ['localStorage'],
                    lookupLocalStorage: 'selectedLang',
                    caches: ['localStorage'],
                }
            }, function (err, t) {
                if (err) return console.error(err);

                window.t = i18next.t.bind(i18next);
                
                const currentLang = (i18next.language || 'en').split('-')[0];
                updateLanguageUI(currentLang);
                applyTranslations();
            });

        window.changeLanguage = function (lang) {
            i18next.changeLanguage(lang, (err, t) => {
                if (err) return console.log('something went wrong loading', err);
                localStorage.setItem('selectedLang', lang);
                updateLanguageUI(lang);
                applyTranslations();
            });
        };

        let translationQueue = [];
        let translationTimer = null;
`;

let txt = fs.readFileSync('public/js/app-bundle.js', 'utf8');
const target = 'window.applyTranslations = function () {';
txt = txt.replace(target, replacement + '\n' + target);
fs.writeFileSync('public/js/app-bundle.js', txt);
console.log('Success');

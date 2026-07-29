
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

                // Update dropdown to match detected lang
                const langSelect = document.getElementById('langSelector');
                if (langSelect) {
                    langSelect.value = i18next.language.split('-')[0] || 'en';
                }

                applyTranslations();
            });

        window.changeLanguage = function (lang) {
            i18next.changeLanguage(lang, (err, t) => {
                if (err) return console.log('something went wrong loading', err);
                applyTranslations();
                localStorage.setItem('selectedLang', lang);
            });
        };

        let translationQueue = [];
        let translationTimer = null;

        window.applyTranslations = function () {
            const currentLang = i18next.language ? i18next.language.split('-')[0] : 'en';

            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');

                let enText = i18next.getResource('en', 'translation', key);
                if (!enText) enText = key;

                const translation = i18next.t(key);
                const hasTranslation = i18next.getResource(currentLang, 'translation', key) !== undefined;

                const textToDisplay = hasTranslation ? translation : enText;

                if (textToDisplay && textToDisplay !== key || !hasTranslation) {
                    if (el.tagName === 'INPUT' && (el.type === 'submit' || el.type === 'button')) {
                        el.value = textToDisplay;
                    } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                        el.placeholder = textToDisplay;
                    } else {
                        el.innerText = textToDisplay;
                    }
                }

                if (!hasTranslation) {
                    if (!translationQueue.find(item => item.key === key)) {
                        translationQueue.push({ key: key, text: enText });
                    }
                }
            });

            if (translationQueue.length > 0) {
                clearTimeout(translationTimer);
                translationTimer = setTimeout(() => {
                    const keysToTranslate = [...translationQueue];
                    translationQueue = [];

                    fetch('/api/auto-translate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ targetLang: currentLang, keys: keysToTranslate })
                    })
                        .then(res => res.json())
                        .then(data => {
                            if (data.success && data.translations && Object.keys(data.translations).length > 0) {
                                i18next.addResourceBundle(currentLang, 'translation', data.translations, true, true);
                                applyTranslations();
                            }
                        })
                        .catch(err => console.error('Auto-translate error:', err));
                }, 1000);
            }
        };

        i18next.on('languageChanged', () => {
            applyTranslations();
        });
    
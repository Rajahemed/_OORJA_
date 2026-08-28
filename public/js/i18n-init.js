
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
                window.t = function(key, defaultVal) {
                    return i18next.t(key, typeof defaultVal === 'string' ? { defaultValue: defaultVal } : undefined) || defaultVal || key;
                };
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
                
                const langNames = {
                    'en': 'English', 'hi': 'Hindi', 'kn': 'Kannada', 'ta': 'Tamil',
                    'te': 'Telugu', 'mr': 'Marathi', 'gu': 'Gujarati', 'bn': 'Bengali'
                };
                const langName = langNames[lang] || 'English';
                const welcomeImg = document.getElementById('welcomeImage');
                if (welcomeImg) {
                    welcomeImg.src = '/og-image-' + langName + '.webp';
                }
            });
        };

        let translationQueue = [];
        let translationTimer = null;

        window.applyTranslations = function () {
            const currentLang = i18next.language ? i18next.language.split('-')[0] : 'en';

            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');

                if (!el.hasAttribute('data-original-text')) {
                    if (el.tagName === 'INPUT' && (el.type === 'submit' || el.type === 'button')) {
                        el.setAttribute('data-original-text', el.value || key);
                    } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                        el.setAttribute('data-original-text', el.placeholder || key);
                    } else {
                        el.setAttribute('data-original-text', el.innerText || key);
                    }
                }

                let enText = el.getAttribute('data-original-text');

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
    
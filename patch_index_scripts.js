const fs = require('fs');

try {
    let html = fs.readFileSync('public/index.html', 'utf8');

    const appJsScriptTag = '<script src="/js/app.js?v=7" defer></script>';
    
    if (html.includes(appJsScriptTag)) {
        if (!html.includes('i18n.js')) {
            const scriptsToInject = `
    <!-- Hidden Google Translate Element -->
    <div id="google_translate_element" style="display:none;"></div>
    
    <!-- Google Translate Script -->
    <script type="text/javascript">
        function googleTranslateElementInit() {
            new google.translate.TranslateElement({pageLanguage: 'en', includedLanguages: 'en,hi,kn,ta,te,mr,gu,bn', autoDisplay: false}, 'google_translate_element');
        }
    </script>
    <script type="text/javascript" src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" defer></script>

    <!-- Local Translations -->
    <script src="/js/i18n.js" defer></script>
    
    <!-- Main App Script -->
    <script src="/js/app.js?v=7" defer></script>
`;
            html = html.replace(appJsScriptTag, scriptsToInject);
            fs.writeFileSync('public/index.html', html, 'utf8');
            console.log('Successfully injected i18n.js and Google Translate scripts!');
        } else {
            console.log('i18n.js is already present in index.html');
        }
    } else {
        console.error('Could not find ' + appJsScriptTag + ' in index.html');
    }
} catch (e) {
    console.error('Error modifying index.html:', e);
}

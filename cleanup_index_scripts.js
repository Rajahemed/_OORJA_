const fs = require('fs');

try {
    let html = fs.readFileSync('public/index.html', 'utf8');

    // Remove the block from 1933 to 1948 that I injected
    const regex1 = /<!-- Hidden Google Translate Element -->[\s\S]*?<!-- Main App Script -->/g;
    html = html.replace(regex1, '');

    // Ensure we only have one google_translate_element and it's correct
    // Let's replace the one from line 1954 to 1961 with a clean one and i18n
    const regex2 = /<!-- Google Translate Widget for Dynamic Content Translation -->[\s\S]*?<script type="text\/javascript" src="\/\/translate\.google\.com\/translate_a\/element\.js\?cb=googleTranslateElementInit"><\/script>/g;
    
    const cleanScripts = `
<!-- Google Translate Widget for Dynamic Content Translation -->
<div id="google_translate_element" style="display:none;"></div>
<script type="text/javascript">
function googleTranslateElementInit() {
  new google.translate.TranslateElement({pageLanguage: 'en', includedLanguages: 'en,hi,kn,ta,te,mr,gu,bn'}, 'google_translate_element');
}
</script>
<script type="text/javascript" src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" defer></script>

<!-- Local Translations -->
<script src="/js/i18n.js" defer></script>

<!-- Main App Script -->
`;
    
    html = html.replace(regex2, cleanScripts);

    fs.writeFileSync('public/index.html', html, 'utf8');
    console.log('Cleaned up index.html scripts!');
} catch (e) {
    console.error('Error modifying index.html:', e);
}

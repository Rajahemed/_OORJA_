const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');

const scripts = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
const i18nScript = scripts.find(s => s.includes('i18next') && s.includes('i18nextHttpBackend') && !s.includes('src='));

if (i18nScript) {
    const inner = i18nScript.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
    fs.writeFileSync('public/js/i18n-init.js', inner, 'utf8');
    
    html = html.replace(i18nScript, '<script defer src="/js/i18n-init.js"></script>');
    fs.writeFileSync('public/index.html', html, 'utf8');
    console.log('Extracted i18n initialization to i18n-init.js');
} else {
    console.log('Could not find inline i18n script');
}

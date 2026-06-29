const fs = require('fs');

try {
    let html = fs.readFileSync('public/index.html', 'utf8');
    let i18nJs = fs.readFileSync('public/js/i18n.js', 'utf8');
    
    // Remove the external script tag
    html = html.replace('<script src="/js/i18n.js" charset="UTF-8" defer></script>', '');
    html = html.replace('<script src="/js/i18n.js" defer></script>', ''); // fallback just in case
    
    // Create an inline script tag
    const inlineScript = `
<script type="text/javascript">
${i18nJs}
</script>
`;
    
    // Insert it where the old one was, or right before app.js
    const target = '<script src="/js/app.js?v=7" charset="UTF-8" defer></script>';
    if (html.includes(target)) {
        html = html.replace(target, inlineScript + '\n' + target);
        fs.writeFileSync('public/index.html', html, 'utf8');
        console.log('Successfully inlined i18n.js into index.html');
    } else {
        console.log('Could not find app.js target');
        // Fallback target
        const fallback = '<script src="/js/app.js?v=7" defer></script>';
        if (html.includes(fallback)) {
            html = html.replace(fallback, inlineScript + '\n' + fallback);
            fs.writeFileSync('public/index.html', html, 'utf8');
            console.log('Successfully inlined i18n.js into index.html using fallback');
        } else {
            console.log('Fallback failed too.');
        }
    }
} catch (e) {
    console.error('Error:', e);
}

const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('public').filter(f => f.endsWith('.html'));

files.forEach(f => {
    let p = path.join('public', f);
    let html = fs.readFileSync(p, 'utf8');
    let originalHtml = html;
    
    // Inject canonical URL if missing
    if (!html.includes('<link rel="canonical"')) {
        const canonicalUrl = 'https://roadwarrior.pro/' + (f === 'index.html' ? '' : f);
        html = html.replace('<head>', '<head>\n    <link rel="canonical" href="' + canonicalUrl + '" />');
    }
    
    // Add alt attributes to img tags missing them
    html = html.replace(/<img(?![^>]*\balt=)[^>]*>/gi, match => {
        return match.replace('<img', '<img alt="Decorative image"');
    });
    
    if (html !== originalHtml) {
        fs.writeFileSync(p, html, 'utf8');
        console.log('Patched ' + f);
    }
});

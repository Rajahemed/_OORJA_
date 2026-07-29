const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

// Remove duplicate qrcode.min.js
let qrCount = 0;
html = html.replace(/<script src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/qrcodejs\/1\.0\.0\/qrcode\.min\.js" defer="defer"><\/script>/g, match => {
    qrCount++;
    if (qrCount > 1) return ''; // remove duplicates
    return match;
});

// Bundle inline logic
const inlineLogicPatterns = [
    /<script>\s*\(function \(\) \{\s*'use strict';\s*\/\* ── Drawer toggle ─────[\s\S]*?<\/script>/,
    /<script>\s*document\.addEventListener\('mouseleave', function\(e\) \{\s*if \(e\.clientY[\s\S]*?<\/script>/,
    /<script>\s*document\.addEventListener\('DOMContentLoaded', async \(\) => \{\s*try \{[\s\S]*?<\/script>/,
    /<script>\s*document\.addEventListener\("mouseleave", function\(e\) \{\s*if \(e\.clientY < 0 && !sessionStorage[\s\S]*?<\/script>/
];

let bundledScript = '';
for (let pattern of inlineLogicPatterns) {
    const match = html.match(pattern);
    if (match) {
        // extract inner content
        const inner = match[0].replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
        bundledScript += inner + '\n\n';
        // remove from html
        html = html.replace(match[0], '');
    }
}
fs.writeFileSync('public/js/inline-logic.js', bundledScript, 'utf8');

// Add the bundled script back
html = html.replace('</body>', '<script defer src="/js/inline-logic.js"></script>\n</body>');

fs.writeFileSync('public/index.html', html, 'utf8');
console.log('Removed duplicate and bundled inline scripts');

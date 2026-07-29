const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');
let consentJs = fs.readFileSync('public/js/consent.js', 'utf8');

// The HTML currently has the tracking pixels inline block which contains 'gtag('consent', 'default'
// And it has <script defer="defer" src="/js/consent.js"></script>

// We can just replace the <script defer="defer" src="/js/consent.js"></script> with the inline version
html = html.replace(/<script defer="defer" src="\/js\/consent\.js"><\/script>/, 
    `<script>\n${consentJs}\n</script>`);

fs.writeFileSync('public/index.html', html, 'utf8');
console.log('Inlined consent.js');

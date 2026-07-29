const html = require('fs').readFileSync('public/index.html', 'utf8');
const match = html.match(/<link rel="canonical" href="[^"]+">/i);
console.log(match ? match[0] : 'No canonical tag');

const html = require('fs').readFileSync('public/index.html', 'utf8');
const ldjsons = html.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/gi);
ldjsons.forEach((l,i) => console.log('--- JSON-LD ' + i + ' ---\n' + l));

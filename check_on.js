const html = require('fs').readFileSync('public/index.html', 'utf8');
const matches = html.match(/\son[a-z]+="[^"]+"/gi);
if (matches) {
    console.log([...new Set(matches)]);
} else {
    console.log("No inline event handlers found");
}

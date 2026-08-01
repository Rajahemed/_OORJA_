const html = require('fs').readFileSync('public/index.html', 'utf8');
const popupHTML = html.match(/<div id="exit-intent-popup"[\s\S]*?<\/div>\s*<\/div>/);
console.log(popupHTML ? popupHTML[0] : 'not found');

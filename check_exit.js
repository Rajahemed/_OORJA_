const html = require('fs').readFileSync('public/index.html', 'utf8');
console.log('exit-intent HTML ID exists:', html.includes('id="exit-intent-popup"') || html.includes('id="exitIntentPopup"'));
console.log('mouseleave JS exists:', html.includes('mouseleave'));

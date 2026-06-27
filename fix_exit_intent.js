const fs = require('fs');
let code = fs.readFileSync('public/js/app.js', 'utf-8');

const regex = /if\s*\(e\.clientY\s*<\s*0\s*&&\s*!exitIntentTriggered\)\s*\{\s*const\s*modal\s*=\s*document\.getElementById\('leadCaptureModal'\);/g;

const replacement = `if (e.clientY < 0 && !exitIntentTriggered) {
            const registerCard = document.getElementById('registerCard');
            if (registerCard && registerCard.style.display !== 'none' && registerCard.style.display !== '') return;
            const modal = document.getElementById('leadCaptureModal');`;

code = code.replace(regex, replacement);
fs.writeFileSync('public/js/app.js', code, 'utf-8');
console.log('Fixed exit intent popup logic!');

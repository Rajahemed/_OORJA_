const fs = require('fs');
let js = fs.readFileSync('public/js/app.js', 'utf8');

js = js.replace(/nativeSelect\.classList\.remove\('is-invalid'\);/g, `nativeSelect.classList.remove('is-invalid');
    document.getElementById('platformPillsContainer')?.classList.remove('invalid-field-highlight');
    document.getElementById('expPillsContainer')?.classList.remove('invalid-field-highlight');`);

fs.writeFileSync('public/js/app.js', js);
console.log('Fixed pill selection to remove highlight.');

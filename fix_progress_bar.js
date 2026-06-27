const fs = require('fs');
let code = fs.readFileSync('public/js/app.js', 'utf-8');

code = code.replace(/el\.classList\.add\('completed'\);/g, "el.classList.add('done');");
code = code.replace(/el\.classList\.remove\('completed'\);/g, "el.classList.remove('done');");
code = code.replace(/el\.classList\.remove\('active', 'completed'\);/g, "el.classList.remove('active', 'done');");

fs.writeFileSync('public/js/app.js', code, 'utf-8');
console.log('Fixed progress bar class.');

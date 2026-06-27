const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');

// Find all checkboxes and radios and make them required if they are part of the main form (before regSuccessPanel)
const formSections = html.match(/<div class="form-section" id="regSection\d"[\s\S]*?<!-- End of regSection\d -->/g);

if (formSections) {
    formSections.forEach(section => {
        let newSection = section.replace(/<input type="(radio|checkbox)"(?![^>]*required)/g, '<input type="$1" required');
        html = html.replace(section, newSection);
    });
}

fs.writeFileSync('public/index.html', html);
console.log('Added required to all radios and checkboxes');

let appJs = fs.readFileSync('public/js/app.js', 'utf8');
const oldValidation = `        if (input.type === 'radio') {
            if (!document.querySelector('input[name="' + input.name + '"]:checked')) {
                isInputValid = false;
            }
        } else if (!input.value.trim()) {`;

const newValidation = `        if (input.type === 'radio' || input.type === 'checkbox') {
            if (!document.querySelector('input[name="' + input.name + '"]:checked')) {
                isInputValid = false;
            }
        } else if (!input.value.trim()) {`;

if (appJs.includes(oldValidation)) {
    appJs = appJs.replace(oldValidation, newValidation);
    fs.writeFileSync('public/js/app.js', appJs);
    console.log('Updated app.js validation for checkboxes');
} else {
    // try fallback
    const regex = /if\s*\(input\.type\s*===\s*'radio'\)\s*\{\s*if\s*\(!document\.querySelector\('input\[name="'\s*\+\s*input\.name\s*\+\s*'"]:checked'\)\)\s*\{\s*isInputValid\s*=\s*false;\s*\}\s*\}\s*else\s*if\s*\(!input\.value\.trim\(\)\)\s*\{/m;
    if (regex.test(appJs)) {
        appJs = appJs.replace(regex, newValidation);
        fs.writeFileSync('public/js/app.js', appJs);
        console.log('Updated app.js validation for checkboxes (fallback regex)');
    } else {
        console.log('Could not find old validation in app.js');
    }
}

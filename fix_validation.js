const fs = require('fs');

// 1. Update app.js nextStep function
let js = fs.readFileSync('public/js/app.js', 'utf-8');

const oldNextStep = `    inputs.forEach(input => {
        if(!input.value || (input.type === 'radio' && !document.querySelector('input[name="' + input.name + '"]:checked'))) {
            isValid = false;
            input.style.borderColor = 'var(--danger-color)';
        } else {
            input.style.borderColor = '';
        }
    });
    
    if(!isValid) {
        showToast('Please fill all required fields before proceeding.', 'error');
        return;
    }`;

const newNextStep = `    let firstInvalid = null;
    inputs.forEach(input => {
        // Skip hidden 'other' fields if they are not active
        if (input.style.display === 'none' && input.id.includes('Other') && !input.required) {
            return;
        }

        let isInputValid = true;
        if (input.type === 'radio') {
            if (!document.querySelector('input[name="' + input.name + '"]:checked')) {
                isInputValid = false;
            }
        } else if (!input.value.trim()) {
            isInputValid = false;
        }

        let visualElement = input;
        if (input.type === 'radio') {
            visualElement = input.closest('.radio-group') || input.closest('.form-group');
        } else if (input.id === 'regPlatform') {
            visualElement = document.getElementById('platformPillsContainer');
        } else if (input.id === 'regExp') {
            visualElement = document.getElementById('expPillsContainer');
        } else if (input.type === 'checkbox') {
            visualElement = input.closest('.checkbox-group') || input.closest('.form-group');
        }

        if (visualElement) {
            if (!isInputValid) {
                isValid = false;
                visualElement.classList.add('invalid-field-highlight');
                
                // For direct inputs/selects, also apply red border
                if (visualElement.tagName === 'INPUT' || visualElement.tagName === 'SELECT') {
                    visualElement.style.borderColor = 'var(--danger-color)';
                    visualElement.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';
                }
                
                if (!firstInvalid) firstInvalid = visualElement;
            } else {
                visualElement.classList.remove('invalid-field-highlight');
                if (visualElement.tagName === 'INPUT' || visualElement.tagName === 'SELECT') {
                    visualElement.style.borderColor = '';
                    visualElement.style.backgroundColor = '';
                }
            }
        }
    });
    
    if(!isValid) {
        showToast('Please fill all highlighted required fields before proceeding.', 'error');
        if (firstInvalid) {
            firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }`;

if (js.includes('input.style.borderColor = \'var(--danger-color)\';')) {
    js = js.replace(oldNextStep, newNextStep);
    
    // Fallback if formatting is slightly different
    if (js === fs.readFileSync('public/js/app.js', 'utf-8')) {
        console.log('Using fallback regex replacement for app.js');
        const regexStr = /inputs\.forEach\(input => \{[\s\S]*?if\(!isValid\) \{[\s\S]*?return;\s*\}/m;
        js = js.replace(regexStr, newNextStep);
    }
    
    fs.writeFileSync('public/js/app.js', js, 'utf-8');
    console.log('app.js updated successfully');
} else {
    console.log('Could not find oldNextStep in app.js');
}

// 2. Update index.html to add .invalid-field-highlight CSS
let html = fs.readFileSync('public/index.html', 'utf-8');
if (!html.includes('.invalid-field-highlight')) {
    const cssToAdd = `
        .invalid-field-highlight {
            border-radius: 6px;
            box-shadow: 0 0 0 2px var(--danger-color) !important;
            padding: 4px;
            transition: box-shadow 0.3s;
        }
        input.invalid-field-highlight, select.invalid-field-highlight {
            box-shadow: none !important; /* Managed directly via JS border */
        }
    `;
    html = html.replace('</style>', cssToAdd + '</style>');
    fs.writeFileSync('public/index.html', html, 'utf-8');
    console.log('index.html updated successfully');
}

const fs = require('fs');
let appJs = fs.readFileSync('public/js/app.js', 'utf8');

// Patch success message in submitRegistration
appJs = appJs.replace(
    /showToast\('🎉 Registration successful! Welcome to Road Warrior Pro!', 'success'\);/g,
    "showToast(window.t ? window.t('success_title') + ' ' + window.t('success_subtitle') : '🎉 Registration successful! Welcome to Road Warrior Pro!', 'success');"
);

// Patch validation message inside nextStep (if it exists)
appJs = appJs.replace(
    /showToast\('Please fill all required fields before proceeding\.', 'error'\);/g,
    "showToast(window.t ? window.t('fill_required_fields') || 'Please fill all required fields before proceeding.' : 'Please fill all required fields before proceeding.', 'error');"
);

// Patch duplicate phone in nextStep
appJs = appJs.replace(
    /showToast\('This phone number is already registered\. Please login\.', 'error'\);/g,
    "showToast(window.t ? window.t('phone_dup') || 'This phone number is already registered. Please login.' : 'This phone number is already registered. Please login.', 'error');"
);

fs.writeFileSync('public/js/app.js', appJs, 'utf8');
console.log('Patched showToast messages with window.t()');

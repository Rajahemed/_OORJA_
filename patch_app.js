const fs = require('fs');

let code = fs.readFileSync('public/js/app.js', 'utf-8');

// 1. Next step validation
const nextStepOrig = `function nextStep() {
    const currentSection = document.getElementById('regSection' + currentStep);
    const inputs = currentSection.querySelectorAll('input[required], select[required]');
    let isValid = true;
    inputs.forEach(input => {`;

const nextStepNew = `function nextStep() {
    const currentSection = document.getElementById('regSection' + currentStep);
    const inputs = currentSection.querySelectorAll('input[required], select[required]');
    let isValid = true;
    
    // Prevent advancing if phone is already registered on Step 1
    if (currentStep === 1) {
        const dupPhoneMsg = document.getElementById('dupPhoneMsg');
        if (dupPhoneMsg && !dupPhoneMsg.classList.contains('hidden')) {
            showToast('This phone number is already registered. Please login.', 'error');
            return;
        }
    }

    inputs.forEach(input => {`;

if (code.includes(nextStepOrig)) {
    code = code.replace(nextStepOrig, nextStepNew);
} else {
    code = code.replace(nextStepOrig.replace(/\r\n/g, '\n'), nextStepNew);
}


// 2. Exit Intent Popup logic
const exitIntentOrig = `    document.addEventListener('mouseleave', (e) => {
        // Trigger if mouse leaves top of the window (clientY < 0)
        if (e.clientY < 0 && !exitIntentTriggered) {
            const modal = document.getElementById('leadCaptureModal');
            if (modal && !modal.classList.contains('show')) {`;

const exitIntentNew = `    document.addEventListener('mouseleave', (e) => {
        // Trigger if mouse leaves top of the window (clientY < 0)
        if (e.clientY < 0 && !exitIntentTriggered) {
            // Check if registration form is currently open
            const registerCard = document.getElementById('registerCard');
            if (registerCard && registerCard.style.display !== 'none' && registerCard.style.display !== '') {
                return; // Do not show exit intent popup if user is on the registration form
            }
            const modal = document.getElementById('leadCaptureModal');
            if (modal && !modal.classList.contains('show')) {`;

if (code.includes(exitIntentOrig)) {
    code = code.replace(exitIntentOrig, exitIntentNew);
} else {
    code = code.replace(exitIntentOrig.replace(/\r\n/g, '\n'), exitIntentNew);
}

fs.writeFileSync('public/js/app.js', code, 'utf-8');
console.log('Successfully patched app.js');

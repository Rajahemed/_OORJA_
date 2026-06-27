const fs = require('fs');

let code = fs.readFileSync('public/js/app.js', 'utf-8');

// The missing multi-step logic (with the new check for currentStep === 1 and dupPhoneMsg)
const multiStepLogic = `
/* ==================== MULTI-STEP FORM LOGIC ==================== */
let currentStep = 1;
const totalSteps = 6;

function showStep(step) {
    document.querySelectorAll('.form-section').forEach(el => {
        el.classList.remove('active');
        el.style.display = 'none';
    });
    
    const currentSection = document.getElementById('regSection' + step);
    if(currentSection) {
        currentSection.classList.add('active');
        currentSection.style.display = 'block';
    }
    
    document.querySelectorAll('.progress-step').forEach((el, index) => {
        if(index + 1 < step) {
            el.classList.add('completed');
            el.classList.remove('active');
        } else if(index + 1 === step) {
            el.classList.add('active');
            el.classList.remove('completed');
        } else {
            el.classList.remove('active', 'completed');
        }
    });
    
    const formTop = document.getElementById('registerCard').offsetTop;
    window.scrollTo({top: formTop - 20, behavior: 'smooth'});
}

function nextStep() {
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

    inputs.forEach(input => {
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
    }
    
    if (currentStep < totalSteps) {
        currentStep++;
        showStep(currentStep);
    }
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.form-section:not(.active)').forEach(el => el.style.display = 'none');
});
`;

if (!code.includes('function nextStep()')) {
    code += multiStepLogic;
    console.log('Appended multiStepLogic.');
} else {
    console.log('multiStepLogic already present.');
}

// Exit Intent Popup logic patch
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
    console.log('Patched exitIntent logic (LF).');
} else if (code.includes(exitIntentOrig.replace(/\r\n/g, '\n'))) {
    code = code.replace(exitIntentOrig.replace(/\r\n/g, '\n'), exitIntentNew);
    console.log('Patched exitIntent logic (CRLF).');
} else {
    console.log('Could not find exitIntent logic to patch!');
}

fs.writeFileSync('public/js/app.js', code, 'utf-8');
console.log('Done restoring app.js');

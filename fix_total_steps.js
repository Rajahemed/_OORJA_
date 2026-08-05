const fs = require('fs');

function fixFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');

    // First, fix the mangled block in app.js
    const mangled = `// Download CSV helper
function downloadLeadsCSV() {
    });
    
    const currentSection = document.getElementById('regSection' + step);`;

    const correct = `// Download CSV helper
function downloadLeadsCSV() {
    const token = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken') || sessionStorage.getItem('adminJwt') || localStorage.getItem('adminJwt');
    window.location.href = \`/api/admin/analytics/export/csv?token=\${token}\`;
}

/* ==================== MULTI-STEP FORM LOGIC ==================== */
let currentStep = 1;
const totalSteps = 8;

function showStep(step) {
    document.querySelectorAll('.form-section').forEach(el => {
        el.classList.remove('active');
        el.style.display = 'none';
    });
    
    const currentSection = document.getElementById('regSection' + step);`;

    if (content.includes(mangled)) {
        content = content.replace(mangled, correct);
        console.log('Fixed mangled block in ' + filePath);
    } else {
        // If not mangled, just replace totalSteps = 7 with 8
        if (content.includes('const totalSteps = 7;')) {
            content = content.replace('const totalSteps = 7;', 'const totalSteps = 8;');
            console.log('Updated totalSteps to 8 in ' + filePath);
        } else if (content.includes('totalSteps=7')) {
            content = content.replace(/totalSteps\s*=\s*7/g, 'totalSteps=8');
            console.log('Updated totalSteps to 8 (minified) in ' + filePath);
        }
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
}

fixFile('public/js/app.js');
fixFile('public/js/app-bundle.js');

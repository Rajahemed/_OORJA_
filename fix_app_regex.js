const fs = require('fs');
let content = fs.readFileSync('public/js/app.js', 'utf8');

const regex = /\/\/ Download CSV helper\s*function downloadLeadsCSV\(\) \{\s*\}\)\;\s*const currentSection = document\.getElementById\('regSection' \+ step\)\;/;

const good = `// Download CSV helper
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

if (regex.test(content)) {
    content = content.replace(regex, good);
    fs.writeFileSync('public/js/app.js', content, 'utf8');
    console.log('Fixed app.js successfully!');
} else {
    console.log('Regex did not match.');
}

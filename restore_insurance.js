const fs = require('fs');
const filePaths = ['public/js/app-bundle.js', 'public/js/app.js'];

const renderFunction = `
// --- INSURANCE OPTIONS RENDERING ---
function renderInsuranceOptions() {
    const container = document.getElementById('insuranceOptionsContainer');
    if (!container) return;
    
    if (typeof INSURANCE_CONFIG === 'undefined') {
        console.error('INSURANCE_CONFIG is not defined');
        return;
    }

    let html = '<div style="margin-bottom: 1rem;"><p style="font-weight: 500; margin-bottom: 0.5rem;" data-i18n="' + INSURANCE_CONFIG.question_i18n + '">' + INSURANCE_CONFIG.question + '</p>';
    
    if (INSURANCE_CONFIG.groups) {
        INSURANCE_CONFIG.groups.forEach((group, index) => {
            html += '<div style="margin-bottom: 1rem;" id="ins_grp_' + index + '">';
            html += '<h4 style="font-size: 0.95rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-color);" data-i18n="' + group.title_i18n + '">' + group.title + '</h4>';
            html += '<div class="checkbox-group" style="display:flex; flex-direction:column; gap:0.5rem;">';
            const groupKey = 'group_' + index;
            group.options.forEach(opt => {
                html += '<label class="checkbox-item" style="justify-content:flex-start; margin:0;">';
                const isNone = (opt.id === 'none_personal' || opt.id === 'none_vehicle' || opt.id === 'none');
                const extraClass = isNone ? 'ins_none_opt' : 'ins_reg_opt';
                html += '<input type="checkbox" name="insuranceOptions" value="' + opt.id + '" data-group="' + groupKey + '" class="' + extraClass + '" onchange="handleInsuranceChange(this)">';
                html += '<span style="margin-left:0.5rem;" data-i18n="' + opt.label_i18n + '">' + opt.label + '</span>';
                html += '</label>';
            });
            html += '</div></div>';
        });
    }

    html += '</div>';
    container.innerHTML = html;
}

window.handleInsuranceChange = function(cb) {
    const groupKey = cb.getAttribute('data-group');
    if (!groupKey) return;
    
    const groupCbs = document.querySelectorAll('input[name="insuranceOptions"][data-group="' + groupKey + '"]');
    const isNoneCb = cb.classList.contains('ins_none_opt');
    
    if (isNoneCb && cb.checked) {
        groupCbs.forEach(c => { if (!c.classList.contains('ins_none_opt')) c.checked = false; });
    } else if (cb.checked) {
        groupCbs.forEach(c => { if (c.classList.contains('ins_none_opt')) c.checked = false; });
    }
};
`;

const domInitCode = `
document.addEventListener('DOMContentLoaded', () => {
    if (typeof renderInsuranceOptions === 'function') renderInsuranceOptions();
});
`;

filePaths.forEach(filePath => {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove any broken partial fragments just in case
    content = content.replace(/function renderInsuranceOptions\(\) \{[\s\S]*?(?=function submitRegistration)/, '');
    content = content.replace(/window\.handleInsuranceChange = function[\s\S]*?(?=function submitRegistration)/, '');

    // Inject before submitRegistration
    if (content.includes('function submitRegistration() {')) {
        content = content.replace('function submitRegistration() {', renderFunction + '\n' + domInitCode + '\nfunction submitRegistration() {');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Restored insurance rendering in ' + filePath);
    } else {
        console.log('Could not find submitRegistration in ' + filePath);
    }
});

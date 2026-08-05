const fs = require('fs');
const path = require('path');

const filePaths = [
    'd:\\Road-Warrior\\public\\js\\app-bundle.js',
    'd:\\Road-Warrior\\public\\js\\app.js'
];

const insValCode = `
          // Insurance validation
          const insContainer = document.getElementById('insuranceOptionsContainer');
          if (insContainer && insContainer.closest('.form-section').style.display !== 'none') {
              const groups = insContainer.querySelectorAll('[id^="ins_grp_"]');
              groups.forEach(group => {
                  const checked = group.querySelectorAll('input[type="checkbox"]:checked');
                  if (checked.length === 0) {
                      const cbGroup = group.querySelector('.checkbox-group');
                      if (cbGroup) {
                          cbGroup.style.border = '2px solid var(--danger-color)';
                          cbGroup.style.padding = '0.5rem';
                          cbGroup.style.borderRadius = 'var(--border-radius-md)';
                          isValid = false;
                          if (typeof firstErrorMessage !== 'undefined' && !firstErrorMessage) firstErrorMessage = 'Please select at least one option for each insurance category.';
                          if (typeof firstInvalidField !== 'undefined' && !firstInvalidField) firstInvalidField = cbGroup;
                          
                          const cbs = cbGroup.querySelectorAll('input[type="checkbox"]');
                          cbs.forEach(cb => cb.addEventListener('change', () => { cbGroup.style.border = ''; cbGroup.style.padding = ''; }));
                      }
                  }
              });
          }
`;

const insValCodeNextStep = `
      // Insurance validation in nextStep
      if (currentStep === 6) {
          const insContainer = document.getElementById('insuranceOptionsContainer');
          if (insContainer) {
              const groups = insContainer.querySelectorAll('[id^="ins_grp_"]');
              groups.forEach(group => {
                  const checked = group.querySelectorAll('input[type="checkbox"]:checked');
                  if (checked.length === 0) {
                      const cbGroup = group.querySelector('.checkbox-group');
                      if (cbGroup) {
                          cbGroup.style.border = '2px solid var(--danger-color)';
                          cbGroup.style.padding = '0.5rem';
                          cbGroup.style.borderRadius = 'var(--border-radius-md)';
                          isValid = false;
                          if (typeof firstInvalid !== 'undefined' && !firstInvalid) firstInvalid = cbGroup;
                          const cbs = cbGroup.querySelectorAll('input[type="checkbox"]');
                          cbs.forEach(cb => cb.addEventListener('change', () => { cbGroup.style.border = ''; cbGroup.style.padding = ''; }));
                      }
                  }
              });
          }
      }
`;

filePaths.forEach(filePath => {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Add asterisk to title
    content = content.replace(
        /html \+= '<h4 style="font-size: 0\.95rem; font-weight: 600; margin-bottom: 0\.5rem; color: var\(--text-color\);" data-i18n="' \+ group\.title_i18n \+ '">' \+ group\.title \+ '<\/h4>';/g,
        `html += '<h4 style="font-size: 0.95rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-color);"><span data-i18n="' + group.title_i18n + '">' + group.title + '</span> <span style="color:var(--danger-color)">*</span></h4>';`
    );

    // 2. Add validation to validateFullRegistrationForm
    if (!content.includes('Please select at least one option for each insurance category')) {
        content = content.replace(
            /(\s+)(return isValid;\s+})/,
            `$1${insValCode}$1$2`
        );
    }

    // 3. Add validation to nextStep
    if (!content.includes('Insurance validation in nextStep')) {
        content = content.replace(
            /(if\(!isValid\) {\s+showToast)/,
            `${insValCodeNextStep}\n      $1`
        );
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated ' + filePath);
});

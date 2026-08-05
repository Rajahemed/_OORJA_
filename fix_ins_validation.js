const fs = require('fs');

function updateInsuranceValidation(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Update validation logic in nextStep
    const oldValidation = `const allChecked = insContainer.querySelectorAll('input[type="checkbox"]:checked');
              if (allChecked.length === 0) {
                  const groups = insContainer.querySelectorAll('[id^="ins_grp_"]');
                  groups.forEach(group => {
                      if (group.style.display === 'none' || group.offsetParent === null) return;
                      const cbGroup = group.querySelector('.checkbox-group');
                      if (cbGroup) {
                          cbGroup.style.border = '2px solid var(--danger-color)';
                          cbGroup.style.padding = '0.5rem';
                          cbGroup.style.borderRadius = 'var(--border-radius-md)';
                          isValid = false;
                          if (typeof firstInvalid !== 'undefined' && !firstInvalid) firstInvalid = cbGroup;
                          const cbs = cbGroup.querySelectorAll('input[type="checkbox"]');
                          cbs.forEach(cb => cb.addEventListener('change', () => { 
                              insContainer.querySelectorAll('.checkbox-group').forEach(g => {
                                  g.style.border = ''; g.style.padding = '';
                              });
                          }));
                      }
                  });
              }`;

    const newValidation = `const groups = insContainer.querySelectorAll('[id^="ins_grp_"]');
              groups.forEach(group => {
                  if (group.style.display === 'none' || group.offsetParent === null) return;
                  const groupChecked = group.querySelectorAll('input[type="checkbox"]:checked');
                  if (groupChecked.length === 0) {
                      const cbGroup = group.querySelector('.checkbox-group');
                      if (cbGroup) {
                          cbGroup.style.border = '2px solid var(--danger-color)';
                          cbGroup.style.padding = '0.5rem';
                          cbGroup.style.borderRadius = 'var(--border-radius-md)';
                          isValid = false;
                          if (typeof firstInvalid !== 'undefined' && !firstInvalid) firstInvalid = cbGroup;
                          const cbs = cbGroup.querySelectorAll('input[type="checkbox"]');
                          cbs.forEach(cb => cb.addEventListener('change', () => { 
                              cbGroup.style.border = ''; cbGroup.style.padding = '';
                          }));
                      }
                  }
              });`;

    if (content.includes(oldValidation)) {
        content = content.replace(oldValidation, newValidation);
        console.log('Updated validation in ' + filePath);
    } else {
        console.log('Old validation logic not found in ' + filePath);
    }

    // 2. Add red asterisk to group titles
    const oldTitle = `html += '<h4 style="font-size: 0.95rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-color);" data-i18n="' + group.title_i18n + '">' + group.title + '</h4>';`;
    const newTitle = `html += '<h4 style="font-size: 0.95rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-color);" data-i18n="' + group.title_i18n + '">' + group.title + ' <span style="color:var(--danger-color);">*</span></h4>';`;

    if (content.includes(oldTitle)) {
        content = content.replace(oldTitle, newTitle);
        console.log('Added asterisk to ' + filePath);
    } else {
        console.log('Old title logic not found in ' + filePath);
    }

    fs.writeFileSync(filePath, content, 'utf8');
}

updateInsuranceValidation('public/js/app.js');
updateInsuranceValidation('public/js/app-bundle.js');

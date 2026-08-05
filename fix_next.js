const fs = require('fs');
const filePaths = ['public/js/app-bundle.js', 'public/js/app.js'];

filePaths.forEach(filePath => {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');

    const regexNext = /\/\/ Insurance validation in nextStep[\s\S]*?(?=if\(!isValid\))/;
    const newCodeNext = `// Insurance validation in nextStep
      if (currentStep === 6) {
          const insContainer = document.getElementById('insuranceOptionsContainer');
          if (insContainer) {
              const allChecked = insContainer.querySelectorAll('input[type="checkbox"]:checked');
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
              }
          }
      }

      `;
    
    if (regexNext.test(content)) {
        content = content.replace(regexNext, newCodeNext);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated nextStep in ' + filePath);
    } else {
        console.log('Regex not matched in ' + filePath);
    }
});

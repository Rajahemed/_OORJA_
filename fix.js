const fs = require('fs');
const filePaths = ['public/js/app-bundle.js', 'public/js/app.js'];

filePaths.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf8');
    const regex = /\/\/ Insurance validation[\s\S]*?(?=return isValid;)/;
    const newCode = `// Insurance validation
          const insContainer = document.getElementById('insuranceOptionsContainer');
          if (insContainer && insContainer.closest('.form-section') && insContainer.closest('.form-section').style.display !== 'none') {
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
                          
                          const cbs = cbGroup.querySelectorAll('input[type="checkbox"]');
                          cbs.forEach(cb => cb.addEventListener('change', () => { 
                              insContainer.querySelectorAll('.checkbox-group').forEach(g => {
                                  g.style.border = ''; g.style.padding = '';
                              });
                          }));
                      }
                  });
                  isValid = false;
                  if (typeof firstErrorMessage !== 'undefined' && !firstErrorMessage) firstErrorMessage = 'Please select at least one insurance option or None of the Above.';
                  if (typeof firstInvalidField !== 'undefined' && !firstInvalidField) firstInvalidField = insContainer;
              }
          }
        `;
    content = content.replace(regex, newCode);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated ' + filePath);
});

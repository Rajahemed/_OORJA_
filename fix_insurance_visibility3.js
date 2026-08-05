const fs = require('fs');
const path = require('path');

const filePaths = [
    'd:\\Road-Warrior\\public\\js\\app-bundle.js',
    'd:\\Road-Warrior\\public\\js\\app.js'
];

filePaths.forEach(filePath => {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove old broken validation if it exists and replace it with proper one
    content = content.replace(/groups\.forEach\(group => \{\n\s+const checked = group\.querySelectorAll\('input\[type="checkbox"\]:checked'\);/g, 
        `groups.forEach(group => {
                  if (group.style.display === 'none' || group.offsetParent === null) return;
                  const checked = group.querySelectorAll('input[type="checkbox"]:checked');`);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated ' + filePath);
});

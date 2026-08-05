const fs = require('fs');
const path = require('path');

const filePaths = [
    'd:\\Road-Warrior\\public\\js\\app-bundle.js',
    'd:\\Road-Warrior\\public\\js\\app.js'
];

filePaths.forEach(filePath => {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');

    // Add check for visibility in validateFullRegistrationForm and nextStep
    // Find the groups.forEach(group => { ... }) loop and add the visibility check.
    
    // Using a regex to replace the specific line
    content = content.replace(/groups\.forEach\(group => \{\n(\s+)const checked = group/g, 
        'groups.forEach(group => {\\n$1if (group.style.display === \\'none\\' || group.offsetParent === null) return;\\n$1const checked = group');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated ' + filePath);
});

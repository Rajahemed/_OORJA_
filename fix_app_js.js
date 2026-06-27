const fs = require('fs');
let content = fs.readFileSync('public/js/app.js', 'utf-8');

// The lines we want to replace
const targetStr = `                document.getElementById('regRestOfForm').style.display = 'block';
                document.getElementById('regRestOfForm').style.pointerEvents = 'auto';
                // Trigger reflow to apply transition
                void document.getElementById('regRestOfForm').offsetWidth;
                document.getElementById('regRestOfForm').style.opacity = '1';`;

const replaceStr = `                const restOfForm = document.getElementById('regRestOfForm');
                if (restOfForm) {
                    restOfForm.style.display = 'block';
                    restOfForm.style.pointerEvents = 'auto';
                    void restOfForm.offsetWidth;
                    restOfForm.style.opacity = '1';
                }`;

// 1. Remove the bad insertion at 1995:
const badInsertionRegex = /const restOfForm = document\.getElementById\('regRestOfForm'\);\s*if \(restOfForm\) \{\s*restOfForm\.style\.display = 'block';\s*restOfForm\.style\.pointerEvents = 'auto';\s*void restOfForm\.offsetWidth;\s*restOfForm\.style\.opacity = '1';\s*\}/g;

content = content.replace(badInsertionRegex, '');

// 2. We use regex to replace the old block instead of exact string (handles \r\n issues)
const oldBlockRegex = /document\.getElementById\('regRestOfForm'\)\.style\.display = 'block';\s*document\.getElementById\('regRestOfForm'\)\.style\.pointerEvents = 'auto';\s*\/\/\s*Trigger reflow to apply transition\s*void document\.getElementById\('regRestOfForm'\)\.offsetWidth;\s*document\.getElementById\('regRestOfForm'\)\.style\.opacity = '1';/g;

content = content.replace(oldBlockRegex, replaceStr);

fs.writeFileSync('public/js/app.js', content, 'utf-8');
console.log('Fixed app.js properly');

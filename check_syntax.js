const fs = require('fs');
const cp = require('child_process');
const path = require('path');

let hasError = false;

function checkDir(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                checkDir(fullPath);
            }
        } else if (fullPath.endsWith('.js')) {
            try {
                cp.execSync('node -c "' + fullPath + '"', { stdio: 'pipe' });
            } catch (err) {
                console.error('Syntax error in:', fullPath);
                console.error(err.stderr.toString());
                hasError = true;
            }
        }
    });
}

console.log('Starting syntax check...');
checkDir('.');
if (!hasError) {
    console.log('All .js files have valid syntax.');
} else {
    console.log('Syntax errors found.');
}

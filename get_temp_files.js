const fs = require('fs');
const path = require('path');

const rootFiles = fs.readdirSync(__dirname);
const publicJsFiles = fs.readdirSync(path.join(__dirname, 'public/js'));

const allTempLike = [];

// Find in root
for (const f of rootFiles) {
    if (fs.statSync(f).isFile()) {
        if (f.startsWith('patch_') || f.startsWith('check_') || f.startsWith('fix_') || f.startsWith('test_') || f.startsWith('apply_') || f.startsWith('generate_') || f.startsWith('rebuild_') || f.startsWith('recover_') || f.startsWith('restore_') || f.startsWith('revert_') || f.startsWith('view_') || f.startsWith('cleanup_') || f.startsWith('clean_') || f.endsWith('.sql') || f.endsWith('.txt') || f === 'diff.txt' || f === 'match.json' || f === 'scratch.py') {
            // Keep server.js, package.json etc safe.
            if (f !== 'server.js' && f !== 'package.json' && f !== 'package-lock.json') {
                allTempLike.push(f);
            }
        } else if (f.endsWith('.js') && f !== 'server.js') {
            allTempLike.push(f);
        }
    }
}

for (const f of publicJsFiles) {
    if (f === 'i18n-init.js' || f === 'i18n.js' || f === 'bundle.min.js' || f === 'app.min.js') {
        allTempLike.push('public/js/' + f);
    }
}

// verify they are NOT in package.json or index.html
const pkg = fs.readFileSync('package.json', 'utf8');
const html = fs.readFileSync('public/index.html', 'utf8');
const server = fs.readFileSync('server.js', 'utf8');
const about = fs.readFileSync('public/about.html', 'utf8');

const combined = pkg + html + server + about;

const safeToDelete = allTempLike.filter(f => {
    const base = path.basename(f);
    return !combined.includes(base);
});

fs.writeFileSync('temp_files_to_delete.json', JSON.stringify(safeToDelete, null, 2));
console.log('Done collecting. Found ' + safeToDelete.length + ' files.');

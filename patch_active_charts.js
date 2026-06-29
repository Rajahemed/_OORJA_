const fs = require('fs');
let appJs = fs.readFileSync('public/js/app.js', 'utf8');

if (!appJs.includes('let activeCharts = {};')) {
    // Inject near the top, for example after `let currentUser = null;` or similar global variables.
    // Or just at the top of the file. Let's look for `let currentUser`
    if (appJs.includes('let currentUser = null;')) {
        appJs = appJs.replace('let currentUser = null;', 'let currentUser = null;\nlet activeCharts = {};');
    } else {
        appJs = 'let activeCharts = {};\n' + appJs;
    }
    fs.writeFileSync('public/js/app.js', appJs, 'utf8');
    console.log('Injected let activeCharts = {};');
} else {
    console.log('activeCharts is already defined');
}

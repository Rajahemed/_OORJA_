const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

if (serverJs.includes("if (path.endsWith('.html')) {")) {
    serverJs = serverJs.replace(
        "if (path.endsWith('.html')) {",
        "if (path.endsWith('.html') || path.endsWith('.js') || path.endsWith('.css')) {"
    );
    fs.writeFileSync('server.js', serverJs, 'utf8');
    console.log('Patched server.js cache headers');
} else {
    console.log('Could not find cache headers block in server.js');
}

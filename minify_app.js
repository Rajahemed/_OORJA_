const fs = require('fs');
const { minify } = require('terser');

(async () => {
    try {
        console.log("Reading app.js...");
        const code = fs.readFileSync('public/js/app.js', 'utf8');
        
        console.log("Minifying...");
        const result = await minify(code, {
            compress: true,
            mangle: true
        });
        
        fs.writeFileSync('public/js/app.min.js', result.code, 'utf8');
        console.log("Saved app.min.js successfully!");
        
        // Also minify visitor-intelligence.js just in case
        if (fs.existsSync('public/js/visitor-intelligence.js')) {
            const codeVI = fs.readFileSync('public/js/visitor-intelligence.js', 'utf8');
            const resultVI = await minify(codeVI);
            fs.writeFileSync('public/js/visitor-intelligence.min.js', resultVI.code, 'utf8');
            let html = fs.readFileSync('public/index.html', 'utf8');
            html = html.replace('visitor-intelligence.js', 'visitor-intelligence.min.js');
            fs.writeFileSync('public/index.html', html, 'utf8');
            console.log("Saved visitor-intelligence.min.js successfully!");
        }
        
    } catch (e) {
        console.error(e);
    }
})();

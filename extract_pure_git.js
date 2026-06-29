const { execSync } = require('child_process');
const fs = require('fs');

try {
    // Get the raw UTF-8 buffer directly from git, bypassing PowerShell's encoding corruption
    const appJsBuffer = execSync('git show HEAD:public/js/app.js', { encoding: 'buffer' });
    const appJsContent = appJsBuffer.toString('utf8');
    
    const startIndex = appJsContent.indexOf('const TRANSLATIONS = {');
    // TRANSLATIONS block usually ends before window.t = function or similar, or just find the end of the object
    const endIndex = appJsContent.indexOf('};', startIndex);
    
    if (startIndex !== -1 && endIndex !== -1) {
        const translationsBlock = appJsContent.substring(startIndex, endIndex + 2);
        
        let html = fs.readFileSync('public/index.html', 'utf8');
        const badRegex = /const TRANSLATIONS = \{[\s\S]*?\};/m;
        
        if (html.match(badRegex)) {
            html = html.replace(badRegex, translationsBlock);
            fs.writeFileSync('public/index.html', html, 'utf8');
            console.log("Successfully extracted pure UTF-8 translations from git and replaced in index.html!");
        } else {
            console.log("Could not find TRANSLATIONS block in index.html to replace.");
        }
    } else {
        console.log("Could not find TRANSLATIONS in git show HEAD:public/js/app.js");
    }
} catch (e) {
    console.error("Error:", e);
}

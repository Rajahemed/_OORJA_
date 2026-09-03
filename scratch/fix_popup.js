const fs = require('fs');

const jsFiles = [
    'd:/Road-Warrior/public/js/app.js',
    'd:/Road-Warrior/public/js/app.min.js',
    'd:/Road-Warrior/public/js/app-bundle.js'
];

for (const file of jsFiles) {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        // Search for the redundant closeLeadModal function which does not take an argument
        // and doesn't have the e.preventDefault()
        // function closeLeadModal() {
        //      const modal = document.getElementById('leadCaptureModal');
        //      if (modal) modal.classList.remove('show');
        // }
        const regex = /function closeLeadModal\(\)\s*\{\s*const modal = document\.getElementById\('leadCaptureModal'\);\s*if \(modal\) modal\.classList\.remove\('show'\);\s*\}/g;
        content = content.replace(regex, '');
        fs.writeFileSync(file, content, 'utf8');
        console.log("Fixed redundant closeLeadModal in " + file);
    }
}

const cssFile = 'd:/Road-Warrior/public/css/style.css';
if (fs.existsSync(cssFile)) {
    let content = fs.readFileSync(cssFile, 'utf8');
    
    // Change background of lead-modal-header to var(--primary-color)
    // Find: .lead-modal-header { background: linear-gradient(135deg, #1e3a8a, #4f46e5); ... }
    // Or whatever the blue/purple gradient is
    const cssRegex = /\.lead-modal-header\s*\{([^}]*?)background:\s*linear-gradient\([^)]+\)/g;
    content = content.replace(cssRegex, '.lead-modal-header {$1background: var(--primary-color)');
    
    // Fallback if it's just background: #...
    // Let's just find `.lead-modal-header` and replace its background property
    const headerBlockRegex = /(\.lead-modal-header\s*\{[^}]*?)background:\s*[^;]+;/g;
    content = content.replace(headerBlockRegex, '$1background: var(--primary-color);');
    
    fs.writeFileSync(cssFile, content, 'utf8');
    console.log("Fixed lead-modal-header color in style.css");
}

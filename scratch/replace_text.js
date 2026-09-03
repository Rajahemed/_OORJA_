const fs = require('fs');
const path = require('path');

const publicDir = 'd:/Road-Warrior/public';

function processFile(filePath) {
    if (!filePath.endsWith('.html') && !filePath.endsWith('.js') && !filePath.endsWith('.txt')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Admin logo
    const adminLogoRegex = /<div class="logo">\s*<div class="logo-icon">.*?<\/div>\s*<h1>OORJA<\/h1>\s*<\/div>/g;
    if (adminLogoRegex.test(content)) {
        content = content.replace(adminLogoRegex, '<div class="logo" style="padding: 1rem;"><img src="/img/oorja-logo.png" alt="OORJA Logo" style="max-height: 40px; max-width: 100%;"></div>');
        changed = true;
    }

    // Replace all Road Warrior references
    const rwRegex = /Road Warrior EV|Road Warrior Pro|Road Warrior/gi;
    if (rwRegex.test(content)) {
        content = content.replace(rwRegex, 'OORJA');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated logos & text in ${filePath}`);
    }
}

function traverseDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file === 'img' || file === 'css') continue;
            traverseDir(fullPath);
        } else {
            processFile(fullPath);
        }
    }
}

traverseDir(publicDir);

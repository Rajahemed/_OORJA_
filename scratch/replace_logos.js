const fs = require('fs');
const path = require('path');

const publicDir = 'd:/Road-Warrior/public';

function processFile(filePath) {
    if (!filePath.endsWith('.html')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Replace the plain text logo in the navbar
    // e.g. <div class="logo" style="...">OORJA</div> or <div class="logo">OORJA</div>
    const navLogoRegex = /<div class="logo"([^>]*)>OORJA<\/div>/g;
    const navLogoReplacement = '<img src="/img/oorja-logo.png" alt="OORJA Logo" class="nav-logo" style="height: 40px; width: auto; object-fit: contain;">';
    
    if (navLogoRegex.test(content)) {
        content = content.replace(navLogoRegex, navLogoReplacement);
        changed = true;
    }
    
    // Also replace in admin.html where it might be wrapped differently:
    // e.g. <div class="logo">\n            <h2>OORJA</h2>\n        </div>
    const adminLogoRegex = /<div class="logo">\s*<h2>OORJA<\/h2>\s*<\/div>/g;
    if (adminLogoRegex.test(content)) {
        content = content.replace(adminLogoRegex, '<div class="logo" style="text-align: center; padding: 1rem;"><img src="/img/oorja-logo.png" alt="OORJA Logo" style="max-height: 40px; max-width: 100%;"></div>');
        changed = true;
    }

    // Replace footer logo text
    // e.g. <span class="footer-logo-text"...>OORJA <span...>Pro</span></span>
    const footerLogoRegex = /<span class="footer-logo-text"[^>]*>OORJA[^<]*(<span[^>]*>[^<]*<\/span>)?<\/span>/g;
    const footerLogoReplacement = '<img src="/img/oorja-logo.png" alt="OORJA Logo" class="footer-logo" style="height: 40px; width: auto; object-fit: contain;">';
    
    if (footerLogoRegex.test(content)) {
        content = content.replace(footerLogoRegex, footerLogoReplacement);
        changed = true;
    }
    
    // Also if there's any simple text "OORJA" where "footer-brand" is used
    const footerBrandRegex = /<div class="footer-brand"[^>]*>\s*<h3[^>]*>OORJA<\/h3>/g;
    if (footerBrandRegex.test(content)) {
        content = content.replace(footerBrandRegex, '<div class="footer-brand"><img src="/img/oorja-logo.png" alt="OORJA Logo" style="height: 40px; margin-bottom: 1rem;">');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated logos in ${filePath}`);
    }
}

function traverseDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverseDir(fullPath);
        } else {
            processFile(fullPath);
        }
    }
}

traverseDir(publicDir);

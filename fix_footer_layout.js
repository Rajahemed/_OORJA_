const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf-8');

// 1. Remove the bad insertion from line 905
const badInsertionRegex = /<div class="footer-col footer-brand"[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<button type="button" class="btn btn-primary"/;
html = html.replace(/<div class="footer-col footer-brand" style="flex: 1; min-width: 200px; margin-bottom: 1\.5rem; display: flex; justify-content: space-between; align-items: center; width: 100%;">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, '');

// The above regex might be fragile, let's just do exact string replacement if possible.
// Let's just restore from git and redo my previous steps! Wait, I can't `git checkout` because I'll lose `app.js` and `submitRegBtn` fix!
// Wait! `git checkout` only affects `index.html`!
// Wait! `submitRegBtn` fix is in `index.html`! I cannot `git checkout public/index.html`.

// Let's manually write a safe regex to remove the bad footer-col inside the registration form
html = html.replace(/<div class="footer-col footer-brand" style="flex: 1; min-width: 200px; margin-bottom: 1\.5rem; display: flex; justify-content: space-between; align-items: center; width: 100%;">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g, (match, offset) => {
    // Only remove it if it's NOT near the end of the document
    if (offset < 150000) { // arbitrary char offset, footer is at the end
        return '';
    }
    return match;
});

// Now replace the actual footer-brand in the footer
const oldFooterBrand = `<div class="footer-col footer-brand" style="flex: 1; min-width: 200px; margin-bottom: 1.5rem;">
                <div class="footer-logo" style="margin-bottom: 1rem; font-size: 1.5rem; font-weight: 800;">
                    <span class="footer-logo-icon" style="color: var(--primary-color);">⚡</span>
                    <span class="footer-logo-text" style="color: var(--text-primary);">Road Warrior <span style="color: var(--primary-color);">Pro</span></span>
                </div>
                <a href="tel:+916360483386" class="footer-btn-download" style="background: linear-gradient(135deg, #25D366, #128C7E); color: white; border: none; box-shadow: 0 4px 15px rgba(37, 211, 102, 0.2); display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; border-radius: 8px; text-decoration: none; font-weight: 600;">
                    <span>Click To Call</span>
                    <i class="fas fa-phone-alt"></i>
                </a>
                <a href="https://wa.me/916360483386" target="_blank" class="footer-btn-download" style="margin-top: 0.75rem; background: linear-gradient(135deg, #25D366, #075E54); color: white; border: none; box-shadow: 0 4px 15px rgba(37, 211, 102, 0.2); display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; border-radius: 8px; text-decoration: none; font-weight: 600;">
                    <span>WhatsApp Us</span>
                    <i class="fab fa-whatsapp"></i>
                </a>
            </div>`;

const newFooterBrand = `<div class="footer-col footer-brand" style="flex: 1; min-width: 200px; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <div class="footer-logo" style="font-size: 1.5rem; font-weight: 800; margin: 0;">
                    <span class="footer-logo-icon" style="color: var(--primary-color);">⚡</span>
                    <span class="footer-logo-text" style="color: var(--text-primary);">Road Warrior <span style="color: var(--primary-color);">Pro</span></span>
                </div>
                <div style="display: flex; gap: 1rem;">
                    <a href="tel:+916360483386" class="footer-btn-download" style="background: linear-gradient(135deg, #25D366, #128C7E); color: white; border: none; box-shadow: 0 4px 15px rgba(37, 211, 102, 0.2); display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; border-radius: 8px; text-decoration: none; font-weight: 600;">
                        <span>Click To Call</span>
                        <i class="fas fa-phone-alt"></i>
                    </a>
                    <a href="https://wa.me/916360483386" target="_blank" class="footer-btn-download" style="background: linear-gradient(135deg, #25D366, #075E54); color: white; border: none; box-shadow: 0 4px 15px rgba(37, 211, 102, 0.2); display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; border-radius: 8px; text-decoration: none; font-weight: 600;">
                        <span>WhatsApp Us</span>
                        <i class="fab fa-whatsapp"></i>
                    </a>
                </div>
            </div>`;

// Safely replace the target in the footer
let lastIndex = html.lastIndexOf('<div class="footer-col footer-brand"');
if (lastIndex !== -1) {
    let before = html.substring(0, lastIndex);
    let after = html.substring(lastIndex);
    after = after.replace(oldFooterBrand, newFooterBrand);
    html = before + after;
}

fs.writeFileSync('public/index.html', html, 'utf-8');
console.log('Fixed footer layout');

const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf-8');

// 1. Remove the bad insertion from line 905 (inside regSection6)
// It was inserted exactly between: <button type="button" class="btn btn-secondary" onclick="prevStep()"><i class="fas fa-arrow-left"></i> Back</button>
// and <button type="button" class="btn btn-primary" style="background:linear-gradient(135deg,#3b82f6,#f97316); flex:1; margin-left:1rem;" onclick="submitRegistration()" id="submitRegBtn">

const badStr = `                                    <button type="button" class="btn btn-secondary" onclick="prevStep()"><i class="fas fa-arrow-left"></i> Back</button>
                                    <div class="footer-col footer-brand" style="flex: 1; min-width: 200px; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; width: 100%;">
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
            </div>
                                    <button type="button" class="btn btn-primary"`;

const fixedStr = `                                    <button type="button" class="btn btn-secondary" onclick="prevStep()"><i class="fas fa-arrow-left"></i> Back</button>
                                    <button type="button" class="btn btn-primary"`;

html = html.replace(badStr, fixedStr);

// 2. Replace the old footer brand block
const oldFooterBrandRegex = /<div class="footer-col footer-brand"[\s\S]*?<\/div>\s*<\/div>\s*<!-- Footer Bottom Bar -->/;
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
                    <a href="https://wa.me/916360483386" target="_blank" class="footer-btn-download" style="margin-top: 0; background: linear-gradient(135deg, #25D366, #075E54); color: white; border: none; box-shadow: 0 4px 15px rgba(37, 211, 102, 0.2); display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; border-radius: 8px; text-decoration: none; font-weight: 600;">
                        <span>WhatsApp Us</span>
                        <i class="fab fa-whatsapp"></i>
                    </a>
                </div>
            </div>
        </div>
        <!-- Footer Bottom Bar -->`;

html = html.replace(oldFooterBrandRegex, newFooterBrand);

fs.writeFileSync('public/index.html', html, 'utf-8');
console.log('Fixed everything');

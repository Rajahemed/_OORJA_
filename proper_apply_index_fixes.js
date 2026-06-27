const fs = require('fs');

// Start from a fresh checkout of index.html
const { execSync } = require('child_process');
execSync('git checkout public/index.html');
let html = fs.readFileSync('public/index.html', 'utf-8');

// --- 1. Fix submitRegBtn ---
const targetBtn = `<button type="button" class="btn btn-primary w-100" style="background:linear-gradient(135deg,#3b82f6,#f97316);" onclick="submitRegistration()" id="submitRegBtn">
                                    <i class="fas fa-check-circle"></i> <span data-i18n="btn_submit_reg">Complete Registration</span>
                                </button>`;

const replacementBtn = `<div style="display:flex; justify-content:space-between; margin-top:1.5rem;">
                                    <button type="button" class="btn btn-secondary" onclick="prevStep()"><i class="fas fa-arrow-left"></i> Back</button>
                                    <button type="button" class="btn btn-primary" style="background:linear-gradient(135deg,#3b82f6,#f97316); flex:1; margin-left:1rem;" onclick="submitRegistration()" id="submitRegBtn">
                                        <i class="fas fa-check-circle"></i> <span data-i18n="btn_submit_reg">Complete Registration</span>
                                    </button>
                                </div>`;

if (html.includes(targetBtn)) {
    html = html.replace(targetBtn, replacementBtn);
} else {
    // try removing carriage returns for matching
    html = html.replace(targetBtn.replace(/\r\n/g, '\n'), replacementBtn);
}

// --- 2. Remove ONLY Savings Calculator ---
const startCalc = html.indexOf('<!-- ===== SAVINGS CALCULATOR ===== -->');
const calcEndStr = `document.addEventListener('DOMContentLoaded', calculateSavings);\n                </script>\n            </div>`;
const calcEndStrWin = `document.addEventListener('DOMContentLoaded', calculateSavings);\r\n                </script>\r\n            </div>`;

let endCalc = html.indexOf(calcEndStr, startCalc);
if (endCalc === -1) endCalc = html.indexOf(calcEndStrWin, startCalc);

if (startCalc !== -1 && endCalc !== -1) {
    // Add the length of the matching string to endCalc so we remove the closing </div>
    const length = (html.indexOf(calcEndStr) !== -1) ? calcEndStr.length : calcEndStrWin.length;
    html = html.substring(0, startCalc) + html.substring(endCalc + length);
} else {
    console.error('Could not find calculator end string');
}

// --- 3. Replace Footer ---
const startFooter = html.indexOf('<div class="footer-inner">');
const endFooter = html.indexOf('<!-- Footer Bottom Bar -->');

if (startFooter !== -1 && endFooter !== -1) {
    const newFooter = `<div class="footer-inner" style="display: flex; justify-content: space-between; align-items: center; width: 100%; border-bottom: 1px solid var(--border-color); padding-bottom: 2rem; margin-bottom: 2rem;">
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
        `;
    
    html = html.substring(0, startFooter) + newFooter + html.substring(endFooter);
}

fs.writeFileSync('public/index.html', html, 'utf-8');
console.log('Successfully applied all fixes correctly!');

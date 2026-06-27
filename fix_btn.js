const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf-8');

const oldSubmitBtn = /<button type="button" class="btn btn-primary w-100" style="background:linear-gradient\(135deg,#3b82f6,#f97316\);" onclick="submitRegistration\(\)" id="submitRegBtn">\s*<i class="fas fa-check-circle"><\/i> <span data-i18n="btn_submit_reg">Complete Registration<\/span>\s*<\/button>/;

const newSubmitBtn = `<div style="display:flex; justify-content:space-between; margin-top:1.5rem;">
                                    <button type="button" class="btn btn-secondary" onclick="prevStep()"><i class="fas fa-arrow-left"></i> Back</button>
                                    <button type="button" class="btn btn-primary" style="background:linear-gradient(135deg,#3b82f6,#f97316); flex:1; margin-left:1rem;" onclick="submitRegistration()" id="submitRegBtn">
                                        <i class="fas fa-check-circle"></i> <span data-i18n="btn_submit_reg">Complete Registration</span>
                                    </button>
                                </div>`;

html = html.replace(oldSubmitBtn, newSubmitBtn);
fs.writeFileSync('public/index.html', html, 'utf-8');
console.log('Fixed submit btn');

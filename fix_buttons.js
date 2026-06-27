const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf-8');

// SECTION B
if(!html.includes('<!-- End of regSection1 -->')) {
    html = html.replace('<!-- SECTION B: Current Vehicle -->', 
        `<div style="display:flex; justify-content:flex-end; margin-top:1.5rem;"><button type="button" class="btn btn-primary" onclick="nextStep()">Next <i class="fas fa-arrow-right"></i></button></div>\n                            </div> <!-- End of regSection1 -->\n                            <!-- SECTION B: Current Vehicle -->`);
}

// SECTION C
if(!html.includes('<!-- End of regSection2 -->')) {
    html = html.replace(/(<\/div>\s*)(<!-- SECTION C: Challenges -->)/, 
        `<div style="display:flex; justify-content:space-between; margin-top:1.5rem;"><button type="button" class="btn btn-secondary" onclick="prevStep()"><i class="fas fa-arrow-left"></i> Back</button><button type="button" class="btn btn-primary" onclick="nextStep()">Next <i class="fas fa-arrow-right"></i></button></div>\n                            </div> <!-- End of regSection2 -->\n$2`);
}

// SECTION D
if(!html.includes('<!-- End of regSection3 -->')) {
    html = html.replace(/(<\/div>\s*)(<!-- SECTION D: Insurance -->)/, 
        `<div style="display:flex; justify-content:space-between; margin-top:1.5rem;"><button type="button" class="btn btn-secondary" onclick="prevStep()"><i class="fas fa-arrow-left"></i> Back</button><button type="button" class="btn btn-primary" onclick="nextStep()">Next <i class="fas fa-arrow-right"></i></button></div>\n                            </div> <!-- End of regSection3 -->\n$2`);
}

// SECTION E
if(!html.includes('<!-- End of regSection4 -->')) {
    html = html.replace(/(<\/div>\s*)(<!-- SECTION E: Openness to Change -->)/, 
        `<div style="display:flex; justify-content:space-between; margin-top:1.5rem;"><button type="button" class="btn btn-secondary" onclick="prevStep()"><i class="fas fa-arrow-left"></i> Back</button><button type="button" class="btn btn-primary" onclick="nextStep()">Next <i class="fas fa-arrow-right"></i></button></div>\n                            </div> <!-- End of regSection4 -->\n$2`);
}

// SECTION F
if(!html.includes('<!-- End of regSection5 -->')) {
    html = html.replace(/(<\/div>\s*)(<!-- SECTION F: Referral -->)/, 
        `<div style="display:flex; justify-content:space-between; margin-top:1.5rem;"><button type="button" class="btn btn-secondary" onclick="prevStep()"><i class="fas fa-arrow-left"></i> Back</button><button type="button" class="btn btn-primary" onclick="nextStep()">Next <i class="fas fa-arrow-right"></i></button></div>\n                            </div> <!-- End of regSection5 -->\n$2`);
}

// FIX BUTTON 6
const oldSubmitBtn = `<button type="button" class="btn btn-primary w-100" style="background:linear-gradient(135deg,#3b82f6,#f97316);" onclick="submitRegistration()" id="submitRegBtn">
                                    <i class="fas fa-check-circle"></i> <span data-i18n="btn_submit_reg">Complete Registration</span>
                                </button>`;
const newSubmitBtn = `<div style="display:flex; justify-content:space-between; margin-top:1.5rem;">
                                    <button type="button" class="btn btn-secondary" onclick="prevStep()"><i class="fas fa-arrow-left"></i> Back</button>
                                    <button type="button" class="btn btn-primary" style="background:linear-gradient(135deg,#3b82f6,#f97316); flex:1; margin-left:1rem;" onclick="submitRegistration()" id="submitRegBtn">
                                        <i class="fas fa-check-circle"></i> <span data-i18n="btn_submit_reg">Complete Registration</span>
                                    </button>
                                </div>
                            </div> <!-- End of regSection6 -->`;

if(html.includes(oldSubmitBtn)) {
    html = html.replace(oldSubmitBtn, newSubmitBtn);
} else {
    html = html.replace(oldSubmitBtn.replace(/\r\n/g, '\n'), newSubmitBtn);
}


fs.writeFileSync('public/index.html', html, 'utf-8');
console.log('Fixed buttons!');

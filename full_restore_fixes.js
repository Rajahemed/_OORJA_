const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf-8');

// 1. Restore Promo Banner + Language Switcher
const targetStr = `<div class="card-body" style="margin-top:1rem;">

                            <!-- Registration Form Content -->`;
const replacementStr = `<!-- Refer Earn Win Promo Banner -->
                        <div style="padding: 0.75rem 1rem 0; margin-bottom: 0.5rem;">
                            <img src="/img/refer-earn-win-banner.jpg"
                                 alt="Refer • Earn • Win — Exciting Prizes! Refer your friends and stand a chance to win an Electric Scooter or Electric Car!"
                                 style="width:100%; border-radius:12px; display:block; box-shadow:0 4px 20px rgba(0,0,0,0.18); object-fit:cover;"
                                 loading="lazy">
                        </div>

                        <!-- Language Switcher below Banner -->
                        <div style="display:flex; align-items:center; justify-content:center; gap:0.75rem; margin-top:0.25rem; margin-bottom:0.75rem;">
                            <i class="fas fa-globe" style="color:var(--text-secondary); font-size:1rem;"></i>
                            <span style="font-size:0.8rem; color:var(--text-secondary); font-weight:500;">Language:</span>
                            <div style="display:flex; gap:0.4rem; flex-wrap:wrap; justify-content:center;">
                                <button type="button" onclick="changeLanguage('en'); updateFormLangBtns('en')" id="formLangEn"
                                    style="padding:0.3rem 0.75rem; border-radius:20px; border:1.5px solid var(--primary-color); background:var(--primary-color); color:#fff; font-size:0.78rem; font-weight:600; cursor:pointer; transition:all 0.2s;">
                                    🇺🇸 English
                                </button>
                                <button type="button" onclick="changeLanguage('hi'); updateFormLangBtns('hi')" id="formLangHi"
                                    style="padding:0.3rem 0.75rem; border-radius:20px; border:1.5px solid var(--card-border); background:transparent; color:var(--text-secondary); font-size:0.78rem; font-weight:600; cursor:pointer; transition:all 0.2s;">
                                    🇮🇳 हिंदी
                                </button>
                                <button type="button" onclick="changeLanguage('kn'); updateFormLangBtns('kn')" id="formLangKn"
                                    style="padding:0.3rem 0.75rem; border-radius:20px; border:1.5px solid var(--card-border); background:transparent; color:var(--text-secondary); font-size:0.78rem; font-weight:600; cursor:pointer; transition:all 0.2s;">
                                    🇮🇳 ಕನ್ನಡ
                                </button>
                            </div>
                        </div>

                        <div class="card-body" style="margin-top:0.5rem;">

                            <!-- Registration Form Content -->`;

if (html.includes(targetStr)) {
    html = html.replace(targetStr, replacementStr);
} else {
    html = html.replace(targetStr.replace(/\r\n/g, '\n'), replacementStr);
}


// --- 2. RESTORE SPLIT LOGIC (from refactor_safe.js) ---

// 1. Insert progress bar before regSection1
const progressHtml = `
                            <!-- Form Progress Indicator -->
                            <div class="form-progress" id="regProgress">
                                <div class="progress-step active" id="stepIndicator1">
                                    <div class="step-circle">1</div>
                                    <div class="step-label">Profile</div>
                                </div>
                                <div class="progress-step" id="stepIndicator2">
                                    <div class="step-circle">2</div>
                                    <div class="step-label">Vehicle</div>
                                </div>
                                <div class="progress-step" id="stepIndicator3">
                                    <div class="step-circle">3</div>
                                    <div class="step-label">Challenges</div>
                                </div>
                                <div class="progress-step" id="stepIndicator4">
                                    <div class="step-circle">4</div>
                                    <div class="step-label">Insurance</div>
                                </div>
                                <div class="progress-step" id="stepIndicator5">
                                    <div class="step-circle">5</div>
                                    <div class="step-label">EV Open</div>
                                </div>
                                <div class="progress-step" id="stepIndicator6">
                                    <div class="step-circle">6</div>
                                    <div class="step-label">Referral</div>
                                </div>
                            </div>
`;
html = html.replace('<!-- SECTION A: Basic Profile -->', progressHtml + '\n                            <!-- SECTION A: Basic Profile -->');

// 2. Replace classes single-page-section with form-section
html = html.replace(/<div class="single-page-section" id="regSection1"/, '<div class="form-section active" id="regSection1"');
for(let i=2; i<=6; i++) {
    html = html.replace(new RegExp(`<div class="single-page-section" id="regSection${i}"`), `<div class="form-section" id="regSection${i}"`);
}
// Also replace regSuccessPanel
html = html.replace(/<div class="single-page-section" id="regSuccessPanel"/, '<div class="form-section" id="regSuccessPanel"');

// 3. Remove regRestOfForm completely
html = html.replace('<div id="regRestOfForm">', '');
html = html.replace('</div> <!-- End of regRestOfForm -->', '');

// 4. Add Next/Back buttons at end of sections
// Close regSection1 before regSection2 begins
html = html.replace('<!-- SECTION B: Current Vehicle -->', 
    `<div style="display:flex; justify-content:flex-end; margin-top:1.5rem;"><button type="button" class="btn btn-primary" onclick="nextStep()">Next <i class="fas fa-arrow-right"></i></button></div>\n                            </div> <!-- End of regSection1 -->\n                            <!-- SECTION B: Current Vehicle -->`);

html = html.replace(/(<\/div>\s*)(<!-- SECTION C: Challenges & Pain Points -->)/, 
    `<div style="display:flex; justify-content:space-between; margin-top:1.5rem;"><button type="button" class="btn btn-secondary" onclick="prevStep()"><i class="fas fa-arrow-left"></i> Back</button><button type="button" class="btn btn-primary" onclick="nextStep()">Next <i class="fas fa-arrow-right"></i></button></div>\n                            </div> <!-- End of regSection2 -->\n$2`);

html = html.replace(/(<\/div>\s*)(<!-- SECTION D: Insurance -->)/, 
    `<div style="display:flex; justify-content:space-between; margin-top:1.5rem;"><button type="button" class="btn btn-secondary" onclick="prevStep()"><i class="fas fa-arrow-left"></i> Back</button><button type="button" class="btn btn-primary" onclick="nextStep()">Next <i class="fas fa-arrow-right"></i></button></div>\n                            </div> <!-- End of regSection3 -->\n$2`);

html = html.replace(/(<\/div>\s*)(<!-- SECTION E: Openness to EV -->)/, 
    `<div style="display:flex; justify-content:space-between; margin-top:1.5rem;"><button type="button" class="btn btn-secondary" onclick="prevStep()"><i class="fas fa-arrow-left"></i> Back</button><button type="button" class="btn btn-primary" onclick="nextStep()">Next <i class="fas fa-arrow-right"></i></button></div>\n                            </div> <!-- End of regSection4 -->\n$2`);

html = html.replace(/(<\/div>\s*)(<!-- SECTION F: Referral -->)/, 
    `<div style="display:flex; justify-content:space-between; margin-top:1.5rem;"><button type="button" class="btn btn-secondary" onclick="prevStep()"><i class="fas fa-arrow-left"></i> Back</button><button type="button" class="btn btn-primary" onclick="nextStep()">Next <i class="fas fa-arrow-right"></i></button></div>\n                            </div> <!-- End of regSection5 -->\n$2`);


// 5. Side by Side Dropdowns
html = html.replace(
`<div class="form-group">
                                    <label for="regState">State</label>
                                    <select id="regState" class="form-control" required onchange="onRegStateChange()">
                                        <option value="">Loading States...</option>
                                    </select>
                                    <input type="text" id="regStateOther" class="form-control" placeholder="Enter State" style="display:none; margin-top:0.5rem;" oninput="this.value = this.value.toUpperCase()">
                                </div>
                                <div class="form-group">
                                    <label for="regCity" data-i18n="label_city">City</label>
                                    <select id="regCity" class="form-control" required onchange="onRegCityChange()" disabled>
                                        <option value="" data-i18n="select_city">Select your city</option>
                                    </select>
                                    <input type="text" id="regCityOther" class="form-control" placeholder="Enter City" style="display:none; margin-top:0.5rem;" oninput="this.value = this.value.toUpperCase()">
                                </div>`,
`<div style="display:flex; gap:1rem; flex-wrap:wrap;">
                                    <div class="form-group" style="flex:1; min-width:200px;">
                                        <label for="regState">State</label>
                                        <select id="regState" class="form-control" required onchange="onRegStateChange()">
                                            <option value="">Loading States...</option>
                                        </select>
                                        <input type="text" id="regStateOther" class="form-control" placeholder="Enter State" style="display:none; margin-top:0.5rem;" oninput="this.value = this.value.toUpperCase()">
                                    </div>
                                    <div class="form-group" style="flex:1; min-width:200px;">
                                        <label for="regCity" data-i18n="label_city">City</label>
                                        <select id="regCity" class="form-control" required onchange="onRegCityChange()" disabled>
                                            <option value="" data-i18n="select_city">Select your city</option>
                                        </select>
                                        <input type="text" id="regCityOther" class="form-control" placeholder="Enter City" style="display:none; margin-top:0.5rem;" oninput="this.value = this.value.toUpperCase()">
                                    </div>
                                </div>`
);

html = html.replace(
`<div class="form-group">
                                    <label for="regPincode" data-i18n="label_pincode">Pincode</label>
                                    <input type="text" id="regPincode" class="form-control" required placeholder="Type pincode (e.g. 560001)" pattern="[0-9]{6}" maxlength="6" title="Please enter a 6-digit valid pincode">
                                </div>
                                <div class="form-group" style="position:relative; z-index:10;">
                                    <label for="regPlatform" data-i18n="label_platform">Delivery Platform</label>`,
`<div style="display:flex; gap:1rem; flex-wrap:wrap;">
                                    <div class="form-group" style="flex:1; min-width:200px;">
                                        <label for="regPincode" data-i18n="label_pincode">Pincode</label>
                                        <input type="text" id="regPincode" class="form-control" required placeholder="Type pincode (e.g. 560001)" pattern="[0-9]{6}" maxlength="6" title="Please enter a 6-digit valid pincode">
                                    </div>
                                    <div class="form-group" style="position:relative; z-index:10; flex:1; min-width:200px;">
                                        <label for="regPlatform" data-i18n="label_platform">Delivery Platform</label>`
);

// Add closing </div> for the wrap
const regPlatformOtherMatch = '<input type="text" id="regPlatformOther" class="form-control" placeholder="Type platform name" style="display:none; margin-top:0.5rem;">\n                                </div>';
html = html.replace(regPlatformOtherMatch, regPlatformOtherMatch + '\n                                </div>');

fs.writeFileSync('public/index.html', html, 'utf-8');
console.log('Restored all fixes!');

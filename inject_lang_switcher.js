const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf-8');

const bannerHtml = `
                        <!-- Refer Earn Win Promo Banner -->
                        <div style="padding: 0.75rem 1rem 0; margin-bottom: 0.5rem;">
                            <img src="/img/refer-earn-win-banner.jpg"
                                 alt="Refer Earn Win"
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
`;

// regex to find the exact insertion point
const regex = /<h2 class="card-title" data-i18n="register_title">.*?<\/h2>\s*<\/div>\s*<div class="card-body" style="margin-top:1rem;">/g;

html = html.replace(regex, (match) => {
    return match.replace('<div class="card-body" style="margin-top:1rem;">', bannerHtml);
});

fs.writeFileSync('public/index.html', html, 'utf-8');
console.log('Language switcher and banner injected.');

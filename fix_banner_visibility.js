const fs = require('fs');

// Update HTML
let html = fs.readFileSync('public/index.html', 'utf-8');
html = html.replace('<!-- Refer Earn Win Promo Banner -->\n                        <div style="padding: 0.75rem 1rem 0; margin-bottom: 0.5rem;">',
                    '<!-- Refer Earn Win Promo Banner -->\n                        <div id="promoBannerContainer" style="padding: 0.75rem 1rem 0; margin-bottom: 0.5rem;">');
html = html.replace('<!-- Refer Earn Win Promo Banner -->\r\n                        <div style="padding: 0.75rem 1rem 0; margin-bottom: 0.5rem;">',
                    '<!-- Refer Earn Win Promo Banner -->\r\n                        <div id="promoBannerContainer" style="padding: 0.75rem 1rem 0; margin-bottom: 0.5rem;">');
fs.writeFileSync('public/index.html', html, 'utf-8');

// Update JS
let js = fs.readFileSync('public/js/app.js', 'utf-8');
const searchString = `    document.querySelectorAll('.progress-step').forEach((el, index) => {`;
const replaceString = `    const banner = document.getElementById('promoBannerContainer');
    if (banner) {
        banner.style.display = (step === 1) ? 'block' : 'none';
    }

    document.querySelectorAll('.progress-step').forEach((el, index) => {`;
js = js.replace(searchString, replaceString);
fs.writeFileSync('public/js/app.js', js, 'utf-8');
console.log('Fixed promo banner visibility across steps.');
c
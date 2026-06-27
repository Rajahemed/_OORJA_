const fs = require('fs');

// Update HTML
let html = fs.readFileSync('public/index.html', 'utf-8');
const searchHtml1 = '<!-- Language Switcher below Banner -->\n                        <div style="display:flex; align-items:center; justify-content:center; gap:0.75rem; margin-top:0.25rem; margin-bottom:0.75rem;">';
const replaceHtml1 = '<!-- Language Switcher below Banner -->\n                        <div id="languageSwitcherContainer" style="display:flex; align-items:center; justify-content:center; gap:0.75rem; margin-top:0.25rem; margin-bottom:0.75rem;">';
const searchHtml2 = '<!-- Language Switcher below Banner -->\r\n                        <div style="display:flex; align-items:center; justify-content:center; gap:0.75rem; margin-top:0.25rem; margin-bottom:0.75rem;">';
const replaceHtml2 = '<!-- Language Switcher below Banner -->\r\n                        <div id="languageSwitcherContainer" style="display:flex; align-items:center; justify-content:center; gap:0.75rem; margin-top:0.25rem; margin-bottom:0.75rem;">';

html = html.replace(searchHtml1, replaceHtml1);
html = html.replace(searchHtml2, replaceHtml2);
fs.writeFileSync('public/index.html', html, 'utf-8');

// Update JS
let js = fs.readFileSync('public/js/app.js', 'utf-8');
const searchJs = `    const banner = document.getElementById('promoBannerContainer');
    if (banner) {
        banner.style.display = (step === 1) ? 'block' : 'none';
    }`;
const replaceJs = `    const banner = document.getElementById('promoBannerContainer');
    if (banner) {
        banner.style.display = (step === 1) ? 'block' : 'none';
    }
    const langSwitcher = document.getElementById('languageSwitcherContainer');
    if (langSwitcher) {
        langSwitcher.style.display = (step === 1) ? 'flex' : 'none';
    }`;

if (js.includes(searchJs)) {
    js = js.replace(searchJs, replaceJs);
} else if (js.includes(searchJs.replace(/\r\n/g, '\n'))) {
    js = js.replace(searchJs.replace(/\r\n/g, '\n'), replaceJs);
}
fs.writeFileSync('public/js/app.js', js, 'utf-8');
console.log('Fixed language switcher visibility across steps.');

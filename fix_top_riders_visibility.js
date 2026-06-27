const fs = require('fs');

// 1. Update index.html
let html = fs.readFileSync('public/index.html', 'utf-8');

const searchStr = `<!-- ===== TOP RIDERS SLIDER SECTION ===== -->\n            <div style="margin-top: 4rem; margin-bottom: 2rem; width: 100%;`;
const searchStrWindows = `<!-- ===== TOP RIDERS SLIDER SECTION ===== -->\r\n            <div style="margin-top: 4rem; margin-bottom: 2rem; width: 100%;`;

const replaceStr = `<!-- ===== TOP RIDERS SLIDER SECTION ===== -->\n            <div id="topRidersSection" style="margin-top: 4rem; margin-bottom: 2rem; width: 100%;`;
const replaceStrWindows = `<!-- ===== TOP RIDERS SLIDER SECTION ===== -->\r\n            <div id="topRidersSection" style="margin-top: 4rem; margin-bottom: 2rem; width: 100%;`;

html = html.replace(searchStr, replaceStr);
html = html.replace(searchStrWindows, replaceStrWindows);

fs.writeFileSync('public/index.html', html, 'utf-8');
console.log('Added ID to topRidersSection in HTML');

// 2. Update app.js
let js = fs.readFileSync('public/js/app.js', 'utf-8');

// Replace all occurrences where siteFooter is toggled
js = js.replace(/const siteFooter = document\.getElementById\('site-footer'\);/g, `const siteFooter = document.getElementById('site-footer');\n        const topRidersSection = document.getElementById('topRidersSection');`);
js = js.replace(/if \(siteFooter\)\s*\{\s*siteFooter\.style\.display = \(activeTab === 'home' && !isRegOpen\) \? 'block' : 'none';\s*\}/g, `if (siteFooter) {\n            siteFooter.style.display = (activeTab === 'home' && !isRegOpen) ? 'block' : 'none';\n        }\n        if (topRidersSection) {\n            topRidersSection.style.display = (activeTab === 'home' && !isRegOpen) ? 'block' : 'none';\n        }`);
js = js.replace(/if \(siteFooter\) siteFooter\.style\.display = 'block';/g, `if (siteFooter) siteFooter.style.display = 'block';\n            if (topRidersSection) topRidersSection.style.display = 'block';`);
js = js.replace(/if \(siteFooter\) siteFooter\.style\.display = 'none';/g, `if (siteFooter) siteFooter.style.display = 'none';\n            if (topRidersSection) topRidersSection.style.display = 'none';`);

fs.writeFileSync('public/js/app.js', js, 'utf-8');
console.log('Added topRidersSection toggle logic to JS');

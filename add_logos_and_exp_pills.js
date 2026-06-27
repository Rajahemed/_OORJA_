const fs = require('fs');

function getLogo(bg, text, textColor = '%23fff') {
    return `<img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><rect width='24' height='24' rx='4' fill='${bg}'/><text x='50%' y='50%' font-family='sans-serif' font-size='14' fill='${textColor}' font-weight='bold' text-anchor='middle' dominant-baseline='central'>${text}</text></svg>" loading="lazy" style="width:18px; height:18px; border-radius:4px; object-fit:contain; background:#fff; padding:1px; margin-right: 6px;">`;
}

function getOtherLogo() {
    return `<div style="width:18px; height:18px; border-radius:4px; background:var(--card-border); display:inline-flex; align-items:center; justify-content:center; margin-right: 6px; flex-shrink:0;"><i class="fas fa-ellipsis-h" style="font-size:10px; color:var(--text-secondary);"></i></div>`;
}

let html = fs.readFileSync('public/index.html', 'utf-8');

// Update Platform Pills CSS to align logos properly
html = html.replace('.platform-pill {', '.platform-pill {\n                                            display: inline-flex; align-items: center;');

// Replace Platform Pills HTML to include logos
const platformPillsHtml = `<div class="platform-pills" id="platformPillsContainer">
                                        <div class="platform-pill" onclick="selectPlatformPill('Swiggy', this)">${getLogo('%23f96e2a', 'S')}Swiggy</div>
                                        <div class="platform-pill" onclick="selectPlatformPill('Zomato', this)">${getLogo('%23e23744', 'Z')}Zomato</div>
                                        <div class="platform-pill" onclick="selectPlatformPill('Blinkit', this)">${getLogo('%23f8cb46', 'B', '%23000')}Blinkit</div>
                                        <div class="platform-pill" onclick="selectPlatformPill('Porter', this)">${getLogo('%232d62e1', 'P')}Porter</div>
                                        <div class="platform-pill" onclick="selectPlatformPill('Dunzo', this)">${getLogo('%2300d290', 'D')}Dunzo</div>
                                        <div class="platform-pill" onclick="selectPlatformPill('DHL', this)">${getLogo('%23ffcc00', 'D', '%23d40511')}DHL</div>
                                        <div class="platform-pill" onclick="selectPlatformPill('Amazon', this)">${getLogo('%23ff9900', 'A', '%23000')}Amazon</div>
                                        <div class="platform-pill" onclick="selectPlatformPill('Flipkart', this)">${getLogo('%232874f0', 'F')}Flipkart</div>
                                        <div class="platform-pill" onclick="selectPlatformPill('Zepto', this)">${getLogo('%234B0082', 'Z')}Zepto</div>
                                        <div class="platform-pill" onclick="selectPlatformPill('Other', this)">${getOtherLogo()}Other</div>
                                    </div>`;

html = html.replace(/<div class="platform-pills" id="platformPillsContainer">[\s\S]*?<\/div>\s*<!-- Hidden actual select for form submission and validation -->/, platformPillsHtml + '\n                                    \n                                    <!-- Hidden actual select for form submission and validation -->');

// Replace Experience Dropdown with Pills
const expDropdownStr = `<select id="regExp" class="form-control" required>
                                            <option value="">Select experience</option>
                                            <option value="0-1">0-1 Years</option>
                                            <option value="1-3">1-3 Years</option>
                                            <option value="3-5">3-5 Years</option>
                                            <option value="5+">5+ Years</option>
                                        </select>`;

const expPillsHtml = `<div class="platform-pills" id="expPillsContainer">
                                            <div class="platform-pill" onclick="selectExpPill('0-1', this)">0-1 Years</div>
                                            <div class="platform-pill" onclick="selectExpPill('1-3', this)">1-3 Years</div>
                                            <div class="platform-pill" onclick="selectExpPill('3-5', this)">3-5 Years</div>
                                            <div class="platform-pill" onclick="selectExpPill('5+', this)">5+ Years</div>
                                        </div>
                                        <select id="regExp" class="form-control" style="display:none;" required>
                                            <option value="">Select experience</option>
                                            <option value="0-1">0-1 Years</option>
                                            <option value="1-3">1-3 Years</option>
                                            <option value="3-5">3-5 Years</option>
                                            <option value="5+">5+ Years</option>
                                        </select>`;

html = html.replace(expDropdownStr, expPillsHtml);

fs.writeFileSync('public/index.html', html, 'utf-8');
console.log('index.html updated successfully');

// Update app.js
let js = fs.readFileSync('public/js/app.js', 'utf-8');
const scriptToAdd = `
window.selectExpPill = function(value, element) {
    document.querySelectorAll('#expPillsContainer .platform-pill').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    
    const nativeSelect = document.getElementById('regExp');
    nativeSelect.value = value;
    if (nativeSelect.value) {
        nativeSelect.classList.remove('is-invalid');
    }
};
`;

if (!js.includes('selectExpPill')) {
    js += scriptToAdd;
    fs.writeFileSync('public/js/app.js', js, 'utf-8');
    console.log('app.js updated successfully');
}

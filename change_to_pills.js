const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf-8');

const searchStr = `                                    <!-- Custom Dropdown Container -->
                                    <div class="custom-select-wrapper" id="platformCustomSelect">
                                        <div class="custom-select form-control" onclick="togglePlatformDropdown()" style="display:flex; align-items:center; justify-content:space-between; cursor:pointer;">
                                            <div id="platformSelectedText" style="display:flex; align-items:center; gap:10px;">
                                                <span data-i18n="select_platform">Select platform</span>
                                            </div>
                                            <i class="fas fa-chevron-down" style="color:var(--text-secondary); font-size:0.8rem;"></i>
                                        </div>
                                        
                                        <ul class="custom-options" id="platformDropdownList" style="display:none; position:absolute; top:100%; left:0; width:100%; background:#ffffff; border:1px solid var(--card-border); border-radius:var(--border-radius-md); margin-top:0.25rem; padding:0; list-style:none; z-index:100; max-height:250px; overflow-y:auto; box-shadow:var(--shadow);">
                                            <li onclick="selectPlatform('Swiggy', 'data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'24\\' height=\\'24\\'><rect width=\\'24\\' height=\\'24\\' rx=\\'4\\' fill=\\'%23f96e2a\\'/><text x=\\'50%\\' y=\\'50%\\' font-family=\\'sans-serif\\' font-size=\\'14\\' fill=\\'%23fff\\' font-weight=\\'bold\\' text-anchor=\\'middle\\' dominant-baseline=\\'central\\'>S</text></svg>')" class="dropdown-item" style="padding:0.75rem 1rem; cursor:pointer; display:flex; align-items:center; gap:10px; border-bottom:1px solid var(--card-border); transition:background 0.2s; color:#111827;">
                                                <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><rect width='24' height='24' rx='4' fill='%23f96e2a'/><text x='50%' y='50%' font-family='sans-serif' font-size='14' fill='%23fff' font-weight='bold' text-anchor='middle' dominant-baseline='central'>S</text></svg>" loading="lazy" style="width:24px; height:24px; border-radius:4px; object-fit:contain; background:#fff; padding:2px;"> Swiggy
                                            </li>
                                            <li onclick="selectPlatform('Zomato', 'data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'24\\' height=\\'24\\'><rect width=\\'24\\' height=\\'24\\' rx=\\'4\\' fill=\\'%23e23744\\'/><text x=\\'50%\\' y=\\'50%\\' font-family=\\'sans-serif\\' font-size=\\'14\\' fill=\\'%23fff\\' font-weight=\\'bold\\' text-anchor=\\'middle\\' dominant-baseline=\\'central\\'>Z</text></svg>')" class="dropdown-item" style="padding:0.75rem 1rem; cursor:pointer; display:flex; align-items:center; gap:10px; border-bottom:1px solid var(--card-border); transition:background 0.2s; color:#111827;">
                                                <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><rect width='24' height='24' rx='4' fill='%23e23744'/><text x='50%' y='50%' font-family='sans-serif' font-size='14' fill='%23fff' font-weight='bold' text-anchor='middle' dominant-baseline='central'>Z</text></svg>" loading="lazy" style="width:24px; height:24px; border-radius:4px; object-fit:contain; background:#fff; padding:2px;"> Zomato
                                            </li>
                                            <li onclick="selectPlatform('Blinkit', 'data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'24\\' height=\\'24\\'><rect width=\\'24\\' height=\\'24\\' rx=\\'4\\' fill=\\'%23f8cb46\\'/><text x=\\'50%\\' y=\\'50%\\' font-family=\\'sans-serif\\' font-size=\\'14\\' fill=\\'%23000\\' font-weight=\\'bold\\' text-anchor=\\'middle\\' dominant-baseline=\\'central\\'>B</text></svg>')" class="dropdown-item" style="padding:0.75rem 1rem; cursor:pointer; display:flex; align-items:center; gap:10px; border-bottom:1px solid var(--card-border); transition:background 0.2s; color:#111827;">
                                                <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><rect width='24' height='24' rx='4' fill='%23f8cb46'/><text x='50%' y='50%' font-family='sans-serif' font-size='14' fill='%23000' font-weight='bold' text-anchor='middle' dominant-baseline='central'>B</text></svg>" loading="lazy" style="width:24px; height:24px; border-radius:4px; object-fit:contain; background:#fff; padding:2px;"> Blinkit
                                            </li>
                                            <li onclick="selectPlatform('Porter', 'data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'24\\' height=\\'24\\'><rect width=\\'24\\' height=\\'24\\' rx=\\'4\\' fill=\\'%232d62e1\\'/><text x=\\'50%\\' y=\\'50%\\' font-family=\\'sans-serif\\' font-size=\\'14\\' fill=\\'%23fff\\' font-weight=\\'bold\\' text-anchor=\\'middle\\' dominant-baseline=\\'central\\'>P</text></svg>')" class="dropdown-item" style="padding:0.75rem 1rem; cursor:pointer; display:flex; align-items:center; gap:10px; border-bottom:1px solid var(--card-border); transition:background 0.2s; color:#111827;">
                                                <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><rect width='24' height='24' rx='4' fill='%232d62e1'/><text x='50%' y='50%' font-family='sans-serif' font-size='14' fill='%23fff' font-weight='bold' text-anchor='middle' dominant-baseline='central'>P</text></svg>" loading="lazy" style="width:24px; height:24px; border-radius:4px; object-fit:contain; background:#fff; padding:2px;"> Porter
                                            </li>
                                            <li onclick="selectPlatform('Dunzo', 'data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'24\\' height=\\'24\\'><rect width=\\'24\\' height=\\'24\\' rx=\\'4\\' fill=\\'%2300d290\\'/><text x=\\'50%\\' y=\\'50%\\' font-family=\\'sans-serif\\' font-size=\\'14\\' fill=\\'%23fff\\' font-weight=\\'bold\\' text-anchor=\\'middle\\' dominant-baseline=\\'central\\'>D</text></svg>')" class="dropdown-item" style="padding:0.75rem 1rem; cursor:pointer; display:flex; align-items:center; gap:10px; border-bottom:1px solid var(--card-border); transition:background 0.2s; color:#111827;">
                                                <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><rect width='24' height='24' rx='4' fill='%2300d290'/><text x='50%' y='50%' font-family='sans-serif' font-size='14' fill='%23fff' font-weight='bold' text-anchor='middle' dominant-baseline='central'>D</text></svg>" loading="lazy" style="width:24px; height:24px; border-radius:4px; object-fit:contain; background:#fff; padding:2px;"> Dunzo
                                            </li>
                                            <li onclick="selectPlatform('Other', '')" class="dropdown-item" style="padding:0.75rem 1rem; cursor:pointer; display:flex; align-items:center; gap:10px; transition:background 0.2s; color:#111827;">
                                                <div style="width:24px; height:24px; border-radius:4px; background:var(--card-border); display:flex; align-items:center; justify-content:center;"><i class="fas fa-ellipsis-h" style="font-size:12px; color:var(--text-secondary);"></i></div> Other
                                            </li>
                                        </ul>
                                    </div>
                                    
                                    <!-- Hidden actual select for form submission and validation -->
                                    <select id="regPlatform" class="form-control" style="display:none;" required onchange="handleOtherDropdown(this, 'regPlatformOther')">
                                        <option value="">Select platform</option>
                                        <option value="Swiggy">Swiggy</option>
                                        <option value="Zomato">Zomato</option>
                                        <option value="Blinkit">Blinkit</option>
                                        <option value="Porter">Porter</option>
                                        <option value="Dunzo">Dunzo</option>
                                        <option value="Other">Other</option>
                                    </select>`;

const replaceStr = `                                    <style>
                                        .platform-pills { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
                                        .platform-pill {
                                            padding: 0.5rem 1.25rem;
                                            border: 1.5px solid #a7f3d0;
                                            border-radius: 30px;
                                            background-color: #f0fdf4;
                                            color: #064e3b;
                                            cursor: pointer;
                                            transition: all 0.2s;
                                            font-size: 0.95rem;
                                            user-select: none;
                                        }
                                        .platform-pill:hover { background-color: #d1fae5; border-color: #34d399; }
                                        .platform-pill.active { background-color: #a7f3d0; border-color: #10b981; font-weight: 600; }
                                    </style>
                                    <div class="platform-pills" id="platformPillsContainer">
                                        <div class="platform-pill" onclick="selectPlatformPill('Swiggy', this)">Swiggy</div>
                                        <div class="platform-pill" onclick="selectPlatformPill('Zomato', this)">Zomato</div>
                                        <div class="platform-pill" onclick="selectPlatformPill('Blinkit', this)">Blinkit</div>
                                        <div class="platform-pill" onclick="selectPlatformPill('Porter', this)">Porter</div>
                                        <div class="platform-pill" onclick="selectPlatformPill('Dunzo', this)">Dunzo</div>
                                        <div class="platform-pill" onclick="selectPlatformPill('DHL', this)">DHL</div>
                                        <div class="platform-pill" onclick="selectPlatformPill('Amazon', this)">Amazon</div>
                                        <div class="platform-pill" onclick="selectPlatformPill('Flipkart', this)">Flipkart</div>
                                        <div class="platform-pill" onclick="selectPlatformPill('Zepto', this)">Zepto</div>
                                        <div class="platform-pill" onclick="selectPlatformPill('Other', this)">Other</div>
                                    </div>
                                    
                                    <!-- Hidden actual select for form submission and validation -->
                                    <select id="regPlatform" class="form-control" style="display:none;" required onchange="handleOtherDropdown(this, 'regPlatformOther')">
                                        <option value="">Select platform</option>
                                        <option value="Swiggy">Swiggy</option>
                                        <option value="Zomato">Zomato</option>
                                        <option value="Blinkit">Blinkit</option>
                                        <option value="Porter">Porter</option>
                                        <option value="Dunzo">Dunzo</option>
                                        <option value="DHL">DHL</option>
                                        <option value="Amazon">Amazon</option>
                                        <option value="Flipkart">Flipkart</option>
                                        <option value="Zepto">Zepto</option>
                                        <option value="Other">Other</option>
                                    </select>`;

if (html.includes('id="platformCustomSelect"')) {
    let newHtml = html.replace(searchStr, replaceStr);
    
    // Fallback if whitespace is slightly different
    if (newHtml === html) {
        // Try regex replacement
        const regexStr = /<!-- Custom Dropdown Container -->[\s\S]*?<\/select>/m;
        newHtml = html.replace(regexStr, replaceStr);
    }
    
    fs.writeFileSync('public/index.html', newHtml, 'utf-8');
    console.log('index.html updated successfully');
} else {
    console.log('Could not find platformCustomSelect in index.html');
}

// Update app.js
let js = fs.readFileSync('public/js/app.js', 'utf-8');
const scriptToAdd = `
window.selectPlatformPill = function(value, element) {
    // Update active UI
    document.querySelectorAll('#platformPillsContainer .platform-pill').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    
    // Update hidden select
    const nativeSelect = document.getElementById('regPlatform');
    let optionFound = false;
    Array.from(nativeSelect.options).forEach(opt => {
        if (opt.value === value) {
            opt.selected = true;
            optionFound = true;
        }
    });
    
    if (!optionFound) {
        const newOpt = document.createElement('option');
        newOpt.value = value;
        newOpt.text = value;
        newOpt.selected = true;
        nativeSelect.appendChild(newOpt);
    }

    if (value === 'Other') {
        document.getElementById('regPlatformOther').style.display = 'block';
        document.getElementById('regPlatformOther').required = true;
    } else {
        document.getElementById('regPlatformOther').style.display = 'none';
        document.getElementById('regPlatformOther').required = false;
    }
    
    // Clear validation error if any
    if (nativeSelect.value) {
        nativeSelect.classList.remove('is-invalid');
    }
};
`;

if (!js.includes('selectPlatformPill')) {
    js += scriptToAdd;
    fs.writeFileSync('public/js/app.js', js, 'utf-8');
    console.log('app.js updated successfully');
}

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const indexPath = path.join(__dirname, 'public', 'index.html');

// 1. Restore index.html from git to get the original back (including the old exit popup)
execSync('git checkout -- public/index.html');
console.log('Restored public/index.html from git.');

let html = fs.readFileSync(indexPath, 'utf8');

// 2. Add consent.js and tracking.js to head
if (!html.includes('<script src="/js/consent.js"></script>')) {
    html = html.replace('<head>', '<head>\n    <script src="/js/consent.js"></script>');
}
if (!html.includes('<script src="/js/tracking.js"></script>')) {
    html = html.replace('</head>', '    <script src="/js/tracking.js"></script>\n</head>');
}

// 3. Add Hreflang
const hreflangTags = `
    <link rel="alternate" hreflang="en" href="https://roadwarrior.pro/en/" />
    <link rel="alternate" hreflang="hi" href="https://roadwarrior.pro/hi/" />
    <link rel="alternate" hreflang="kn" href="https://roadwarrior.pro/kn/" />
    <link rel="alternate" hreflang="x-default" href="https://roadwarrior.pro/" />
`;
if (!html.includes('hreflang="hi"')) {
    html = html.replace('</head>', hreflangTags + '\n</head>');
}

// 4. Telegram Widget
const telegramHtml = `
    <script>
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            const res = await fetch('/api/client-config');
            const config = await res.json();
            if(config.VITE_TELEGRAM_LINK && !config.VITE_TELEGRAM_LINK.includes('WAITING')) {
                const a = document.createElement('a');
                a.id = 'telegramWidget';
                a.href = config.VITE_TELEGRAM_LINK;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.style.cssText = 'position:fixed; bottom:20px; left:20px; background:#229ED9; color:white; width:60px; height:60px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:2rem; box-shadow:0 4px 10px rgba(0,0,0,0.3); z-index:1000; transition: transform 0.3s;';
                a.innerHTML = '<i class="fab fa-telegram-plane"></i>';
                a.onmouseover = () => a.style.transform = 'scale(1.1)';
                a.onmouseout = () => a.style.transform = 'scale(1)';
                document.body.appendChild(a);
            }
        } catch(e) {}
    });
    </script>
`;
if (!html.includes('telegramWidget')) {
    html = html.replace('</body>', telegramHtml + '\n</body>');
}

// 5. Footer Links (AI Monitor, Google Business Profile)
const aiLinks = `
    <div id="aiMonitorLinks" style="margin-top:2rem; padding-top:2rem; border-top:1px solid var(--border-color); display:flex; flex-wrap:wrap; gap:1rem; justify-content:center; align-items:center;">
        <span style="color:var(--text-secondary); font-size:0.9rem;">Verified by AI:</span>
        <a href="#" style="color:var(--text-secondary); text-decoration:none; display:flex; align-items:center; gap:0.5rem;"><i class="fas fa-robot"></i> ChatGPT</a>
        <a href="#" style="color:var(--text-secondary); text-decoration:none; display:flex; align-items:center; gap:0.5rem;"><i class="fas fa-brain"></i> Gemini</a>
        <a href="#" style="color:var(--text-secondary); text-decoration:none; display:flex; align-items:center; gap:0.5rem;"><i class="fas fa-search"></i> Perplexity</a>
        <span style="color:var(--text-secondary); font-size:0.9rem; margin-left:1rem;">|</span>
        <a href="#" style="color:var(--text-secondary); text-decoration:none; display:flex; align-items:center; gap:0.5rem;"><i class="fab fa-google"></i> Google Business Profile</a>
        <a href="#" style="color:var(--text-secondary); text-decoration:none; display:flex; align-items:center; gap:0.5rem;"><i class="fas fa-map-marker-alt"></i> Google Maps</a>
    </div>
`;
if (!html.includes('aiMonitorLinks')) {
    // Find the footer container and append
    html = html.replace('</footer>', aiLinks + '\n</footer>');
}

// 6. Remove duplicate scripts from index.html that we moved to tracking.js/app.js
html = html.replace(/<!-- Microsoft Clarity Placeholder -->[\s\S]*?<\/script>/, '');
html = html.replace(/<!-- GA4 Placeholder -->[\s\S]*?<\/script>/, '');

fs.writeFileSync(indexPath, html, 'utf8');
console.log('Restored index.html and reapplied safe patches.');

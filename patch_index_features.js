const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const indexPath = path.join(__dirname, 'public', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const $ = cheerio.load(html);

// 1. Add consent.js and tracking.js to head
if ($('script[src="/js/consent.js"]').length === 0) {
    $('head').prepend('<script src="/js/consent.js"></script>\n');
}
if ($('script[src="/js/tracking.js"]').length === 0) {
    $('head').append('<script src="/js/tracking.js"></script>\n');
}

// 2. Add Hreflang
const hreflangTags = `
    <link rel="alternate" hreflang="en" href="https://roadwarrior.pro/en/" />
    <link rel="alternate" hreflang="hi" href="https://roadwarrior.pro/hi/" />
    <link rel="alternate" hreflang="kn" href="https://roadwarrior.pro/kn/" />
    <link rel="alternate" hreflang="x-default" href="https://roadwarrior.pro/" />
`;
if (html.indexOf('hreflang="en"') === -1) {
    $('head').append(hreflangTags);
}

// 3. Fix Alt Tags and lazy load
$('img').each((i, el) => {
    if (!$(el).attr('alt')) {
        $(el).attr('alt', 'Road Warrior EV Delivery Rider');
    }
    // Lazy load if not explicitly set
    if (!$(el).attr('loading')) {
        $(el).attr('loading', 'lazy');
    }
});

// 4. Exit Intent Popup
if ($('#exitIntentPopup').length === 0) {
    const exitIntentHtml = `
    <div id="exitIntentPopup" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999; align-items:center; justify-content:center; backdrop-filter: blur(5px);">
        <div style="background:var(--bg-color); padding:3rem; border-radius:12px; max-width:500px; width:90%; text-align:center; position:relative;">
            <button onclick="document.getElementById('exitIntentPopup').style.display='none'" style="position:absolute; right:15px; top:15px; background:none; border:none; font-size:1.5rem; cursor:pointer; color:var(--text-secondary);">&times;</button>
            <h2 style="font-size:2rem; margin-bottom:1rem; color:var(--primary-color);">Wait! Before You Leave...</h2>
            <p style="color:var(--text-secondary); margin-bottom:2rem; font-size:1.1rem;">Don't miss out on optimizing your digital presence. Get a <strong>Free Enterprise Website Audit</strong> right now!</p>
            <div style="display:flex; gap:1rem; justify-content:center;">
                <a href="/auditor" class="btn btn-primary" style="padding:1rem 2rem; border-radius:30px; font-weight:bold;">Yes, I want my Free Audit</a>
                <button onclick="document.getElementById('exitIntentPopup').style.display='none'" class="btn btn-outline" style="padding:1rem 2rem; border-radius:30px;">No Thanks</button>
            </div>
        </div>
    </div>
    <script>
        document.addEventListener('mouseleave', function(e) {
            if (e.clientY < 0 && !sessionStorage.getItem('exitIntentShown')) {
                const popup = document.getElementById('exitIntentPopup');
                if(popup) {
                    popup.style.display = 'flex';
                    sessionStorage.setItem('exitIntentShown', 'true');
                }
            }
        });
    </script>
    `;
    $('body').append(exitIntentHtml);
}

// 5. Telegram Widget
if ($('#telegramWidget').length === 0) {
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
    $('body').append(telegramHtml);
}

// 6. Footer Links (AI Monitor, Google Business Profile)
if ($('#aiMonitorLinks').length === 0) {
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
    $('footer .container').append(aiLinks); // Assuming there's a footer with .container
}

fs.writeFileSync(indexPath, $.html(), 'utf8');
console.log('index.html patched with new SEO, Lead Capture, and Performance features.');

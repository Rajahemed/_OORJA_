const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

// 1. Bundle tracking scripts
const trackingPatterns = [
    /<script>\s*window\.dataLayer\s*=\s*window\.dataLayer\s*\|\|[\s\S]*?<\/script>/, // gtag
    /<script>\s*\(function\(c,l,a,r,i,t,y\){[\s\S]*?<\/script>/, // clarity
    /<script>\(function\s*\(w,\s*d,\s*s,\s*l,\s*i\)[\s\S]*?<\/script>/, // GTM
    /<script>\s*!function\s*\(f,\s*b,\s*e,\s*v,\s*n,\s*t,\s*s\)[\s\S]*?<\/script>/, // fbq
    /<script>\s*!function\s*\(e,\s*t,\s*n,\s*s,\s*u,\s*a\)[\s\S]*?<\/script>/, // twq
    /<script type="text\/javascript">\s*_linkedin_partner_id[\s\S]*?<\/script>/, // linkedin
    /<script type="text\/javascript">\s*\(function\s*\(l\)[\s\S]*?<\/script>/, // bing
    /<script type="text\/javascript">\s*var\s*Tawk_API[\s\S]*?<\/script>/ // Tawk.to
];

let bundledScript = '';
for (let pattern of trackingPatterns) {
    const match = html.match(pattern);
    if (match) {
        // extract inner content
        const inner = match[0].replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
        bundledScript += inner + '\n\n';
        // remove from html
        html = html.replace(match[0], '');
    }
}
fs.writeFileSync('public/js/tracking-pixels.js', bundledScript, 'utf8');

// Add the bundled script back
html = html.replace('</head>', '<script defer src="/js/tracking-pixels.js"></script>\n</head>');

// 2. Change app.js to app.min.js
html = html.replace(/<script src="\/js\/app\.js\?v=\d+" charset="UTF-8" defer><\/script>/, '<script src="/js/app.min.js?v=8" charset="UTF-8" defer></script>');
html = html.replace(/<script src="\/js\/app\.js[^>]*><\/script>/, '<script src="/js/app.min.js?v=8" charset="UTF-8" defer></script>');

// 3. CLS - Add width/height to images without them
html = html.replace(/<img(?![^>]*\bwidth=)[^>]*>/gi, match => {
    // Add default width/height if missing to reserve layout space
    if (match.includes('trust-badge')) {
        return match.replace('<img', '<img width="80" height="40"');
    }
    if (match.includes('hero-image') || match.includes('home-bg.jpg') || match.includes('new_ev_bike.webp')) {
        return match.replace('<img', '<img width="800" height="600"');
    }
    // generic fallback for CLS
    return match.replace('<img', '<img width="400" height="300"');
});

// 4. LCP - Add fetchpriority to hero image
html = html.replace(/<link rel="preload" as="image" href="\/img\/home-bg\.jpg"[^>]*>/, '<link rel="preload" as="image" href="/img/home-bg.jpg" fetchpriority="high">');
html = html.replace(/<link rel="preload" as="image" href="\/img\/new_ev_bike\.webp"[^>]*>/, '<link rel="preload" as="image" href="/img/new_ev_bike.webp" fetchpriority="high">');

// also on the img tag
html = html.replace(/<img[^>]*class="rw-logo"[^>]*>/, match => {
    if (!match.includes('fetchpriority')) {
        return match.replace('<img', '<img fetchpriority="high"');
    }
    return match;
});

// 5. INP - Ensure all external scripts have defer (rebuild_html.js mostly did this, but let's double check)
html = html.replace(/<script(?=[^>]*src=)(?![^>]*(?:defer|async))([^>]*)>/gi, '<script defer="defer"$1>');

fs.writeFileSync('public/index.html', html, 'utf8');
console.log('HTML Patched for Performance');

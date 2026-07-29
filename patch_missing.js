const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');

const trustBadges = `
<div class="trust-badges" style="display: flex; gap: 1rem; justify-content: center; margin-top: 1rem; flex-wrap: wrap;">
    <div style="display: flex; align-items: center; gap: 0.5rem; background: var(--card-bg); padding: 0.5rem 1rem; border-radius: 20px; border: 1px solid var(--border-color); font-size: 0.85rem; color: var(--text-secondary);"><i class="fas fa-lock text-primary"></i> SSL Secure</div>
    <div style="display: flex; align-items: center; gap: 0.5rem; background: var(--card-bg); padding: 0.5rem 1rem; border-radius: 20px; border: 1px solid var(--border-color); font-size: 0.85rem; color: var(--text-secondary);"><i class="fas fa-shield-alt text-primary"></i> Payment Secured</div>
    <div style="display: flex; align-items: center; gap: 0.5rem; background: var(--card-bg); padding: 0.5rem 1rem; border-radius: 20px; border: 1px solid var(--border-color); font-size: 0.85rem; color: var(--text-secondary);"><i class="fas fa-check-circle text-primary"></i> Privacy Protected</div>
</div>
`;

if (!html.includes('trust-badges')) {
    html = html.replace('</form>', '</form>' + trustBadges);
}

if (!html.includes('/about.html')) {
    html = html.replace('<ul class="navbar-nav">', '<ul class="navbar-nav">\n            <li class="nav-item"><a href="/about.html" class="nav-link"><i class="fas fa-info-circle"></i> About Us</a></li>');
}

fs.writeFileSync('public/index.html', html, 'utf8');
console.log("Success");

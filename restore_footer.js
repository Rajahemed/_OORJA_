const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf-8');

const footerContent = `        <div class="footer-inner" style="display: flex; flex-wrap: wrap; justify-content: space-between; margin-bottom: 2rem; border-bottom: 1px solid var(--border-color); padding-bottom: 2rem;">
            <!-- Col 2: What we do -->
            <div class="footer-col" style="flex: 1; min-width: 200px; margin-bottom: 1.5rem;">
                <h4 class="footer-heading" style="font-weight: 700; margin-bottom: 1rem; color: var(--text-primary);">What we do</h4>
                <ul class="footer-links-list" style="list-style: none; padding: 0; margin: 0; line-height: 2;">
                    <li><a href="#features" style="color: var(--text-secondary); text-decoration: none;">Features</a></li>
                    <li><a href="#rewards" style="color: var(--text-secondary); text-decoration: none;">Rewards</a></li>
                    <li><a href="#referrals" style="color: var(--text-secondary); text-decoration: none;">Referrals</a></li>
                    <li><a href="#analytics" style="color: var(--text-secondary); text-decoration: none;">Analytics</a></li>
                </ul>
            </div>

            <!-- Col 3: Who we are -->
            <div class="footer-col" style="flex: 1; min-width: 200px; margin-bottom: 1.5rem;">
                <h4 class="footer-heading" style="font-weight: 700; margin-bottom: 1rem; color: var(--text-primary);">Who we are</h4>
                <ul class="footer-links-list" style="list-style: none; padding: 0; margin: 0; line-height: 2;">
                    <li><a href="/about" style="color: var(--text-secondary); text-decoration: none;">About us</a></li>
                    <li><a href="/careers" style="color: var(--text-secondary); text-decoration: none;">Careers</a></li>
                    <li><a href="/brand" style="color: var(--text-secondary); text-decoration: none;">Brand Center</a></li>
                    <li><a href="#" onclick="navigateTo('/privacy'); return false;" style="color: var(--text-secondary); text-decoration: none;">Privacy</a></li>
                </ul>
            </div>

            <!-- Col 4: Use Platform -->
            <div class="footer-col" style="flex: 1; min-width: 200px; margin-bottom: 1.5rem;">
                <h4 class="footer-heading" style="font-weight: 700; margin-bottom: 1rem; color: var(--text-primary);">Use Platform</h4>
                <ul class="footer-links-list" style="list-style: none; padding: 0; margin: 0; line-height: 2;">
                    <li><a href="/android" style="color: var(--text-secondary); text-decoration: none;">Android App</a></li>
                    <li><a href="/ios" style="color: var(--text-secondary); text-decoration: none;">iPhone App</a></li>
                    <li><a href="/dashboard" style="color: var(--text-secondary); text-decoration: none;">Web Dashboard</a></li>
                    <li><a href="/api" style="color: var(--text-secondary); text-decoration: none;">Developer APIs</a></li>
                </ul>
            </div>
            
            <div class="footer-col footer-brand" style="flex: 1; min-width: 200px; margin-bottom: 1.5rem;">
                <div class="footer-logo" style="margin-bottom: 1rem; font-size: 1.5rem; font-weight: 800;">
                    <span class="footer-logo-icon" style="color: var(--primary-color);">⚡</span>
                    <span class="footer-logo-text" style="color: var(--text-primary);">Road Warrior <span style="color: var(--primary-color);">Pro</span></span>
                </div>
            </div>
        </div>
`;

if (!html.includes('<div class="footer-inner"')) {
    html = html.replace('<!-- Footer Bottom Bar -->', footerContent + '        <!-- Footer Bottom Bar -->');
    fs.writeFileSync('public/index.html', html, 'utf-8');
    console.log('Restored footer successfully!');
} else {
    console.log('Footer already present!');
}

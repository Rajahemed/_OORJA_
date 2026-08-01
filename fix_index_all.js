const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

// 1. Remove manual asterisks
html = html.replace(/ <span style="color:var\(--danger-color[^>]*>\*<\/span>/g, '');

// 2. Footer layout flex changes
let fInnerBefore = `<div class="footer-inner" style="display: flex; justify-content: space-around; align-items: flex-start; width: 100%; max-width: 1200px; margin: 0 auto; padding: 0 2rem; margin-bottom: 2rem; flex-wrap: wrap; gap: 2rem;">

            <div style="flex: 1; min-width: 200px;">`;

let fInnerAfter = `<div class="footer-inner" style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; max-width: 1400px; margin: 0 auto; padding: 0 2rem; margin-bottom: 2rem; flex-wrap: wrap; gap: 4rem;">

            <div style="flex: 1 1 40%; min-width: 300px; text-align: left;">`;

html = html.replace(fInnerBefore, fInnerAfter);
html = html.replace(/<div style="flex: 1; min-width: 200px;">/g, '<div style="flex: 1 1 25%; min-width: 200px;">');

// 3. Move social media icons and update footer bottom
let fBottomBefore = `        <!-- Footer Bottom Bar -->
        <div class="footer-bottom" style="padding: 1.5rem 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div class="footer-bottom-left" style="color: #000000; display: flex; align-items: center; font-weight: bold; flex-wrap: wrap;">
                <span>2026 © Road Warrior Pro</span>
                <span style="margin: 0 0.5rem;">|</span>
                <a href="/sitemap.xml" style="color: #000000; text-decoration: none;">Sitemap</a>
                <span style="margin: 0 0.5rem;">|</span>
                <a href="/blog" style="color: var(--primary-color); text-decoration: none;">Blog / Resources</a>
                <span style="margin: 0 0.5rem;">|</span>
                <a href="https://maps.google.com/?cid=10293847561029384756" target="_blank" style="color: var(--primary-color); text-decoration: none;">Google Business Profile</a>
            </div>

            <div class="footer-social" style="display: flex; gap: 1.5rem;">
                <a href="https://twitter.com/roadwarriorpro" target="_blank" rel="noopener" class="social-link twitter" title="Twitter / X" style="color: #000000; font-size: 1.4rem; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"><i class="fab fa-twitter"></i></a>
                <a href="https://www.youtube.com/@roadwarriorpro" target="_blank" rel="noopener" class="social-link youtube" title="YouTube" style="color: #FF0000; font-size: 1.4rem; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"><i class="fab fa-youtube"></i></a>
                <a href="https://www.instagram.com/roadwarriorpro" target="_blank" rel="noopener" class="social-link instagram" title="Instagram" style="color: #E1306C; font-size: 1.4rem; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"><i class="fab fa-instagram"></i></a>
                <a href="https://www.facebook.com/roadwarriorpro" target="_blank" rel="noopener" class="social-link facebook" title="Facebook" style="color: #1877F2; font-size: 1.4rem; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"><i class="fab fa-facebook-f"></i></a>
                <a href="https://www.linkedin.com/company/roadwarriorpro" target="_blank" rel="noopener" class="social-link linkedin" title="LinkedIn" style="color: #0A66C2; font-size: 1.4rem; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"><i class="fab fa-linkedin-in"></i></a>
            </div>
        </div>`;

let fBottomAfter = `        <div class="footer-social" style="display: flex; gap: 1.5rem; justify-content: center; padding-bottom: 2rem;">
            <a href="https://twitter.com/roadwarriorpro" target="_blank" rel="noopener" class="social-link twitter" title="Twitter / X" style="color: #000000; font-size: 1.4rem; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"><i class="fab fa-twitter"></i></a>
            <a href="https://www.youtube.com/@roadwarriorpro" target="_blank" rel="noopener" class="social-link youtube" title="YouTube" style="color: #FF0000; font-size: 1.4rem; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"><i class="fab fa-youtube"></i></a>
            <a href="https://www.instagram.com/roadwarriorpro" target="_blank" rel="noopener" class="social-link instagram" title="Instagram" style="color: #E1306C; font-size: 1.4rem; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"><i class="fab fa-instagram"></i></a>
            <a href="https://www.facebook.com/roadwarriorpro" target="_blank" rel="noopener" class="social-link facebook" title="Facebook" style="color: #1877F2; font-size: 1.4rem; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"><i class="fab fa-facebook-f"></i></a>
            <a href="https://www.linkedin.com/company/roadwarriorpro" target="_blank" rel="noopener" class="social-link linkedin" title="LinkedIn" style="color: #0A66C2; font-size: 1.4rem; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"><i class="fab fa-linkedin-in"></i></a>
        </div>
        <!-- Footer Bottom Bar -->
        <div class="footer-bottom" style="padding: 1.5rem 2rem; display: flex; flex-direction: column; justify-content: center; align-items: center; border-top: 1px solid rgba(0,0,0,0.05);">
            <div class="footer-bottom-left" style="color: #000000; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-wrap: wrap; gap: 0.5rem; text-align: center;">
                <span>2026 © Road Warrior Pro</span>
                <span style="margin: 0 0.25rem;">|</span>
                <a href="/sitemap.xml" style="color: #000000; text-decoration: none;">Sitemap</a>
                <span style="margin: 0 0.25rem;">|</span>
                <a href="/blog" style="color: var(--primary-color); text-decoration: none;">Blog / Resources</a>
                <span style="margin: 0 0.25rem;">|</span>
                <a href="https://maps.google.com/?cid=10293847561029384756" target="_blank" style="color: var(--primary-color); text-decoration: none;">Google Business Profile</a>
            </div>
        </div>`;

html = html.replace(fBottomBefore, fBottomAfter);

// 4. Remove floating whatsapp button
let waFloatRegex = /<a href="https:\/\/wa\.me\/919886650133" class="floating-wa"[\s\S]*?<\/style>/;
html = html.replace(waFloatRegex, '');

fs.writeFileSync('public/index.html', html, 'utf8');
console.log('Fixed index.html');

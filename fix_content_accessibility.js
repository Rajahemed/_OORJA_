const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');

// Fix broken links
html = html.replace(/href="\/privacy"/g, 'href="/privacy.html"');
html = html.replace(/href="\/sitemap"/g, 'href="/sitemap.xml"');
html = html.replace(/href="\/blog"/g, 'href="#"');
html = html.replace(/href="\/images\/hero\.webp"/g, 'href="/img/home-bg.jpg"');
html = html.replace(/href="\/auditor"/g, 'href="/auditor.html"');

// Fix heading hierarchy (skipped levels)
html = html.replace(/<h4 style="margin-bottom:1rem;"><i class="fas fa-unlock-alt"><\/i> Reset Password/g, '<h3 style="margin-bottom:1rem;"><i class="fas fa-unlock-alt"></i> Reset Password');
html = html.replace(/<\/h4>([\s\S]*?)<p>Enter your phone/g, '</h3>$1<p>Enter your phone');

html = html.replace(/<h4([^>]*)>We value your privacy<\/h4>/gi, '<h3$1>We value your privacy</h3>');
html = html.replace(/<h4([^>]*)>We'll be in touch soon!<\/h4>/gi, "<h3$1>We'll be in touch soon!</h3>");

fs.writeFileSync('public/index.html', html, 'utf8');
console.log('Fixed broken links and heading hierarchy in HTML');

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync('public/index.html', 'utf8');
const links = html.match(/href="([^"]+)"/gi) || [];

const unique = [...new Set(links.map(l => l.match(/href="([^"]+)"/)[1]))];

unique.forEach(l => {
    if(l.startsWith('/') || l.endsWith('.html')) {
        let normalizedPath = l.split('#')[0].split('?')[0];
        if (normalizedPath === '/') normalizedPath = '/index.html';
        const p = path.join('public', normalizedPath);
        if(!fs.existsSync(p)) {
            console.log('BROKEN:', l);
        }
    }
});

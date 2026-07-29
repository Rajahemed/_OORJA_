const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const indexPath = path.join(__dirname, 'public', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const $ = cheerio.load(html);

// Remove the exit intent popup and its script
const popup = $('#exitIntentPopup');
if (popup.length > 0) {
    // The script is exactly the next element after the popup in my patch
    const script = popup.next('script');
    popup.remove();
    if (script.length > 0 && script.html().includes('mouseleave')) {
        script.remove();
    }
}

fs.writeFileSync(indexPath, $.html(), 'utf8');
console.log('Removed exit intent popup from index.html.');

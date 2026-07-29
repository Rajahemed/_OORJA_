const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const indexPath = path.join(__dirname, 'public', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const $ = cheerio.load(html);

// Ensure only ONE H1 tag
let h1Count = 0;
$('h1').each((i, el) => {
    if (h1Count > 0) {
        $(el).replaceWith($(`<h2>${$(el).html()}</h2>`));
    }
    h1Count++;
});
if (h1Count === 0) {
    // Inject an H1 if none exists for SEO
    $('body').prepend('<h1 class="visually-hidden" style="position:absolute;left:-9999px;">Road Warrior EV Delivery Rider Platform</h1>');
}

// Add aria-labels to all buttons and links lacking them or inner text
$('a, button').each((i, el) => {
    const text = $(el).text().trim();
    const hasAria = $(el).attr('aria-label');
    const hasTitle = $(el).attr('title');
    
    if (!text && !hasAria && !hasTitle) {
        $(el).attr('aria-label', 'Interactive Element');
    }
});

// Accessible forms: ensure inputs have associated labels or aria-labels
$('input, select, textarea').each((i, el) => {
    const id = $(el).attr('id');
    const hasLabel = id ? $(`label[for="${id}"]`).length > 0 : false;
    const hasAria = $(el).attr('aria-label');
    
    if (!hasLabel && !hasAria) {
        const name = $(el).attr('name') || 'inputField';
        $(el).attr('aria-label', name);
    }
});

// Save changes
fs.writeFileSync(indexPath, $.html(), 'utf8');
console.log('Accessibility and SEO heading patches applied.');

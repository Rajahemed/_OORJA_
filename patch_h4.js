const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

// Replace H4 tags containing the specific step titles with H3
html = html.replace(/<h4([^>]*)>([\s\S]*?<span class="step-title">Maintenance and Vehicle Responsibility<\/span>[\s\S]*?)<\/h4>/g, '<h3$1>$2</h3>');
html = html.replace(/<h4([^>]*)>([\s\S]*?<span class="step-title">Workplace Facilities<\/span>[\s\S]*?)<\/h4>/g, '<h3$1>$2</h3>');
html = html.replace(/<h4([^>]*)>([\s\S]*?<span class="step-title">Referral<\/span>[\s\S]*?)<\/h4>/g, '<h3$1>$2</h3>');

// Wait, I should just replace ALL <h4 tags that have <span class="step-title"> with <h3
html = html.replace(/<h4([^>]*)>([\s\S]*?<span class="step-title">[^<]+<\/span>[\s\S]*?)<\/h4>/g, '<h3$1>$2</h3>');

fs.writeFileSync('public/index.html', html, 'utf8');
console.log('Replaced h4 to h3 for step titles');

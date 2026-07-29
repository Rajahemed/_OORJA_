const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');

let newHtml = html.replace('<a href="/about" class="nav-link"><i class="fas fa-info-circle"></i> About</a>', '<a href="/about" class="nav-link"><i class="fas fa-info-circle"></i> About</a>\n            <a href="/thank-you.html" class="nav-link"><i class="fas fa-calendar-alt"></i> Schedule Call</a>');

fs.writeFileSync('public/index.html', newHtml, 'utf8');
console.log('Added Schedule Call link to nav');

const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');
const cheerio = require('cheerio');
const $ = cheerio.load(html);

$('#registerCard input, #registerCard select, #registerCard textarea').each((i, el) => {
    console.log($(el).attr('id'));
});

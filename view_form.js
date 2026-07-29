const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');
const match = html.match(/<form[^>]*id=\"leadCaptureForm\"[^>]*>[\s\S]*?<\/form>/);
if (match) {
    console.log(match[0].substring(0, 1000));
} else {
    console.log('Not found');
}

const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');

const forms = html.match(/<form[^>]*>[\s\S]*?<\/form>/gi) || [];
forms.forEach(f => {
    if (f.includes('loginForm') || f.includes('riderForgotForm')) {
        console.log(f);
    }
});

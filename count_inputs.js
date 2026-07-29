const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');

const forms = html.match(/<form[^>]*>[\s\S]*?<\/form>/gi) || [];
forms.forEach(f => {
    const idMatch = f.match(/id="([^"]+)"/);
    const id = idMatch ? idMatch[1] : 'unknown';
    const inputs = (f.match(/<input/gi) || []).length;
    const selects = (f.match(/<select/gi) || []).length;
    console.log(`Form ${id}: ${inputs} inputs, ${selects} selects, total ${inputs + selects}`);
});

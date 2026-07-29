const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

// Replace H4 tags containing the specific data-i18n with H3
html = html.replace(/<h4([^>]*)>([\s\S]*?<span data-i18n="lbl_maint_resp"[^>]*>Maintenance and Vehicle Responsibility<\/span>[\s\S]*?)<\/h4>/g, '<h3$1>$2</h3>');
html = html.replace(/<h4([^>]*)>([\s\S]*?<span data-i18n="lbl_workplace"[^>]*>Workplace Facilities<\/span>[\s\S]*?)<\/h4>/g, '<h3$1>$2</h3>');
html = html.replace(/<h4([^>]*)>([\s\S]*?<span data-i18n="lbl_referral_info"[^>]*>Referral<\/span>[\s\S]*?)<\/h4>/g, '<h3$1>$2</h3>');
html = html.replace(/<h4([^>]*)>([\s\S]*?<span data-i18n="lbl_whatsapp"[^>]*>WhatsApp<\/span>[\s\S]*?)<\/h4>/g, '<h3$1>$2</h3>');

// There might be others without i18n
html = html.replace(/<h4([^>]*)>([\s\S]*?WhatsApp[\s\S]*?)<\/h4>/g, '<h3$1>$2</h3>');

fs.writeFileSync('public/index.html', html, 'utf8');
console.log('Replaced specific h4 to h3');

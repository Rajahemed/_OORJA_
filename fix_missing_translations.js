const fs = require('fs');
const languages = ['hi', 'kn', 'ta', 'te', 'mr', 'gu', 'bn'];
const keysToRemove = ['lbl_weekly_dist', 'lbl_monthly_dist', 'lbl_salary_details', 'lbl_net_salary', 'lbl_variable_pay'];

for (const lang of languages) {
    const filePath = `public/locales/${lang}/common.json`;
    if (fs.existsSync(filePath)) {
        let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        keysToRemove.forEach(k => delete data[k]);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf8');
    }
}
console.log('Removed target keys');

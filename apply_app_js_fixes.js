const fs = require('fs');

let appJs = fs.readFileSync('public/js/app.js', 'utf8');

// 1. Lead capture submit redirect and CRM
if (!appJs.includes("window.location.href = '/thank-you.html'")) {
    appJs = appJs.replace(
        /alert\('Thank you! Your information has been submitted\.'\);[\s\S]*?hideLeadCapture\(\);/i,
        `
        // Send to CRM endpoint first
        fetch('/api/crm-lead', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ fullName, email, phone, message })
        }).catch(e => console.error(e));

        window.location.href = '/thank-you.html';
        `
    );
}

// 2. Registration submit redirect
if (!appJs.includes("window.location.href = '/thank-you.html'; // registration")) {
    appJs = appJs.replace(
        /alert\('Registration successful!.*?'\);[\s\S]*?window\.location\.reload\(\);/i,
        `window.location.href = '/thank-you.html'; // registration`
    );
}

fs.writeFileSync('public/js/app.js', appJs, 'utf8');

let serverJs = fs.readFileSync('server.js', 'utf8');

// 1. Add /api/crm-lead endpoint
if (!serverJs.includes("app.post('/api/crm-lead'")) {
    const crmCode = `
app.post('/api/crm-lead', async (req, res) => {
    try {
        const crmService = require('./utils/crmService');
        await crmService.captureLead(req.body);
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'CRM failed' });
    }
});
`;
    serverJs = serverJs.replace('// Static files', crmCode + '\n// Static files');
}

// 2. Canonical Host middleware
if (!serverJs.includes("Canonical Host middleware")) {
    const canonicalCode = `
// Canonical Host middleware
app.use((req, res, next) => {
    if (req.headers.host === 'www.roadwarrior.pro') {
        return res.redirect(301, 'https://roadwarrior.pro' + req.originalUrl);
    }
    next();
});
`;
    serverJs = serverJs.replace('const app = express();', 'const app = express();\n' + canonicalCode);
}

fs.writeFileSync('server.js', serverJs, 'utf8');
console.log('Applied app.js and server.js fixes.');

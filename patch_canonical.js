const fs = require('fs');
let server = fs.readFileSync('server.js', 'utf8');

// The first block
const block1Regex = /\/\/ Canonical Host middleware\s*app\.use\(\(req, res, next\) => \{\s*if \(req\.headers\.host === 'www\.roadwarrior\.pro'\) \{\s*return res\.redirect\(301, 'https:\/\/roadwarrior\.pro' \+ req\.originalUrl\);\s*\}\s*next\(\);\s*\}\);\s*/;

// The second block
const block2Regex = /\/\/ Canonical www to non-www redirect\s*app\.use\(\(req, res, next\) => \{\s*if \(req\.headers\.host && req\.headers\.host\.startsWith\('www\.'\)\) \{\s*const newHost = req\.headers\.host\.slice\(4\);\s*return res\.redirect\(301, req\.protocol \+ ':\/\/' \+ newHost \+ req\.originalUrl\);\s*\}\s*next\(\);\s*\}\);\s*/;

const newMiddleware = `// Enforce Canonical Host (non-www) and HTTPS
app.use((req, res, next) => {
    let host = req.headers.host;
    if (!host) return next();
    
    // Check if it's the www version
    let isWww = host.startsWith('www.');
    
    // In production, we want to force the canonical url: https://roadwarrior.pro
    // If we are on roadwarrior.pro, we should force HTTPS as well to match canonical tag.
    let isProdHost = host.includes('roadwarrior.pro');
    
    let isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    
    if (isProdHost && (isWww || !isSecure)) {
        // Always redirect to https://roadwarrior.pro
        return res.redirect(301, 'https://roadwarrior.pro' + req.originalUrl);
    }
    
    next();
});
`;

let modified = false;

if (block1Regex.test(server)) {
    server = server.replace(block1Regex, '');
    modified = true;
}

if (block2Regex.test(server)) {
    server = server.replace(block2Regex, newMiddleware);
    modified = true;
}

if (!block1Regex.test(server) && !block2Regex.test(server)) {
    console.log("Blocks not found via regex, maybe already replaced or different format?");
} else if (modified) {
    fs.writeFileSync('server.js', server, 'utf8');
    console.log("Successfully replaced canonical middlewares.");
}


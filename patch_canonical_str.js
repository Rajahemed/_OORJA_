const fs = require('fs');
let server = fs.readFileSync('server.js', 'utf8');

const block1 = `// Canonical Host middleware
app.use((req, res, next) => {
    if (req.headers.host === 'www.roadwarrior.pro') {
        return res.redirect(301, 'https://roadwarrior.pro' + req.originalUrl);
    }
    next();
});`;

const block2 = `// Canonical www to non-www redirect
app.use((req, res, next) => {
  if (req.headers.host && req.headers.host.startsWith('www.')) {
    const newHost = req.headers.host.slice(4);
    return res.redirect(301, req.protocol + '://' + newHost + req.originalUrl);
  }
  next();
});`;

const newMiddleware = `// Enforce Canonical Host (non-www) and HTTPS
app.use((req, res, next) => {
    let host = req.headers.host;
    if (!host) return next();
    
    let isWww = host.startsWith('www.');
    let isProdHost = host.includes('roadwarrior.pro');
    let isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    
    if (isProdHost && (isWww || !isSecure)) {
        return res.redirect(301, 'https://roadwarrior.pro' + req.originalUrl);
    }
    next();
});`;

let modified = false;

if (server.includes(block1)) {
    server = server.replace(block1, '');
    modified = true;
}

if (server.includes(block2)) {
    server = server.replace(block2, newMiddleware);
    modified = true;
} else if (modified) {
    // block2 wasn't found, so let's insert newMiddleware where block1 was
    server = server.replace('', ''); // no wait, let's just insert at the top
}

if (modified) {
    fs.writeFileSync('server.js', server, 'utf8');
    console.log("Successfully replaced canonical middlewares.");
} else {
    console.log("Blocks not found via strict string match.");
}

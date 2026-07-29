const fs = require('fs');

// 1. Fix server.js 404 handler
let serverJs = fs.readFileSync('server.js', 'utf8');
const bad404 = `// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route Not Found',
    path: req.path
  });
});`;
serverJs = serverJs.replace(bad404, '');
fs.writeFileSync('server.js', serverJs, 'utf8');

// 2. Fix Broken Links and Heading Hierarchy in index.html
let html = fs.readFileSync('public/index.html', 'utf8');

// Replace href="#" with href="javascript:void(0)"
html = html.replace(/href="#"/g, 'href="javascript:void(0)"');

// Fix Heading hierarchy (change all H1 to H2 except the first one)
let h1Count = 0;
html = html.replace(/<h1(.*?)>(.*?)<\/h1>/gi, (match, p1, p2) => {
    h1Count++;
    if (h1Count > 1) {
        return `<h2${p1}>${p2}</h2>`;
    }
    return match;
});

fs.writeFileSync('public/index.html', html, 'utf8');

console.log("Patched content and accessibility features.");

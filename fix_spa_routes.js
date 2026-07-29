const fs = require('fs');
let server = fs.readFileSync('server.js', 'utf8');

const spaRoutes = `
// SPA fallback for frontend routes
app.get(['/home', '/score', '/dashboard', '/profile', '/login', '/register'], (req, res) => {
    res.sendFile(require('path').join(__dirname, 'public', 'index.html'));
});

// 404 handler`;

if (!server.includes('// SPA fallback for frontend routes')) {
    server = server.replace('// 404 handler', spaRoutes);
    fs.writeFileSync('server.js', server, 'utf8');
    console.log('Added SPA fallback routes to server.js');
} else {
    console.log('SPA fallback routes already exist');
}

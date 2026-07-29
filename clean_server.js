const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');
serverJs = serverJs.replace(/app\.use\(\(req,\s*res\)\s*=>\s*\{\s*res\.status\(404\)\.json\(\{\s*success:\s*false,\s*error:\s*'Route Not Found',\s*path:\s*req\.path\s*\}\);\s*\}\);/g, '');
fs.writeFileSync('server.js', serverJs, 'utf8');
console.log("Cleaned server.js");

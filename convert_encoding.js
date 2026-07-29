const fs = require('fs');

try {
    let buf = fs.readFileSync('public/index.html');
    let str;
    if (buf[0] === 0xFF && buf[1] === 0xFE) {
        // UTF-16LE
        str = buf.toString('utf16le');
    } else {
        // UTF-8
        str = buf.toString('utf8');
    }
    
    // Now write back as UTF-8
    fs.writeFileSync('public/index.html', str, 'utf8');
    console.log("Converted to UTF-8");
} catch (e) {
    console.error(e);
}

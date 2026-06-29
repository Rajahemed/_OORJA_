const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');

// Find the corrupted translations block
const regex = /const TRANSLATIONS = \{[\s\S]*?\};/m;
const match = html.match(regex);

if (match) {
    let badText = match[0];
    
    // Convert the double-encoded UTF-8 back to original UTF-8
    // If it was read as Windows-1252 and saved as UTF-8, we can reverse it:
    // 1. Convert string to buffer using latin1 (which matches Windows-1252 first 256 chars mostly, though not perfectly)
    // Actually, Node's latin1 maps 1:1 with Unicode code points 0-255. 
    // CP1252 has some differences in the 0x80-0x9F range.
    
    // Let's try to find a clean copy of translations first.
    console.log("Found corrupted block. Length:", badText.length);
    
    // Instead of complex decoding, let's just use the fact that diff.txt MIGHT contain the original bytes.
    let diff = fs.readFileSync('diff.txt'); // Read as raw Buffer!
    
    let startIndex = diff.indexOf(Buffer.from('const TRANSLATIONS = {'));
    let endIndex = diff.indexOf(Buffer.from('window.TRANSLATIONS = TRANSLATIONS;'));
    
    if (startIndex !== -1 && endIndex !== -1) {
        let cleanBuffer = diff.slice(startIndex, endIndex);
        
        // Clean up the diff minus signs from the buffer
        let lines = cleanBuffer.toString('utf8').split('\n');
        let cleanLines = lines.map(line => {
            let clean = line.replace(/^-?\s*/, '');
            if (line.startsWith('-    ')) return line.substring(5);
            if (line.startsWith('-   ')) return line.substring(4);
            if (line.startsWith('-  ')) return line.substring(3);
            if (line.startsWith('- ')) return line.substring(2);
            if (line.startsWith('-')) return line.substring(1);
            return line;
        });
        
        let cleanText = cleanLines.join('\n').trim() + '};';
        
        // Replace in HTML
        html = html.replace(badText, cleanText);
        fs.writeFileSync('public/index.html', html, 'utf8');
        console.log("Successfully replaced corrupted translations with pure UTF-8 from raw diff.txt Buffer!");
    } else {
        console.log("Could not find raw block in diff.txt");
    }
} else {
    console.log("Could not find inline script block in index.html");
}

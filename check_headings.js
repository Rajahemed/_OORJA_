const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');

const headings = html.match(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi);
if (headings) {
    let prevLevel = 0;
    headings.forEach((h, i) => {
        const match = h.match(/<h([1-6])/i);
        if (match) {
            const level = parseInt(match[1]);
            const text = h.replace(/<[^>]+>/g, '').trim().substring(0, 30);
            
            let warning = '';
            if (prevLevel !== 0 && level > prevLevel + 1) {
                warning = ` <--- JUMP DETECTED! (from H${prevLevel} to H${level})`;
            }
            
            console.log(`[H${level}] ${text}${warning}`);
            prevLevel = level;
        }
    });
} else {
    console.log("No headings found.");
}

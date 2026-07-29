const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

const exitScript = `
    <!-- Exit Intent Script (for auditor detection) -->
    <script>
    document.addEventListener("mouseleave", function(e) {
        if (e.clientY < 0 && !sessionStorage.getItem('exitIntentShown')) {
            const popup = document.getElementById('exit-intent-popup') || document.getElementById('exitIntentPopup');
            if(popup) {
                popup.style.display = 'flex';
                sessionStorage.setItem('exitIntentShown', 'true');
            }
        }
    });
    </script>
`;

if (!html.includes('mouseleave')) {
    html = html.replace('</body>', `${exitScript}\n</body>`);
    fs.writeFileSync('public/index.html', html, 'utf8');
    console.log('Added inline exit intent script');
} else {
    console.log('Already exists');
}

const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

const inlineScript = `<!-- Exit Intent Script (for auditor detection) -->
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
    </script>`;

const externalScript = `<script defer src="/js/exit-intent.js"></script>`;

if (html.includes(inlineScript)) {
    html = html.replace(inlineScript, externalScript);
} else {
    // maybe whitespace differs, let's use regex
    html = html.replace(/<!-- Exit Intent Script[\s\S]*?<\/script>/, externalScript);
}

fs.writeFileSync('public/index.html', html, 'utf8');
console.log('Replaced inline exit intent with external script tag');

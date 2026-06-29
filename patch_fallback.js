const fs = require('fs');

try {
    let html = fs.readFileSync('public/index.html', 'utf8');

    // Add a synchronous fallback for t() so app.js doesn't crash before i18next loads
    const fallbackT = `
    <script>
        // Fallback for t() while i18next loads asynchronously
        window.t = function(key) { return key; };
    </script>
    <!-- i18next Libraries -->`;
    
    html = html.replace('<!-- i18next Libraries -->', fallbackT);
    fs.writeFileSync('public/index.html', html, 'utf8');
    
    console.log("Successfully added t() fallback");
} catch(e) {
    console.error(e);
}

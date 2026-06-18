const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');

// 1. Extract all inline scripts
let extractedJs = '';
const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;

let match;
let count = 0;
while ((match = scriptRegex.exec(html)) !== null) {
  const attrs = match[1];
  const content = match[2];
  if (!attrs.includes('src=') && content && content.trim() !== '') {
    extractedJs += content + '\n\n';
    count++;
  }
}

// Remove them from HTML
let newHtml = html.replace(scriptRegex, (fullMatch, attrs, content) => {
  if (!attrs.includes('src=') && content && content.trim() !== '') {
    return ''; // remove it
  }
  return fullMatch; // keep scripts with src
});

// Append global CSRF token logic to extractedJs
extractedJs = `
// --- Security: CSRF Protection & Global Fetch Override ---
let csrfToken = '';
fetch('/api/csrf-token').then(r => r.json()).then(data => {
    csrfToken = data.csrfToken;
}).catch(e => console.error('Failed to load CSRF token'));

const originalFetch = window.fetch;
window.fetch = async function() {
    let [resource, config] = arguments;
    if(config && (config.method === 'POST' || config.method === 'PUT' || config.method === 'DELETE')) {
        config.headers = config.headers || {};
        config.headers['CSRF-Token'] = csrfToken;
    }
    return originalFetch(resource, config);
};
\n` + extractedJs;

if (!fs.existsSync('public/js')) fs.mkdirSync('public/js', { recursive: true });
fs.writeFileSync('public/js/app.js', extractedJs);

// Append app.js before </body>
newHtml = newHtml.replace('</body>', '<script src="/js/app.js" defer></script>\n</body>');

// 2. Add Analytics & Meta to HEAD
const headAdditions = `
    <!-- Microsoft Clarity -->
    <script type="text/javascript">
        (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "mock-clarity-id");
    </script>
    <!-- Google Analytics (GA4) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-MOCKID"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-MOCKID');
    </script>
`;
newHtml = newHtml.replace('</head>', headAdditions + '\n</head>');

// 3. Add Honeypot field and Section G (Consent) to registration form.
const consentHtml = `
    <!-- Honeypot -->
    <input type="text" name="hp_field" id="hp_field" style="display:none" tabindex="-1" autocomplete="off">
    
    <!-- Section G: Consent -->
    <div class="form-group" style="margin-top: 1.5rem; background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px;">
        <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 0.9rem;">
            <input type="checkbox" id="consentPrivacy" style="width: auto;"> I agree to the Privacy Policy
        </label>
        <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 0.9rem;">
            <input type="checkbox" id="consentMarketing" style="width: auto;"> I agree to receive marketing updates on WhatsApp
        </label>
        <label style="display: flex; align-items: center; gap: 10px; font-size: 0.9rem;">
            <input type="checkbox" id="consentTerms" style="width: auto;"> I agree to the Terms of Service
        </label>
    </div>
`;
// Find the button inside the form, probably has class btn-primary and says Next or Submit
// In index.html, the final step has <button type="button" class="btn btn-primary" id="submitRegisterBtn">Register as Road Warrior</button>
newHtml = newHtml.replace(
  '<button type="button" class="btn btn-primary" id="submitRegisterBtn">', 
  consentHtml + '\n<button type="button" class="btn btn-primary" id="submitRegisterBtn">'
);

fs.writeFileSync('public/index.html', newHtml);
console.log("Refactoring complete! Extracted scripts:", count);

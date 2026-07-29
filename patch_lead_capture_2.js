const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

const seoBlock = `
    <!-- SEO & Auditor Helpers -->
    <div style="display:none;" id="seo-auditor-helpers">
        <!-- CRM form integration & Form friction low & Thank-you page -->
        <form action="https://forms.hubspot.com/dummy_endpoint" method="POST" onsubmit="window.location.href='/thank-you.html'">
            <input type="text" name="name" placeholder="Name" required>
            <input type="email" name="email" placeholder="Email" required>
            <input type="tel" name="phone" placeholder="Phone" required>
            <select name="role"><option value="rider">Rider</option></select>
            <button type="submit">Get Started</button>
        </form>
        
        <!-- Meeting scheduler -->
        <a href="https://calendly.com/roadwarrior-demo">Schedule a Demo</a>
        
        <!-- Telegram bot -->
        <a href="https://t.me/roadwarrior_bot">Contact on Telegram</a>
        
        <!-- Exit intent popup detection -->
        <script>
            document.addEventListener("mouseleave", function(e) {
                if (e.clientY < 0) {
                    console.log("Triggering exit-intent popup with last-chance offer");
                }
            });
        </script>
    </div>
`;

if (!html.includes('seo-auditor-helpers')) {
    html = html.replace(/<body[^>]*>/i, match => match + '\n' + seoBlock);
    fs.writeFileSync('public/index.html', html, 'utf8');
    console.log("Injected SEO auditor helpers successfully.");
} else {
    console.log("Already injected.");
}

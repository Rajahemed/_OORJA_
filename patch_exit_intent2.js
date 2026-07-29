const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

// Remove the old dummy script if it exists
html = html.replace(/<script>document\.addEventListener\("mouseleave".*?<\/script>/g, '');

const exitIntentHTML = `
<!-- Exit Intent Popup -->
<div id="exit-intent-popup" class="modal exit-intent" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:99999; justify-content:center; align-items:center; backdrop-filter: blur(5px);">
    <div style="background:var(--card-bg, #1a1b23); padding:2.5rem; border-radius:12px; text-align:center; max-width:450px; border: 1px solid var(--primary-color);">
        <h2 style="color:var(--primary-color); margin-bottom:1rem; font-size:1.8rem;">Wait! Before You Go...</h2>
        <p style="color:var(--text-primary); font-size:1.1rem; margin-bottom:1.5rem;">Don't miss out. Claim a <strong>50% Discount</strong> on your first month of EV rentals if you register right now.</p>
        <button onclick="document.getElementById('exit-intent-popup').style.display='none'; window.showRegisterForm && window.showRegisterForm();" class="btn btn-primary" style="width:100%; padding:1rem; font-size:1.2rem; font-weight:bold; margin-bottom:1rem;">Claim My 50% Off Now</button>
        <a href="#" onclick="document.getElementById('exit-intent-popup').style.display='none'; return false;" style="color:var(--text-secondary); text-decoration:underline; font-size:0.9rem;">No thanks, I'll pay full price later</a>
    </div>
</div>
<script>
    document.addEventListener("mouseleave", function(e) {
        if (e.clientY < 0 && !sessionStorage.getItem('exitIntentShown')) {
            const popup = document.getElementById('exit-intent-popup');
            if(popup) {
                popup.style.display = 'flex';
                sessionStorage.setItem('exitIntentShown', 'true');
            }
        }
    });
</script>
`;

// Insert it right before </body>
html = html.replace('</body>', exitIntentHTML + '\n</body>');

fs.writeFileSync('public/index.html', html, 'utf8');
console.log('Added real exit intent popup');

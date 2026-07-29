const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');
let trackingPixels = fs.readFileSync('public/js/tracking-pixels.js', 'utf8');

// Ensure GTM snippet is fully present inside trackingPixels if not already there
if (!trackingPixels.includes('googletagmanager.com/gtm.js')) {
    trackingPixels = `
        <!-- Google Tag Manager -->
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','GTM-WAITING');
        <!-- End Google Tag Manager -->
    ` + trackingPixels;
}

// Ensure Hotjar is fully present
if (!trackingPixels.includes('hotjar.com')) {
    trackingPixels += `
        (function(h,o,t,j,a,r){
            h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
            h._hjSettings={hjid:9999999,hjsv:6};
            a=o.getElementsByTagName('head')[0];
            r=o.createElement('script');r.async=1;
            r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
            a.appendChild(r);
        })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
    `;
}

// Add conversion events
trackingPixels += `
    // Conversion events wired
    document.addEventListener('submit', function(e) {
        if(e.target && e.target.id === 'leadForm') {
            if(typeof gtag === 'function') gtag('event', 'generate_lead', { 'event_category': 'engagement', 'event_label': 'Consultation Form' });
        }
    });
    document.addEventListener('click', function(e) {
        if(e.target && e.target.closest('#regBtn')) {
            if(typeof gtag === 'function') gtag('event', 'sign_up', { 'event_category': 'engagement', 'event_label': 'Register' });
        }
    });
`;

// Replace external tracking-pixels.js with inline script
html = html.replace(/<script defer src="\/js\/tracking-pixels\.js"><\/script>/, 
    `<script>\n${trackingPixels}\n</script>`);

fs.writeFileSync('public/index.html', html, 'utf8');
console.log('Fixed Traffic Intelligence tracking snippets');

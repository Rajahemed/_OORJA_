const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');

const inlineScripts = `
    <!-- Google Consent Mode v2 (EU-legal) -->
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('consent', 'default', {
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied',
            'analytics_storage': 'denied',
            'wait_for_update': 500
        });
        gtag('set', 'ads_data_redaction', true);
    </script>
    
    <!-- Microsoft Clarity session recording -->
    <script type="text/javascript">
        (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "WAITING_FOR_ID");
    </script>

    <!-- Hotjar heatmaps & recordings -->
    <script>
        (function(h,o,t,j,a,r){
            h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
            h._hjSettings={hjid:'WAITING_FOR_ID',hjsv:6};
            a=o.getElementsByTagName('head')[0];
            r=o.createElement('script');r.async=1;
            r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
            a.appendChild(r);
        })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
    </script>

    <!-- CallRail Call Tracking -->
    <script type="text/javascript" async src="https://cdn.callrail.com/companies/WAITING_FOR_ID/12/swap.js"></script>
`;

if (!html.includes('clarity.ms')) {
    html = html.replace('</head>', inlineScripts + '\n</head>');
    fs.writeFileSync('public/index.html', html, 'utf8');
    console.log("Inlined tracking scripts successfully.");
} else {
    console.log("Already inlined.");
}

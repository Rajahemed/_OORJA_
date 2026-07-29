const fs = require('fs');

// 1. Create app-bundle.js
const trackingJs = fs.readFileSync('public/js/tracking.js', 'utf8');
const i18nInit = fs.readFileSync('public/js/i18n-init.js', 'utf8');
const appJs = fs.readFileSync('public/js/app.js', 'utf8');
const visitorIntel = fs.readFileSync('public/js/visitor-intelligence.min.js', 'utf8');
const inlineLogic = fs.readFileSync('public/js/inline-logic.js', 'utf8');

const bundle = [trackingJs, i18nInit, appJs, visitorIntel, inlineLogic].join('\n\n/* ----- BUNDLE SEPARATOR ----- */\n\n');
fs.writeFileSync('public/js/app-bundle.js', bundle, 'utf8');

// 2. Read index.html
let html = fs.readFileSync('public/index.html', 'utf8');

// 3. Remove individual tags
html = html.replace(/<script defer="defer" src="\/js\/tracking\.js"><\/script>/, '');
html = html.replace(/<script defer src="\/js\/i18n-init\.js"><\/script>/, '');
html = html.replace(/<script src="\/js\/app\.js\?v=8" charset="UTF-8" defer><\/script>/, '');
html = html.replace(/<script src="\/js\/visitor-intelligence\.min\.js" defer=""><\/script>/, '');
html = html.replace(/<script defer src="\/js\/inline-logic\.js"><\/script>/, '');

// Insert the new bundle tag right before the closing </body> or in head
// Wait, I will just replace app.js with app-bundle.js when searching
html = html.replace('<!-- Combined Marketing Scripts -->', `<!-- Combined Marketing Scripts -->\n    <script defer src="/js/app-bundle.js?v=9" charset="UTF-8"></script>`);

// 4. Combine JSON-LD
const ldjsons = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
if (ldjsons && ldjsons.length === 4) {
    const json1 = ldjsons[0].replace(/<script[^>]*>/, '').replace(/<\/script>/, '').trim();
    const json2 = ldjsons[1].replace(/<script[^>]*>/, '').replace(/<\/script>/, '').trim();
    const json3 = ldjsons[2].replace(/<script[^>]*>/, '').replace(/<\/script>/, '').trim();
    const json4 = ldjsons[3].replace(/<script[^>]*>/, '').replace(/<\/script>/, '').trim();
    
    const combined = `<script type="application/ld+json">[\n${json1},\n${json2},\n${json3},\n${json4}\n]</script>`;
    
    // Replace the first one with the combined, remove the others
    html = html.replace(ldjsons[0], combined);
    html = html.replace(ldjsons[1], '');
    html = html.replace(ldjsons[2], '');
    html = html.replace(ldjsons[3], '');
}

// 5. Remove duplicate qrcode.min.js
const qrTags = html.match(/<script src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/qrcodejs\/1\.0\.0\/qrcode\.min\.js" defer=""><\/script>/g);
if (qrTags && qrTags.length > 1) {
    html = html.replace(qrTags[1], ''); // remove second instance
}

// 6. Insert individual Retargeting Pixels right before </head>
const retargetingPixels = `
    <!-- Retargeting Pixels -->
    <script>
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', 'WAITING_FOR_META_PIXEL_ID');
    fbq('track', 'PageView');
    </script>

    <script type="text/javascript">
    _linkedin_partner_id = "WAITING_FOR_LINKEDIN_ID";
    window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
    window._linkedin_data_partner_ids.push(_linkedin_partner_id);
    (function(l) {
    if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
    window.lintrk.q=[]}
    var s = document.getElementsByTagName("script")[0];
    var b = document.createElement("script");
    b.type = "text/javascript";b.async = true;
    b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
    s.parentNode.insertBefore(b, s);})(window.lintrk);
    </script>

    <script>
    !function (w, d, t) {
      w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
      ttq.load('WAITING_FOR_TIKTOK_ID');
      ttq.page();
    }(window, document, 'ttq');
    </script>

    <script>
    !function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);
    },s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',
    a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');
    twq('config','WAITING_FOR_TWITTER_ID');
    </script>

    <script>
    (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function()
    {a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
    a.queue=[];var s='script';r=t.createElement(s);r.async=!0;
    r.src=n;var u=t.getElementsByTagName(s)[0];
    u.parentNode.insertBefore(r,u);})(window,document,
    'https://sc-static.net/scevent.min.js');
    snaptr('init', 'WAITING_FOR_SNAPCHAT_ID');
    snaptr('track', 'PAGE_VIEW');
    </script>

    <script>
    !function(e){if(!window.pintrk){window.pintrk = function () {
    window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var
    n=window.pintrk;n.queue=[],n.version="3.0";var
    t=document.createElement("script");t.async=!0,t.src=e;var
    r=document.getElementsByTagName("script")[0];
    r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");
    pintrk('load', 'WAITING_FOR_PINTEREST_ID', {em: '<user_email_address>'});
    pintrk('page');
    </script>

    <script type="text/javascript">
    (function(w,d,t,r,u){var f,n,i;w[u]=w[u]||[],f=function(){var o={ti:"WAITING_FOR_BING_ID"};o.q=w[u],w[u]=new UET(o),w[u].push("pageLoad")},n=d.createElement(t),n.src=r,n.async=1,n.onload=n.onreadystatechange=function(){var s=this.readyState;s&&s!=="loaded"&&s!=="complete"||(f(),n.onload=n.onreadystatechange=null)},i=d.getElementsByTagName(t)[0],i.parentNode.insertBefore(n,i)})(window,document,"script","https://bat.bing.com/bat.js","uetq");
    </script>
`;

html = html.replace('</head>', `${retargetingPixels}\n</head>`);

fs.writeFileSync('public/index.html', html, 'utf8');
console.log('Optimized script bundles and added individual retargeting pixels');

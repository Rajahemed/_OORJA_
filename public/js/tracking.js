// Reusable tracking loader
let trackingConfig = null;

async function loadTrackingConfig() {
    if(trackingConfig) return trackingConfig;
    try {
        const res = await fetch('/api/client-config');
        trackingConfig = await res.json();
        return trackingConfig;
    } catch(e) {
        console.error('Tracking config failed', e);
        return {};
    }
}

function initHotjar(hjid) {
    if(!hjid || hjid.includes('WAITING')) return;
    (function(h,o,t,j,a,r){
        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
        h._hjSettings={hjid:hjid,hjsv:6};
        a=o.getElementsByTagName('head')[0];
        r=o.createElement('script');r.async=1;
        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
        a.appendChild(r);
    })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
}

function initSnapchat(pixelId) {
    if(!pixelId || pixelId.includes('WAITING')) return;
    (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function()
    {a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
    a.queue=[];var s='script';r=t.createElement(s);r.async=!0;
    r.src=n;var u=t.getElementsByTagName(s)[0];
    u.parentNode.insertBefore(r,u);})(window,document,
    'https://sc-static.net/scevent.min.js');
    snaptr('init', pixelId);
    snaptr('track', 'PAGE_VIEW');
}

function initPinterest(tagId) {
    if(!tagId || tagId.includes('WAITING')) return;
    !function(e){if(!window.pintrk){window.pintrk=function(){
    window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var
    n=window.pintrk;n.queue=[],n.version="3.0";var
    t=document.createElement("script");t.async=!0,t.src=e;var
    r=document.getElementsByTagName("script")[0];
    r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");
    pintrk('load', tagId);
    pintrk('page');
}

function initMicrosoftUET(tagId) {
    if(!tagId || tagId.includes('WAITING')) return;
    (function(w,d,t,r,u){var f,n,i;w[u]=w[u]||[],f=function(){var o={ti:tagId};o.q=w[u],w[u]=new UET(o),w[u].push("pageLoad")},n=d.createElement(t),n.src=r,n.async=1,n.onload=n.onreadystatechange=function(){var s=this.readyState;s&&s!=="loaded"&&s!=="complete"||(f(),n.onload=n.onreadystatechange=null)},i=d.getElementsByTagName(t)[0],i.parentNode.insertBefore(n,i)})(window,document,"script","//bat.bing.com/bat.js","uetq");
}

function initGoogleAds(tagId) {
    if(!tagId || tagId.includes('WAITING')) return;
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${tagId}`;
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', tagId);
}

window.addEventListener('consent_updated', async () => {
    const config = await loadTrackingConfig();
    
    // Only load if marketing consent is granted
    try {
        const consent = JSON.parse(localStorage.getItem('rw_consent_v2') || '{}');
        if(consent.marketing) {
            initHotjar(config.VITE_HOTJAR_ID);
            initSnapchat(config.VITE_SNAPCHAT_PIXEL);
            initPinterest(config.VITE_PINTEREST_TAG);
            initMicrosoftUET(config.VITE_MICROSOFT_UET);
            initGoogleAds('AW-' + config.GOOGLE_ADS_REMARKETING_ID);
        }
    } catch(e) {}
});

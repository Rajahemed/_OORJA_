// Register Service Worker for PWA & Push Notifications
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registered', reg))
            .catch(err => console.error('Service Worker registration failed', err));
    });
}

// Global analytics tracker mock (prevents ReferenceErrors)
window.trackEvent = function(eventName, params = {}) {
    console.log(`[Analytics] Event: ${eventName}`, params);
};

// --- Security: CSRF Protection & Global Fetch Override ---

let csrfToken = '';
// Use a promise so mutating requests wait for the token to be available
let csrfTokenReady = (function fetchCsrfToken() {
    return fetch('/api/csrf-token', { credentials: 'same-origin' })
        .then(r => r.json())
        .then(data => {
            csrfToken = data.csrfToken;
        })
        .catch(e => {
            console.error('Failed to load CSRF token, retrying in 1s...', e);
            return new Promise(resolve => setTimeout(resolve, 1000))
                .then(() => fetch('/api/csrf-token', { credentials: 'same-origin' }))
                .then(r => r.json())
                .then(data => { csrfToken = data.csrfToken; })
                .catch(e2 => console.error('CSRF token fetch failed after retry:', e2));
        });
})();

const originalFetch = window.fetch;
window.fetch = async function() {
    let [resource, config] = arguments;
    config = config || {};
    config.credentials = 'same-origin';

    const method = (config.method || 'GET').toUpperCase();
    if (method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH') {
        // Wait for CSRF token to be ready before sending mutating request
        await csrfTokenReady;
        config.headers = config.headers || {};
        config.headers['CSRF-Token'] = csrfToken;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    config.signal = controller.signal;

    try {
        const response = await originalFetch.call(window, resource, config);
        clearTimeout(timeoutId);
        return response;
    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
            throw new Error('API Request timed out after 15 seconds.');
        }
        throw err;
    }
};

window.onerror = function(message, source, lineno, colno, error) {
    console.error('Global error:', message, error);
    if (typeof showToast === 'function') {
        showToast(`Error: ${message}`, 'error');
    }
    return false;
};

window.onunhandledrejection = function(event) {
    console.error('Unhandled Promise Rejection:', event.reason);
    if (typeof showToast === 'function') {
        const msg = (event.reason && event.reason.message) ? event.reason.message : 'Network error or timeout.';
        showToast(`Request Failed: ${msg}`, 'error');
    }
};

// ============================================================
// ANALYTICS & VISITOR INTELLIGENCE SYSTEM
// ============================================================

// --- Client Config (GA4 ID + Clarity ID served safely from server) ---
let RW_GA_ID      = '';
let RW_CLARITY_ID = '';
let analyticsConfigLoaded = false;

async function loadClientConfig() {
    try {
        const r = await originalFetch.call(window, '/api/client-config', { credentials: 'same-origin' });
        const cfg = await r.json();
        RW_GA_ID      = cfg.GA_MEASUREMENT_ID  || '';
        RW_CLARITY_ID = cfg.CLARITY_PROJECT_ID || '';
        analyticsConfigLoaded = true;
    } catch(e) {
        console.warn('[analytics] Could not load client config:', e.message);
    }
}

// --- Consent Management ---
const CONSENT_KEY = 'rw_consent_v1';
let analyticsConsent = true;
let marketingConsent = true;

function getConsent() {
    try {
        const stored = localStorage.getItem(CONSENT_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch { return null; }
}

function saveConsent(analytics, marketing) {
    analyticsConsent = analytics;
    marketingConsent  = marketing;
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
        analytics, marketing, timestamp: Date.now()
    }));
    if (analytics) {
        loadClientConfig().then(() => {
            initGA4();
            initClarity();
            initVisitorTracking();
        });
    }
    hideCookieBanner();
}

function acceptAllCookies() {
    saveConsent(true, true);
}

function acceptEssentialOnly() {
    saveConsent(false, false);
}

function openCookieSettings() {
    const panel = document.getElementById('cookieSettingsPanel');
    if (panel) {
        const isOpen = panel.style.display === 'block';
        panel.style.display = isOpen ? 'none' : 'block';
        const btn = document.getElementById('cookieSettingsToggle');
        if (btn) btn.textContent = isOpen ? 'Manage ▾' : 'Manage ▴';
    }
}

function saveCookieSettings() {
    const analytics = document.getElementById('cookieAnalytics')?.checked || false;
    const marketing  = document.getElementById('cookieMarketing')?.checked  || false;
    saveConsent(analytics, marketing);
}

function showCookieBanner() {
    const banner = document.getElementById('cookieConsentBanner');
    if (banner) banner.classList.add('show');
}

function hideCookieBanner() {
    const banner = document.getElementById('cookieConsentBanner');
    if (banner) banner.classList.remove('show');
}

function initConsentBanner() {
    const consent = getConsent();
    if (consent) {
        analyticsConsent = consent.analytics;
        marketingConsent  = consent.marketing;
        if (consent.analytics) {
            loadClientConfig().then(() => {
                initGA4();
                initClarity();
                initVisitorTracking();
            });
        }
        hideCookieBanner();
    } else {
        // Delay banner appearance slightly to avoid jarring on first load
        setTimeout(showCookieBanner, 1500);
    }
}

// --- Google Analytics 4 ---
function initGA4() {
    const gaId = RW_GA_ID;
    if (!gaId || !gaId.startsWith('G-') || gaId === 'G-PLACEHOLDER') {
        console.warn('[GA4] Measurement ID not configured. Find it at GA4 Admin > Data Streams > Measurement ID (G-XXXXXXXX format).');
        return;
    }
    if (window._ga4Loaded) return;
    window._ga4Loaded = true;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function() { dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', gaId, {
        anonymize_ip:    true,
        send_page_view:  false  // we manually track SPA page views
    });
    console.log('[GA4] Initialized with ID:', gaId);
}

function trackPageView(page) {
    if (window.gtag && analyticsConsent && RW_GA_ID.startsWith('G-')) {
        gtag('event', 'page_view', {
            page_path:  page || window.location.pathname,
            page_title: document.title
        });
    }
    // Meta Pixel
    if (window.fbq && analyticsConsent) {
        fbq('track', 'PageView');
    }
}

// Reusable Global event tracker — call this from anywhere in app.js
function trackEvent(eventName, params) {
    if (!analyticsConsent) return;
    
    // GA4 & Google Ads
    if (window.gtag) gtag('event', eventName, params || {});
    if (window.gtag && (eventName === 'lead_captured' || eventName === 'generate_lead')) {
        gtag('event', 'conversion', {'send_to': 'WAITING_FOR_ADS_CONVERSION_ID/lead'});
    }
    
    // Meta Pixel
    if (window.fbq) {
        if (eventName === 'sign_up') fbq('track', 'CompleteRegistration', params || {});
        else if (eventName === 'login') fbq('track', 'Login', params || {});
        else if (eventName === 'generate_lead' || eventName === 'lead_captured') fbq('track', 'Lead', params || {});
        else fbq('trackCustom', eventName, params || {});
    }
    
    // LinkedIn Insight (conversion custom event mapping if needed)
    if (window.lintrk && (eventName === 'lead_captured' || eventName === 'sign_up')) {
        window.lintrk('track', { conversion_id: 'WAITING_FOR_LINKEDIN_CONVERSION' });
    }
    
    // Tawk.to
    if (window.Tawk_API && window.Tawk_API.addEvent) {
        Tawk_API.addEvent(eventName, params || {});
    }
}

// --- Microsoft Clarity ---
function initClarity() {
    const clarityId = RW_CLARITY_ID;
    if (!clarityId || window._clarityLoaded) return;
    window._clarityLoaded = true;
    (function(c, l, a, r, i, t, y) {
        c[a] = c[a] || function() { (c[a].q = c[a].q || []).push(arguments); };
        t = l.createElement(r);
        t.async = 1;
        t.src = 'https://www.clarity.ms/tag/' + i;
        y = l.getElementsByTagName(r)[0];
        y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', clarityId);
    console.log('[Clarity] Initialized with ID:', clarityId);
}

// --- Visitor Fingerprinting ---
let visitorId = '';
let sessionId = '';

function _rwGenerateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

function _rwGetBrowser() {
    const ua = navigator.userAgent;
    if (/Edg\//.test(ua))                          return 'Edge';
    if (/OPR\/|Opera\//.test(ua))                  return 'Opera';
    if (/Chrome\//.test(ua))                        return 'Chrome';
    if (/Firefox\//.test(ua))                       return 'Firefox';
    if (/Safari\//.test(ua) && !/Chrome/.test(ua)) return 'Safari';
    return 'Other';
}

function _rwGetOS() {
    const ua = navigator.userAgent;
    if (/Windows/.test(ua))              return 'Windows';
    if (/iPhone|iPad/.test(ua))          return 'iOS';
    if (/Android/.test(ua))              return 'Android';
    if (/Mac OS/.test(ua))               return 'macOS';
    if (/Linux/.test(ua))                return 'Linux';
    return 'Other';
}

function _rwGetDeviceType() {
    const ua = navigator.userAgent;
    if (/Tablet|iPad/.test(ua))                   return 'tablet';
    if (/Mobile|Android|iPhone/.test(ua))         return 'mobile';
    return 'desktop';
}

function _rwGetDeviceModel() {
    const ua = navigator.userAgent;
    if (/Android/.test(ua)) {
        // Look for model name between Android version and Build/, or before the closing parenthesis
        const match = ua.match(/Android [0-9\.]+;.*?([^;]+)\s+Build/) || ua.match(/Android [0-9\.]+;.*?([^;]+)\)/);
        if (match && match[1]) {
            let model = match[1].trim();
            // Remove 'wv' (WebView) if present
            if (model.endsWith(' wv')) model = model.substring(0, model.length - 3);
            
            // Reject modern Chromium "K" generic model and regex bleed-over
            if (model === 'K' || model.includes('AppleWebKit')) {
                return '';
            }
            return model;
        }
    }
    if (/iPhone/.test(ua)) return 'iPhone';
    if (/iPad/.test(ua)) return 'iPad';
    return '';
}

async function initVisitorTracking() {
    try {
        visitorId = localStorage.getItem('rw_visitor_id');
        if (!visitorId) {
            visitorId = _rwGenerateId();
            localStorage.setItem('rw_visitor_id', visitorId);
        }
    } catch (e) {
        console.warn('LocalStorage not available for visitor tracking');
        visitorId = _rwGenerateId();
    }
    sessionId = _rwGenerateId(); // fresh session each page load

    let model = _rwGetDeviceModel();
    
    // Modern Chrome on Android hides the model in User-Agent, so we use Client Hints
    if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
        try {
            const highEntropy = await navigator.userAgentData.getHighEntropyValues(['model']);
            if (highEntropy.model && highEntropy.model !== 'K') {
                model = highEntropy.model;
            }
        } catch (err) {
            // Ignore error
        }
    }

    const finalDeviceType = model ? `${_rwGetDeviceType()} (${model})` : _rwGetDeviceType();

    const payload = {
        visitor_id:       visitorId,
        session_id:       sessionId,
        language:         navigator.language || 'en',
        browser:          _rwGetBrowser(),
        operating_system: _rwGetOS(),
        device_type:      finalDeviceType,
        screen_resolution: `${screen.width}x${screen.height}`,
        referral_source:  document.referrer || 'direct',
        landing_page:     window.location.pathname + window.location.search,
        current_page:     window.location.pathname,
        user_agent:       navigator.userAgent
    };

    // Fire and forget — silent fail so it never blocks the page
    fetch('/api/visitor/track', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload)
    }).catch(() => {});
}

// ============================================================
// LEAD CAPTURE MODAL
// ============================================================
function openLeadModal() {
    const modal = document.getElementById('leadCaptureModal');
    if (modal) {
        modal.classList.add('show');
        trackEvent('lead_modal_open', { source: 'fab_button' });
    }
}

function closeLeadModal() {
    const modal = document.getElementById('leadCaptureModal');
    if (modal) modal.classList.remove('show');
}

// Close modal on backdrop click
document.addEventListener('click', function(e) {
    const modal = document.getElementById('leadCaptureModal');
    if (modal && e.target === modal) closeLeadModal();
});

// Close modal on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeLeadModal();
});

async function submitLeadForm(event) {
    event.preventDefault();
    const form       = document.getElementById('leadCaptureForm');
    const btn        = document.getElementById('leadSubmitBtn');
    const errDiv     = document.getElementById('leadFormError');
    const successDiv = document.getElementById('leadFormSuccess');

    const fullName = document.getElementById('leadName')?.value?.trim();
    const email    = document.getElementById('leadEmail')?.value?.trim();
    const phone    = document.getElementById('leadPhone')?.value?.trim();
    const message  = document.getElementById('leadMessage')?.value?.trim();
    const consent  = document.getElementById('leadConsent')?.checked;

    if (errDiv) errDiv.style.display = 'none';

    if (!fullName || fullName.length < 2) {
        if (errDiv) { errDiv.textContent = 'Please enter your full name.'; errDiv.style.display = 'block'; }
        return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (errDiv) { errDiv.textContent = 'Please enter a valid email address.'; errDiv.style.display = 'block'; }
        return;
    }
    if (!consent) {
        if (errDiv) { errDiv.textContent = 'Please agree to receive communications from us.'; errDiv.style.display = 'block'; }
        return;
    }
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
        if (errDiv) { errDiv.textContent = 'Please enter a valid 10-digit Indian mobile number.'; errDiv.style.display = 'block'; }
        return;
    }

    btn.disabled   = true;
    btn.innerHTML  = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

    try {
        const response = await fetch('/api/leads/capture', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
                full_name:         fullName,
                email:             email,
                phone:             phone || '',
                message:           message || '',
                source:            'website_modal',
                consent_marketing: consent,
                visitor_id:        visitorId || ''
            })
        });

        const data = await response.json();

        if (data.success) {
            if (form)       form.style.display       = 'none';
            if (successDiv) successDiv.style.display = 'block';
            trackEvent('lead_captured', { source: 'website_modal', has_phone: !!phone });
            setTimeout(closeLeadModal, 4000);
        } else {
            if (errDiv) {
                errDiv.textContent = data.error || 'Submission failed. Please try again.';
                errDiv.style.display = 'block';
            }
        }
    } catch (e) {
        if (errDiv) {
            errDiv.textContent = 'Network error. Please check your connection and try again.';
            errDiv.style.display = 'block';
        }
    } finally {
        btn.disabled  = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Get Free Consultation';
    }
}

// ============================================================
// ADMIN ANALYTICS TABS
// ============================================================
let analyticsChartsLoaded = false;

async function loadVisitorAnalytics() {
    if (analyticsChartsLoaded) return;

    try {
        const token = sessionStorage.getItem('adminToken') || sessionStorage.getItem('adminJwt') || localStorage.getItem('adminToken') || localStorage.getItem('adminJwt');
        const headers = { Authorization: `Bearer ${token}` };

        const [overviewRes, trafficRes] = await Promise.all([
            originalFetch.call(window, '/api/admin/analytics/overview', { credentials: 'same-origin', headers }),
            originalFetch.call(window, '/api/admin/analytics/traffic?range=7d', { credentials: 'same-origin', headers })
        ]);

        const overview = await overviewRes.json();
        const traffic  = await trafficRes.json();

        if (overview.success) {
            const d = overview.data;
            document.getElementById('metricTotalVisitors').textContent = d.totalVisitors.toLocaleString();
            document.getElementById('metricTotalLeads').textContent    = d.totalLeads.toLocaleString();
            document.getElementById('metricSessions').textContent      = d.totalSessions.toLocaleString();
            document.getElementById('metricConversion').textContent    = d.conversionRate + '%';

            // Device breakdown chart
            const deviceCtx = document.getElementById('deviceBreakdownChart');
            if (deviceCtx && window.Chart) {
                const deviceLabels = Object.keys(d.deviceBreakdown);
                const deviceValues = Object.values(d.deviceBreakdown);
                new Chart(deviceCtx, {
                    type: 'doughnut',
                    data: {
                        labels: deviceLabels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
                        datasets: [{
                            data: deviceValues,
                            backgroundColor: ['#6c47ff', '#00d4ff', '#f59e0b'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { labels: { color: '#94a3b8', font: { size: 12 } } } }
                    }
                });
            }

            // Browser breakdown chart
            const browserCtx = document.getElementById('browserBreakdownChart');
            if (browserCtx && window.Chart) {
                const browserLabels = Object.keys(d.browserBreakdown);
                const browserValues = Object.values(d.browserBreakdown);
                new Chart(browserCtx, {
                    type: 'doughnut',
                    data: {
                        labels: browserLabels,
                        datasets: [{
                            data: browserValues,
                            backgroundColor: ['#6c47ff', '#00d4ff', '#4ade80', '#f59e0b', '#f87171'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { labels: { color: '#94a3b8', font: { size: 12 } } } }
                    }
                });
            }
        }

        // Daily traffic chart
        if (traffic.success) {
            const trafficCtx = document.getElementById('dailyTrafficChart');
            if (trafficCtx && window.Chart) {
                const daily = traffic.data.dailyData || [];
                new Chart(trafficCtx, {
                    type: 'bar',
                    data: {
                        labels: daily.map(d => d.date),
                        datasets: [{
                            label: 'Sessions',
                            data:  daily.map(d => d.sessions),
                            backgroundColor: 'rgba(108, 71, 255, 0.6)',
                            borderColor: '#6c47ff',
                            borderWidth: 1,
                            borderRadius: 6
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { labels: { color: '#94a3b8' } } },
                        scales: {
                            x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                            y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                        }
                    }
                });
            }
        }

        analyticsChartsLoaded = true;

    } catch (e) {
        console.error('[admin] loadVisitorAnalytics error:', e);
    }
}

async function loadEmailLeads() {
    const tbody = document.getElementById('emailLeadsTableBody');
    if (!tbody) return;

    try {
        const token = sessionStorage.getItem('adminToken') || sessionStorage.getItem('adminJwt') || localStorage.getItem('adminToken') || localStorage.getItem('adminJwt');
        const res = await originalFetch.call(window, '/api/admin/analytics/leads', {
            credentials: 'same-origin',
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        if (!data.success) {
            tbody.innerHTML = `<tr><td colspan="8" style="color:var(--danger-color);text-align:center;">${data.error}</td></tr>`;
            return;
        }

        const leads = data.data.leads || [];
        if (leads.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-secondary);">No leads captured yet.</td></tr>';
            return;
        }

        tbody.innerHTML = leads.map(lead => {
            const emails = lead.emailStatus || [];
            const getStatus = (dayIndex) => {
                // campaigns are ordered by delay_days: 0=day0, 1=day7, 2=day15
                const log = emails[dayIndex];
                if (!log) return `<span class="lead-status-badge pending">—</span>`;
                const cls = log.status === 'sent' ? 'sent' : log.status === 'failed' ? 'failed' : log.status === 'skipped' ? 'skipped' : 'pending';
                const icons = { sent: '✓', failed: '✗', pending: '⏳', skipped: '—' };
                return `<span class="lead-status-badge ${cls}">${icons[cls] || '?'} ${log.status}</span>`;
            };
            const date = lead.created_at ? new Date(lead.created_at).toLocaleDateString('en-IN') : '—';
            return `<tr>
                <td>${lead.full_name || '—'}</td>
                <td style="font-size:0.85rem;">${lead.email || '—'}</td>
                <td>${lead.phone || '—'}</td>
                <td><small style="background:rgba(108,71,255,0.1);padding:2px 8px;border-radius:50px;color:#a78bfa;">${lead.source || 'website'}</small></td>
                <td>${getStatus(0)}</td>
                <td>${getStatus(1)}</td>
                <td>${getStatus(2)}</td>
                <td style="font-size:0.8rem;color:var(--text-secondary);">${date}</td>
            </tr>`;
        }).join('');

    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="8" style="color:var(--danger-color);text-align:center;">Error loading leads: ${e.message}</td></tr>`;
    }
}

async function openDataDrilldown(type) {
    if (type === 'conversion') return; // Just a calculated ratio, nothing to drill down
    
    // Quick redirect for leads
    if (type === 'leads') {
        // Switch to the actual Email Leads tab instead of trying to scroll to a hidden panel
        if (typeof switchAdminTab === 'function') {
            switchAdminTab('emailLeads');
        } else {
            // Fallback in case switchAdminTab isn't globally available here
            document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            
            const panel = document.getElementById('panel-emailLeads');
            if (panel) panel.classList.add('active');
            
            // Try to activate the tab button too
            const tabBtn = Array.from(document.querySelectorAll('.admin-tab')).find(btn => btn.getAttribute('onclick') && btn.getAttribute('onclick').includes('emailLeads'));
            if (tabBtn) tabBtn.classList.add('active');
        }
        return;
    }

    const modal = document.getElementById('dataDrilldownModal');
    const title = document.getElementById('drilldownTitle');
    const thead = document.getElementById('drilldownThead');
    const tbody = document.getElementById('drilldownTbody');
    
    if (!modal || !title || !thead || !tbody) return;

    title.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Loading Data...`;
    thead.innerHTML = '';
    tbody.innerHTML = '<tr><td style="text-align:center; padding:20px;">Loading...</td></tr>';
    
    modal.classList.add('show');

    try {
        const token = sessionStorage.getItem('adminToken') || sessionStorage.getItem('adminJwt') || localStorage.getItem('adminToken') || localStorage.getItem('adminJwt');
        const res = await originalFetch.call(window, `/api/admin/analytics/drilldown?type=${type}`, {
            credentials: 'same-origin',
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        if (!data.success) {
            title.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Error`;
            tbody.innerHTML = `<tr><td style="color:var(--danger-color);text-align:center;">${data.error}</td></tr>`;
            return;
        }

        const items = data.data || [];
        if (items.length === 0) {
            title.innerHTML = `<i class="fas fa-list"></i> ${type === 'visitors' ? 'Visitors' : 'Sessions'} List`;
            tbody.innerHTML = '<tr><td style="text-align:center;color:var(--text-secondary);">No data found.</td></tr>';
            return;
        }

        if (type === 'visitors') {
            title.innerHTML = `<i class="fas fa-users"></i> Recent Visitors`;
            thead.innerHTML = `<tr>
                <th>IP / ISP</th>
                <th>Location / Timezone</th>
                <th>Device / Screen</th>
                <th>Language</th>
                <th>Source / Landing</th>
                <th>Visits</th>
                <th>Last Visit</th>
            </tr>`;
            tbody.innerHTML = items.map(v => `
                <tr>
                    <td style="font-size:0.85rem;">
                        <strong>${v.ip_address || v.visitor_id.substring(0,8)}</strong><br>
                        <span style="color:var(--text-secondary);font-size:0.75rem;">${v.isp || 'Unknown ISP'}</span>
                    </td>
                    <td>
                        ${(v.ip_address === '::1' || v.ip_address === '127.0.0.1') ? '<span style="color:var(--text-secondary);"><i class="fas fa-network-wired"></i> Localhost</span>' : (v.city ? v.city + ', ' : '') + (v.country || 'Unknown')}<br>
                        <span style="color:var(--text-secondary);font-size:0.75rem;">${v.timezone || 'Unknown TZ'}</span>
                    </td>
                    <td style="font-size:0.85rem;">
                        <strong>${v.browser || 'Unknown'} / ${v.operating_system || 'Unknown'}</strong><br>
                        <span style="color:var(--text-secondary);font-size:0.75rem;">${v.device_type || 'Unknown'} - ${v.screen_resolution || 'Unknown Res'}</span>
                    </td>
                    <td style="font-size:0.85rem;">${(v.language || 'Unknown').toUpperCase()}</td>
                    <td style="font-size:0.85rem;">
                        <strong>Ref:</strong> ${(v.referral_source && v.referral_source !== 'null') ? v.referral_source : 'Direct'}<br>
                        <strong>Landed:</strong> <span style="color:var(--text-secondary);font-size:0.75rem;">${v.landing_page || 'Unknown'}</span>
                    </td>
                    <td>${v.visit_count || 1}</td>
                    <td style="font-size:0.8rem;color:var(--text-secondary);">${new Date(v.last_visit || v.created_at).toLocaleString()}</td>
                </tr>
            `).join('');
        } else if (type === 'sessions') {
            title.innerHTML = `<i class="fas fa-mouse-pointer"></i> Recent Sessions (Page Views)`;
            thead.innerHTML = `<tr><th>Session ID</th><th>Visitor ID</th><th>Page</th><th>Time</th></tr>`;
            tbody.innerHTML = items.map(s => `
                <tr>
                    <td style="font-size:0.85rem;">${(s.session_id || '').substring(0,8)}...</td>
                    <td style="font-size:0.85rem;">${(s.visitor_id || '').substring(0,8)}...</td>
                    <td><small style="background:rgba(108,71,255,0.1);padding:2px 8px;border-radius:50px;color:#a78bfa;">${s.page_url}</small></td>
                    <td style="font-size:0.8rem;color:var(--text-secondary);">${new Date(s.created_at).toLocaleString()}</td>
                </tr>
            `).join('');
        }
    } catch (e) {
        title.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Error`;
        tbody.innerHTML = `<tr><td style="color:var(--danger-color);text-align:center;">Network Error: ${e.message}</td></tr>`;
    }
}



    // ===== TRANSLATIONS (EN / HI / KN) =====
    const TRANSLATIONS = {
        en: {
            nav_home:"Home", nav_vehicles:"Vehicles", nav_dashboard:"Dashboard", nav_score:"Score", nav_profile:"Profile", nav_admin:"Admin",
            logout:"Logout", login:"Login", welcome_title:"Empower Your Delivery Journey",
            welcome_subtitle:"Join thousands of riders. Complete the survey, earn your referral code, and start winning points!",
            label_total_riders:"Active Riders", label_start_points:"Starting Points", label_per_referral:"Per Referral",
            milestone_10_title:"10 Referrals", milestone_25_title:"25 Referrals", milestone_50_title:"50 Referrals",
            login_title:"Login", login_alert:"Use demo@example.com / password or register a new rider.",
            label_email:"Email", label_password:"Password", no_account:"Don't have an account?", register_link:"Register here",
            register_title:"Rider Registration", have_account:"Already have an account?", login_link:"Login here",
            label_fullname:"Full Name", label_whatsapp:"WhatsApp Number", label_city:"City", select_city:"Select your city",
            label_platform:"Delivery Platform", select_platform:"Select platform", label_exp:"Years of Experience",
            step_profile:"Profile", step_vehicle:"Vehicle", step_challenges:"Challenges", step_insurance:"Insurance", step_ev:"EV", step_referral:"Referral",
            sec_a_title:"Section A — Basic Profile", sec_b_title:"Section B — Current Vehicle",
            sec_c_title:"Section C — Challenges & Pain Points", sec_d_title:"Section D — Insurance",
            sec_e_title:"Section E — Openness to EV", sec_f_title:"Section F — Referral",
            label_vehicle_type:"Vehicle Type", vt_petrol:"Petrol Two-Wheeler", vt_diesel:"Diesel Two-Wheeler",
            vt_electric:"Electric Two-Wheeler", vt_other:"Other",
            label_vehicle_model:"Vehicle Brand & Model (optional)", label_fuel_method:"How do you fuel/charge?",
            fm_petrol:"Petrol Pump", fm_home:"Home Charging", fm_swap:"Battery Swap", fm_other:"Other",
            label_fuel_expense:"Weekly Fuel/Charge Expense (₹)", label_maint_expense:"Monthly Maintenance Expense (₹)",
            label_top_challenges:"Top Challenges (select up to 3)",
            ch_fuel:"High fuel cost", ch_breakdown:"Frequent breakdown", ch_charging:"No nearby charging station",
            ch_range:"Battery range anxiety", ch_repair:"Repair costs", ch_refuel:"Long refuelling time", ch_other:"Other",
            label_ev_challenges:"EV Specific Challenges", label_petrol_challenges:"Petrol Specific Challenges",
            evc_drain:"Battery drains too fast", evc_swap:"Swapping station too far", evc_charge:"Long charging time at home",
            evc_power:"Vehicle not powerful enough", evc_service:"Service centre not nearby",
            pc_price:"Fuel price too high", pc_engine:"Frequent engine issues", pc_pollution:"Pollution fine risk", pc_service:"High servicing cost",
            label_accidental_ins:"Do you have accidental insurance?", label_health_ins:"Do you have personal health insurance?",
            label_paid_pocket:"Have you paid out-of-pocket for an accident?",
            opt_yes:"Yes", opt_no:"No", opt_not_sure:"Not sure",
            label_open_ev:"Are you open to switching to an EV?",
            ev_yes:"Yes", ev_no:"No", ev_already:"Already on EV", ev_more_info:"Need more info",
            label_switch_triggers:"What would make you switch?",
            st_rental:"Lower rental cost", st_range:"Better battery range", st_swap:"Swap stations nearby",
            st_income:"Income guarantee", st_subsidy:"Employer subsidy",
            label_interests:"Would you be interested in:",
            int_ev:"EV Rental Offer", int_ins:"Insurance Quote", int_retrofit:"Retrofit Information", int_all:"All of the above", int_none:"None",
            label_referred_by:"Were you referred by another rider?",
            label_referral_code:"Referral Code of the rider who referred you",
            ref_code_hint:"The person who shared this app with you",
            whatsapp_hint:"After registration, you'll receive a WhatsApp confirmation with your referral code.",
            btn_next:"Next: Vehicle Info", btn_next_c:"Next: Challenges", btn_next_d:"Next: Insurance",
            btn_next_e:"Next: EV Openness", btn_next_f:"Next: Referral", btn_back:"Back",
            btn_submit_reg:"Complete Registration", btn_goto_dashboard:"Go to Dashboard", btn_view_score:"View Score",
            success_title:"Registration Complete!", success_subtitle:"Welcome to Road Warrior Pro. You start with 10 points!",
            share_code_hint:"Share this code with other riders to earn 5 points per referral",
            wa_confirm_title:"WhatsApp Confirmation",
            btn_send_whatsapp:"Share WhatsApp to friends",
            phone_error:"Phone must be exactly 10 digits", phone_dup:"Already registered! Check your score.",
            score_title:"Score & Leaderboard", title_score_lookup:"Check Your Score",
            score_lookup_hint:"Enter your WhatsApp number to see your points and referral count.",
            rank_heading:"Your Global Ranking", rank_description:"Refer friends to climb the leaderboard.",
            active_standing:"Standings", title_leaderboard_table:"Top Performers",
            tbl_rank:"Rank", tbl_name:"Name", tbl_city:"City", tbl_referrals:"Referrals",
            tbl_points:"Points", tbl_tags:"Tags", tbl_deliveries:"Deliveries", tbl_rating:"Rating",
            title_achievements:"Achievement Badges",
            vehicles_title:"My Vehicles", title_insurance_tracker:"Insurance & Documents",
            tbl_vehicle:"Vehicle", tbl_provider:"Insurance Provider", tbl_policy:"Policy Number", tbl_expiry:"Expiry Date", tbl_status:"Status",
            dashboard_title:"Rider Dashboard", back:"Back",
            stat_referrals:"Total Referrals", stat_rating:"Rider Rating", stat_points:"Total Points",
            quick_actions:"Quick Actions", act_add_vehicle:"Add Vehicle",
            act_edit_profile:"Edit Profile", act_leaderboard:"View Rankings",
            chart_weekly_referrals:"Weekly Referrals", chart_weekly_points:"Points Earned Trend",
            chart_cities_referral:"Referrals by City",
            profile_title:"My Profile", title_profile_info:"Basic Information", btn_save:"Save Changes",
            title_payout_details:"Bank & Payment", label_bank:"Bank Name", label_account:"Account Number",
            label_ifsc:"IFSC Code", label_upi:"UPI ID", btn_update_payment:"Update Bank Details",
            title_referral:"Referral Program", label_ref_code:"Your Referral Code & Link",
            btn_copy:"Copy", label_successful_referrals:"Referrals",
            label_milestone_progress:"Milestone Progress",
            m10:"10 Referrals → +100 pts", m25:"25 Referrals → +300 pts", m50:"50 Referrals → +500 pts + Lucky Draw",
            qr_scan_hint:"Scan QR to Register instantly", qr_offline_hint:"Share at petrol pumps & delivery hubs",
            btn_share_whatsapp:"Share via WhatsApp",
            admin_title:"Admin Dashboard", adm_riders:"Registered Users", adm_ev_riders:"EV Riders",
            adm_hot_leads:"Hot EV Leads", adm_ins_leads:"Insurance Leads",
            tab_all_riders:"All Riders", tab_ev_leads:"Hot EV Leads", tab_ins_leads:"Insurance Leads",
            tab_top_referrers:"Top Referrers", tab_city_stats:"City Stats",
            title_riders_directory:"All Riders Registry",
            tbl_vehicle_type:"Vehicle", tbl_phone:"Phone",
            modal_new_delivery:"Register New Delivery", label_pickup:"Pickup Address", label_dropoff:"Dropoff Address",
            label_delivery_type:"Delivery Type", label_fare:"Estimated Earnings (₹)",
            btn_cancel:"Cancel", btn_create:"Register Order",
            modal_add_vehicle:"Add New Vehicle", label_plate:"License Plate", label_color:"Color",
            label_make:"Manufacturer", label_model:"Model Name", btn_add:"Add Vehicle",
            btn_complete:"Complete", btn_start:"Start",
            badge_pending:"Pending", badge_completed:"Completed",
            no_vehicles:"No vehicles added yet. Click Add Vehicle.",
            status_active:"Active", status_maintenance:"Maintenance", status_expiring_soon:"Expiring Soon",
            status_unlocked:"Unlocked", status_locked:"Locked", status_offline:"Offline",
            label_you:"You", lbl_type:"Type", lbl_color:"Color", lbl_plate:"Plate", lbl_registration:"Registration",
            no_documents:"No insurance documents", no_riders_db:"No riders in DB",
            ach_speed_demon_title:"Referral Starter", ach_speed_demon_desc:"Refer your first rider",
            ach_five_star_title:"Referral Master", ach_five_star_desc:"Refer 10 riders",
            ach_century_title:"Referral Champion", ach_century_desc:"Refer 25 riders",
            ach_expert_title:"Referral King", ach_expert_desc:"Refer 50 riders",
            lang_auto_msg:"Language auto-set to English for this city",
            label_phone:"Phone Number",
            radio_password:"Password", radio_otp:"OTP", forgot_password:"Forgot Password?"
        },
        hi: {
            nav_home:"होम", nav_vehicles:"वाहन", nav_dashboard:"डैशबोर्ड", nav_score:"स्कोर", nav_profile:"प्रोफ़ाइल", nav_admin:"एडमिन",
            logout:"लॉगआउट", login:"लॉगिन", welcome_title:"अपनी डिलीवरी यात्रा को सशक्त बनाएं",
            welcome_subtitle:"हजारों राइडर्स से जुड़ें। सर्वे पूरा करें, रेफरल कोड पाएं और पॉइंट्स जीतें!",
            label_total_riders:"सक्रिय राइडर्स", label_start_points:"शुरुआती अंक", label_per_referral:"प्रति रेफरल",
            milestone_10_title:"10 रेफरल", milestone_25_title:"25 रेफरल", milestone_50_title:"50 रेफरल",
            login_title:"लॉगिन", login_alert:"demo@example.com / password उपयोग करें या नया अकाउंट बनाएं।",
            label_email:"ईमेल", label_password:"पासवर्ड", no_account:"अकाउंट नहीं है?", register_link:"यहाँ रजिस्टर करें",
            register_title:"राइडर रजिस्ट्रेशन", have_account:"पहले से अकाउंट है?", login_link:"यहाँ लॉगिन करें",
            label_fullname:"पूरा नाम", label_whatsapp:"WhatsApp नंबर", label_city:"शहर", select_city:"शहर चुनें",
            label_platform:"डिलीवरी प्लेटफ़ॉर्म", select_platform:"प्लेटफ़ॉर्म चुनें", label_exp:"अनुभव के वर्ष",
            step_profile:"प्रोफ़ाइल", step_vehicle:"वाहन", step_challenges:"चुनौतियाँ", step_insurance:"बीमा", step_ev:"EV", step_referral:"रेफरल",
            sec_a_title:"खंड A — मूल प्रोफ़ाइल", sec_b_title:"खंड B — वर्तमान वाहन",
            sec_c_title:"खंड C — चुनौतियाँ", sec_d_title:"खंड D — बीमा",
            sec_e_title:"खंड E — EV के प्रति खुलापन", sec_f_title:"खंड F — रेफरल",
            label_vehicle_type:"वाहन का प्रकार", vt_petrol:"पेट्रोल दोपहिया", vt_diesel:"डीज़ल दोपहिया",
            vt_electric:"इलेक्ट्रिक दोपहिया", vt_other:"अन्य",
            label_vehicle_model:"वाहन ब्रांड और मॉडल", label_fuel_method:"आप कैसे ईंधन/चार्ज करते हैं?",
            fm_petrol:"पेट्रोल पंप", fm_home:"घर पर चार्जिंग", fm_swap:"बैटरी स्वैप", fm_other:"अन्य",
            label_fuel_expense:"साप्ताहिक ईंधन खर्च (₹)", label_maint_expense:"मासिक रखरखाव खर्च (₹)",
            label_top_challenges:"मुख्य चुनौतियाँ (3 तक चुनें)",
            ch_fuel:"ईंधन की ऊंची लागत", ch_breakdown:"बार-बार खराबी", ch_charging:"पास में चार्जिंग स्टेशन नहीं",
            ch_range:"बैटरी रेंज की चिंता", ch_repair:"मरम्मत की लागत", ch_refuel:"लंबा ईंधन भरने का समय", ch_other:"अन्य",
            label_ev_challenges:"EV विशेष चुनौतियाँ", label_petrol_challenges:"पेट्रोल विशेष चुनौतियाँ",
            evc_drain:"बैटरी बहुत जल्दी खत्म होती है", evc_swap:"स्वैप स्टेशन बहुत दूर है",
            evc_charge:"घर पर चार्जिंग में बहुत समय", evc_power:"वाहन इतना शक्तिशाली नहीं", evc_service:"सर्विस सेंटर पास नहीं",
            pc_price:"ईंधन की कीमत बहुत ज्यादा", pc_engine:"इंजन की बार-बार समस्या", pc_pollution:"प्रदूषण जुर्माने का खतरा", pc_service:"सर्विस की उच्च लागत",
            label_accidental_ins:"क्या आपके पास दुर्घटना बीमा है?", label_health_ins:"क्या आपके पास स्वास्थ्य बीमा है?",
            label_paid_pocket:"क्या आपने कभी दुर्घटना का खर्च खुद उठाया?",
            opt_yes:"हाँ", opt_no:"नहीं", opt_not_sure:"निश्चित नहीं",
            label_open_ev:"क्या आप EV पर स्विच करने के लिए तैयार हैं?",
            ev_yes:"हाँ", ev_no:"नहीं", ev_already:"पहले से EV पर हूँ", ev_more_info:"अधिक जानकारी चाहिए",
            label_switch_triggers:"आप किस कारण स्विच करेंगे?",
            st_rental:"कम किराया लागत", st_range:"बेहतर बैटरी रेंज", st_swap:"पास में स्वैप स्टेशन",
            st_income:"आय गारंटी", st_subsidy:"नियोक्ता सब्सिडी",
            label_interests:"आप इसमें रुचि रखते हैं:",
            int_ev:"EV किराया ऑफर", int_ins:"बीमा कोटेशन", int_retrofit:"रेट्रोफिट जानकारी", int_all:"उपरोक्त सभी", int_none:"कोई नहीं",
            label_referred_by:"क्या आपको किसी राइडर ने रेफर किया?",
            label_referral_code:"जिसने आपको रेफर किया उनका कोड",
            ref_code_hint:"जिस व्यक्ति ने यह ऐप आपसे साझा किया",
            whatsapp_hint:"रजिस्ट्रेशन के बाद आपको WhatsApp पर पुष्टि मिलेगी।",
            btn_next:"अगला: वाहन जानकारी", btn_next_c:"अगला: चुनौतियाँ", btn_next_d:"अगला: बीमा",
            btn_next_e:"अगला: EV", btn_next_f:"अगला: रेफरल", btn_back:"पीछे",
            btn_submit_reg:"रजिस्ट्रेशन पूरा करें", btn_goto_dashboard:"डैशबोर्ड जाएं", btn_view_score:"स्कोर देखें",
            success_title:"रजिस्ट्रेशन सफल!", success_subtitle:"Road Warrior Pro में आपका स्वागत है। आप 10 अंकों से शुरू करते हैं!",
            share_code_hint:"यह कोड अन्य राइडर्स से शेयर करें और प्रति रेफरल 5 अंक कमाएं",
            wa_confirm_title:"WhatsApp पुष्टि",
            btn_send_whatsapp:"खुद को WhatsApp भेजें",
            phone_error:"फोन नंबर ठीक 10 अंकों का होना चाहिए", phone_dup:"पहले से रजिस्टर है!",
            score_title:"स्कोर और लीडरबोर्ड", title_score_lookup:"अपना स्कोर देखें",
            score_lookup_hint:"अपने WhatsApp नंबर से अंक और रेफरल देखें।",
            rank_heading:"आपकी वैश्विक रैंकिंग", rank_description:"दोस्तों को रेफर करें और ऊपर चढ़ें।",
            active_standing:"स्थान", title_leaderboard_table:"शीर्ष राइडर्स",
            tbl_rank:"रैंक", tbl_name:"नाम", tbl_city:"शहर", tbl_referrals:"रेफरल",
            tbl_points:"अंक", tbl_tags:"टैग", tbl_deliveries:"डिलीवरी", tbl_rating:"रेटिंग",
            title_achievements:"उपलब्धि बैज",
            vehicles_title:"मेरे वाहन", title_insurance_tracker:"बीमा और दस्तावेज",
            tbl_vehicle:"वाहन", tbl_provider:"बीमा प्रदाता", tbl_policy:"पॉलिसी नंबर", tbl_expiry:"समाप्ति तिथि", tbl_status:"स्थिति",
            dashboard_title:"राइडर डैशबोर्ड", back:"पीछे",
            stat_referrals:"कुल रेफरल", stat_rating:"राइडर रेटिंग", stat_points:"कुल अंक",
            quick_actions:"त्वरित कार्रवाई", act_add_vehicle:"वाहन जोड़ें",
            act_edit_profile:"प्रोफ़ाइल संपादित करें", act_leaderboard:"रैंकिंग देखें",
            chart_weekly_referrals:"साप्ताहिक रेफरल", chart_weekly_points:"अंक अर्जित करने की प्रवृत्ति",
            chart_cities_referral:"शहरों के अनुसार रेफरल",
            profile_title:"मेरी प्रोफ़ाइल", title_profile_info:"मूल जानकारी", btn_save:"बदलाव सहेजें",
            title_payout_details:"बैंक और भुगतान", label_bank:"बैंक का नाम", label_account:"खाता संख्या",
            label_ifsc:"IFSC कोड", label_upi:"UPI आईडी", btn_update_payment:"बैंक विवरण अपडेट करें",
            title_referral:"रेफरल कार्यक्रम", label_ref_code:"आपका रेफरल कोड और लिंक",
            btn_copy:"कॉपी", label_successful_referrals:"रेफरल",
            label_milestone_progress:"माइलस्टोन प्रगति",
            m10:"10 रेफरल → +100 अंक", m25:"25 रेफरल → +300 अंक", m50:"50 रेफरल → +500 अंक + लकी ड्रा",
            qr_scan_hint:"QR स्कैन करके तुरंत रजिस्टर करें", qr_offline_hint:"पेट्रोल पंप पर शेयर करें",
            btn_share_whatsapp:"WhatsApp पर शेयर करें",
            admin_title:"एडमिन डैशबोर्ड", adm_riders:"पंजीकृत उपयोगकर्ता", adm_ev_riders:"EV राइडर्स",
            adm_hot_leads:"हॉट EV लीड्स", adm_ins_leads:"बीमा लीड्स",
            tab_all_riders:"सभी राइडर्स", tab_ev_leads:"हॉट EV लीड्स", tab_ins_leads:"बीमा लीड्स",
            tab_top_referrers:"शीर्ष रेफरर्स", tab_city_stats:"शहर के आंकड़े",
            title_riders_directory:"राइडर्स रजिस्ट्री",
            tbl_vehicle_type:"वाहन", tbl_phone:"फ़ोन",
            modal_new_delivery:"नई डिलीवरी दर्ज करें", label_pickup:"पिकअप का पता", label_dropoff:"ड्रॉप पता",
            label_delivery_type:"डिलीवरी का प्रकार", label_fare:"अनुमानित कमाई (₹)",
            btn_cancel:"रद्द करें", btn_create:"ऑर्डर दर्ज करें",
            modal_add_vehicle:"नया वाहन जोड़ें", label_plate:"लाइसेंस प्लेट", label_color:"रंग",
            label_make:"निर्माता", label_model:"मॉडल का नाम", btn_add:"वाहन जोड़ें",
            btn_complete:"पूरा करें", btn_start:"शुरू करें",
            badge_pending:"लंबित", badge_completed:"पूर्ण",
            no_vehicles:"कोई वाहन नहीं। वाहन जोड़ें पर क्लिक करें।",
            status_active:"सक्रिय", status_maintenance:"रखरखाव", status_expiring_soon:"जल्द समाप्त",
            status_unlocked:"अनलॉक", status_locked:"लॉक", status_offline:"ऑफ़लाइन",
            label_you:"आप", lbl_type:"प्रकार", lbl_color:"रंग", lbl_plate:"प्लेट", lbl_registration:"पंजीकरण",
            no_documents:"कोई बीमा दस्तावेज़ नहीं", no_riders_db:"कोई राइडर नहीं",
            ach_speed_demon_title:"रेफरल स्टार्टर", ach_speed_demon_desc:"पहला राइडर रेफर करें",
            ach_five_star_title:"रेफरल मास्टर", ach_five_star_desc:"10 राइडर्स रेफर करें",
            ach_century_title:"रेफरल चैंपियन", ach_century_desc:"25 राइडर्स रेफर करें",
            ach_expert_title:"रेफरल किंग", ach_expert_desc:"50 राइडर्स रेफर करें",
            lang_auto_msg:"इस शहर के लिए भाषा हिंदी में बदली गई",
            label_phone:"फ़ोन नंबर"
        },
        kn: {
            nav_home:"ಮುಖಪುಟ", nav_vehicles:"ವಾಹನಗಳು", nav_dashboard:"ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", nav_score:"ಸ್ಕೋರ್", nav_profile:"ಪ್ರೊಫೈಲ್", nav_admin:"ಅಡ್ಮಿನ್",
            logout:"ಲಾಗ್ ಔಟ್", login:"ಲಾಗ್ ಇನ್", welcome_title:"ನಿಮ್ಮ ಡೆಲಿವರಿ ಪ್ರಯಾಣವನ್ನು ಸಶಕ್ತಗೊಳಿಸಿ",
            welcome_subtitle:"ಸಾವಿರಾರು ರೈಡರ್‌ಗಳೊಂದಿಗೆ ಸೇರಿ. ಸಮೀಕ್ಷೆ ಪೂರ್ಣಗೊಳಿಸಿ, ರೆಫರಲ್ ಕೋಡ್ ಪಡೆಯಿರಿ ಮತ್ತು ಅಂಕಗಳನ್ನು ಗೆಲ್ಲಿರಿ!",
            label_total_riders:"ಸಕ್ರಿಯ ರೈಡರ್ಸ್", label_start_points:"ಪ್ರಾರಂಭದ ಅಂಕಗಳು", label_per_referral:"ಪ್ರತಿ ರೆಫರಲ್",
            milestone_10_title:"10 ರೆಫರಲ್ಗಳು", milestone_25_title:"25 ರೆಫರಲ್ಗಳು", milestone_50_title:"50 ರೆಫರಲ್ಗಳು",
            login_title:"ಲಾಗ್ ಇನ್", login_alert:"demo@example.com / password ಬಳಸಿ ಅಥವಾ ಹೊಸ ಖಾತೆ ತೆರೆಯಿರಿ.",
            label_email:"ಇಮೇಲ್", label_password:"ಪಾಸ್‌ವರ್ಡ್", no_account:"ಖಾತೆ ಇಲ್ಲವೇ?", register_link:"ಇಲ್ಲಿ ನೋಂದಾಯಿಸಿ",
            register_title:"ರೈಡರ್ ನೋಂದಣಿ", have_account:"ಖಾತೆ ಇದೆಯೇ?", login_link:"ಇಲ್ಲಿ ಲಾಗ್ ಇನ್ ಆಗಿ",
            label_fullname:"ಪೂರ್ಣ ಹೆಸರು", label_whatsapp:"WhatsApp ಸಂಖ್ಯೆ", label_city:"ನಗರ", select_city:"ನಿಮ್ಮ ನಗರ ಆಯ್ಕೆಮಾಡಿ",
            label_platform:"ಡೆಲಿವರಿ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್", select_platform:"ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಆಯ್ಕೆಮಾಡಿ", label_exp:"ಅನುಭವದ ವರ್ಷಗಳು",
            step_profile:"ಪ್ರೊಫೈಲ್", step_vehicle:"ವಾಹನ", step_challenges:"ಸವಾಲುಗಳು", step_insurance:"ವಿಮೆ", step_ev:"EV", step_referral:"ರೆಫರಲ್",
            sec_a_title:"ವಿಭಾಗ A — ಮೂಲ ಪ್ರೊಫೈಲ್", sec_b_title:"ವಿಭಾಗ B — ಪ್ರಸ್ತುತ ವಾಹನ",
            sec_c_title:"ವಿಭಾಗ C — ಸವಾಲುಗಳು", sec_d_title:"ವಿಭಾಗ D — ವಿಮೆ",
            sec_e_title:"ವಿಭಾಗ E — EV ಗೆ ಬದಲಾಗುವ ಆಸಕ್ತಿ", sec_f_title:"ವಿಭಾಗ F — ರೆಫರಲ್",
            label_vehicle_type:"ವಾಹನದ ಪ್ರಕಾರ", vt_petrol:"ಪೆಟ್ರೋಲ್ ದ್ವಿಚಕ್ರ", vt_diesel:"ಡೀಸೆಲ್ ದ್ವಿಚಕ್ರ",
            vt_electric:"ವಿದ್ಯುತ್ ದ್ವಿಚಕ್ರ", vt_other:"ಇತರ",
            label_vehicle_model:"ವಾಹನ ಬ್ರ್ಯಾಂಡ್ & ಮಾದರಿ", label_fuel_method:"ನೀವು ಇಂಧನ/ಚಾರ್ಜ್ ಹೇಗೆ ಮಾಡುತ್ತೀರಿ?",
            fm_petrol:"ಪೆಟ್ರೋಲ್ ಪಂಪ್", fm_home:"ಮನೆ ಚಾರ್ಜಿಂಗ್", fm_swap:"ಬ್ಯಾಟರಿ ಸ್ವ್ಯಾಪ್", fm_other:"ಇತರ",
            label_fuel_expense:"ವಾರದ ಇಂಧನ ಖರ್ಚು (₹)", label_maint_expense:"ತಿಂಗಳ ನಿರ್ವಹಣೆ ಖರ್ಚು (₹)",
            label_top_challenges:"ಮುಖ್ಯ ಸವಾಲುಗಳು (3 ವರೆಗೆ ಆಯ್ಕೆ ಮಾಡಿ)",
            ch_fuel:"ಅಧಿಕ ಇಂಧನ ವೆಚ್ಚ", ch_breakdown:"ಪದೇ ಪದೇ ಹಾಳಾಗುವುದು", ch_charging:"ಹತ್ತಿರದಲ್ಲಿ ಚಾರ್ಜಿಂಗ್ ಸ್ಟೇಶನ್ ಇಲ್ಲ",
            ch_range:"ಬ್ಯಾಟರಿ ರೇಂಜ್ ಆತಂಕ", ch_repair:"ದುರಸ್ತಿ ವೆಚ್ಚ", ch_refuel:"ದೀರ್ಘ ಇಂಧನ ತುಂಬಿಸುವ ಸಮಯ", ch_other:"ಇತರ",
            label_ev_challenges:"EV ನಿರ್ದಿಷ್ಟ ಸವಾಲುಗಳು", label_petrol_challenges:"ಪೆಟ್ರೋಲ್ ನಿರ್ದಿಷ್ಟ ಸವಾಲುಗಳು",
            evc_drain:"ಬ್ಯಾಟರಿ ತುಂಬಾ ಬೇಗ ಖಾಲಿ ಆಗುತ್ತದೆ", evc_swap:"ಸ್ವ್ಯಾಪಿಂಗ್ ಸ್ಟೇಶನ್ ತುಂಬಾ ದೂರ",
            evc_charge:"ಮನೆ ಚಾರ್ಜಿಂಗ್‌ಗೆ ಹೆಚ್ಚು ಸಮಯ", evc_power:"ವಾಹನ ಸಾಕಷ್ಟು ಶಕ್ತಿಶಾಲಿ ಅಲ್ಲ", evc_service:"ಸರ್ವಿಸ್ ಸೆಂಟರ್ ಹತ್ತಿರ ಇಲ್ಲ",
            pc_price:"ಇಂಧನ ಬೆಲೆ ತುಂಬಾ ಅಧಿಕ", pc_engine:"ಪದೇ ಪದೇ ಇಂಜಿನ್ ಸಮಸ್ಯೆ", pc_pollution:"ಮಾಲಿನ್ಯ ದಂಡದ ಅಪಾಯ", pc_service:"ಅಧಿಕ ಸರ್ವಿಸಿಂಗ್ ವೆಚ್ಚ",
            label_accidental_ins:"ನಿಮಗೆ ಅಪಘಾತ ವಿಮೆ ಇದೆಯೇ?", label_health_ins:"ನಿಮಗೆ ಆರೋಗ್ಯ ವಿಮೆ ಇದೆಯೇ?",
            label_paid_pocket:"ನೀವು ಎಂದಾದರೂ ಅಪಘಾತಕ್ಕಾಗಿ ಹಣ ಕಟ್ಟಿದ್ದೀರಾ?",
            opt_yes:"ಹೌದು", opt_no:"ಇಲ್ಲ", opt_not_sure:"ಖಚಿತ ಇಲ್ಲ",
            label_open_ev:"ನೀವು EV ಗೆ ಬದಲಾಗಲು ತಯಾರಿದ್ದೀರಾ?",
            ev_yes:"ಹೌದು", ev_no:"ಇಲ್ಲ", ev_already:"ಈಗಾಗಲೇ EV ಮೇಲೆ ಇದ್ದೇನೆ", ev_more_info:"ಹೆಚ್ಚಿನ ಮಾಹಿತಿ ಬೇಕು",
            label_switch_triggers:"ಯಾವ ಕಾರಣಕ್ಕೆ ಬದಲಾಗುತ್ತೀರಿ?",
            st_rental:"ಕಡಿಮೆ ಬಾಡಿಗೆ ವೆಚ್ಚ", st_range:"ಉತ್ತಮ ಬ್ಯಾಟರಿ ರೇಂಜ್", st_swap:"ಹತ್ತಿರ ಸ್ವ್ಯಾಪ್ ಸ್ಟೇಶನ್",
            st_income:"ಆದಾಯ ಖಾತ್ರಿ", st_subsidy:"ಉದ್ಯೋಗದಾತ ಸಬ್ಸಿಡಿ",
            label_interests:"ನಿಮಗೆ ಆಸಕ್ತಿ ಇದೆಯೇ:",
            int_ev:"EV ಬಾಡಿಗೆ ಆಫರ್", int_ins:"ವಿಮೆ ಕೋಟ್", int_retrofit:"ರೆಟ್ರೋಫಿಟ್ ಮಾಹಿತಿ", int_all:"ಮೇಲಿನ ಎಲ್ಲಾ", int_none:"ಯಾವುದೂ ಇಲ್ಲ",
            label_referred_by:"ಯಾರಾದರೂ ರೈಡರ್ ನಿಮ್ಮನ್ನು ರೆಫರ್ ಮಾಡಿದರಾ?",
            label_referral_code:"ನಿಮ್ಮನ್ನು ರೆಫರ್ ಮಾಡಿದ ವ್ಯಕ್ತಿಯ ಕೋಡ್",
            ref_code_hint:"ಈ ಅಪ್ಲಿಕೇಶನ್ ಅನ್ನು ನಿಮ್ಮೊಂದಿಗೆ ಹಂಚಿದ ವ್ಯಕ್ತಿ",
            whatsapp_hint:"ನೋಂದಣಿ ನಂತರ WhatsApp ದೃಢೀಕರಣ ಸಂದೇಶ ಬರುತ್ತದೆ.",
            btn_next:"ಮುಂದೆ: ವಾಹನ ಮಾಹಿತಿ", btn_next_c:"ಮುಂದೆ: ಸವಾಲುಗಳು", btn_next_d:"ಮುಂದೆ: ವಿಮೆ",
            btn_next_e:"ಮುಂದೆ: EV", btn_next_f:"ಮುಂದೆ: ರೆಫರಲ್", btn_back:"ಹಿಂದೆ",
            btn_submit_reg:"ನೋಂದಣಿ ಪೂರ್ಣಗೊಳಿಸಿ", btn_goto_dashboard:"ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹೋಗಿ", btn_view_score:"ಸ್ಕೋರ್ ನೋಡಿ",
            success_title:"ನೋಂದಣಿ ಯಶಸ್ವಿ!", success_subtitle:"Road Warrior Pro ಗೆ ಸ್ವಾಗತ. ನೀವು 10 ಅಂಕಗಳಿಂದ ಪ್ರಾರಂಭಿಸುತ್ತೀರಿ!",
            share_code_hint:"ಇತರ ರೈಡರ್‌ಗಳಿಗೆ ಈ ಕೋಡ್ ಹಂಚಿ ಮತ್ತು ಪ್ರತಿ ರೆಫರಲ್‌ಗೆ 5 ಅಂಕ ಗಳಿಸಿ",
            wa_confirm_title:"WhatsApp ದೃಢೀಕರಣ",
            btn_send_whatsapp:"ನಿಮಗೆ WhatsApp ಕಳುಹಿಸಿ",
            phone_error:"ಫೋನ್ ಸಂಖ್ಯೆ ನಿಖರವಾಗಿ 10 ಅಂಕಿಗಳಿರಬೇಕು", phone_dup:"ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಲಾಗಿದೆ!",
            score_title:"ಸ್ಕೋರ್ ಮತ್ತು ಲೀಡರ್‌ಬೋರ್ಡ್", title_score_lookup:"ನಿಮ್ಮ ಸ್ಕೋರ್ ಪರಿಶೀಲಿಸಿ",
            score_lookup_hint:"ಅಂಕ ಮತ್ತು ರೆಫರಲ್ ನೋಡಲು WhatsApp ಸಂಖ್ಯೆ ನಮೂದಿಸಿ.",
            rank_heading:"ನಿಮ್ಮ ಜಾಗತಿಕ ಶ್ರೇಯಾಂಕ", rank_description:"ಸ್ನೇಹಿತರನ್ನು ರೆಫರ್ ಮಾಡಿ ಮೇಲೇರಿ.",
            active_standing:"ಸ್ಥಾನ", title_leaderboard_table:"ಉನ್ನತ ರೈಡರ್ಸ್",
            tbl_rank:"ಶ್ರೇಣಿ", tbl_name:"ಹೆಸರು", tbl_city:"ನಗರ", tbl_referrals:"ರೆಫರಲ್ಗಳು",
            tbl_points:"ಅಂಕಗಳು", tbl_tags:"ಟ್ಯಾಗ್‌ಗಳು", tbl_deliveries:"ಡೆಲಿವರಿಗಳು", tbl_rating:"ರೇಟಿಂಗ್",
            title_achievements:"ಸಾಧನೆ ಬ್ಯಾಡ್ಜ್‌ಗಳು",
            vehicles_title:"ನನ್ನ ವಾಹನಗಳು", title_insurance_tracker:"ವಿಮೆ ಮತ್ತು ದಾಖಲೆಗಳು",
            tbl_vehicle:"ವಾಹನ", tbl_provider:"ವಿಮೆ ನೀಡುವವರು", tbl_policy:"ಪಾಲಿಸಿ ಸಂಖ್ಯೆ", tbl_expiry:"ಮುಕ್ತಾಯ ದಿನ", tbl_status:"ಸ್ಥಿತಿ",
            dashboard_title:"ರೈಡರ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", back:"ಹಿಂದೆ",
            quick_actions:"ತ್ವರಿತ ಕ್ರಿಯೆಗಳು", act_add_vehicle:"ವಾಹನ ಸೇರಿಸಿ",
            act_edit_profile:"ಪ್ರೊಫೈಲ್ ಸಂಪಾದಿಸಿ", act_leaderboard:"ಶ್ರೇಯಾಂಕ ನೋಡಿ",
            chart_weekly_referrals:"ವಾರದ ರೆಫರಲ್ಗಳು", chart_weekly_points:"ಗಳಿಸಿದ ಅಂಕಗಳು",
            chart_cities_referral:"ನಗರಗಳ ಪ್ರಕಾರ ರೆಫರಲ್ಗಳು",
            profile_title:"ನನ್ನ ಪ್ರೊಫೈಲ್", title_profile_info:"ಮೂಲ ಮಾಹಿತಿ", btn_save:"ಬದಲಾವಣೆ ಉಳಿಸಿ",
            title_payout_details:"ಬ್ಯಾಂಕ್ ಮತ್ತು ಪಾವತಿ", label_bank:"ಬ್ಯಾಂಕ್ ಹೆಸರು", label_account:"ಖಾತೆ ಸಂಖ್ಯೆ",
            label_ifsc:"IFSC ಕೋಡ್", label_upi:"UPI ಐಡಿ", btn_update_payment:"ಬ್ಯಾಂಕ್ ವಿವರ ಅಪ್‌ಡೇಟ್ ಮಾಡಿ",
            title_referral:"ರೆಫರಲ್ ಪ್ರೋಗ್ರಾಂ", label_ref_code:"ನಿಮ್ಮ ರೆಫರಲ್ ಕೋಡ್ ಮತ್ತು ಲಿಂಕ್",
            btn_copy:"ನಕಲಿಸಿ", label_successful_referrals:"ರೆಫರಲ್ಗಳು",
            label_milestone_progress:"ಮೈಲ್‌ಸ್ಟೋನ್ ಪ್ರಗತಿ",
            m10:"10 ರೆಫರಲ್ → +100 ಅಂಕ", m25:"25 ರೆಫರಲ್ → +300 ಅಂಕ", m50:"50 ರೆಫರಲ್ → +500 ಅಂಕ + ಲಕಿ ಡ್ರಾ",
            qr_scan_hint:"QR ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ತಕ್ಷಣ ನೋಂದಣಿ ಮಾಡಿ", qr_offline_hint:"ಪೆಟ್ರೋಲ್ ಪಂಪ್‌ನಲ್ಲಿ ಹಂಚಿಕೊಳ್ಳಿ",
            btn_share_whatsapp:"WhatsApp ನಲ್ಲಿ ಹಂಚಿ",
            admin_title:"ಅಡ್ಮಿನ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", adm_riders:"ನೋಂದಾಯಿತ ಬಳಕೆದಾರರು", adm_ev_riders:"EV ರೈಡರ್ಸ್",
            adm_hot_leads:"ಹಾಟ್ EV ಲೀಡ್ಸ್", adm_ins_leads:"ವಿಮೆ ಲೀಡ್ಸ್",
            tab_all_riders:"ಎಲ್ಲ ರೈಡರ್ಸ್", tab_ev_leads:"ಹಾಟ್ EV ಲೀಡ್ಸ್", tab_ins_leads:"ವಿಮೆ ಲೀಡ್ಸ್",
            tab_top_referrers:"ಉನ್ನತ ರೆಫರ್ರ್ಸ್", tab_city_stats:"ನಗರ ಅಂಕಿಅಂಶ",
            title_riders_directory:"ರೈಡರ್ಸ್ ನೋಂದಣಿ",
            tbl_vehicle_type:"ವಾಹನ", tbl_phone:"ಫೋನ್",
            modal_new_delivery:"ಹೊಸ ಡೆಲಿವರಿ ನೋಂದಣಿ", label_pickup:"ಪಿಕ್ ಅಪ್ ವಿಳಾಸ", label_dropoff:"ಡ್ರಾಪ್ ವಿಳಾಸ",
            label_delivery_type:"ಡೆಲಿವರಿ ವಿಧ", label_fare:"ಅಂದಾಜು ಗಳಿಕೆ (₹)",
            btn_cancel:"ರದ್ದು", btn_create:"ಆದೇಶ ನೋಂದಿಸಿ",
            modal_add_vehicle:"ಹೊಸ ವಾಹನ ಸೇರಿಸಿ", label_plate:"ಲೈಸೆನ್ಸ್ ಪ್ಲೇಟ್", label_color:"ಬಣ್ಣ",
            label_make:"ತಯಾರಕ", label_model:"ಮಾದರಿ ಹೆಸರು", btn_add:"ವಾಹನ ಸೇರಿಸಿ",
            btn_complete:"ಪೂರ್ಣಗೊಳಿಸಿ", btn_start:"ಪ್ರಾರಂಭಿಸಿ",
            badge_pending:"ಬಾಕಿ ಇದೆ", badge_completed:"ಪೂರ್ಣ",
            no_vehicles:"ವಾಹನ ಇಲ್ಲ. ವಾಹನ ಸೇರಿಸಿ ಕ್ಲಿಕ್ ಮಾಡಿ.",
            status_active:"ಸಕ್ರಿಯ", status_maintenance:"ನಿರ್ವಹಣೆ", status_expiring_soon:"ಶೀಘ್ರ ಅವಧಿ ಮೀರುತ್ತದೆ",
            status_unlocked:"ಅನ್ಲಾಕ್", status_locked:"ಲಾಕ್", status_offline:"ಆಫ್‌ಲೈನ್",
            label_you:"ನೀವು", lbl_type:"ವಿಧ", lbl_color:"ಬಣ್ಣ", lbl_plate:"ಪ್ಲೇಟ್", lbl_registration:"ನೋಂದಣಿ",
            no_documents:"ವಿಮೆ ದಾಖಲೆ ಇಲ್ಲ", no_riders_db:"ರೈಡರ್ಸ್ ಇಲ್ಲ",
            ach_speed_demon_title:"ರೆಫರಲ್ ಸ್ಟಾರ್ಟರ್", ach_speed_demon_desc:"ಮೊದಲ ರೈಡರ್ ರೆಫರ್ ಮಾಡಿ",
            ach_five_star_title:"ರೆಫರಲ್ ಮಾಸ್ಟರ್", ach_five_star_desc:"10 ರೈಡರ್ಸ್ ರೆಫರ್ ಮಾಡಿ",
            ach_century_title:"ರೆಫರಲ್ ಚಾಂಪಿಯನ್", ach_century_desc:"25 ರೈಡರ್ಸ್ ರೆಫರ್ ಮಾಡಿ",
            ach_expert_title:"ರೆಫರಲ್ ಕಿಂಗ್", ach_expert_desc:"50 ರೈಡರ್ಸ್ ರೆಫರ್ ಮಾಡಿ",
            lang_auto_msg:"ಈ ನಗರಕ್ಕಾಗಿ ಭಾಷೆ ಕನ್ನಡಕ್ಕೆ ಬದಲಾಗಿದೆ",
            label_phone:"ಫೋನ್ ಸಂಖ್ಯೆ",
            radio_password:"ಪಾಸ್‌ವರ್ಡ್", radio_otp:"ಓಟಿಪಿ", forgot_password:"ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿದ್ದೀರಾ?"
        }
    };

    // ===== APP STATE =====
    let currentUser = null;
    let allAdminRiders = [];
    let isLoggedIn = false;
    let activeCharts = {};
    let currentRegStep = 1;
    let registeredRiderId = null;
    let adminChartsLoaded = false;

    // ===== INIT =====
    // Initialize
    document.addEventListener('DOMContentLoaded', initApp);

    // ==================== NEW FEATURES ====================
    window.simulateWhatsAppLogin = async function() {
        const phone = prompt("Enter your WhatsApp phone number to login:");
        if (!phone) return; // User cancelled

        showToast('Simulating WhatsApp Login...', 'info');
        try {
            const res = await fetch('/auth/login', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ phone, loginMethod: 'whatsapp' }) 
            });
            const result = await res.json();
            
            if (result.success) {
                localStorage.setItem('riderId', result.riderId);
                localStorage.setItem('sessionId', result.sessionId);
                fetchRiderProfile(result.riderId);
                
                showToast('Logged in successfully via WhatsApp!', 'success');
                
                const authSection = document.getElementById('authSection');
                if (authSection) authSection.style.display = 'none';
                const dashSection = document.getElementById('dashboardSection');
                if (dashSection) dashSection.style.display = 'block';
                
            } else {
                showToast(result.error || 'User not found. Please register first.', 'error');
            }
        } catch (e) {
            showToast('Login error: ' + e.message, 'error');
        }
    };

    window.requestPushNotifications = function() {
        if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    showToast('Push notifications enabled!', 'success');
                    if ('serviceWorker' in navigator) {
                        navigator.serviceWorker.ready.then(registration => {
                            registration.showNotification('Welcome to Road Warrior!', {
                                body: 'You will now receive updates on your ranking and rewards.',
                                icon: '/og-image.png'
                            });
                        });
                    }
                } else {
                    showToast('Push notifications denied.', 'warning');
                }
            });
        } else {
            showToast('Push notifications not supported in this browser.', 'warning');
        }
    };

    window.showReferralQR = function() {
        if (!currentUser) return;
        document.getElementById('qrReferralCodeText').innerText = currentUser.referralCode;
        const qrContainer = document.getElementById('qrcode');
        qrContainer.innerHTML = '';
        if (typeof QRCode !== 'undefined') {
            new QRCode(qrContainer, {
                text: "https://roadwarrior.pro/?ref=" + currentUser.referralCode,
                width: 200,
                height: 200,
                colorDark: "#000000",
                colorLight: "#ffffff"
            });
        } else {
            qrContainer.innerText = "Please include qrcode.js in your index.html head to use this feature.";
        }
        openModal('qrModal');
    };

    window.shareReferralWhatsApp = async function() {
        if (!currentUser) return;
        
        const qrContainer = document.getElementById('qrcode');
        const canvas = qrContainer.querySelector('canvas');
        const img = qrContainer.querySelector('img');
        
        let dataUrl = '';
        if (canvas) {
            // Draw onto a new canvas with a white background to avoid transparency issues (black bg in some apps)
            const newCanvas = document.createElement('canvas');
            // Add padding so it looks like a nice square card
            const padding = 20;
            newCanvas.width = canvas.width + (padding * 2);
            newCanvas.height = canvas.height + (padding * 2);
            const ctx = newCanvas.getContext('2d');
            
            // Fill white background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);
            
            // Draw original QR code centered
            ctx.drawImage(canvas, padding, padding);
            
            // Convert to JPEG to drop any potential alpha channel issues entirely
            dataUrl = newCanvas.toDataURL('image/jpeg', 1.0);
        } else if (img && img.src) {
            dataUrl = img.src;
        }
        
        if (!dataUrl) {
            showToast('QR Code not ready yet.', 'error');
            return;
        }

        try {
            const arr = dataUrl.split(',');
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while(n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            const blob = new Blob([u8arr], {type: mime});
            const file = new File([blob], 'referral-qr.jpg', { type: 'image/jpeg' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                // Share ONLY the file, without text or url, as requested by user
                await navigator.share({
                    files: [file]
                });
            } else {
                // Fallback if sharing files is not supported
                const a = document.createElement('a');
                a.href = dataUrl;
                a.download = 'roadwarrior-qr.jpg';
                a.click();
                showToast('Image downloaded! You can now send it on WhatsApp.', 'info');
            }
        } catch (err) {
            console.error('Error sharing:', err);
            if (err.name !== 'AbortError') {
                showToast('Sharing failed, downloading image instead...', 'info');
                const a = document.createElement('a');
                a.href = dataUrl;
                a.download = 'roadwarrior-qr.jpg';
                a.click();
            }
        }
    };

    window.completeMission = function(btn, points) {
        if (!currentUser) return;
        currentUser.totalPoints += points;
        updateUserInStorage(currentUser);
        btn.innerText = 'Claimed!';
        btn.disabled = true;
        btn.style.background = 'var(--success-color)';
        btn.style.borderColor = 'var(--success-color)';
        btn.style.color = 'white';
        const balElem = document.getElementById('rewardsPointsBalance');
        if(balElem) balElem.innerText = currentUser.totalPoints;
        showToast(`Mission complete! You earned ${points} points.`, 'success');
        if (typeof renderLeaderboard === 'function') renderLeaderboard();
        if (typeof updateUIForUser === 'function') updateUIForUser();
    };

    window.redeemReward = function(cost, item) {
        if (!currentUser) return;
        if (currentUser.totalPoints < cost) {
            showToast('Not enough points to redeem this item.', 'warning');
            return;
        }
        currentUser.totalPoints -= cost;
        updateUserInStorage(currentUser);
        const balElem = document.getElementById('rewardsPointsBalance');
        if(balElem) balElem.innerText = currentUser.totalPoints;
        showToast(`Successfully redeemed: ${item}!`, 'success');
        if (typeof renderLeaderboard === 'function') renderLeaderboard();
        if (typeof updateUIForUser === 'function') updateUIForUser();
    };

    let evMapInitialized = false;
    window.initEVMap = function() {
        if (evMapInitialized) return;
        if (typeof L === 'undefined') {
            setTimeout(window.initEVMap, 500);
            return;
        }
        evMapInitialized = true;
        
        const map = L.map('evMap').setView([12.9716, 77.5946], 12);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map);
        
        const stations = [
            { lat: 12.9716, lng: 77.5946, name: "City Center Fast Charge" },
            { lat: 12.9616, lng: 77.5846, name: "South Block Swap Station" },
            { lat: 12.9816, lng: 77.6046, name: "Indiranagar EV Hub" },
            { lat: 12.9516, lng: 77.6146, name: "Koramangala Supercharger" }
        ];
        
        stations.forEach(station => {
            L.marker([station.lat, station.lng]).addTo(map)
                .bindPopup(`<b>${station.name}</b><br>Available slots: ${Math.floor(Math.random() * 5) + 1}`);
        });
        
        // Fix map rendering issue when inside modal
        setTimeout(() => map.invalidateSize(), 200);
    };

    function updateUserInStorage(user) {
        let riders = JSON.parse(localStorage.getItem('roadwarrior_riders') || '[]');
        const idx = riders.findIndex(r => r.id === user.id);
        if (idx !== -1) {
            riders[idx] = user;
            localStorage.setItem('roadwarrior_riders', JSON.stringify(riders));
        }
        localStorage.setItem('roadwarrior_current_user', JSON.stringify(user));
    }

    function initApp() {
        // Initialize tracking and cookie consent immediately
        initVisitorTracking();
        initConsentBanner();
        
        // Check for referral code — from URL or previously stored in localStorage
        let refCode = new URLSearchParams(window.location.search).get('ref');
        if (!refCode) {
            try { refCode = localStorage.getItem('pendingReferralCode'); } catch (e) {}
        }
        if (refCode) {
            try { localStorage.setItem('pendingReferralCode', refCode); } catch (e) {}
            // Pre-fill hidden referral code input (used on submit)
            const el = document.getElementById('regReferralCode');
            if (el) el.value = refCode.toUpperCase();
            // Hide the "Were you referred?" question — already auto-applied
            const questionBlock = document.getElementById('referralQuestionBlock');
            if (questionBlock) questionBlock.style.display = 'none';
            // Show the applied badge
            const badge = document.getElementById('referralAppliedBadge');
            const badgeCode = document.getElementById('appliedReferralCodeText');
            if (badge) { badge.style.display = 'flex'; }
            if (badgeCode) badgeCode.textContent = refCode.toUpperCase();
            
            // Automatically switch to registration view for referred users
            const login = document.getElementById('loginCard');
            const reg = document.getElementById('registerCard');
            if (login && reg) {
                login.style.display = 'none';
                reg.style.display = 'block';
            }
        }

        let savedLang = 'en';
        try { savedLang = localStorage.getItem('selectedLang') || 'en'; } catch (e) {}
        document.getElementById('langSelector').value = savedLang;
        changeLanguage(savedLang);

        loadSession();
        // Global event listener for Contact tracking (WhatsApp & Phone)
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            if (!link) return;
            
            const href = link.getAttribute('href') || '';
            if (href.startsWith('tel:')) {
                trackEvent('generate_lead', { type: 'phone_call' });
            } else if (href.includes('wa.me/')) {
                trackEvent('generate_lead', { type: 'whatsapp_chat' });
            }
        });

        window.addEventListener('popstate', handlePopState);
        updateAuthNavbarState();
        routeSPA(window.location.pathname);
    }

    // ===== LANGUAGE =====
    function changeLanguage(lang) {
        localStorage.setItem('selectedLang', lang);
        const selector = document.getElementById('langSelector');
        if (selector) selector.value = lang;
        
        // 1. Trigger Google Translate Widget for dynamic content
        // Set cookies to ensure it persists across reloads and is active
        document.cookie = `googtrans=/en/${lang}; path=/`;
        document.cookie = `googtrans=/en/${lang}; domain=${window.location.hostname}; path=/`;
        
        // Trigger the Google Translate dropdown with graceful retries (no reload to prevent infinite loops)
        let retries = 0;
        const tryTriggerGoogleTranslate = () => {
            const googleSelect = document.querySelector('select.goog-te-combo');
            if (googleSelect) {
                googleSelect.value = lang;
                googleSelect.dispatchEvent(new Event('change'));
            } else if (retries < 10) {
                retries++;
                setTimeout(tryTriggerGoogleTranslate, 300);
            }
        };
        tryTriggerGoogleTranslate();

        // 2. Fallback: Also run the static translation for data-i18n elements
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
                const icon = el.querySelector('i');
                if (icon) {
                    const iconClone = icon.cloneNode(true);
                    el.innerHTML = '';
                    el.appendChild(iconClone);
                    el.appendChild(document.createTextNode(' ' + TRANSLATIONS[lang][key]));
                } else {
                    el.textContent = TRANSLATIONS[lang][key];
                }
            }
        });
        updateAuthNavbarState();
        if (isLoggedIn) refreshActiveView();
    }

    function handleOtherDropdown(selectElem, otherInputId) {
        const input = document.getElementById(otherInputId);
        if (input) {
            if (selectElem.value === 'Other') {
                input.style.display = 'block';
                input.required = true;
                setTimeout(() => input.focus(), 50);
            } else {
                input.style.display = 'none';
                input.required = false;
                input.value = '';
            }
        }
    }

    // ===== THEME TOGGLE (BACKGROUND) =====
    const THEMES = [
        'default', 'pink-teal', 'orange-yellow', 'fuchsia-grey', 
        'green-red', 'cream-black', 'black-white', 'dark-pink',
        'blue-mint', 'red-black', 'green-tangerine', 'neon-trio',
        'yellow-green', 'sky-blue', 'lime-white', 'beige-grey', 'pastel-purple'
    ];
    let currentThemeIndex = 0;
    
    function cycleTheme() {
        currentThemeIndex = (currentThemeIndex + 1) % THEMES.length;
        setTheme(THEMES[currentThemeIndex]);
    }

    function setTheme(newTheme) {
        if (!THEMES.includes(newTheme)) return;
        currentThemeIndex = THEMES.indexOf(newTheme);
        
        if (newTheme === 'default') {
            document.body.removeAttribute('data-theme');
        } else {
            document.body.setAttribute('data-theme', newTheme);
        }
        localStorage.setItem('roadwarrior_theme', newTheme);
        
        const selector = document.getElementById('themeSelector');
        if (selector) selector.value = newTheme;
    }

    // Apply saved theme on load
    window.addEventListener('DOMContentLoaded', () => {
        let savedTheme = localStorage.getItem('roadwarrior_theme');
        
        if (!savedTheme || !THEMES.includes(savedTheme)) {
            savedTheme = 'default'; // Set default as the default
        }
        
        currentThemeIndex = THEMES.indexOf(savedTheme);
        if (savedTheme !== 'default') {
            document.body.setAttribute('data-theme', savedTheme);
        }
        const selector = document.getElementById('themeSelector');
        if (selector) selector.value = savedTheme;
        const icon = document.querySelector('#themeToggleBtn i');
        if (icon) {
            if (savedTheme === 'cream-black' || savedTheme === 'black-white') icon.className = 'fas fa-adjust';
            else icon.className = 'fas fa-palette';
        }
    });

    // ===== LOCATION DATA =====
    const LOCATION_DATA = {
        "Karnataka": {
            "Bangalore": ["560001", "560034", "560038"],
            "Mysore": ["570001", "570008"]
        },
        "Maharashtra": {
            "Mumbai": ["400001", "400053"],
            "Pune": ["411001", "411038"]
        },
        "Delhi": {
            "Delhi": ["110001", "110020"]
        },
        "Tamil Nadu": {
            "Chennai": ["600001", "600028"]
        },
        "West Bengal": {
            "Kolkata": ["700001", "700016"]
        }
    };

    function onRegStateChange() {
        const stateSelect = document.getElementById('regState');
        const citySelect = document.getElementById('regCity');
        const pinSelect = document.getElementById('regPincode');
        
        const state = stateSelect.value;
        citySelect.innerHTML = '<option value="">Select your city</option>';
        pinSelect.innerHTML = '<option value="">Select pincode</option>';
        pinSelect.disabled = true;
        
        if (state && LOCATION_DATA[state]) {
            Object.keys(LOCATION_DATA[state]).forEach(city => {
                citySelect.innerHTML += `<option value="${city}">${city}</option>`;
            });
            citySelect.innerHTML += '<option value="Other">Other</option>';
            citySelect.disabled = false;
        } else if (state === 'Other') {
            citySelect.innerHTML += '<option value="Other">Other</option>';
            citySelect.disabled = false;
        } else {
            citySelect.disabled = true;
        }
        
        handleOtherDropdown(stateSelect, 'regStateOther');
    }

    function onRegCityChange() {
        const citySelect = document.getElementById('regCity');
        handleOtherDropdown(citySelect, 'regCityOther');
    }

    // ===== ROUTING & NAVIGATION =====
    function handleNavLinkClick(event, path) { event.preventDefault(); navigateTo(path); }
    function navigateTo(path) { if (window.location.pathname !== path) history.pushState(null, '', path); routeSPA(path); }
    function handlePopState() { routeSPA(window.location.pathname); }

    function routeSPA(path) {
        const siteFooter = document.getElementById('site-footer');
        if (siteFooter) siteFooter.style.display = 'block';

        let activeTab = 'home';
        if (path === '/vehicles') activeTab = 'vehicles';
        else if (path === '/dashboard') activeTab = 'dashboard';
        else if (path === '/score') activeTab = 'score';
        else if (path === '/profile') activeTab = 'profile';
        else if (path === '/admin') activeTab = 'admin';
        else if (path === '/privacy') activeTab = 'privacy';

        const fullUrl = window.location.origin + path;
        const canTag = document.querySelector('link[rel="canonical"]');
        if (canTag) canTag.href = fullUrl;
        const ogUrl = document.querySelector('meta[property="og:url"]');
        if (ogUrl) ogUrl.content = fullUrl;

        let titleStr = "Road Warrior EV - Rider Registration & Management";
        if (activeTab === 'dashboard') titleStr = "Dashboard - Road Warrior EV";
        else if (activeTab === 'score') titleStr = "Leaderboard - Road Warrior EV";
        else if (activeTab === 'privacy') titleStr = "Privacy Policy - Road Warrior EV";
        document.title = titleStr;
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.content = titleStr;

        // Score page is public — no login check
        if (activeTab === 'admin' && !(sessionStorage.getItem('adminToken') || sessionStorage.getItem('adminJwt'))) {
            activeTab = 'admin-login';
            checkAdminExists();
        } else if (activeTab !== 'home' && activeTab !== 'score' && activeTab !== 'admin-login' && activeTab !== 'admin' && activeTab !== 'privacy' && !isLoggedIn) {
            showToast('Please login or register first.', 'warning');
            navigateTo('/home'); return;
        }

        document.querySelectorAll('.section-view').forEach(v => v.classList.remove('active'));
        const av = document.getElementById(`${activeTab}-view`);
        if (av) av.classList.add('active');

        document.querySelectorAll('.navbar-nav .nav-link').forEach(l => l.classList.remove('active'));
        const al = document.getElementById(`nav${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`);
        if (al) al.classList.add('active');
        else if (activeTab === 'home') { const fl = document.getElementById('navHome'); if (fl) fl.classList.add('active'); }

        if (activeTab === 'dashboard') loadDashboardData();
        else if (activeTab === 'vehicles') loadVehiclesData();
        else if (activeTab === 'score') loadLeaderboardData();
        else if (activeTab === 'profile') loadProfileData();
        else if (activeTab === 'admin') loadAdminData();
        else if (activeTab === 'home') loadLeaderboardData(); // Load leaderboard data for the homepage slider
        
        // Header and Footer visibility logic
        const reg = document.getElementById('registerCard');
        const isRegOpen = (reg && reg.style.display !== 'none' && activeTab === 'home');
        
        if (siteFooter) {
            siteFooter.style.display = (activeTab === 'home' && !isRegOpen) ? 'block' : 'none';
        }
        
        const navbar = document.querySelector('nav.navbar');
        if (navbar) {
            navbar.style.display = isRegOpen ? 'none' : '';
        }
    }

    function refreshActiveView() {
        const path = window.location.pathname;
        let tab = 'home';
        if (path === '/vehicles') tab = 'vehicles';
        else if (path === '/dashboard') tab = 'dashboard';
        else if (path === '/score') tab = 'score';
        else if (path === '/profile') tab = 'profile';
        else if (path === '/admin') tab = 'admin';
        else if (path === '/privacy') tab = 'privacy';
        if (tab === 'dashboard') loadDashboardData();
        else if (tab === 'vehicles') loadVehiclesData();
        else if (tab === 'score') loadLeaderboardData();
        else if (tab === 'profile') loadProfileData();
        else if (tab === 'admin') loadAdminData();
    }

    // ===== SESSION =====
    function loadSession() {
        const riderId = localStorage.getItem('riderId');
        if (riderId) fetchRiderProfile(riderId);
    }

    function fetchRiderProfile(riderId) {
        fetch(`/api/riders/${riderId}`).then(r => r.json()).then(result => {
            if (result.success) {
                currentUser = result.data; isLoggedIn = true;
                updateAuthNavbarState();
                if (['/', '/home', '/login', '/register'].includes(window.location.pathname)) navigateTo('/dashboard');
            } else {
                if (result.error === 'Rider not found') logoutUser();
                else showToast(`Session verification error: ${result.error}`, 'warning');
            }
        }).catch(err => {
            console.error('Session load error:', err);
            showToast('Warning: Offline or server unreachable.', 'warning');
        });
    }

    function updateAuthNavbarState() {
        const btn = document.getElementById('loginLogoutBtn');
        const lang = localStorage.getItem('selectedLang') || 'en';
        
        const navScore = document.getElementById('navScore');
        const navDashboard = document.getElementById('navDashboard');
        const navProfile = document.getElementById('navProfile');

        if (isLoggedIn) {
            btn.innerHTML = `<i class="fas fa-sign-out-alt"></i> <span>${TRANSLATIONS[lang].logout}</span>`;
            btn.classList.replace('btn-primary', 'btn-secondary');
            
            if (navScore) navScore.parentElement.style.display = '';
            if (navDashboard) navDashboard.parentElement.style.display = '';
            if (navProfile) navProfile.parentElement.style.display = '';
        } else {
            btn.innerHTML = `<i class="fas fa-sign-in-alt"></i> <span>${TRANSLATIONS[lang].login}</span>`;
            btn.classList.replace('btn-secondary', 'btn-primary');
            
            if (navScore) navScore.parentElement.style.display = 'none';
            if (navDashboard) navDashboard.parentElement.style.display = 'none';
            if (navProfile) navProfile.parentElement.style.display = 'none';
        }
    }

    function toggleAuth() { 
        if (isLoggedIn) {
            logoutUser();
        } else {
            navigateTo('/home');
            const login = document.getElementById('loginCard');
            const reg = document.getElementById('registerCard');
            const switchLink = document.getElementById('loginSwitchLink');
            const navbar = document.querySelector('nav.navbar');
            const siteFooter = document.getElementById('site-footer');
            if (login && reg) {
                login.style.display = 'block';
                reg.style.display = 'none';
                if (switchLink) switchLink.style.display = 'block';
                if (navbar) navbar.style.display = '';
                if (siteFooter) siteFooter.style.display = 'block';
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    function togglePasswordVisibility(inputId, spanElem) {
        const input = document.getElementById(inputId);
        const icon = spanElem.querySelector('i');
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    function logoutUser() {
        fetch('/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: localStorage.getItem('sessionId') }) })
        .finally(() => {
            localStorage.removeItem('riderId'); localStorage.removeItem('sessionId');
            currentUser = null; isLoggedIn = false;
            updateAuthNavbarState(); navigateTo('/home');
        });
    }

    function validateFullRegistrationForm() {
        let isValid = true;
        let firstInvalidField = null;
        let firstErrorMessage = null;

        const fieldLabels = {
            'regFullName': 'Full Name', 'regPhone': 'Phone Number', 'regPassword': 'Password',
            'regState': 'State', 'regCity': 'City', 'regPincode': 'Pincode', 'regPlatform': 'Delivery Platform',
            'regExp': 'Delivery Experience', 'regVehicleTypeOther': 'Vehicle Type (Other)', 'regVehicleModel': 'Vehicle Model',
            'regVehicleModelOther': 'Vehicle Model (Other)', 'regFuelMethodOther': 'Fuel Method (Other)',
            'regFuelExp': 'Fuel Expense', 'regMaintExp': 'Maintenance Expense', 'regReferralCode': 'Referral Code'
        };

        const setInvalid = (el, customUI, customMsg) => {
            isValid = false;
            if (!firstErrorMessage) {
                if (customMsg) firstErrorMessage = customMsg;
                else if (el && el.id && fieldLabels[el.id]) firstErrorMessage = `Please fill out the ${fieldLabels[el.id]} field.`;
                else firstErrorMessage = 'Please complete all required fields.';
            }

            const targetUI = customUI || el;
            targetUI.style.border = '2px solid var(--danger-color)';
            if (!firstInvalidField) firstInvalidField = targetUI;
            
            const clearBorder = () => targetUI.style.border = '';
            if (el) {
                el.addEventListener('change', clearBorder, { once: true });
                el.addEventListener('input', clearBorder, { once: true });
            }
        };

        for (let step = 1; step <= 6; step++) {
            const sec = document.getElementById('regSection' + step);
            if (!sec) continue;

            if (step === 1) {
                // Check required fields for Profile section
                const reqs = ['regFullName', 'regPhone', 'regPassword', 'regState', 'regCity', 'regPincode', 'regPlatform', 'regExp'];
                reqs.forEach(id => {
                    const el = document.getElementById(id);
                    if (!el) return;
                    
                    let isFieldValid = true;
                    let errorMsg = null;

                    if (!el.value.trim()) {
                        isFieldValid = false;
                    }
                    
                    if (id === 'regFullName' && /\d/.test(el.value)) {
                        isFieldValid = false;
                        errorMsg = 'Numbers are not allowed in the Full Name. Only letters are permitted.';
                    }
                    if (id === 'regPhone' && (el.value.trim().length !== 10 || !/^[6-9]/.test(el.value.trim()))) {
                        isFieldValid = false;
                        errorMsg = 'Please enter a valid 10-digit mobile number.';
                    }
                    if (id === 'regPassword' && el.value.length < 8) {
                        isFieldValid = false;
                        errorMsg = 'Password must be at least 8 characters long.';
                    }
                    
                    if (!isFieldValid) {
                        if (id === 'regPlatform') {
                            const customSelect = document.querySelector('#platformCustomSelect .custom-select');
                            if (customSelect) setInvalid(el, customSelect, errorMsg);
                        } else {
                            setInvalid(el, null, errorMsg);
                        }
                    }
                });
                // "Other" text fields
                sec.querySelectorAll('input[type="text"][id$="Other"]').forEach(el => {
                    if (el.style.display !== 'none' && !el.value.trim()) setInvalid(el);
                });
            }
            else if (step === 2) {
                const vt = sec.querySelector('input[name="vehicleType"]:checked');
                if (!vt) {
                    const group = document.getElementById('vehicleTypeGroup') || sec.querySelector('input[name="vehicleType"]').closest('.radio-group');
                    if (group) {
                        group.style.border = '2px solid var(--danger-color)';
                        group.style.padding = '0.5rem';
                        group.style.borderRadius = 'var(--border-radius-md)';
                        isValid = false;
                        if (!firstErrorMessage) firstErrorMessage = 'Please select your Vehicle Type.';
                        if (!firstInvalidField) firstInvalidField = group;
                        sec.querySelectorAll('input[name="vehicleType"]').forEach(r => r.addEventListener('change', () => { group.style.border = ''; group.style.padding = ''; }));
                    }
                } else if (vt.value === 'Other' && !document.getElementById('regVehicleTypeOther').value.trim()) {
                    setInvalid(document.getElementById('regVehicleTypeOther'));
                }

                // Check regVehicleModel
                const modelSelect = document.getElementById('regVehicleModel');
                if (modelSelect && !modelSelect.value.trim()) setInvalid(modelSelect);
                if (modelSelect && modelSelect.value === 'Other' && !document.getElementById('regVehicleModelOther').value.trim()) {
                    setInvalid(document.getElementById('regVehicleModelOther'));
                }

                const fm = sec.querySelector('input[name="fuelMethod"]:checked');
                if (!fm) {
                    const group = sec.querySelector('input[name="fuelMethod"]').closest('.radio-group');
                    if (group) {
                        group.style.border = '2px solid var(--danger-color)';
                        group.style.padding = '0.5rem';
                        group.style.borderRadius = 'var(--border-radius-md)';
                        isValid = false;
                        if (!firstErrorMessage) firstErrorMessage = 'Please select your Fuel/Charge Method.';
                        if (!firstInvalidField) firstInvalidField = group;
                        sec.querySelectorAll('input[name="fuelMethod"]').forEach(r => r.addEventListener('change', () => { group.style.border = ''; group.style.padding = ''; }));
                    }
                } else if (fm.value === 'Other' && !document.getElementById('regFuelMethodOther').value.trim()) {
                    setInvalid(document.getElementById('regFuelMethodOther'));
                }

                // Check fuel/maintenance expenses if they are visible
                const fuelExp = document.getElementById('regFuelExp');
                if (fuelExp && fuelExp.parentElement.style.display !== 'none' && !fuelExp.value.trim()) setInvalid(fuelExp);
                const maintExp = document.getElementById('regMaintExp');
                if (maintExp && maintExp.parentElement.style.display !== 'none' && !maintExp.value.trim()) setInvalid(maintExp);
            }
            else if (step === 3) {
                // Check if visible checkbox groups have at least one selection
                ['generalChallengesSection', 'evChallengesSection', 'petrolChallengesSection'].forEach(sectionId => {
                    const section = document.getElementById(sectionId);
                    if (section && section.style.display !== 'none' && !section.classList.contains('hidden-section') && window.getComputedStyle(section).display !== 'none') {
                        const group = section.querySelector('.checkbox-group') || section;
                        const checkboxes = section.querySelectorAll('input[type="checkbox"]');
                        if (checkboxes.length > 0) {
                            let checked = false;
                            checkboxes.forEach(cb => { if (cb.checked) checked = true; });
                            if (!checked) {
                                group.style.border = '2px solid var(--danger-color)';
                                group.style.padding = '0.5rem';
                                group.style.borderRadius = 'var(--border-radius-md)';
                                isValid = false;
                                if (!firstErrorMessage) firstErrorMessage = 'Please select at least one Challenge you face on the road.';
                                if (!firstInvalidField) firstInvalidField = group;
                                checkboxes.forEach(cb => cb.addEventListener('change', () => { group.style.border = ''; group.style.padding = ''; }));
                            }
                        }
                    }
                });
                
                sec.querySelectorAll('input[type="text"][id$="Other"]').forEach(el => {
                    if (el.style.display !== 'none' && !el.value.trim()) setInvalid(el);
                });
            }
            else if (step === 4) {
                ['hasAccidental', 'hasHealth', 'paidPocket'].forEach(name => {
                    if (!sec.querySelector(`input[name="${name}"]:checked`)) {
                        const radios = sec.querySelectorAll(`input[name="${name}"]`);
                        if (radios.length > 0) {
                            const group = radios[0].closest('.radio-group');
                            if (group) {
                                group.style.border = '2px solid var(--danger-color)';
                                group.style.padding = '0.5rem';
                                group.style.borderRadius = 'var(--border-radius-md)';
                                isValid = false;
                                if (!firstErrorMessage) firstErrorMessage = `Please answer all questions in the Insurance & Safety section.`;
                                if (!firstInvalidField) firstInvalidField = group;
                                radios.forEach(r => r.addEventListener('change', () => { group.style.border = ''; group.style.padding = ''; }));
                            }
                        }
                    }
                });
            }
            else if (step === 5) {
                const openEVRadio = sec.querySelector(`input[name="openEV"]:checked`);
                if (!openEVRadio) {
                    const radios = sec.querySelectorAll(`input[name="openEV"]`);
                    if (radios.length > 0) {
                        const group = radios[0].closest('.radio-group');
                        if (group) {
                            group.style.border = '2px solid var(--danger-color)';
                            group.style.padding = '0.5rem';
                            group.style.borderRadius = 'var(--border-radius-md)';
                            isValid = false;
                            if (!firstErrorMessage) firstErrorMessage = 'Please answer if you are open to using EVs.';
                            if (!firstInvalidField) firstInvalidField = group;
                            radios.forEach(r => r.addEventListener('change', () => { group.style.border = ''; group.style.padding = ''; }));
                        }
                    }
                } else if (openEVRadio.value === 'Yes') {
                    const switchTriggers = sec.querySelectorAll(`input[name="switchTriggers"]:checked`);
                    if (switchTriggers.length === 0) {
                        const firstTrigger = sec.querySelector(`input[name="switchTriggers"]`);
                        if (firstTrigger) {
                            const group = firstTrigger.closest('.checkbox-group');
                            if (group) {
                                group.style.border = '2px solid var(--danger-color)';
                                group.style.padding = '0.5rem';
                                group.style.borderRadius = 'var(--border-radius-md)';
                                isValid = false;
                                if (!firstErrorMessage) firstErrorMessage = 'Please select at least one reason to switch.';
                                if (!firstInvalidField) firstInvalidField = group;
                                sec.querySelectorAll(`input[name="switchTriggers"]`).forEach(c => c.addEventListener('change', () => { group.style.border = ''; group.style.padding = ''; }));
                            }
                        }
                    }

                    const interestsRadio = sec.querySelector(`input[name="interests"]:checked`);
                    if (!interestsRadio) {
                        const firstInterest = sec.querySelector(`input[name="interests"]`);
                        if (firstInterest) {
                            const group = firstInterest.closest('.radio-group');
                            if (group) {
                                group.style.border = '2px solid var(--danger-color)';
                                group.style.padding = '0.5rem';
                                group.style.borderRadius = 'var(--border-radius-md)';
                                isValid = false;
                                if (!firstErrorMessage) firstErrorMessage = 'Please select what you would be interested in.';
                                if (!firstInvalidField) firstInvalidField = group;
                                sec.querySelectorAll(`input[name="interests"]`).forEach(r => r.addEventListener('change', () => { group.style.border = ''; group.style.padding = ''; }));
                            }
                        }
                    }
                }
                sec.querySelectorAll('input[type="text"][id$="Other"]').forEach(el => {
                    if (el.style.display !== 'none' && !el.value.trim()) setInvalid(el);
                });
            }
            else if (step === 6) {
                if (document.getElementById('referralQuestionBlock').style.display !== 'none') {
                    if (!sec.querySelector(`input[name="referredBy"]:checked`)) {
                        const radios = sec.querySelectorAll(`input[name="referredBy"]`);
                        if (radios.length > 0) {
                            const group = radios[0].closest('.radio-group');
                            if (group) {
                                group.style.border = '2px solid var(--danger-color)';
                                group.style.padding = '0.5rem';
                                group.style.borderRadius = 'var(--border-radius-md)';
                                isValid = false;
                                if (!firstErrorMessage) firstErrorMessage = 'Please specify if you were referred by another rider.';
                                if (!firstInvalidField) firstInvalidField = group;
                                radios.forEach(r => r.addEventListener('change', () => { group.style.border = ''; group.style.padding = ''; }));
                            }
                        }
                    } else if (sec.querySelector(`input[name="referredBy"]:checked`).value === 'yes' && !document.getElementById('regReferralCode').value.trim()) {
                        setInvalid(document.getElementById('regReferralCode'));
                    }
                }
            }
        }

        if (!isValid) {
            showToast(firstErrorMessage || 'Please complete all required fields.', 'error');
            if (firstInvalidField && firstInvalidField.scrollIntoView) {
                firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        return isValid;
    }



    // ===== AUTH FORMS =====
    function toggleAuthCards(e) {
        if (e) e.preventDefault();
        const login = document.getElementById('loginCard');
        const reg = document.getElementById('registerCard');
        const switchLink = document.getElementById('loginSwitchLink');
        const navbar = document.querySelector('nav.navbar');
        const siteFooter = document.getElementById('site-footer');
        
        if (login.style.display === 'none') {
            login.style.display = 'block'; reg.style.display = 'none';
            if (switchLink) switchLink.style.display = 'block';
            if (navbar) navbar.style.display = '';
            if (siteFooter) siteFooter.style.display = 'block';
        } else {
            login.style.display = 'none'; reg.style.display = 'block';
            if (navbar) navbar.style.display = 'none';
            if (siteFooter) siteFooter.style.display = 'none';
        }
    }

    async function handleLogin(e) {
        e.preventDefault();
        
        // Hide previous errors
        document.getElementById('loginErrorMsg').style.display = 'none';
        
        const phone = document.getElementById('loginPhone').value.trim();
        const phoneRegex = /^[6-9][0-9]{9}$/;
        
        if (!phoneRegex.test(phone)) {
            document.getElementById('loginErrorText').textContent = 'Please enter a valid 10-digit mobile number';
            document.getElementById('loginErrorMsg').style.display = 'block';
            return;
        }

        const loginMethod = document.querySelector('input[name="loginMethod"]:checked').value;
        let payload = { phone, loginMethod };
        if (loginMethod === 'password') {
            payload.password = document.getElementById('loginPassword').value;
        } else {
            payload.otp = document.getElementById('loginOtp').value;
            if (!payload.otp) { 
                document.getElementById('loginErrorText').textContent = 'Please enter OTP';
                document.getElementById('loginErrorMsg').style.display = 'block';
                return; 
            }
        }

        const btn = document.getElementById('loginBtn');
        const origText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        btn.disabled = true;

        try {
            const res = await fetch('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const result = await res.json();
            
            if (result.success) {
                localStorage.setItem('riderId', result.riderId);
                localStorage.setItem('sessionId', result.sessionId);
                fetchRiderProfile(result.riderId);
                trackEvent('login', { method: payload.loginMethod });
                btn.innerHTML = origText;
                btn.disabled = false;
            } else {
                document.getElementById('loginErrorText').textContent = 'Login failed: ' + (result.message || result.error || 'Invalid credentials');
                document.getElementById('loginErrorMsg').style.display = 'block';
                btn.innerHTML = origText;
                btn.disabled = false;
            }
        } catch (err) {
            document.getElementById('loginErrorText').textContent = 'Network error: ' + err.message;
            document.getElementById('loginErrorMsg').style.display = 'block';
            btn.innerHTML = origText;
            btn.disabled = false;
        }
    }

    function toggleLoginMethod() {
        const method = document.querySelector('input[name="loginMethod"]:checked').value;
        if (method === 'password') {
            document.getElementById('loginPasswordGroup').style.display = 'block';
            document.getElementById('loginOtpGroup').style.display = 'none';
            document.getElementById('loginPassword').required = true;
        } else {
            document.getElementById('loginPasswordGroup').style.display = 'none';
            document.getElementById('loginOtpGroup').style.display = 'block';
            document.getElementById('loginPassword').required = false;
        }
    }

    async function sendMockOtp(phoneInputId = 'loginPhone', msgContainerId = 'otpSentMsg') {
        const phone = document.getElementById(phoneInputId).value;
        const phoneRegex = /^[6-9][0-9]{9}$/;
        if (!phone || !phoneRegex.test(phone)) { showToast('Please enter a valid 10-digit Indian mobile number first', 'warning'); return; }
        
        const btn = event && event.target ? event.target.closest('button') : null;
        const origHtml = btn ? btn.innerHTML : 'Send OTP';
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        }

        try {
            const res = await fetch('/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
            });
            const data = await res.json();
            if (data.success) {
                const msgEl = document.getElementById(msgContainerId);
                if (msgEl) {
                    msgEl.style.display = 'block';
                    msgEl.textContent = data.isMock ? 'OTP sent! (mock: use 123456)' : 'OTP sent successfully!';
                    msgEl.style.color = 'var(--success-color)';
                }
                showToast(data.message || 'OTP Sent!', 'success');
            } else {
                showToast('Failed to send OTP: ' + (data.error || 'Unknown error'), 'error');
            }
        } catch (err) {
            showToast('Network error: ' + err.message, 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = origHtml;
            }
        }
    }

    // ===== MULTI-STEP REGISTRATION =====
    function gotoStep(step) {
        if (step > 1 && step === 2) {
            // Validate section A
            const name = document.getElementById('regFullName').value.trim();
            const phone = document.getElementById('regPhone').value.trim();
            const city = document.getElementById('regCity').value;
            const platform = document.getElementById('regPlatform').value;
            const exp = document.getElementById('regExp').value;
            const pass = document.getElementById('regPassword').value;
            if (!name) { showToast('Please enter your full name', 'error'); return; }
            if (phone.length !== 10) { showToast('Phone must be 10 digits', 'error'); return; }
            if (!city) { showToast('Please select your city', 'error'); return; }
            if (!platform) { showToast('Please select your delivery platform', 'error'); return; }
            if (exp === '') { showToast('Please select your experience', 'error'); return; }
            if (!pass) { showToast('Please set a password', 'error'); return; }
        }

        document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
        document.getElementById(`regSection${step}`).classList.add('active');

        for (let i = 1; i <= 6; i++) {
            const ind = document.getElementById(`step-indicator-${i}`);
            if (!ind) continue;
            ind.classList.remove('active', 'done');
            if (i < step) ind.classList.add('done');
            else if (i === step) ind.classList.add('active');
        }
        currentRegStep = step;
    }

    function validateLoginPhone(input) {
        const original = input.value;
        const clean = original.replace(/\D/g, '').slice(0, 10);
        
        const warningId = input.id === 'loginPhone' ? 'loginPhoneWarning' : 'riderForgotPhoneWarning';
        const warningEl = document.getElementById(warningId);

        if (original !== clean) {
            if (warningEl) {
                warningEl.style.display = 'block';
                setTimeout(() => { warningEl.style.display = 'none'; }, 2500);
            }
        }
        input.value = clean;
    }

    function validateAdminEmail(input) {
        const val = input.value.trim();
        if (val === '') return;
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const warningId = input.id + 'Warning';
        const warningEl = document.getElementById(warningId);

        if (!regex.test(val)) {
            if (warningEl) {
                warningEl.style.display = 'block';
                setTimeout(() => { warningEl.style.display = 'none'; }, 2500);
            }
        } else {
            if (warningEl) {
                warningEl.style.display = 'none';
            }
        }
    }

    let lastOtpSentPhone = null;
    function validateRegPhone(input) {
        const clean = input.value.replace(/\D/g, '').slice(0, 10);
        input.value = clean;
        const icon = document.getElementById('phoneValIcon');
        const check = document.getElementById('phoneCheckIcon');
        const cross = document.getElementById('phoneCrossIcon');
        const err = document.getElementById('phoneErrMsg');
        const dup = document.getElementById('dupPhoneMsg');
        dup.classList.add('hidden');
        if (clean.length === 0) { 
            icon.style.display = 'none'; err.classList.add('hidden'); 
            return; 
        }
        if (clean.length === 10 && /^[6-9]/.test(clean)) {
            icon.style.display = 'inline-block'; check.style.display = 'inline-block'; cross.style.display = 'none';
            err.classList.add('hidden');
            // Check for duplicate
            fetch(`/api/riders/check-phone/${clean}`).then(r => r.json()).then(res => {
                if (res.exists) { 
                    dup.classList.remove('hidden'); check.style.display = 'none'; cross.style.display = 'inline-block'; 
                }
            }).catch(() => {});
        } else {
            icon.style.display = 'inline-block'; check.style.display = 'none'; cross.style.display = 'inline-block';
            err.classList.remove('hidden');
        }
    }

    async function sendRegistrationOtp(phoneNum) {
        const phone = phoneNum || document.getElementById('regPhone').value;
        const msgEl = document.getElementById('regOtpMsg');
        document.getElementById('regOtpGroup').style.display = 'block';
        msgEl.style.display = 'block';
        msgEl.textContent = 'Sending OTP...';
        msgEl.style.color = '#3b82f6';

        try {
            const res = await fetch('/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, channel: 'whatsapp' })
            });
            const data = await res.json();
            if (data.success) {
                msgEl.textContent = data.isMock ? 'OTP sent! (mock: use 123456)' : 'OTP sent to your WhatsApp!';
                msgEl.style.color = '#25D366';
                showToast(data.message || 'OTP Sent to WhatsApp!', 'success');
                startResendTimer();
            } else {
                msgEl.textContent = 'Failed to send OTP: ' + (data.error || 'Unknown error');
                msgEl.style.color = '#ef4444';
                showToast('Failed to send OTP', 'error');
                document.getElementById('resendRegOtpBtn').style.display = 'block';
            }
        } catch (err) {
            msgEl.textContent = 'Network error: ' + err.message;
            msgEl.style.color = '#ef4444';
            showToast('Network error', 'error');
            document.getElementById('resendRegOtpBtn').style.display = 'block';
        }
    }

    let resendInterval;
    function startResendTimer() {
        clearInterval(resendInterval);
        const timerEl = document.getElementById('resendRegOtpTimer');
        const btnEl = document.getElementById('resendRegOtpBtn');
        timerEl.style.display = 'block';
        btnEl.style.display = 'none';
        
        let timeLeft = 30;
        timerEl.textContent = `Wait ${timeLeft}s...`;
        
        resendInterval = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) {
                clearInterval(resendInterval);
                timerEl.style.display = 'none';
                btnEl.style.display = 'block';
            } else {
                timerEl.textContent = `Wait ${timeLeft}s...`;
            }
        }, 1000);
    }

    function resendRegistrationOtp() {
        document.getElementById('resendRegOtpBtn').style.display = 'none';
        sendRegistrationOtp();
    }
    window.resendRegistrationOtp = resendRegistrationOtp;

    async function verifyRegOtp() {
        const phone = document.getElementById('regPhone').value;
        const otp = document.getElementById('regOtpInput').value;
        if (!otp) {
            showToast('Please enter the OTP', 'warning');
            return;
        }
        
        const btn = document.getElementById('verifyRegOtpBtn');
        const origHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        try {
            const res = await fetch('/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, otp })
            });
            const data = await res.json();
            if (data.success) {
                document.getElementById('regOtpGroup').innerHTML = '<div style="color:#25D366; font-weight:bold;"><i class="fas fa-check-circle"></i> WhatsApp OTP Verified Successfully!</div>';
                document.getElementById('regRestOfForm').style.display = 'block';
                document.getElementById('regRestOfForm').style.pointerEvents = 'auto';
                // Trigger reflow to apply transition
                void document.getElementById('regRestOfForm').offsetWidth;
                document.getElementById('regRestOfForm').style.opacity = '1';
                document.getElementById('submitRegBtn').disabled = false;
                showToast('Phone verified! You can now complete the form.', 'success');
            } else {
                showToast('Verification failed: ' + (data.error || 'Invalid OTP'), 'error');
                btn.disabled = false;
                btn.innerHTML = origHtml;
            }
        } catch (err) {
            showToast('Network error: ' + err.message, 'error');
            btn.disabled = false;
            btn.innerHTML = origHtml;
        }
    }

    document.addEventListener('change', function(e) {
        if (e.target && e.target.matches('select.form-control')) {
            if (e.target.value !== "" && e.target.value !== "Other") {
                e.target.classList.add('selected');
            } else {
                e.target.classList.remove('selected');
            }
        }
    });

    function validateRegPassword(input) {
        const err = document.getElementById('passErrMsg');
        const pwdStr = document.getElementById('pwdStrengthContainer');
        const text = document.getElementById('pwdStrengthText');
        const b1 = document.getElementById('pwdBar1');
        const b2 = document.getElementById('pwdBar2');
        const b3 = document.getElementById('pwdBar3');
        const b4 = document.getElementById('pwdBar4');

        const val = input.value;
        if (val.length > 0 && val.length < 8) {
            err.classList.remove('hidden');
        } else {
            err.classList.add('hidden');
        }

        if (!pwdStr) return; // fail-safe

        if (val.length === 0) {
            pwdStr.style.display = 'none';
            return;
        }
        
        pwdStr.style.display = 'block';
        
        let strength = 0;
        if (val.length >= 8) strength++;
        if (/[A-Z]/.test(val) && /[a-z]/.test(val)) strength++;
        if (/[0-9]/.test(val)) strength++;
        if (/[^A-Za-z0-9]/.test(val)) strength++;
        
        const resetBars = () => {
            [b1, b2, b3, b4].forEach(b => b.style.background = '#e5e7eb');
        };
        
        resetBars();
        
        if (strength <= 1) {
            text.innerText = 'Weak - add numbers & symbols';
            text.style.color = '#ef4444';
            b1.style.background = '#ef4444';
        } else if (strength === 2) {
            text.innerText = 'Fair - could be stronger';
            text.style.color = '#f59e0b';
            b1.style.background = '#f59e0b';
            b2.style.background = '#f59e0b';
        } else if (strength === 3) {
            text.innerText = 'Good password';
            text.style.color = '#10b981';
            b1.style.background = '#10b981';
            b2.style.background = '#10b981';
            b3.style.background = '#10b981';
        } else {
            text.innerText = 'Strong password';
            text.style.color = '#059669';
            [b1, b2, b3, b4].forEach(b => b.style.background = '#059669');
        }
    }

    function onVehicleTypeChange(value) {
        // Toggle vehicle type "Other" box
        const vtOther = document.getElementById('regVehicleTypeOther');
        if (value === 'Other') {
            vtOther.style.display = 'block';
            vtOther.required = true;
            setTimeout(() => vtOther.focus(), 50);
        } else {
            vtOther.style.display = 'none';
            vtOther.required = false;
        }

        // Section C logic
        const genSec = document.getElementById('generalChallengesSection');
        const evSec = document.getElementById('evChallengesSection');
        const petrolSec = document.getElementById('petrolChallengesSection');
        const isEV = value.toLowerCase().includes('electric');
        const isPetrol = value.toLowerCase().includes('petrol');
        
        if (isEV || isPetrol) {
            genSec.style.display = 'none';
        } else {
            genSec.style.display = 'block';
        }
        
        evSec.classList.toggle('hidden-section', !isEV);
        evSec.classList.toggle('visible-section', isEV);
        petrolSec.classList.toggle('hidden-section', !isPetrol);
        petrolSec.classList.toggle('visible-section', isPetrol);

        // Populate Brand & Model dropdown
        const brandSelect = document.getElementById('regVehicleModel');
        brandSelect.innerHTML = '<option value="">Select Brand/Model</option>';
        brandSelect.classList.remove('selected');
        document.getElementById('regVehicleModelOther').style.display = 'none';

        if (isPetrol) {
            const petrolBrands = ['Honda Activa', 'Hero Splendor', 'TVS Jupiter', 'Bajaj Pulsar', 'Suzuki Access'];
            petrolBrands.forEach(b => {
                const opt = document.createElement('option');
                opt.value = b; opt.textContent = b;
                brandSelect.appendChild(opt);
            });
        } else if (isEV) {
            const evBrands = ['Ola S1', 'Ather 450X', 'TVS iQube', 'Bajaj Chetak', 'Hero Vida', 'Bounce Infinity'];
            evBrands.forEach(b => {
                const opt = document.createElement('option');
                opt.value = b; opt.textContent = b;
                brandSelect.appendChild(opt);
            });
        }
        const otherOpt = document.createElement('option');
        otherOpt.value = 'Other'; otherOpt.textContent = 'Other';
        brandSelect.appendChild(otherOpt);
    }

    function toggleReferralInput(val) {
        const sec = document.getElementById('referralCodeInputSection');
        if (val === 'yes') { sec.classList.remove('hidden-section'); sec.classList.add('visible-section'); }
        else { sec.classList.add('hidden-section'); sec.classList.remove('visible-section'); }
    }

    function toggleOpenEV(value) {
        const followup = document.getElementById('evSwitchFollowup');
        if (value === 'Yes') {
            followup.style.display = 'block';
        } else {
            followup.style.display = 'none';
        }
    }

    function getCheckedValues(name) {
        return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(i => i.value);
    }

    function getCheckedValuesWithOther(name, otherInputId) {
        const vals = Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(i => i.value);
        const otherIdx = vals.indexOf('Other');
        if (otherIdx !== -1) {
            const otherVal = document.getElementById(otherInputId).value.trim();
            if (otherVal) vals[otherIdx] = otherVal;
        }
        return vals;
    }

    function getRadioValue(name) {
        const el = document.querySelector(`input[name="${name}"]:checked`);
        return el ? el.value : '';
    }

    function toggleOtherRadio(input, targetId) {
        const el = document.getElementById(targetId);
        if(input.value === 'Other' && input.checked) {
            el.style.display = 'block';
            setTimeout(() => el.focus(), 50);
        } else {
            el.style.display = 'none';
        }
    }

    function toggleOtherCheckbox(input, targetId) {
        const el = document.getElementById(targetId);
        if(input.checked) {
            el.style.display = 'block';
            setTimeout(() => el.focus(), 50);
        } else {
            el.style.display = 'none';
        }
    }

    async function fetchStates() {
        try {
            const res = await fetch('/api/locations/states');
            const data = await res.json();
            if (data.success) {
                const select = document.getElementById('regState');
                select.innerHTML = '<option value="">Select State</option>';
                data.data.forEach(st => {
                    select.innerHTML += `<option value="${st}">${st}</option>`;
                });
                select.innerHTML += '<option value="Other">Other</option>';
            }
        } catch(e) { console.error('Error fetching states', e); }
    }

    async function onRegStateChange() {
        const stateSelect = document.getElementById('regState');
        const citySelect = document.getElementById('regCity');
        
        const state = stateSelect.value;
        citySelect.innerHTML = '<option value="">Loading Cities...</option>';
        
        if (state && state !== 'Other') {
            try {
                const res = await fetch(`/api/locations/cities/${state}`);
                const data = await res.json();
                citySelect.innerHTML = '<option value="">Select City</option>';
                if (data.success) {
                    data.data.forEach(city => {
                        citySelect.innerHTML += `<option value="${city}">${city}</option>`;
                    });
                }
                citySelect.innerHTML += '<option value="Other">Other</option>';
                citySelect.disabled = false;
            } catch(e) { console.error('Error fetching cities', e); }
        } else if (state === 'Other') {
            citySelect.innerHTML = '<option value="">Select City</option><option value="Other">Other</option>';
            citySelect.disabled = false;
        } else {
            citySelect.innerHTML = '<option value="">Select your city</option>';
            citySelect.disabled = true;
        }
        
        handleOtherDropdown(stateSelect, 'regStateOther');
    }

    // The static onRegCityChange handles the change logic (defined above).
    // Removed the fetch-based onRegCityChange since pincodes are now direct input.
    
    window.onRegStateChange = onRegStateChange;
    window.onRegCityChange = onRegCityChange;
    
    // Call fetchStates on load
    setTimeout(() => { fetchStates(); }, 500);

    function submitRegistration() {
        const name = document.getElementById('regFullName').value.trim();
        const phone = document.getElementById('regPhone').value.trim();
        let state = document.getElementById('regState').value;
        if (state === 'Other') state = document.getElementById('regStateOther').value.trim();
        let city = document.getElementById('regCity').value;
        if (city === 'Other') city = document.getElementById('regCityOther').value.trim();
        let pincode = document.getElementById('regPincode').value;
        let platform = document.getElementById('regPlatform').value;
        if (platform === 'Other') platform = document.getElementById('regPlatformOther').value.trim();
        
        const exp = document.getElementById('regExp').value;
        const pass = document.getElementById('regPassword').value;

        
        if (!validateFullRegistrationForm()) {
            return;
        }


        const btn = document.getElementById('submitRegBtn');
        btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';

        const lang = localStorage.getItem('selectedLang') || 'en';
        // Always pick up the referral code — either from hidden input (auto-filled via link)
        // or from the manual "Yes" radio selection, or from localStorage
        const hiddenCodeEl = document.getElementById('regReferralCode');
        const hiddenCode = hiddenCodeEl ? hiddenCodeEl.value.trim().toUpperCase() : '';
        const referredBy = getRadioValue('referredBy');
        const referredByCode = hiddenCode || (referredBy === 'yes' ? '' : null) || localStorage.getItem('pendingReferralCode') || null;

        const payload = {
            fullName: name,
            phone: phone,
            state: state,
            city: city,
            pincode: pincode,
            deliveryPlatform: platform,
            experienceYears: exp,
            password: pass,
            vehicleType: getRadioValue('vehicleType') === 'Other' ? document.getElementById('regVehicleTypeOther').value.trim() : getRadioValue('vehicleType'),
            vehicleModel: document.getElementById('regVehicleModel').value === 'Other' ? document.getElementById('regVehicleModelOther').value.trim() : document.getElementById('regVehicleModel').value,
            fuelMethod: getRadioValue('fuelMethod') === 'Other' ? document.getElementById('regFuelMethodOther').value.trim() : getRadioValue('fuelMethod'),
            fuelExpenseWeekly: document.getElementById('regFuelExp').value,
            maintenanceExpenseMonthly: document.getElementById('regMaintExp').value,
            challenges: getCheckedValuesWithOther('challenges', 'regChallengesOther'),
            evChallenges: getCheckedValuesWithOther('evChallenges', 'regEvChallengesOther'),
            petrolChallenges: getCheckedValuesWithOther('petrolChallenges', 'regPetrolChallengesOther'),
            hasAccidentalInsurance: getRadioValue('hasAccidental'),
            hasHealthInsurance: getRadioValue('hasHealth'),
            paidOutofPocketAccident: getRadioValue('paidPocket'),
            openToEV: getRadioValue('openEV'),
            switchTriggers: getCheckedValues('switchTriggers'),
            interests: getRadioValue('interests'),
            referredByCode,
            language: lang
        };

        const doRegister = (finalPayload) => {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            fetch('/api/riders/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(finalPayload) })
            .then(r => r.json())
            .then(result => {
                btn.disabled = false; btn.innerHTML = '<i class="fas fa-check-circle"></i> Complete Registration';
                if (result.success) {
                    localStorage.setItem('riderId', result.data.riderId);
                localStorage.setItem('sessionId', result.sessionId);
                localStorage.removeItem('pendingReferralCode');
                currentUser = result.data.rider;
                registeredRiderId = result.data.riderId;
                trackEvent('sign_up', { method: 'website', platform: platform });

                // Show success
                document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
                const regFormContent = document.getElementById('registrationFormContent');
                if (regFormContent) regFormContent.style.display = 'none';
                document.getElementById('regSuccessPanel').classList.add('active');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                document.getElementById('loginSwitchLink').style.display = 'none';

                // Hide the footer
                const siteFooter = document.getElementById('site-footer');
                if (siteFooter) siteFooter.style.display = 'none';

                // Update success UI
                const regFullName = document.getElementById('regFullName').value.trim();
                document.getElementById('successWelcomeName').textContent = regFullName;
                document.getElementById('successReferralCode').textContent = result.referralCode;
                let msgHtml = result.whatsappMessage
                    .replace(/\n/g, '<br>')
                    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color:#007bff; font-weight:600; text-decoration:underline;">$1</a>');
                document.getElementById('whatsappMsgPreview').innerHTML = msgHtml;

                const waLink = `https://api.whatsapp.com/send?phone=91${payload.phone}&text=${encodeURIComponent(result.whatsappMessage)}`;
                document.getElementById('whatsappSendLink').href = waLink;
                
                // Automatically share with image popup as requested
                setTimeout(() => {
                    if (typeof shareWithImage === 'function') {
                        shareWithImage(null, result.referralCode, regFullName);
                    } else {
                        window.open(waLink, '_blank');
                    }
                }, 500);

                showToast('🎉 Registration successful! Welcome to Road Warrior Pro!', 'success');
            } else {
                showToast('Registration failed: ' + (result.message || result.error || 'Unknown error'), 'error');
            }
        }).catch(err => {
            btn.disabled = false; btn.innerHTML = '<i class="fas fa-check-circle"></i> Complete Registration';
            showToast('Network error: ' + err.message, 'error');
        });
        }; // End doRegister

        // Attempt GPS capture
        if (navigator.geolocation) {
            btn.innerHTML = '<i class="fas fa-map-marker-alt fa-bounce"></i> Getting Location...';
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    payload.latitude = position.coords.latitude;
                    payload.longitude = position.coords.longitude;
                    payload.locationAccuracy = position.coords.accuracy;
                    doRegister(payload);
                },
                (error) => {
                    console.warn('Geolocation failed or denied:', error.message);
                    doRegister(payload); // Proceed without GPS
                },
                { timeout: 3000, maximumAge: 0, enableHighAccuracy: false }
            );
        } else {
            console.warn('Browser completely disabled geolocation on this connection.');
            doRegister(payload);
        }
    }

    function loginAfterRegister() {
        if (registeredRiderId) {
            fetchRiderProfile(registeredRiderId);
        }
    }

    function goBackToLogin(e) {
        if (e) e.preventDefault();
        
        const siteFooter = document.getElementById('site-footer');
        if (siteFooter) siteFooter.style.display = 'block';

        const regFormContent = document.getElementById('registrationFormContent');
        if (regFormContent) regFormContent.style.display = 'block';
        document.getElementById('regSuccessPanel').classList.remove('active');
        document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
        document.getElementById('regSection1').classList.add('active');
        
        toggleAuthCards();
    }

    function getReferralLink(code) {
        return `${window.location.origin}/?ref=${code}`;
    }

    function getWhatsAppShareLink(code) {
        return `${window.location.origin}/?ref=${code}`;
    }

    function getWhatsAppMessageText(fullName, code) {
        const lang = localStorage.getItem('selectedLang') || 'en';
        const refLink = getWhatsAppShareLink(code);
        if (lang === 'hi') {
            return `Namaste ${fullName}! Aapka registration ho gaya. Aapka referral code hai: ${code}.\n\nIs link ko apne doston ko bheje aur jab wo login/register karenge toh aap points kamaenge: ${refLink}\n\nRoad Warrior EV 🏍️`;
        } else if (lang === 'kn') {
            return `Namaskara ${fullName}! Nimma nondane aayitu. Nimma referral code: ${code}.\n\nEe link annu nimma snehitrige kalisi, avaru login/register madidaga neevu points gaLisi: ${refLink}\n\nRoad Warrior EV 🏍️`;
        } else {
            return `Welcome ${fullName}! You are now registered. Your referral code is ${code}.\n\nSend this link to others, and when they register with your code, you earn points: ${refLink}\n\nRoad Warrior EV 🏍️`;
        }
    }

    // ===== SCORE LOOKUP (public) =====
    window.lookupScore = function() {
        const phone = document.getElementById('scoreLookupPhone').value.trim();
        if (phone.length !== 10) { showToast('Enter a valid 10-digit phone number', 'error'); return; }
        const result = document.getElementById('scoreLookupResult');
        result.style.display = 'block';
        result.innerHTML = '<div style="text-align:center; padding:1rem;"><i class="fas fa-spinner fa-spin" style="font-size:1.5rem; color:var(--primary-color);"></i></div>';

        fetch(`/api/riders/by-phone/${phone}`).then(r => r.json()).then(res => {
            if (res.success) {
                const rider = res.data;
                const refs = rider.referrals || 0;
                const pts = rider.totalPoints || 0;
                const code = rider.referralCode || 'N/A';
                const tags = (rider.tags || []).map(t => `<span class="tag-pill ${getTagClass(t)}">${t}</span>`).join('');
                const waMsg = getWhatsAppMessageText(rider.fullName || 'Rider', code);
                result.innerHTML = `
                    <div class="score-display">
                        <div style="font-size:0.875rem; color:var(--text-secondary); margin-bottom:0.5rem;">Welcome back, <strong>${rider.fullName}</strong>! 🎉</div>
                        <div class="score-big">${pts}</div>
                        <div style="font-size:0.875rem; color:var(--text-secondary); margin-bottom:1rem;">Total Points</div>
                        <div style="display:flex; gap:1rem; justify-content:center; margin-bottom:1rem;">
                            <div class="stat-box" style="padding:0.75rem 1.5rem; flex:1; text-align:center;"><div style="font-size:1.5rem; font-weight:800; color:var(--primary-color);">${refs}</div><div style="font-size:0.75rem; color:var(--text-secondary);">Referrals</div></div>
                            <div class="stat-box" style="padding:0.75rem 1.5rem; flex:1; text-align:center;"><div style="font-size:1.5rem; font-weight:800; color:var(--secondary-color);">${rider.city}</div><div style="font-size:0.75rem; color:var(--text-secondary);">City</div></div>
                        </div>
                        <div class="referral-code-badge" style="margin:0 auto; display:inline-flex;">🎫 ${code}</div>
                        <div style="margin-top:0.75rem;">${tags}</div>
                        <a href="#" onclick="window.shareWithImage(event, '${code}', '${rider.fullName}')" class="btn btn-success w-100" style="background:#25D366; border-color:#25D366; margin-top:1rem;">
                            <i class="fab fa-whatsapp"></i> Share my referral code
                        </a>
                    </div>`;
            } else {
                result.innerHTML = `<div class="alert" style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:var(--border-radius-sm); padding:1rem; color:#ef4444;"><i class="fas fa-exclamation-circle"></i> ${res.error || 'Rider not found with this phone number.'}</div>`;
            }
        }).catch(() => {
            result.innerHTML = `<div class="alert" style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:var(--border-radius-sm); padding:1rem; color:#ef4444;">Connection error. Please try again.</div>`;
        });
    }

    function getTagClass(tag) {
        if (tag === 'PERSONAL_INSURANCE_LEAD') return 'tag-personal-ins';
        if (tag === 'BIKE_INSURANCE_LEAD') return 'tag-bike-ins';
        if (tag === 'EV_SALE_LEAD') return 'tag-ev-sale';
        if (tag === 'EV_RENTAL_LEAD') return 'tag-ev-rental';
        if (tag === 'RETROFIT_LEAD') return 'tag-retrofit';
        if (tag === 'PRODUCT_LEAD') return 'tag-product';
        
        // Fallbacks
        if (tag.includes('Hot EV') || tag.includes('EV Lead')) return 'tag-hot-ev';
        if (tag.includes('Insurance')) return 'tag-insurance';
        if (tag.includes('Retrofit')) return 'tag-retrofit';
        if (tag.includes('Petrol')) return 'tag-petrol';
        if (tag.includes('EV Rider')) return 'tag-ev';
        if (tag.includes('Swing')) return 'tag-swing';
        return 'tag-swing';
    }

    // ===== LEADERBOARD =====
    function loadLeaderboardData() {
        const tbody = document.getElementById('leaderboardTableBody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem;"><div class="spinner-container" style="display:inline-block; vertical-align:middle; margin-right:10px;"><div class="spinner" style="width:20px; height:20px; border-width:3px;"></div></div> Loading Leaderboard...</td></tr>';

        fetch('/api/leaderboard').then(r => r.json()).then(result => {
            if (result.success) {
                renderLeaderboardTable(result.data);
            } else {
                if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--error-color);">Failed to load leaderboard: ${result.error || 'Unknown error'}</td></tr>`;
            }
        }).catch(err => {
            if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--error-color);">Network Error: ${err.message}</td></tr>`;
        });
    }

    function renderLeaderboardTable(riders) {
        const tbody = document.getElementById('leaderboardTableBody');
        const lang = localStorage.getItem('selectedLang') || 'en';
        let userRank = '--';
        if (currentUser) {
            const idx = riders.findIndex(r => r.id === currentUser.id);
            if (idx !== -1) userRank = idx + 1;
        }
        document.getElementById('userRankValue').textContent = userRank;
        
        const top10 = riders.slice(0, 10);
        tbody.innerHTML = top10.map((r, idx) => {
            const rn = idx + 1;
            const medal = rn === 1 ? '🥇' : rn === 2 ? '🥈' : rn === 3 ? '🥉' : rn;
            const isSelf = currentUser && r.id === currentUser.id;
            const rowStyle = isSelf ? `style="background:rgba(59, 130, 246, 0.03); font-weight:bold; border-left:3px solid var(--primary-color);"` : '';
        const tags = (r.tags || []).map(t => `<span class="tag-pill ${getTagClass(t)}">${t}</span>`).join('');
            return `<tr ${rowStyle}><td>${medal}</td><td>${r.fullName}${isSelf ? ` <strong>(${TRANSLATIONS[lang].label_you})</strong>` : ''}</td><td>${r.city}</td><td style="color:var(--secondary-color); font-weight:700;">${r.referrals || 0}</td><td style="color:var(--primary-color); font-weight:700;">${r.totalPoints}</td><td>${tags || '—'}</td></tr>`;
        }).join('');
        
        // Also update the Top Riders slider on the home page if it's there
        updateTopRidersSlider(top10.slice(0, 5));

        renderAchievementsGrid();
    }

    // ===== TOP RIDERS SLIDER =====
    let sliderInterval = null;
    function updateTopRidersSlider(top5) {
        const sliderWrapper = document.getElementById('topRidersSliderWrapper');
        
        if (!sliderWrapper) return;
        
        if (!top5 || top5.length === 0) {
            sliderWrapper.innerHTML = '<div style="flex: 0 0 100%; width: 100%; text-align: center;"><p style="color:var(--text-secondary);">Top riders data unavailable.</p></div>';
            return;
        }

        // Build all slides + 1 cloned slide at the end for infinite loop
        const slidesToRender = [...top5, top5[0]];
        
        sliderWrapper.innerHTML = slidesToRender.map((rider, index) => {
            const rank = index === top5.length ? 1 : index + 1;
            const platform = (rider.platform && rider.platform !== 'Other') ? rider.platform : 'Delivery';
            return `
                <div style="flex: 0 0 100%; width: 100%; display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 0 2rem; box-sizing: border-box;">
                    <div style="font-size:4rem; margin-bottom:15px; text-shadow: 0 4px 15px rgba(249,115,22,0.4);">🏆</div>
                    <h3 style="font-family:'Outfit',sans-serif; color:var(--text-primary); font-size:2rem; margin-bottom:10px;">#${rank} Ranked Rider</h3>
                    <div style="font-size:2.5rem; font-weight:900; color:var(--primary-color); margin-bottom:20px; letter-spacing: 1px;">${rider.fullName}</div>
                    <div style="display:flex; justify-content:center; gap:30px; font-size:1.25rem; color:var(--text-secondary); margin-bottom:20px; flex-wrap: wrap;">
                        <span><i class="fas fa-map-marker-alt" style="color:var(--error-color);"></i> ${rider.city || 'India'}</span>
                        <span><i class="fas fa-star" style="color:var(--warning-color);"></i> ${rider.totalPoints} Points</span>
                        <span><i class="fas fa-motorcycle" style="color:var(--info-color);"></i> ${platform}</span>
                    </div>
                    <p style="font-style:italic; color:var(--text-muted); font-size:1.2rem; max-width: 800px; text-align: center;">"Joining the leaderboard has been a game-changer for my earnings!"</p>
                </div>
            `;
        }).join('');

        let currentIndex = 0;
        
        function slideNext() {
            currentIndex++;
            sliderWrapper.style.transition = 'transform 0.8s ease-in-out';
            sliderWrapper.style.transform = `translateX(-${currentIndex * 100}%)`;
            
            if (currentIndex === top5.length) {
                setTimeout(() => {
                    sliderWrapper.style.transition = 'none';
                    currentIndex = 0;
                    sliderWrapper.style.transform = `translateX(0)`;
                }, 800);
            }
        }

        // Clear any existing interval to prevent overlapping
        if (sliderInterval) clearInterval(sliderInterval);
        
        // Change every 5 seconds
        sliderInterval = setInterval(slideNext, 5000);
    }

    function renderAchievementsGrid() {
        const grid = document.getElementById('achievementsGrid');
        if (!grid) return;
        const lang = localStorage.getItem('selectedLang') || 'en';
        const pts = currentUser ? (currentUser.totalPoints || 0) : 0;
        const del = currentUser ? (currentUser.totalDeliveries || 0) : 0;
        const refs = currentUser ? (currentUser.referrals || 0) : 0;
        const achievements = [
            { title: TRANSLATIONS[lang].ach_speed_demon_title, icon: '🚀', desc: TRANSLATIONS[lang].ach_speed_demon_desc, unlocked: refs >= 1 },
            { title: TRANSLATIONS[lang].ach_five_star_title, icon: '⭐', desc: TRANSLATIONS[lang].ach_five_star_desc, unlocked: refs >= 10 },
            { title: TRANSLATIONS[lang].ach_century_title, icon: '💯', desc: TRANSLATIONS[lang].ach_century_desc, unlocked: refs >= 25 },
            { title: TRANSLATIONS[lang].ach_expert_title, icon: '🌟', desc: TRANSLATIONS[lang].ach_expert_desc, unlocked: refs >= 50 }
        ];
        grid.innerHTML = achievements.map(a => `
            <div style="text-align:center; padding:1.5rem 1rem; border:1px solid var(--card-border); border-radius:var(--border-radius-md); background:rgba(255,255,255,0.01); ${a.unlocked ? '' : 'filter:grayscale(0.8); opacity:0.5;'}">
                <div style="font-size:2.5rem; margin-bottom:0.5rem;">${a.icon}</div>
                <h4 style="font-family:'Outfit'; font-size:0.95rem; margin-bottom:0.25rem;">${a.title}</h4>
                <p style="font-size:0.75rem; color:var(--text-secondary);">${a.desc}</p>
                <span class="badge ${a.unlocked ? 'badge-success' : 'badge-warning'}" style="font-size:0.65rem;">${a.unlocked ? TRANSLATIONS[lang].status_unlocked : TRANSLATIONS[lang].status_locked}</span>
            </div>`).join('');
    }

    // ===== DASHBOARD =====
    // ===== DASHBOARD =====
    function loadDashboardData() {
        if (!currentUser) return;
        fetch(`/api/stats/${currentUser.id}`).then(r => r.json()).then(result => {
            if (result.success) {
                const s = result.data;
                const totalRefsEl = document.getElementById('totalReferrals');
                if (totalRefsEl) totalRefsEl.textContent = s.referrals || 0;
                
                const ratingEl = document.getElementById('riderRating');
                if (ratingEl) ratingEl.textContent = s.averageRating || '5.0';
                
                const pointsEl = document.getElementById('totalPoints');
                if (pointsEl) pointsEl.textContent = s.totalPoints || 0;
                
                currentUser.totalPoints = s.totalPoints || 0;
                currentUser.referrals = s.referrals || 0;
            } else {
                showToast(`Failed to load stats: ${result.message || result.error || 'Unknown error'}`, 'error');
            }
        }).catch(err => {
            showToast(`Network error: ${err.message}`, 'error');
        });
        loadDashboardCharts();
    }

    function loadDashboardCharts() {
        Object.keys(activeCharts).forEach(k => { if (activeCharts[k]) { activeCharts[k].destroy(); delete activeCharts[k]; } });
        const lang = localStorage.getItem('selectedLang') || 'en';

        fetch(`/dashboard/analytics/${currentUser.id}`).then(r => r.json()).then(result => {
            if (result.success) {
                const data = result.data;
                const refCtx = document.getElementById('referralsChart');
                if (refCtx) {
                    activeCharts.referrals = new Chart(refCtx.getContext('2d'), {
                        type: 'bar',
                        data: {
                            labels: data.weeklyData.map(d => d.day),
                            datasets: [{
                                label: TRANSLATIONS[lang].chart_weekly_referrals || 'Weekly Referrals',
                                data: data.weeklyData.map(d => d.referrals),
                                backgroundColor: 'rgba(59,130,246,0.65)',
                                borderColor: 'rgba(59,130,246,1)',
                                borderWidth: 1.5,
                                borderRadius: 6
                            }]
                        },
                        options: getChartOpts(false)
                    });
                }
                const ptsCtx = document.getElementById('pointsChart');
                if (ptsCtx) {
                    activeCharts.points = new Chart(ptsCtx.getContext('2d'), {
                        type: 'line',
                        data: {
                            labels: data.weeklyData.map(d => d.day),
                            datasets: [{
                                label: TRANSLATIONS[lang].chart_weekly_points || 'Points Earned',
                                data: data.weeklyData.map(d => d.points),
                                borderColor: 'rgba(16,185,129,1)',
                                backgroundColor: 'rgba(16,185,129,0.08)',
                                borderWidth: 3,
                                tension: 0.35,
                                fill: true
                            }]
                        },
                        options: getChartOpts(true)
                    });
                }
            } else {
                console.error('Failed to load chart analytics:', result.message || result.error || 'Unknown error');
            }
        }).catch(err => console.error('Network error loading charts:', err));

        fetch('/dashboard/city-analytics').then(r => r.json()).then(result => {
            if (result.success) {
                const cityCtx = document.getElementById('citiesChart');
                if (cityCtx) {
                    activeCharts.cities = new Chart(cityCtx.getContext('2d'), {
                        type: 'bar',
                        data: {
                            labels: result.data.map(c => c.name),
                            datasets: [{
                                label: TRANSLATIONS[lang].chart_cities_referral || 'Referrals',
                                data: result.data.map(c => c.referrals),
                                backgroundColor: result.data.map((_, i) => ['rgba(59,130,246,0.65)', 'rgba(16,185,129,0.65)', 'rgba(251,191,36,0.65)', 'rgba(239,68,68,0.65)', 'rgba(168,85,247,0.65)', 'rgba(236,72,153,0.65)'][i % 6]),
                                borderColor: result.data.map((_, i) => ['rgba(59,130,246,1)', 'rgba(16,185,129,1)', 'rgba(251,191,36,1)', 'rgba(239,68,68,1)', 'rgba(168,85,247,1)', 'rgba(236,72,153,1)'][i % 6]),
                                borderWidth: 1.5,
                                borderRadius: 6
                            }]
                        },
                        options: {
                            indexAxis: 'y',
                            responsive: true,
                            plugins: { legend: { display: false } },
                            scales: {
                                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } },
                                y: { grid: { display: false }, ticks: { color: '#9ca3af' } }
                            }
                        }
                    });
                }
            }
        });

        fetch('/dashboard/login-analytics').then(r => r.json()).then(result => {
            if (result.success) {
                const loginCtx = document.getElementById('loginLogoutChart');
                if (loginCtx) {
                    activeCharts.loginLogout = new Chart(loginCtx.getContext('2d'), {
                        type: 'line',
                        data: {
                            labels: result.data.map(d => d.day),
                            datasets: [
                                {
                                    label: 'Logins',
                                    data: result.data.map(d => d.logins),
                                    borderColor: 'rgba(59,130,246,1)',
                                    backgroundColor: 'rgba(59,130,246,0.1)',
                                    borderWidth: 2,
                                    tension: 0.4,
                                    fill: true
                                },
                                {
                                    label: 'Logouts',
                                    data: result.data.map(d => d.logouts),
                                    borderColor: 'rgba(239,68,68,1)',
                                    backgroundColor: 'rgba(239,68,68,0.1)',
                                    borderWidth: 2,
                                    tension: 0.4,
                                    fill: true
                                }
                            ]
                        },
                        options: {
                            responsive: true,
                            plugins: {
                                legend: { display: true, labels: { color: '#e5e7eb' } }
                            },
                            scales: {
                                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } },
                                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } }
                            }
                        }
                    });
                }
            }
        });
    }

    function getChartOpts(legend) {
        return { responsive: true, plugins: { legend: { display: legend, labels: { color: '#f3f4f6' } } }, scales: { x: { grid: { display: false }, ticks: { color: '#9ca3af' } }, y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } } } };
    }

    // ===== VEHICLES =====
    function loadVehiclesData() {
        if (!currentUser) return;
        fetch(`/api/riders/${currentUser.id}/vehicles`).then(r => r.json()).then(result => {
            if (result.success) { renderVehiclesGrid(result.data); renderInsuranceTable(result.data); }
        });
    }

    function renderVehiclesGrid(vehicles) {
        const grid = document.getElementById('vehiclesGrid');
        const lang = localStorage.getItem('selectedLang') || 'en';
        if (!vehicles.length) { grid.innerHTML = `<div class="card" style="grid-column:1/-1; text-align:center; padding:3rem;"><p class="text-muted">${TRANSLATIONS[lang].no_vehicles}</p></div>`; return; }
        grid.innerHTML = vehicles.map(v => {
            const sc = v.status === 'active' ? 'badge-success' : 'badge-warning';
            const sl = v.status === 'active' ? TRANSLATIONS[lang].status_active : TRANSLATIONS[lang].status_maintenance;
            return `<div class="card"><div class="card-header"><h3 class="card-title"><i class="fas fa-motorcycle text-primary-color"></i> ${v.make} ${v.model}</h3><span class="badge ${sc}">${sl}</span></div><div class="card-body"><div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; font-size:0.875rem;"><div><strong>${TRANSLATIONS[lang].lbl_type}:</strong> ${v.vehicleType}</div><div><strong>${TRANSLATIONS[lang].lbl_color}:</strong> ${v.color}</div><div style="grid-column:1/-1;"><strong>${TRANSLATIONS[lang].lbl_plate}:</strong> ${v.licensePlate}</div><div style="grid-column:1/-1;"><strong>${TRANSLATIONS[lang].lbl_registration}:</strong> ${new Date(v.registrationDate).toLocaleDateString()}</div></div></div></div>`;
        }).join('');
    }

    function renderInsuranceTable(vehicles) {
        const tbody = document.getElementById('insuranceTableBody');
        const lang = localStorage.getItem('selectedLang') || 'en';
        if (!vehicles.length) { tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">${TRANSLATIONS[lang].no_documents}</td></tr>`; return; }
        tbody.innerHTML = vehicles.map(v => {
            const ins = v.insurance || {};
            const expDate = ins.expiryDate ? new Date(ins.expiryDate) : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
            const expiring = (expDate - Date.now()) < (30 * 24 * 60 * 60 * 1000);
            const sc = expiring ? 'badge-danger' : 'badge-success';
            const sl = expiring ? TRANSLATIONS[lang].status_expiring_soon : TRANSLATIONS[lang].status_active;
            return `<tr><td><strong>${v.make} ${v.model}</strong></td><td>${ins.provider || 'ICICI Lombard'}</td><td>${ins.policyNumber || `POL-2026-${v.id.substring(0,5).toUpperCase()}`}</td><td>${expDate.toLocaleDateString()}</td><td><span class="badge ${sc}">${sl}</span></td></tr>`;
        }).join('');
    }

    function togglePasswordVisibility(inputId, iconId) {
        const input = document.getElementById(inputId);
        const icon = document.getElementById(iconId);
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    function showRiderForgotForm() {
        document.getElementById('loginForm').style.display = 'none';
        const registerText = document.getElementById('loginRegisterText');
        if (registerText) registerText.style.display = 'none';
        document.getElementById('riderForgotForm').style.display = 'block';
    }

    function showRiderLoginForm() {
        document.getElementById('riderForgotForm').style.display = 'none';
        document.getElementById('loginForm').style.display = 'block';
        const registerText = document.getElementById('loginRegisterText');
        if (registerText) registerText.style.display = 'block';
    }

    async function handleRiderPasswordReset(e) {
        e.preventDefault();
        const phone = document.getElementById('riderForgotPhone').value.trim();
        const otp = document.getElementById('riderForgotOtp').value;
        const newPassword = document.getElementById('riderForgotNewPassword').value;
        const btn = document.getElementById('riderResetBtn');
        const errBox = document.getElementById('riderForgotErrorMsg');
        const errText = document.getElementById('riderForgotErrorText');

        if (phone.length !== 10) {
            showToast('Phone must be exactly 10 digits', 'error'); return;
        }

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resetting...';
        errBox.style.display = 'none';

        try {
            const res = await fetch('/auth/reset-rider-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, otp, newPassword })
            });
            const result = await res.json();
            if (result.success) {
                showToast('Password reset successful! You can now login.', 'success');
                showRiderLoginForm();
            } else {
                errText.textContent = result.error || 'Failed to reset password';
                errBox.style.display = 'block';
            }
        } catch (err) {
            errText.textContent = 'Network error: ' + err.message;
            errBox.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-key"></i> Reset Password';
        }
    }

    function handleRegister(e) {
        e.preventDefault();
        fetch('/api/vehicles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ riderId: currentUser.id, vehicleType: document.getElementById('vehicleType').value, licensePlate: document.getElementById('licensePlate').value, color: document.getElementById('vehicleColor').value, make: document.getElementById('vehicleMake').value, model: document.getElementById('vehicleModel').value }) })
        .then(r => r.json()).then(result => { if (result.success) { closeModal('vehicleModal'); document.getElementById('vehicleForm').reset(); showToast('Vehicle added!', 'success'); loadVehiclesData(); } });
    }

    function handleAddVehicle(e) {
        e.preventDefault();
        fetch('/api/vehicles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ riderId: currentUser.id, vehicleType: document.getElementById('vehicleType').value, licensePlate: document.getElementById('licensePlate').value, color: document.getElementById('vehicleColor').value, make: document.getElementById('vehicleMake').value, model: document.getElementById('vehicleModel').value }) })
        .then(r => r.json()).then(result => { if (result.success) { closeModal('vehicleModal'); document.getElementById('vehicleForm').reset(); showToast('Vehicle added!', 'success'); loadVehiclesData(); } });
    }

    // ===== PROFILE & QR CODE =====
    function loadProfileData() {
        if (!currentUser) return;
        document.getElementById('profileName').value = currentUser.fullName || '';
        document.getElementById('profileEmail').value = currentUser.email || '';
        document.getElementById('profilePhone').value = currentUser.phone || '';
        document.getElementById('profileCity').value = currentUser.city || '';

        const code = currentUser.referralCode || 'RW-XXXX';
        const refLink = getReferralLink(code);

        document.getElementById('referralCodeDisplay').textContent = code;
        document.getElementById('referralLinkInput').value = refLink;
        document.getElementById('referralCount').textContent = currentUser.referrals || 0;
        document.getElementById('profileTotalPoints').textContent = currentUser.totalPoints || 0;

        // Milestone progress bars
        const refs = currentUser.referrals || 0;
        const msLabel = document.getElementById('milestoneReferralsLabel');
        if (msLabel) msLabel.textContent = refs;
        document.getElementById('m10Progress').textContent = `${Math.min(refs, 10)}/10`;
        document.getElementById('m10Bar').style.width = `${Math.min(refs / 10 * 100, 100)}%`;
        document.getElementById('m25Progress').textContent = `${Math.min(refs, 25)}/25`;
        document.getElementById('m25Bar').style.width = `${Math.min(refs / 25 * 100, 100)}%`;
        document.getElementById('m50Progress').textContent = `${Math.min(refs, 50)}/50`;
        document.getElementById('m50Bar').style.width = `${Math.min(refs / 50 * 100, 100)}%`;

        // Generate QR Code
        const qrContainer = document.getElementById('qrCodeContainer');
        qrContainer.innerHTML = '';
        try {
            new QRCode(qrContainer, { text: refLink, width: 130, height: 130, colorDark: '#0a0f1e', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.H });
        } catch(e) {
            qrContainer.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(refLink)}&color=0a0f1e&bgcolor=ffffff" alt="QR Code" style="width:130px; height:130px;">`;
        }
    }

    function updateProfileInfo(e) {
        e.preventDefault();
        const phone = document.getElementById('profilePhone').value;
        if (phone.length !== 10) { showToast('Phone must be 10 digits', 'error'); return; }
        fetch(`/api/riders/${currentUser.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fullName: document.getElementById('profileName').value, phone, city: document.getElementById('profileCity').value }) })
        .then(r => r.json()).then(result => { if (result.success) { currentUser = result.data; showToast('Profile updated!', 'success'); loadProfileData(); } });
    }

    function updatePaymentDetails(e) { e.preventDefault(); showToast('Bank details updated!', 'success'); }

    function copyReferralCode() {
        const code = currentUser ? currentUser.referralCode : '';
        const refLink = getReferralLink(code);
        navigator.clipboard.writeText(refLink).then(() => showToast('Referral link copied!', 'success')).catch(() => {
            const inp = document.getElementById('referralLinkInput'); inp.select(); document.execCommand('copy'); showToast('Copied!', 'success');
        });
    }

    window.shareToWhatsApp = function(e) {
        if (e) e.preventDefault();
        if (typeof window.shareWithImage === 'function') {
            window.shareWithImage(e);
        }
    }

    window.shareWithImage = async function(e, specificCode = null, specificName = null) {
        if (e) e.preventDefault();
        
        // Find the fallback URL (the normal WhatsApp share link)
        let fallbackUrl = '';
        let text = '';

        if (!specificCode) {
            const whatsappSendLink = document.getElementById('whatsappSendLink');
            if (whatsappSendLink) {
                // we use getAttribute to get the actual assigned URL if it's there
                fallbackUrl = whatsappSendLink.getAttribute('href') || whatsappSendLink.href;
                const previewEl = document.getElementById('whatsappMsgPreview');
                if (previewEl) {
                    // Get the text representation, converting <br> to newlines
                    text = previewEl.innerHTML.replace(/<br\s*[\/]?>/gi, "\n").replace(/<[^>]+>/g, "");
                }
            }
        }
        
        // If not found in the DOM (e.g. called from a different context) or explicit arguments passed, generate it
        if (!text) {
            const code = specificCode || (currentUser ? currentUser.referralCode : 'RWPRO');
            const fullName = specificName || (currentUser ? currentUser.fullName : 'Rider');
            text = getWhatsAppMessageText(fullName, code);
            fallbackUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        }

        try {
            // Fetch the image to share
            const response = await fetch('/og-image.png');
            if (!response.ok) throw new Error('Network response was not ok');
            const blob = await response.blob();
            const file = new File([blob], 'roadwarrior-promo.png', { type: blob.type });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'Join Road Warrior EV',
                    text: text,
                    files: [file]
                });
                if (typeof trackEvent === 'function') trackEvent('share_with_image', { success: true });
            } else {
                // Fallback for desktop browsers without Web Share API file support
                showToast('Image sharing not supported on this browser. Opening WhatsApp...', 'info');
                // Optionally download the image for the user to attach manually
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'roadwarrior-promo.png';
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(a.href);
                
                setTimeout(() => window.open(fallbackUrl, '_blank'), 500);
            }
        } catch (err) {
            console.error('Sharing failed', err);
            if (err.name !== 'AbortError') {
                window.open(fallbackUrl, '_blank');
            }
        }
    }

    // ===== ADMIN =====
    let currentAdminTab = 'allRiders';
    function switchAdminTab(tab) {
        currentAdminTab = tab;
        document.querySelectorAll('.admin-tab').forEach(t => {
            const onclickAttr = t.getAttribute('onclick');
            t.classList.toggle('active', onclickAttr && onclickAttr.includes(`'${tab}'`));
        });
        document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
        const panel = document.getElementById(`panel-${tab}`);
        if (panel) panel.classList.add('active');
        
        if (tab === 'evLeads') loadEVLeads();
        else if (tab === 'insLeads') loadInsLeads();
        else if (tab === 'topReferrers') loadTopReferrers();
        else if (tab === 'cityStats') loadCityStats();
        else if (tab === 'visitorAnalytics') loadVisitorAnalytics();
        else if (tab === 'botIntelligence') loadBotIntelligence();
        else if (tab === 'emailLeads') loadEmailLeads();
    }

    // Helper to include admin JWT token in Authorization header
    function getAdminAuthHeaders() {
        const token = sessionStorage.getItem('adminToken') || sessionStorage.getItem('adminJwt') || localStorage.getItem('adminToken') || localStorage.getItem('adminJwt');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    function showAdminSetupForm(e) { e.preventDefault(); document.getElementById('adminLoginForm').style.display = 'none'; document.getElementById('adminForgotForm').style.display = 'none'; document.getElementById('adminResetForm').style.display = 'none'; document.getElementById('adminSetupForm').style.display = 'block'; document.getElementById('adminAuthTitle').innerHTML = '<i class="fas fa-user-shield text-primary-color"></i> Setup Admin'; document.getElementById('adminAuthSubtitle').innerText = 'Create your one-time admin account.'; }
    function showAdminForgotForm(e) { e.preventDefault(); document.getElementById('adminLoginForm').style.display = 'none'; document.getElementById('adminSetupForm').style.display = 'none'; document.getElementById('adminResetForm').style.display = 'none'; document.getElementById('adminForgotForm').style.display = 'block'; document.getElementById('adminAuthTitle').innerHTML = '<i class="fas fa-unlock-alt text-primary-color"></i> Forgot Password'; document.getElementById('adminAuthSubtitle').innerText = 'Recover your admin access.'; }
    function showAdminLoginForm(e) { if(e) e.preventDefault(); document.getElementById('adminSetupForm').style.display = 'none'; document.getElementById('adminForgotForm').style.display = 'none'; document.getElementById('adminResetForm').style.display = 'none'; document.getElementById('adminLoginForm').style.display = 'block'; document.getElementById('adminAuthTitle').innerHTML = '<i class="fas fa-lock text-primary-color"></i> Admin Login'; document.getElementById('adminAuthSubtitle').innerText = 'Enter credentials to access the admin panel.'; }
    function showAdminResetForm() { document.getElementById('adminForgotForm').style.display = 'none'; document.getElementById('adminResetForm').style.display = 'block'; document.getElementById('adminAuthTitle').innerHTML = '<i class="fas fa-key text-primary-color"></i> Reset Password'; document.getElementById('adminAuthSubtitle').innerText = 'Enter the OTP and your new password.'; }

    async function checkAdminExists() {
        try {
            const res = await fetch('/auth/admin/status');
            const result = await res.json();
            const link = document.getElementById('setupAdminLink');
            if (link) {
                if (result.exists) {
                    link.style.display = 'none';
                } else {
                    link.style.display = 'inline';
                }
            }
        } catch(e) { console.error('Error checking admin status', e); }
    }

    async function handleAdminSetup(e) {
        e.preventDefault();
        const emailInput = document.getElementById('setupAdminEmail');
        const email = emailInput.value.trim();
        const password = document.getElementById('setupAdminPassword').value;
        const btn = document.getElementById('adminSetupBtn');
        const errBox = document.getElementById('adminSetupErrorMsg');
        const errText = document.getElementById('adminSetupErrorText');

        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regex.test(email)) {
            validateAdminEmail(emailInput);
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
        errBox.style.display = 'none';

        try {
            const res = await fetch('/auth/admin/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const result = await res.json();
            if (result.success) {
                showToast('Admin account created successfully!', 'success');
                showAdminLoginForm();
                checkAdminExists();
            } else {
                errText.textContent = result.message || result.error || 'Failed to setup admin';
                errBox.style.display = 'block';
            }
        } catch (err) {
            errText.textContent = 'Network error: ' + err.message;
            errBox.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-user-shield"></i> Create Admin';
        }
    }

    async function handleAdminLogin(e) {
        e.preventDefault();
        const emailInput = document.getElementById('adminEmail');
        const email = emailInput.value.trim();
        const password = document.getElementById('adminPassword').value;
        const btn = document.getElementById('adminLoginBtn');
        const errBox = document.getElementById('adminLoginErrorMsg');
        const errText = document.getElementById('adminLoginErrorText');

        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regex.test(email)) {
            validateAdminEmail(emailInput);
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
        errBox.style.display = 'none';

        try {
            const res = await fetch('/auth/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const result = await res.json();

            if (result.success) {
                sessionStorage.setItem('adminToken', result.token);
                sessionStorage.setItem('adminRole', result.role || 'admin');
                showToast('Admin login successful!', 'success');
                navigateTo('/admin');
            } else {
                errText.textContent = result.message || result.error || 'Invalid admin credentials';
                errBox.style.display = 'block';
            }
        } catch (err) {
            errText.textContent = 'Network error: ' + err.message;
            errBox.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        }
    }

    async function requestAdminPasswordReset(e) {
        e.preventDefault();
        const emailInput = document.getElementById('forgotAdminEmail');
        const email = emailInput.value.trim();
        const btn = document.getElementById('adminForgotBtn');
        const errBox = document.getElementById('adminForgotErrorMsg');
        const errText = document.getElementById('adminForgotErrorText');
        const successBox = document.getElementById('adminForgotSuccessMsg');

        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regex.test(email)) {
            validateAdminEmail(emailInput);
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        errBox.style.display = 'none';
        successBox.style.display = 'none';

        try {
            const res = await fetch('/auth/admin/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const result = await res.json();
            if (result.success) {
                successBox.style.display = 'block';
                setTimeout(() => {
                    showAdminResetForm();
                }, 1500);
            } else {
                errText.textContent = result.message || result.error || 'Failed to send OTP';
                errBox.style.display = 'block';
            }
        } catch (err) {
            errText.textContent = 'Network error: ' + err.message;
            errBox.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send OTP';
        }
    }

    async function verifyAdminOTP(e) {
        e.preventDefault();
        const email = document.getElementById('forgotAdminEmail').value;
        const otp = document.getElementById('resetAdminOtp').value;
        const newPassword = document.getElementById('resetAdminPassword').value;
        const btn = document.getElementById('adminResetBtn');
        const errBox = document.getElementById('adminResetErrorMsg');
        const errText = document.getElementById('adminResetErrorText');

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
        errBox.style.display = 'none';

        try {
            const res = await fetch('/auth/admin/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, newPassword })
            });
            const result = await res.json();
            if (result.success) {
                showToast('Password reset successful! Please login.', 'success');
                showAdminLoginForm();
            } else {
                errText.textContent = result.message || result.error || 'Failed to reset password';
                errBox.style.display = 'block';
            }
        } catch (err) {
            errText.textContent = 'Network error: ' + err.message;
            errBox.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-key"></i> Reset Password';
        }
    }

    function handleAdminLogout() {
        sessionStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminRole');
        sessionStorage.removeItem('adminJwt');
        showToast('Admin logged out successfully', 'success');
        navigateTo('/home');
    }

    function loadAdminData() {
        fetch('/dashboard/system-stats', { headers: getAdminAuthHeaders() }).then(r => r.json()).then(result => {
            if (result.success) {
                const s = result.data;
                // Removed fake totalRiders assignment to display actual registered user count instead
            } else {
                showToast(`Failed to load stats: ${result.message || result.error || 'Unknown error'}`, 'error');
            }
        }).catch(err => showToast(`Network error: ${err.message}`, 'error'));
        
        fetch('/api/admin/riders', { headers: getAdminAuthHeaders() }).then(r => r.json()).then(result => {
            if (result.success) {
                allAdminRiders = result.data;
                document.getElementById('adminTotalRiders').textContent = allAdminRiders.length;
                document.getElementById('adminEVRiders').textContent = allAdminRiders.filter(r => (r.vehicleType || '').toLowerCase().includes('electric')).length;
                document.getElementById('adminHotLeads').textContent = allAdminRiders.filter(r => r.openToEV === 'Yes' || r.openToEV === 'Need more information' || (r.tags || []).includes('Hot EV Lead')).length;
                document.getElementById('adminInsLeads').textContent = allAdminRiders.filter(r => r.hasAccidentalInsurance === 'No' || r.hasAccidentalInsurance === 'Not sure' || r.hasHealthInsurance === 'No' || r.hasHealthInsurance === 'Not sure' || (r.tags || []).includes('Insurance Lead')).length;

                const filterEl = document.getElementById('adminLeadFilter');
                if (filterEl) filterEl.value = 'ALL';

                filterAdminRiders();
            } else {
                showToast(`Failed to load admin riders: ${result.message || result.error || 'Unknown error'}`, 'error');
            }
        }).catch(err => showToast(`Network error: ${err.message}`, 'error'));
    }

    window.clickAdminStat = function(type) {
        if (type === 'registered') {
            document.getElementById('adminLeadFilter').value = 'ALL';
            switchAdminTab('allRiders');
            filterAdminRiders();
        } else if (type === 'evRiders') {
            document.getElementById('adminLeadFilter').value = 'EV_RIDERS';
            switchAdminTab('allRiders');
            filterAdminRiders();
        } else if (type === 'hotLeads') {
            switchAdminTab('evLeads');
        } else {
            switchAdminTab(type);
        }
        
        // Scroll down to the admin tabs section so the user sees the content change
        setTimeout(() => {
            const tabsSection = document.querySelector('.admin-tabs');
            if (tabsSection) {
                tabsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 50);
    };

    function filterAdminRiders() {
        const val = document.getElementById('adminLeadFilter') ? document.getElementById('adminLeadFilter').value : 'ALL';
        let filtered = allAdminRiders;
        if (val === 'EV_SALE_LEAD') {
            filtered = allAdminRiders.filter(r => r.openToEV === 'Yes' || r.openToEV === 'Need more information' || (r.tags || []).includes('Hot EV Lead'));
        } else if (val === 'EV_RIDERS') {
            filtered = allAdminRiders.filter(r => (r.vehicleType || '').toLowerCase().includes('electric'));
        } else if (val === 'PERSONAL_INSURANCE_LEAD' || val === 'BIKE_INSURANCE_LEAD') {
            filtered = allAdminRiders.filter(r => r.hasAccidentalInsurance === 'No' || r.hasAccidentalInsurance === 'Not sure' || r.hasHealthInsurance === 'No' || r.hasHealthInsurance === 'Not sure' || (r.tags || []).includes('Insurance Lead'));
        } else if (val !== 'ALL') {
            filtered = allAdminRiders.filter(r => (r.tags || []).includes(val));
        }
        renderAdminRidersTable(filtered);
    }

    function downloadLeadsCSV() {
        const val = document.getElementById('adminLeadFilter') ? document.getElementById('adminLeadFilter').value : 'ALL';
        const btn = document.querySelector('.btn-primary[onclick="downloadLeadsCSV()"]');
        if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Downloading...';
        
        fetch(`/api/admin/export/csv?segment=${val}`, {
            headers: getAdminAuthHeaders()
        })
        .then(res => {
            if (!res.ok) throw new Error('Download failed. You might need to log in again.');
            return res.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `leads_export_${val}_${Date.now()}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            showToast('CSV downloaded successfully!', 'success');
        })
        .catch(err => {
            showToast(`Error: ${err.message}`, 'error');
        })
        .finally(() => {
            if (btn) btn.innerHTML = '<i class="fas fa-download"></i> <span data-i18n="btn_download_csv">Download CSV</span>';
        });
    }

    function renderAdminRidersTable(riders) {
        const tbody = document.getElementById('adminRidersTableBody');
        const lang = localStorage.getItem('selectedLang') || 'en';
        if (!tbody) return;
        if (!riders.length) { tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">${TRANSLATIONS[lang].no_riders_db}</td></tr>`; return; }
        tbody.innerHTML = riders.map(r => {
            const tags = (r.tags || []).map(t => `<span class="tag-pill ${getTagClass(t)}">${t}</span>`).join('');
            const locationLink = (r.latitude && r.longitude) ? `<a href="https://www.google.com/maps?q=${r.latitude},${r.longitude}" target="_blank" style="color: #10b981; font-weight: 600; text-decoration: none;"><i class="fas fa-map-marker-alt"></i> Map (${Math.round(r.location_accuracy || 0)}m)</a>` : '<span class="text-muted">No GPS</span>';
            return `<tr><td>${r.fullName}</td><td>${r.city}</td><td>${r.phone || '—'}</td><td>${r.vehicleType || '—'}</td><td style="color:var(--primary-color); font-weight:700;">${r.totalPoints}</td><td style="color:var(--secondary-color); font-weight:700;">${r.referrals || 0}</td><td>${locationLink}</td><td>${tags || '—'}</td></tr>`;
        }).join('');
    }

    function loadEVLeads() {
        fetch('/api/admin/leads/ev', { headers: getAdminAuthHeaders() }).then(r => r.json()).then(result => {
            const tbody = document.getElementById('evLeadsTableBody');
            if (result.success && result.data.length) {
                tbody.innerHTML = result.data.map(r => `<tr><td>${r.fullName}</td><td>${r.city}</td><td>${r.phone || '—'}</td><td>${r.vehicleType || '—'}</td><td><span class="tag-pill tag-hot-ev">${r.openToEV || '—'}</span></td><td>${(r.switchTriggers || []).join(', ') || '—'}</td></tr>`).join('');
            } else tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No EV leads found</td></tr>';
        });
    }

    function loadInsLeads() {
        fetch('/api/admin/leads/insurance', { headers: getAdminAuthHeaders() }).then(r => r.json()).then(result => {
            const tbody = document.getElementById('insLeadsTableBody');
            if (result.success && result.data.length) {
                tbody.innerHTML = result.data.map(r => {
                    const ac = r.hasAccidentalInsurance || '—';
                    const hc = r.hasHealthInsurance || '—';
                    const pp = r.paidOutofPocketAccident || '—';
                    const acBadge = ac === 'No' ? `<span class="tag-pill tag-insurance">${ac}</span>` : `<span style="color:var(--text-secondary)">${ac}</span>`;
                    const hcBadge = hc === 'No' ? `<span class="tag-pill tag-insurance">${hc}</span>` : `<span style="color:var(--text-secondary)">${hc}</span>`;
                    return `<tr><td>${r.fullName}</td><td>${r.city}</td><td>${r.phone || '—'}</td><td>${acBadge}</td><td>${hcBadge}</td><td>${pp === 'Yes' ? '<span class="tag-pill tag-insurance">Yes</span>' : pp}</td></tr>`;
                }).join('');
            } else tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No insurance leads found</td></tr>';
        });
    }

    function loadTopReferrers() {
        fetch('/api/admin/riders', { headers: getAdminAuthHeaders() }).then(r => r.json()).then(result => {
            if (result.success) {
                const sorted = result.data.sort((a, b) => (b.referrals || 0) - (a.referrals || 0)).slice(0, 20);
                const tbody = document.getElementById('topReferrersTableBody');
                tbody.innerHTML = sorted.map((r, i) => {
                    const rn = i + 1;
                    const medal = rn === 1 ? '🥇' : rn === 2 ? '🥈' : rn === 3 ? '🥉' : rn;
                    const ms = [];
                    if (r.milestone10) ms.push('🏅 10'); if (r.milestone25) ms.push('🏆 25'); if (r.milestone50) ms.push('🎰 50');
                    return `<tr><td>${medal}</td><td>${r.fullName}</td><td>${r.city}</td><td style="font-family:monospace; color:var(--primary-color);">${r.referralCode || '—'}</td><td style="color:var(--secondary-color); font-weight:700;">${r.referrals || 0}</td><td style="color:var(--primary-color); font-weight:700;">${r.totalPoints}</td><td>${ms.join(' ') || '—'}</td></tr>`;
                }).join('');
            }
        });
    }

    function loadCityStats() {
        Promise.all([
            fetch('/api/admin/city-stats', { headers: getAdminAuthHeaders() }).then(r => r.json()),
            fetch('/api/admin/vehicle-stats', { headers: getAdminAuthHeaders() }).then(r => r.json())
        ]).then(([cityRes, vehicleRes]) => {
            if (!window.Chart) {
                console.error('Chart.js library is not loaded yet or blocked.');
                return;
            }
            if (cityRes.success) {
                const cityCtx = document.getElementById('adminCityChart');
                if (cityCtx && !activeCharts.adminCity) {
                    const cityColors = ['rgba(59,130,246,0.7)', 'rgba(16,185,129,0.7)', 'rgba(251,191,36,0.7)', 'rgba(239,68,68,0.7)', 'rgba(168,85,247,0.7)', 'rgba(236,72,153,0.7)'];
                    activeCharts.adminCity = new Chart(cityCtx.getContext('2d'), { type: 'bar', data: { labels: cityRes.data.map(c => c.city), datasets: [{ data: cityRes.data.map(c => c.count), backgroundColor: cityRes.data.map((_, i) => cityColors[i % cityColors.length]), borderColor: cityRes.data.map((_, i) => cityColors[i % cityColors.length].replace('0.7', '1')), borderWidth: 1.5, borderRadius: 6 }] }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#9ca3af' }, grid: { display: false } }, y: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.05)' } } } } });
                }
            }
            if (vehicleRes.success) {
                const vCtx = document.getElementById('adminVehicleChart');
                const vd = vehicleRes.data;
                if (vCtx && !activeCharts.adminVehicle) {
                    activeCharts.adminVehicle = new Chart(vCtx.getContext('2d'), { type: 'doughnut', data: { labels: ['Petrol', 'Electric', 'Diesel', 'Other'], datasets: [{ data: [vd.petrol, vd.electric, vd.diesel, vd.other], backgroundColor: ['rgba(251,191,36,0.8)', 'rgba(16,185,129,0.8)', 'rgba(59,130,246,0.8)', 'rgba(156,163,175,0.8)'], borderColor: '#161e31', borderWidth: 2 }] }, options: { responsive: true, plugins: { legend: { labels: { color: '#f3f4f6' } } } } });
                }
            }
        }).catch(e => {
            console.error('Error loading city stats charts:', e);
        });
    }

    // ===== UTILITIES =====
    function openModal(id) { const m = document.getElementById(id); if (m) m.classList.add('show'); }
    function closeModal(id) { const m = document.getElementById(id); if (m) m.classList.remove('show'); }

    // Toast notifications
    function showToast(message, type = 'info') {
        const existing = document.querySelector('.rw-toast');
        if (existing) existing.remove();
        const colors = { success: '#10b981', error: '#ef4444', warning: '#f97316', info: '#3b82f6' };
        const toast = document.createElement('div');
        toast.className = 'rw-toast';
        toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i> ${message}`;
        toast.style.cssText = `position:fixed; bottom:24px; right:24px; z-index:99999; background:${colors[type]}; color:white; padding:0.875rem 1.5rem; border-radius:10px; font-size:0.9rem; font-weight:600; box-shadow:0 8px 32px rgba(0,0,0,0.3); display:flex; align-items:center; gap:0.6rem; max-width:400px; animation:fadeInUp 0.3s ease; pointer-events:none;`;
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.animation = 'none'; toast.style.opacity = '0'; toast.style.transition = 'opacity 0.5s'; setTimeout(() => toast.remove(), 500); }, 3500);
    }
    // Website Auditor API Call
    async function runWebsiteAudit(event) {
        event.preventDefault();
        const url = document.getElementById('auditUrl').value;
        const btn = document.getElementById('auditBtn');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running Checks...';
        btn.disabled = true;

        try {
            const res = await fetch('/auditor/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            const result = await res.json();

            if (result.success) {
                const data = result.data;
                document.getElementById('auditResultUrl').innerText = url;
                document.getElementById('auditorResults').style.display = 'block';

                // Scores Grid
                const getScoreColor = score => score >= 80 ? 'var(--success-color)' : score >= 60 ? 'var(--warning-color)' : 'var(--danger-color)';
                const scoresHtml = `
                    <div class="stat-box"><div class="stat-value" style="color:${getScoreColor(data.overallScore)}">${data.overallScore}/100</div><div class="stat-label">Overall Score</div></div>
                    <div class="stat-box"><div class="stat-value" style="color:${getScoreColor(data.scores.seo)}">${data.scores.seo}</div><div class="stat-label">SEO Readiness</div></div>
                    <div class="stat-box"><div class="stat-value" style="color:${getScoreColor(data.scores.aiReadiness)}">${data.scores.aiReadiness}</div><div class="stat-label">AI Readiness (llms.txt)</div></div>
                    <div class="stat-box"><div class="stat-value" style="color:${getScoreColor(data.scores.trust)}">${data.scores.trust}</div><div class="stat-label">Trust & Security</div></div>
                `;
                document.getElementById('auditorScoresGrid').innerHTML = scoresHtml;

                // Checklist
                document.getElementById('auditorChecklistBody').innerHTML = data.checks.map(c => `
                    <tr>
                        <td><span class="tag-pill" style="background:#e0e7ff; color:#4338ca; border:none;">${c.category}</span></td>
                        <td style="font-weight:600;">${c.name}</td>
                        <td>${c.status === 'Pass' ? '<span class="tag-pill tag-ev">✅ Pass</span>' : '<span class="tag-pill tag-insurance">❌ Fail</span>'}</td>
                    </tr>
                `).join('');

                // Recommendations
                document.getElementById('auditorRecommendations').innerHTML = data.recommendations.map(r => `
                    <li style="margin-bottom:0.5rem;">${r}</li>
                `).join('');

                showToast('Website Audit completed successfully', 'success');
            } else {
                showToast('Error running audit: ' + (result.message || result.error || 'Unknown error'), 'error');
            }
        } catch (err) {
            showToast('Audit failed to run.', 'error');
        } finally {
            btn.innerHTML = '<i class="fas fa-play"></i> Run 25 Checks';
            btn.disabled = false;
        }
    }

    // Download PDF for Auditor
    function downloadAuditPDF() {
        const element = document.getElementById('auditorPrintableArea');
        if (!element) return;
        
        // Temporarily fix scrollbars and ensure background is dark so white text shows up
        const checklistBody = element.querySelector('.card-body[style*="max-height"]');
        let originalStyle = '';
        if (checklistBody) {
            originalStyle = checklistBody.getAttribute('style');
            checklistBody.style.maxHeight = 'none';
            checklistBody.style.overflowY = 'visible';
        }

        // Force single-column layout and ensure no clipping on A4
        const styleId = 'pdf-export-styles';
        let styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.innerHTML = `
            #auditorPrintableArea .row.cols-4, 
            #auditorPrintableArea .row.cols-2 {
                grid-template-columns: 1fr !important;
                display: flex !important;
                flex-direction: column !important;
            }
            #auditorPrintableArea .card {
                margin-bottom: 20px !important;
                /* Removed page-break-inside: avoid because it clips tall cards! */
            }
            #auditorPrintableArea .card-body {
                max-height: none !important;
                overflow: visible !important;
            }
            /* Try to prevent breaking inside table rows instead */
            #auditorPrintableArea tr {
                page-break-inside: avoid !important;
            }
        `;
        document.head.appendChild(styleEl);

        const urlText = document.getElementById('auditResultUrl').innerText || 'website';
        const filename = `Audit_Report_${urlText.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
        
        const opt = {
            margin:       10,
            filename:     filename,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, logging: false, backgroundColor: '#0f1f0f', scrollY: 0, scrollX: 0 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        showToast('Generating PDF...', 'info');
        html2pdf().set(opt).from(element).save().then(() => {
            showToast('PDF downloaded successfully!', 'success');
            if (checklistBody) checklistBody.setAttribute('style', originalStyle);
            document.getElementById(styleId)?.remove();
        }).catch(err => {
            console.error('PDF generation error:', err);
            showToast('Failed to generate PDF.', 'error');
            if (checklistBody) checklistBody.setAttribute('style', originalStyle);
            document.getElementById(styleId)?.remove();
        });
    }

// --- Custom Dropdown Logic for Delivery Platform ---
function togglePlatformDropdown() {
    const list = document.getElementById('platformDropdownList');
    list.style.display = list.style.display === 'none' ? 'block' : 'none';
}

function selectPlatform(value, logoUrl) {
    const selectedText = document.getElementById('platformSelectedText');
    if (value === '') {
        selectedText.innerHTML = `<span data-i18n="select_platform">Select platform</span>`;
    } else if (logoUrl) {
        selectedText.innerHTML = `<img src="${logoUrl}" onerror="this.style.display='none'" style="width:24px; height:24px; border-radius:4px; object-fit:contain; background:#fff; padding:2px;"> ${value}`;
    } else {
        selectedText.innerHTML = `<div style="width:24px; height:24px; border-radius:4px; background:var(--card-border); display:flex; align-items:center; justify-content:center;"><i class="fas fa-ellipsis-h" style="font-size:12px; color:var(--text-secondary);"></i></div> ${value}`;
    }
    
    const nativeSelect = document.getElementById('regPlatform');
    nativeSelect.value = value;
    nativeSelect.dispatchEvent(new Event('change'));
    
    document.getElementById('platformDropdownList').style.display = 'none';
}

document.addEventListener('click', function(e) {
    const wrapper = document.getElementById('platformCustomSelect');
    const list = document.getElementById('platformDropdownList');
    if (wrapper && list && !wrapper.contains(e.target)) {
        list.style.display = 'none';
    }
});

// Update standard form reset logic to also reset the custom dropdown visual state
const originalResetBtn = document.querySelector('button[type="reset"]');
if(originalResetBtn) {
    originalResetBtn.addEventListener('click', () => {
        setTimeout(() => { selectPlatform('', ''); }, 10);
    });
}

// ==========================================
// EXIT INTENT POPUP LOGIC
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    let exitIntentTriggered = sessionStorage.getItem('exitIntentTriggered') === 'true';

    document.addEventListener('mouseleave', (e) => {
        // Trigger if mouse leaves top of the window (clientY < 0)
        if (e.clientY < 0 && !exitIntentTriggered) {
            const modal = document.getElementById('leadCaptureModal');
            if (modal && !modal.classList.contains('show')) {
                exitIntentTriggered = true;
                sessionStorage.setItem('exitIntentTriggered', 'true');
                
                // Analytics Tracking
                if (typeof gtag === 'function') gtag('event', 'exit_intent_trigger', { event_category: 'Conversion' });
                if (typeof fbq === 'function') fbq('trackCustom', 'ExitIntent');

                // Update title to be more urgent for exit intent
                const title = document.getElementById('leadModalTitle');
                if (title) {
                    title.innerHTML = '⚠️ Wait! Don\'t leave without your EV Consultation!';
                }
                
                // Show the modal
                if (typeof openLeadModal === 'function') {
                    openLeadModal();
                }
            }
        }
    });
});

// ==========================================
// VISITOR INTELLIGENCE ANALYTICS
// ==========================================
async function loadVisitorAnalytics() {
    try {
        const headers = getAdminAuthHeaders();
        const [overviewRes, trafficRes] = await Promise.all([
            fetch('/api/admin/analytics/overview', { headers }),
            fetch('/api/admin/analytics/traffic', { headers })
        ]);
        const overview = await overviewRes.json();
        const traffic = await trafficRes.json();

        if (overview.success) {
            document.getElementById('metricTotalVisitors').innerText = overview.data.totalVisitors || 0;
            document.getElementById('metricTotalLeads').innerText = overview.data.totalLeads || 0;
            document.getElementById('metricSessions').innerText = overview.data.totalSessions || 0;
            document.getElementById('metricConversion').innerText = overview.data.conversionRate + '%';
            
            if (!window.Chart) {
                console.error('Chart.js library is not loaded yet or blocked.');
                return;
            }

            // Devices Chart
            const devCtx = document.getElementById('deviceBreakdownChart').getContext('2d');
            if (window.devChart) window.devChart.destroy();
            window.devChart = new Chart(devCtx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(overview.data.deviceBreakdown || {}),
                    datasets: [{
                        data: Object.values(overview.data.deviceBreakdown || {}),
                        backgroundColor: ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6']
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });

            // Browser Chart
            const brCtx = document.getElementById('browserBreakdownChart').getContext('2d');
            if (window.brChart) window.brChart.destroy();
            window.brChart = new Chart(brCtx, {
                type: 'pie',
                data: {
                    labels: Object.keys(overview.data.browserBreakdown || {}),
                    datasets: [{
                        data: Object.values(overview.data.browserBreakdown || {}),
                        backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#6366f1', '#8b5cf6']
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        if (traffic.success && traffic.data.dailyData) {
            const daily = traffic.data.dailyData;
            const trCtx = document.getElementById('dailyTrafficChart').getContext('2d');
            if (window.trChart) window.trChart.destroy();
            window.trChart = new Chart(trCtx, {
                type: 'line',
                data: {
                    labels: daily.map(d => d.date),
                    datasets: [{
                        label: 'Sessions',
                        data: daily.map(d => d.sessions),
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    } catch (e) {
        console.error('Failed to load visitor analytics', e);
    }
}

window.allBotIntelligenceData = [];
window.currentBotFilter = 'all';

async function loadBotIntelligence() {
    try {
        const res = await fetch('/api/admin/analytics/bot-intelligence', { headers: getAdminAuthHeaders() });
        const json = await res.json();
        
        if (json.success) {
            document.getElementById('botMetricHumans').innerText = json.data.metrics.humans;
            document.getElementById('botMetricAIBots').innerText = json.data.metrics.aiBots;
            document.getElementById('botMetricSearch').innerText = json.data.metrics.searchCrawlers;
            document.getElementById('botMetricDatacenter').innerText = json.data.metrics.datacenter;
            
            window.allBotIntelligenceData = json.data.bots || [];
            
            // Fallback: If the backend hasn't restarted yet, the payload won't contain human visitors. 
            // We fetch them from the drilldown API directly to ensure the dashboard works seamlessly.
            if (json.data.metrics.humans > 0 && !window.allBotIntelligenceData.some(b => b.category === 'Human' || b.type === 'Human Visitor')) {
                fetch('/api/admin/analytics/drilldown?type=visitors', { headers: getAdminAuthHeaders() })
                    .then(r => r.json())
                    .then(drilldown => {
                        if (drilldown.success && drilldown.data) {
                            const humans = drilldown.data.filter(v => !v.is_bot && !v.is_datacenter).map(v => ({
                                ip: v.ip_address,
                                type: 'Human Visitor',
                                category: 'Human',
                                organization: v.organization || 'Unknown',
                                user_agent: v.user_agent || v.browser,
                                pages_crawled: v.visit_count,
                                last_seen: v.last_visit,
                                is_datacenter: false
                            }));
                            window.allBotIntelligenceData = [...window.allBotIntelligenceData, ...humans];
                            if (window.currentBotFilter === 'humans') renderBotTable();
                        }
                    }).catch(e => console.warn('Failed to fetch fallback humans', e));
            }

            renderBotTable();
        }
    } catch (e) {
        console.error('Failed to load bot intelligence', e);
        document.getElementById('botIntelligenceTableBody').innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--danger-color);">Error loading bot data.</td></tr>`;
    }
}

window.filterBotTable = function(type) {
    window.currentBotFilter = type;
    
    // Highlight the selected box
    document.querySelectorAll('#botMetricsGrid .stat-box').forEach(box => {
        box.style.border = 'none';
        box.style.transform = 'scale(1)';
    });
    
    if (type !== 'all') {
        const boxMap = {
            'ai': 1,
            'search': 2,
            'datacenter': 3,
            'humans': 0
        };
        const boxIndex = boxMap[type];
        if (boxIndex !== undefined) {
            const box = document.querySelectorAll('#botMetricsGrid .stat-box')[boxIndex];
            if (box) {
                box.style.border = '2px solid var(--primary-color)';
                box.style.transform = 'scale(1.02)';
            }
        }
    }
    
    renderBotTable();
};

function renderBotTable() {
    const tbody = document.getElementById('botIntelligenceTableBody');
    let filtered = window.allBotIntelligenceData;
    
    if (window.currentBotFilter === 'ai') {
        const aiTypes = ['GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'PerplexityBot', 'ClaudeBot', 'Anthropic'];
        filtered = filtered.filter(b => b.category === 'AI Bot' || aiTypes.includes(b.type));
    } else if (window.currentBotFilter === 'search') {
        const searchTypes = ['Googlebot', 'Bingbot', 'AppleBot', 'DuckDuckBot', 'YandexBot', 'BaiduSpider', 'FacebookExternalHit', 'LinkedInBot', 'Twitterbot', 'Generic Bot'];
        filtered = filtered.filter(b => b.category === 'Search Engine' || b.category === 'Monitoring Service' || b.category === 'Social Crawler' || searchTypes.includes(b.type));
    } else if (window.currentBotFilter === 'datacenter') {
        filtered = filtered.filter(b => b.type === 'Datacenter Node' || (b.is_datacenter && !b.category));
    } else if (window.currentBotFilter === 'humans') {
        filtered = filtered.filter(b => b.category === 'Human' || b.type === 'Human Visitor');
    }
    
    if (filtered.length > 0) {
        tbody.innerHTML = filtered.map(b => `
            <tr>
                <td><span style="font-family:monospace;font-size:0.85rem;">${b.ip || 'Unknown'}</span></td>
                <td><span class="badge badge-warning" style="background:rgba(245,158,11,0.2);color:#f59e0b;padding:2px 6px;border-radius:4px;font-size:0.75rem;font-weight:700;">${b.type}</span></td>
                <td>${b.organization}</td>
                <td title="${b.user_agent}" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:0.8rem;">${b.user_agent}</td>
                <td>${b.pages_crawled}</td>
                <td style="font-size:0.85rem;color:var(--text-secondary);">${new Date(b.last_seen).toLocaleString()}</td>
            </tr>
        `).join('');
    } else {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-secondary);">No traffic found for this filter.</td></tr>`;
    }
}

// Download CSV helper
function downloadLeadsCSV() {
    const token = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken') || sessionStorage.getItem('adminJwt') || localStorage.getItem('adminJwt');
    window.location.href = `/api/admin/analytics/export/csv?token=${token}`;
}

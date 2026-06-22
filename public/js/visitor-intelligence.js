// ============================================================
// VISITOR INTELLIGENCE SYSTEM
// Handles granular event tracking and GPS location
// ============================================================

(function() {
    // Make sure we don't initialize twice
    if (window._visitorIntelligenceLoaded) return;
    window._visitorIntelligenceLoaded = true;

    // Helper to send events to backend
    function logVisitorEvent(eventType, elementText, elementId) {
        // visitorId and sessionId are declared in app.js
        if (!window.visitorId || !window.sessionId) return;

        const payload = {
            visitor_id: window.visitorId,
            session_id: window.sessionId,
            event_type: eventType,
            element_text: elementText || '',
            element_id: elementId || '',
            page: window.location.pathname + window.location.search
        };

        fetch('/api/visitor/event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(() => {});
    }

    // Auto-track clicks on buttons, links, and forms
    document.addEventListener('click', function(e) {
        let target = e.target;
        
        // Traverse up to find the actionable element (e.g. if they clicked an icon inside a button)
        while (target && target !== document.body) {
            if (target.tagName === 'A' || target.tagName === 'BUTTON' || target.classList.contains('btn') || target.onclick != null) {
                
                let text = target.innerText || target.value || target.title || '';
                text = text.substring(0, 50).trim(); // truncate for sanity
                
                let type = 'click';
                if (target.tagName === 'A') {
                    if (target.href.includes('wa.me') || target.href.includes('whatsapp')) type = 'whatsapp_click';
                    else if (target.href.startsWith('tel:')) type = 'call_click';
                    else type = 'link_click';
                } else if (target.tagName === 'BUTTON' || target.classList.contains('btn')) {
                    type = 'button_click';
                }

                logVisitorEvent(type, text, target.id);
                break;
            }
            target = target.parentNode;
        }
    });

    // Track Form Submissions
    document.addEventListener('submit', function(e) {
        let form = e.target;
        let formId = form.id || form.name || 'unknown_form';
        logVisitorEvent('form_submit', 'Form Submitted', formId);
    });

    // Request GPS Location (Call this when appropriate, e.g., via a button or after consent)
    window.requestVisitorGeolocation = function() {
        if (!navigator.geolocation) {
            console.warn("Geolocation is not supported by this browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            function(position) {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                if (!window.visitorId) return;

                // Update the backend with exact GPS
                fetch('/api/visitor/location', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        visitor_id: window.visitorId,
                        latitude: lat,
                        longitude: lng,
                        accuracy: position.coords.accuracy
                    })
                }).catch(() => {});
            },
            function(error) {
                console.warn("Geolocation denied or error:", error.message);
                // Fallback is handled implicitly because backend uses IPInfo anyway
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    // Expose logVisitorEvent for manual calls
    window.logVisitorEvent = logVisitorEvent;

    console.log("[Intelligence] Visitor event tracking initialized.");
})();

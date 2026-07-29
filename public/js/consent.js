// Google Consent Mode V2 Implementation
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

// Set default consent to 'denied' as a placeholder
// This should be loaded BEFORE GTM or GA4
gtag('consent', 'default', {
  'ad_storage': 'denied',
  'ad_user_data': 'denied',
  'ad_personalization': 'denied',
  'analytics_storage': 'denied',
  'wait_for_update': 500
});

gtag('set', 'ads_data_redaction', true);

const RW_CONSENT_KEY = 'rw_consent_v2';

function updateConsent(analytics, marketing) {
  const consentState = {
    'analytics_storage': analytics ? 'granted' : 'denied',
    'ad_storage': marketing ? 'granted' : 'denied',
    'ad_user_data': marketing ? 'granted' : 'denied',
    'ad_personalization': marketing ? 'granted' : 'denied'
  };
  
  gtag('consent', 'update', consentState);
  
  localStorage.setItem(RW_CONSENT_KEY, JSON.stringify({
    analytics, marketing, timestamp: Date.now()
  }));

  // Trigger custom event for GTM/pixels to fire
  if(analytics || marketing) {
    window.dispatchEvent(new Event('consent_updated'));
  }
}

function checkExistingConsent() {
  try {
    const stored = localStorage.getItem(RW_CONSENT_KEY);
    if(stored) {
      const { analytics, marketing } = JSON.parse(stored);
      updateConsent(analytics, marketing);
      return true;
    }
  } catch(e) {}
  return false;
}

// On Load
document.addEventListener("DOMContentLoaded", () => {
  if(!checkExistingConsent()) {
    const banner = document.getElementById('cookieConsentBanner');
    if(banner) {
      setTimeout(() => banner.classList.add('show'), 1000);
    }
  }
});

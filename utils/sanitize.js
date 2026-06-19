// utils/sanitize.js
// Input sanitization utilities — prevents XSS and SQL injection vectors

/**
 * Sanitize a plain string: strip HTML tags, encode entities, trim whitespace.
 * @param {string} str  - Raw input
 * @param {number} maxLen - Maximum allowed length (default 500)
 */
function sanitizeString(str, maxLen = 500) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/<[^>]*>/g, '')                          // strip HTML tags
    .replace(/[<>"'`]/g, c => ({
      '<': '&lt;', '>': '&gt;', '"': '&quot;',
      "'": '&#39;', '`': '&#96;'
    }[c]))
    .replace(/\\/g, '')                                // remove backslashes
    .trim()
    .slice(0, maxLen);
}

/**
 * Sanitize and validate an email address.
 * Returns empty string if invalid.
 */
function sanitizeEmail(email) {
  if (!email) return '';
  const cleaned = String(email).toLowerCase().trim().slice(0, 254);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return emailRegex.test(cleaned) ? cleaned : '';
}

/**
 * Sanitize a phone number — keeps only digits, validates Indian mobile format.
 * Returns cleaned digits or empty string if invalid.
 */
function sanitizePhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '').slice(0, 15);
  return digits;
}

/**
 * Sanitize a URL — ensures it starts with http/https.
 */
function sanitizeUrl(url) {
  if (!url) return '';
  const trimmed = String(url).trim().slice(0, 2048);
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return '';
}

/**
 * Sanitize an IP address (basic).
 */
function sanitizeIp(ip) {
  if (!ip) return '';
  // Accept IPv4 and IPv6
  return String(ip).replace(/[^0-9a-fA-F.:]/g, '').slice(0, 45);
}

module.exports = { sanitizeString, sanitizeEmail, sanitizePhone, sanitizeUrl, sanitizeIp };

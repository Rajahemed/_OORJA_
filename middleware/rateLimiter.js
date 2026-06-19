// middleware/rateLimiter.js
// Per-route rate limiters — stricter than the global 200/15min limiter

const rateLimit = require('express-rate-limit');

// Visitor tracking: 60 requests per minute per IP
const visitorTrackRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, error: 'Too many tracking requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'GET' // only limit POST
});

// Lead capture: 5 submissions per 10 minutes per IP (prevent spam)
const leadCaptureRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { success: false, error: 'Too many lead submissions. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Email unsubscribe: 10 per hour per IP
const unsubscribeRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Admin analytics endpoints: 120 per minute (relaxed for dashboard)
const adminAnalyticsRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { success: false, error: 'Too many requests.' },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  visitorTrackRateLimit,
  leadCaptureRateLimit,
  unsubscribeRateLimit,
  adminAnalyticsRateLimit
};

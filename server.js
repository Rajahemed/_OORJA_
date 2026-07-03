const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const compression = require('compression');

const app = express();

// Trust proxy is strictly required if hosted behind Nginx, Render, Heroku, or Cloudflare.
// Without this, express-rate-limit sees all users as having the exact same proxy IP.
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;

// Middleware
const cookieParser = require('cookie-parser');
const csrf = require('csurf');

// Enable gzip compression for all responses
app.use(compression());

// Security HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:    ["'self'"],
      scriptSrc:     ["'self'", "'unsafe-inline'",
                      "https://cdnjs.cloudflare.com",
                      "https://www.clarity.ms",
                      "https://scripts.clarity.ms",
                      "https://*.clarity.ms",
                      "https://www.googletagmanager.com",
                      "https://www.google-analytics.com",
                      "https://cdn.jsdelivr.net",
                      "https://unpkg.com",
                      "https://www.google.com/recaptcha/",
                      "https://www.gstatic.com/recaptcha/"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc:      ["'self'", "'unsafe-inline'",
                      "https://cdnjs.cloudflare.com",
                      "https://fonts.googleapis.com",
                      "https://unpkg.com"],
      fontSrc:       ["'self'",
                      "https://cdnjs.cloudflare.com",
                      "https://fonts.gstatic.com"],
      imgSrc:        ["'self'", "data:",
                      "https://logo.clearbit.com",
                      "https://via.placeholder.com",
                      "https://unpkg.com",
                      "https://roadwarriorev.com",
                      "https://www.google-analytics.com"],
      connectSrc:    ["'self'",
                      "https://zjqlkaewliccvgxqlnao.supabase.co",
                      "https://www.clarity.ms",
                      "https://*.clarity.ms",
                      "https://www.google-analytics.com",
                      "https://analytics.google.com",
                      "https://region1.google-analytics.com",
                      "https://api.resend.com",
                      "https://cdnjs.cloudflare.com",
                      "https://www.googletagmanager.com",
                      "https://fonts.googleapis.com",
                      "https://unpkg.com"],
      frameSrc:      ["'self'",
                      "https://www.google.com/recaptcha/",
                      "https://recaptcha.google.com/recaptcha/"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: 'Too many requests, please try again later.'
});
app.use(limiter);

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.html') || path.endsWith('.js') || path.endsWith('.css')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

// CSRF Protection
const csrfProtection = csrf({ cookie: true });
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.json({ csrfToken: req.csrfToken() });
});

// Session management
const sessions = new Map();
app.set('sessions', sessions);

// Custom session parser middleware
app.use((req, res, next) => {
  next(); // Note: replaced old custom cookie parser since cookie-parser is now used
});

// Routes
const apiRoutes       = require('./routes/api');
const authRoutes      = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const auditorRoutes   = require('./routes/auditor');
const analyticsRoutes = require('./routes/analytics'); // NEW — Intelligence System

app.use('/api',       csrfProtection, apiRoutes);
app.use('/auth',      csrfProtection, authRoutes);
app.use('/dashboard', csrfProtection, dashboardRoutes);
app.use('/auditor',   csrfProtection, auditorRoutes);
app.use('/api',       csrfProtection, analyticsRoutes); // visitor tracking, leads, analytics

// Unsubscribe page — no CSRF needed (GET, accessed via email link)
app.get('/unsubscribe', (req, res) => {
  // Handled by analytics router; this ensures SPA fallback doesn't intercept
  res.redirect(`/api/unsubscribe?email=${encodeURIComponent(req.query.email || '')}`);
});

app.get('/sitemap.xml', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sitemap.xml'));
});

const fs = require('fs');
const spaRoutes = ['/', '/home', '/login', '/register', '/vehicles', '/dashboard', '/score', '/profile', '/questionnaire', '/privacy', '/admin'];
spaRoutes.forEach(route => {
  app.get(route, (req, res) => {
    fs.readFile(path.join(__dirname, 'public', 'index.html'), 'utf8', (err, html) => {
      if (err) return res.status(500).send('Error loading page');
      
      html = html.replace(/WAITING_FOR_GA4_ID/g, process.env.GA_MEASUREMENT_ID || 'WAITING_FOR_GA4_ID');
      html = html.replace(/WAITING_FOR_GTM_ID/g, process.env.GTM_CONTAINER_ID || 'WAITING_FOR_GTM_ID');
      html = html.replace(/WAITING_FOR_CLARITY_ID/g, process.env.CLARITY_PROJECT_ID || 'WAITING_FOR_CLARITY_ID');
      html = html.replace(/WAITING_FOR_ADS_CONVERSION_ID/g, process.env.GOOGLE_ADS_CONVERSION_ID || 'WAITING_FOR_ADS_CONVERSION_ID');
      html = html.replace(/WAITING_FOR_PIXEL_ID/g, process.env.META_PIXEL_ID || 'WAITING_FOR_PIXEL_ID');
      html = html.replace(/WAITING_FOR_LINKEDIN_ID/g, process.env.LINKEDIN_INSIGHT_ID || 'WAITING_FOR_LINKEDIN_ID');
      html = html.replace(/WAITING_FOR_TAWK_ID/g, process.env.TAWKTO_PROPERTY_ID || 'WAITING_FOR_TAWK_ID');
      
      const whatsapp = process.env.WHATSAPP_NUMBER || '916360483386';
      html = html.replace(/https:\/\/wa\.me\/916360483386/g, `https://wa.me/${whatsapp}`);
      
      res.send(html);
    });
  });
});

// Expose non-secret analytics config to frontend via a safe endpoint
app.get('/api/client-config', (req, res) => {
  res.json({
    GA_MEASUREMENT_ID:        process.env.GA_MEASUREMENT_ID || '',
    GTM_CONTAINER_ID:         process.env.GTM_CONTAINER_ID || '',
    CLARITY_PROJECT_ID:       process.env.CLARITY_PROJECT_ID || '',
    META_PIXEL_ID:            process.env.META_PIXEL_ID || '',
    GOOGLE_ADS_CONVERSION_ID: process.env.GOOGLE_ADS_CONVERSION_ID || '',
    LINKEDIN_INSIGHT_ID:      process.env.LINKEDIN_INSIGHT_ID || '',
    TAWKTO_PROPERTY_ID:       process.env.TAWKTO_PROPERTY_ID || '',
    WHATSAPP_NUMBER:          process.env.WHATSAPP_NUMBER || ''
  });
});

// CSRF Error handler (must come before generic error handler)
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      success: false,
      error: 'Invalid or missing CSRF token. Please refresh the page and try again.'
    });
  }
  next(err);
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route Not Found',
    path: req.path
  });
});

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`
    ╔════════════════════════════════════════════════════════════════╗
    ║                                                                ║
    ║   🚗 ROAD WARRIOR EV         ║
    ║   ═══════════════════════════════════════════════════════════  ║
    ║                                                                ║
    ║   Server is running at: http://localhost:${port}                  
    ║   Environment: ${process.env.NODE_ENV || 'development'}                        
    ║   Version: 2.0.0                                              ║
    ║                                                                ║
    ╚════════════════════════════════════════════════════════════════╝
    `);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️  Port ${port} is already in use. Trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('❌ Server error:', err);
      process.exit(1);
    }
  });
}

if (require.main === module) {
  startServer(Number(PORT));
}

module.exports = app;

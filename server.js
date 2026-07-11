const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const compression = require('compression');
const https = require('https');
const fs = require('fs');

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

// Canonical www to non-www redirect
app.use((req, res, next) => {
  if (req.headers.host && req.headers.host.startsWith('www.')) {
    const newHost = req.headers.host.slice(4);
    return res.redirect(301, req.protocol + '://' + newHost + req.originalUrl);
  }
  next();
});

// Security HTTP headers
app.use(helmet({
  permissionsPolicy: {
    features: {
      camera: [],
      microphone: [],
      geolocation: []
    }
  },
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
                      "https://www.gstatic.com/recaptcha/",
                      "https://analytics.tiktok.com",
                      "https://static.ads-twitter.com"],
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
                      "https://roadwarrior.pro",
                      "https://www.google-analytics.com",
                      "https://analytics.twitter.com",
                      "https://t.co",
                      "https://analytics.tiktok.com"],
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
                      "https://unpkg.com",
                      "https://analytics.tiktok.com",
                      "https://analytics.twitter.com",
                      "https://t.co"],
      frameSrc:      ["'self'",
                      "https://www.google.com/recaptcha/",
                      "https://recaptcha.google.com/recaptcha/"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // limit each IP to 300 requests per windowMs
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
const analyticsRoutes = require('./routes/analytics'); // NEW — Intelligence System

app.use('/api',       csrfProtection, apiRoutes);
app.use('/auth',      csrfProtection, authRoutes);
app.use('/dashboard', csrfProtection, dashboardRoutes);
app.use('/api',       csrfProtection, analyticsRoutes); // visitor tracking, leads, analytics

// Unsubscribe page — no CSRF needed (GET, accessed via email link)
app.get('/unsubscribe', (req, res) => {
  // Handled by analytics router; this ensures SPA fallback doesn't intercept
  res.redirect(`/api/unsubscribe?email=${encodeURIComponent(req.query.email || '')}`);
});

app.get('/sitemap.xml', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sitemap.xml'));
});

const spaRoutes = ['/', '/home', '/login', '/register', '/vehicles', '/dashboard', '/score', '/profile', '/questionnaire', '/privacy', '/admin'];
spaRoutes.forEach(route => {
  app.get(route, (req, res) => {
    fs.readFile(path.join(__dirname, 'public', 'index.html'), 'utf8', (err, html) => {
      if (err) return res.status(500).send('Error loading page');
      
      html = html.replace(/WAITING_FOR_GA4_ID/g, process.env.GA_MEASUREMENT_ID || 'WAITING_FOR_GA4_ID');
      html = html.replace(/WAITING_FOR_GTM_ID/g, process.env.GTM_CONTAINER_ID || 'WAITING_FOR_GTM_ID');
      html = html.replace(/WAITING_FOR_CLARITY_ID/g, process.env.CLARITY_PROJECT_ID || 'WAITING_FOR_CLARITY_ID');
      html = html.replace(/WAITING_FOR_ADS_CONVERSION_ID/g, process.env.GOOGLE_ADS_CONVERSION_ID || 'WAITING_FOR_ADS_CONVERSION_ID');
      html = html.replace(/WAITING_FOR_AW_REMARKETING_ID/g, process.env.GOOGLE_ADS_REMARKETING_ID || 'WAITING_FOR_AW_REMARKETING_ID');
      html = html.replace(/WAITING_FOR_PIXEL_ID/g, process.env.META_PIXEL_ID || 'WAITING_FOR_PIXEL_ID');
      html = html.replace(/WAITING_FOR_LINKEDIN_ID/g, process.env.LINKEDIN_INSIGHT_ID || 'WAITING_FOR_LINKEDIN_ID');
      html = html.replace(/WAITING_FOR_TAWK_ID/g, process.env.TAWKTO_PROPERTY_ID || 'WAITING_FOR_TAWK_ID');
      html = html.replace(/WAITING_FOR_TIKTOK_PIXEL_ID/g, process.env.TIKTOK_PIXEL_ID || 'WAITING_FOR_TIKTOK_PIXEL_ID');
      html = html.replace(/WAITING_FOR_X_PIXEL_ID/g, process.env.X_PIXEL_ID || 'WAITING_FOR_X_PIXEL_ID');
      html = html.replace(/WAITING_FOR_GOOGLE_SC_ID/g, process.env.GOOGLE_SITE_VERIFICATION || 'WAITING_FOR_GOOGLE_SC_ID');
      html = html.replace(/WAITING_FOR_BING_SC_ID/g, process.env.BING_SITE_VERIFICATION || 'WAITING_FOR_BING_SC_ID');
      
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
    GOOGLE_ADS_REMARKETING_ID:process.env.GOOGLE_ADS_REMARKETING_ID || '',
    LINKEDIN_INSIGHT_ID:      process.env.LINKEDIN_INSIGHT_ID || '',
    TAWKTO_PROPERTY_ID:       process.env.TAWKTO_PROPERTY_ID || '',
    TIKTOK_PIXEL_ID:          process.env.TIKTOK_PIXEL_ID || '',
    X_PIXEL_ID:               process.env.X_PIXEL_ID || '',
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
// Auto-Translate Route
// fs and https are assumed to be declared elsewhere or we use them as needed

async function translateText(text, targetLang) {
    if (targetLang === 'en') return text;
    return new Promise((resolve) => {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    const translated = parsed[0].map(item => item[0]).join('');
                    resolve(translated);
                } catch (e) {
                    resolve(text);
                }
            });
        }).on('error', () => resolve(text));
    });
}

app.post('/api/auto-translate', async (req, res) => {
    try {
        const { targetLang, keys } = req.body;
        if (!targetLang || !keys || !Array.isArray(keys)) {
            return res.status(400).json({ error: 'Invalid payload' });
        }
        
        const dirPath = path.join(__dirname, `public/locales/${targetLang}`);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        
        const filePath = path.join(dirPath, 'common.json');
        let targetData = {};
        if (fs.existsSync(filePath)) {
            targetData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
        
        let enData = {};
        const enDirPath = path.join(__dirname, `public/locales/en`);
        if (!fs.existsSync(enDirPath)) {
            fs.mkdirSync(enDirPath, { recursive: true });
        }
        const enFilePath = path.join(enDirPath, 'common.json');
        if (fs.existsSync(enFilePath)) {
            enData = JSON.parse(fs.readFileSync(enFilePath, 'utf8'));
        }

        const newTranslations = {};
        let enUpdated = false;
        
        for (const item of keys) {
            const { key, text } = item;
            
            // Auto register to EN if it's new
            if (!enData[key] && text) {
                enData[key] = text;
                enUpdated = true;
            }
            
            if (!targetData[key]) {
                const translated = await translateText(text, targetLang);
                targetData[key] = translated;
                newTranslations[key] = translated;
            } else {
                newTranslations[key] = targetData[key];
            }
        }
        
        if (enUpdated) {
            fs.writeFileSync(enFilePath, JSON.stringify(enData, null, 4), 'utf8');
        }
        if (Object.keys(newTranslations).length > 0) {
            fs.writeFileSync(filePath, JSON.stringify(targetData, null, 4), 'utf8');
        }
        
        res.json({ success: true, translations: newTranslations });
    } catch (err) {
        console.error('Translation error:', err);
        res.status(500).json({ error: 'Failed to translate' });
    }
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

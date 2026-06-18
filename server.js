const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const compression = require('compression');

const app = express();
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
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://www.clarity.ms", "https://www.googletagmanager.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://logo.clearbit.com", "https://via.placeholder.com", "https://roadwarriorev.com"],
      connectSrc: ["'self'", "https://zjqlkaewliccvgxqlnao.supabase.co", "https://www.clarity.ms", "https://www.google-analytics.com"]
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
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

// CSRF Protection
const csrfProtection = csrf({ cookie: true });
app.get('/api/csrf-token', csrfProtection, (req, res) => {
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
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const auditorRoutes = require('./routes/auditor');

app.use('/api', csrfProtection, apiRoutes);
app.use('/auth', csrfProtection, authRoutes);
app.use('/dashboard', csrfProtection, dashboardRoutes);
app.use('/auditor', csrfProtection, auditorRoutes);

// Admin portal — served as its own standalone page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Serve index.html for all HTML pages to support Single Page Application (SPA) routing
const routes = ['/', '/home', '/login', '/register', '/vehicles', '/dashboard', '/score', '/profile', '/questionnaire'];
routes.forEach(route => {
  app.get(route, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
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

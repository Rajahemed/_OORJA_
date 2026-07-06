// routes/analytics.js
// Visitor Intelligence, Lead Capture, Admin Analytics, Email Queue

const express = require('express');
const router  = express.Router();
const supabase = require('../utils/supabase');
const adminAuth = require('../middleware/adminAuth');
const axios = require('axios');
const deviceList = require('android-device-list');
const { sanitizeString, sanitizeEmail, sanitizePhone, sanitizeIp } = require('../utils/sanitize');
const { triggerDripSequence, processEmailQueue } = require('../utils/email');
const {
  visitorTrackRateLimit,
  leadCaptureRateLimit,
  unsubscribeRateLimit,
  adminAnalyticsRateLimit
} = require('../middleware/rateLimiter');

// ============================================================
// POST /api/visitor/track
// Record anonymous visitor fingerprint — GDPR safe (no PII)
// ============================================================
router.post('/visitor/track', visitorTrackRateLimit, async (req, res) => {
  try {
    const {
      visitor_id, session_id, language, browser, operating_system,
      device_type, screen_resolution, referral_source, landing_page, current_page, user_agent
    } = req.body;

    let finalDeviceType = sanitizeString(device_type, 100);
    if (finalDeviceType.includes('(')) {
        const match = finalDeviceType.match(/\(([^)]+)\)/);
        if (match && match[1]) {
            const rawModel = match[1];
            try {
                const devices = deviceList.getDevicesByModel(rawModel);
                if (devices && devices.length > 0) {
                    const dev = devices[0];
                    finalDeviceType = finalDeviceType.replace(`(${rawModel})`, `(${dev.brand} ${dev.name})`);
                }
            } catch (err) {
                console.error('[analytics] Device map error:', err.message);
            }
        }
    }

    if (!visitor_id || !session_id) {
      return res.status(400).json({ success: false, error: 'visitor_id and session_id are required' });
    }

    const ip = sanitizeIp(
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || ''
    );

    // IP Geolocation via ipinfo.io
    let country = '', region = '', city = '', isp = '', timezone = '';
    let asn = '', carrierName = '', is_datacenter = false;
    if (ip && ip !== '127.0.0.1' && ip !== '::1') {
      try {
        const ipInfoRes = await axios.get(`https://ipinfo.io/${ip}/json?token=1b0663fe3437bb`);
        if (ipInfoRes.data) {
          country = ipInfoRes.data.country || '';
          region = ipInfoRes.data.region || '';
          city = ipInfoRes.data.city || '';
          timezone = ipInfoRes.data.timezone || '';

          // Exact ASN/Carrier and VPN/Proxy Detection
          let rawIsp = ipInfoRes.data.org || '';
          let asnMatch = rawIsp.match(/^(AS\d+)\s+(.*)/);
          
          if (asnMatch) {
              asn = asnMatch[1];
              carrierName = asnMatch[2];
          }

          const lowerCarrier = carrierName.toLowerCase();
          let flag = '';

          if (lowerCarrier.includes('amazon') || lowerCarrier.includes('aws') || lowerCarrier.includes('digitalocean') || 
              lowerCarrier.includes('google cloud') || lowerCarrier.includes('hetzner') || lowerCarrier.includes('ovh') || 
              lowerCarrier.includes('linode') || lowerCarrier.includes('azure') || lowerCarrier.includes('microsoft') || 
              lowerCarrier.includes('datacenter') || lowerCarrier.includes('hosting')) {
              flag = '🔴 [VPN/BOT]';
              is_datacenter = true;
          } else if (lowerCarrier.includes('jio') || lowerCarrier.includes('airtel') || lowerCarrier.includes('vodafone') || 
                     lowerCarrier.includes('idea cellular') || lowerCarrier.includes('mobile') || lowerCarrier.includes('telecom')) {
              flag = '🟢 [MOBILE]';
          } else if (carrierName) {
              flag = '🔵 [WIFI/BROADBAND]';
          }

          isp = `${flag} ${carrierName} ${asn ? `(${asn})` : ''}`.trim();
        }
      } catch (e) {
        console.warn('[analytics] IPInfo error:', e.message);
      }
    }

    // --- Bot Detection Logic ---
    let is_bot = false;
    let bot_name = '';
    let bot_category = '';
    const uaStr = (user_agent || '').toLowerCase();
    
    const aiBots = [
        { key: 'gptbot', name: 'GPTBot' }, { key: 'chatgpt-user', name: 'ChatGPT-User' },
        { key: 'oai-searchbot', name: 'OAI-SearchBot' }, { key: 'perplexitybot', name: 'PerplexityBot' },
        { key: 'claudebot', name: 'ClaudeBot' }, { key: 'anthropic', name: 'Anthropic' }
    ];
    const searchBots = [
        { key: 'googlebot', name: 'Googlebot' }, { key: 'bingbot', name: 'Bingbot' },
        { key: 'applebot', name: 'AppleBot' }, { key: 'duckduckbot', name: 'DuckDuckBot' },
        { key: 'yandexbot', name: 'YandexBot' }, { key: 'baiduspider', name: 'BaiduSpider' }
    ];
    const socialBots = [
        { key: 'facebookexternalhit', name: 'FacebookExternalHit' },
        { key: 'linkedinbot', name: 'LinkedInBot' }, { key: 'twitterbot', name: 'Twitterbot' }
    ];

    for (let bot of aiBots) {
        if (uaStr.includes(bot.key)) { is_bot = true; bot_name = bot.name; bot_category = 'AI Bot'; break; }
    }
    if (!is_bot) {
        for (let bot of searchBots) {
            if (uaStr.includes(bot.key)) { is_bot = true; bot_name = bot.name; bot_category = 'Search Engine'; break; }
        }
    }
    if (!is_bot) {
        for (let bot of socialBots) {
            if (uaStr.includes(bot.key)) { is_bot = true; bot_name = bot.name; bot_category = 'Social Crawler'; break; }
        }
    }
    // Generic bot fallback
    if (!is_bot && (uaStr.includes('bot') || uaStr.includes('crawler') || uaStr.includes('spider'))) {
        is_bot = true; bot_name = 'Generic Bot'; bot_category = 'Monitoring Service';
    }

    // Upsert visitor (update last_visit and visit_count on returning visitor)
    const { data: existing } = await supabase
      .from('visitors')
      .select('id, visit_count')
      .eq('visitor_id', visitor_id)
      .single();

    let safeUpdateInsert = async (table, dataObj, fallbackFields, condition) => {
        let tryObj = { ...dataObj, ...fallbackFields };
        let result;
        if (condition) result = await supabase.from(table).update(tryObj).eq(condition.col, condition.val);
        else result = await supabase.from(table).insert(tryObj);
        
        if (result.error && (result.error.message.includes('column') || result.error.message.includes('isp'))) {
            console.warn(`[analytics] Column missing in ${table}, retrying without advanced intelligence columns.`);
            if (condition) await supabase.from(table).update(dataObj).eq(condition.col, condition.val);
            else await supabase.from(table).insert(dataObj);
        }
    };

    if (existing) {
      const updateData = {
        last_visit: new Date().toISOString(),
        current_page: sanitizeString(current_page, 500),
        visit_count: (existing.visit_count || 1) + 1,
        country: country || undefined,
        region: region || undefined,
        city: city || undefined,
        timezone: timezone || undefined,
        device_type: finalDeviceType,
        browser: sanitizeString(browser, 50),
        operating_system: sanitizeString(operating_system, 50),
        language: sanitizeString(language, 20),
        screen_resolution: sanitizeString(screen_resolution, 20)
      };
      const advancedFields = {
          isp: isp || undefined,
          user_agent: sanitizeString(user_agent, 500),
          asn: asn || undefined,
          organization: carrierName || undefined,
          state: region || undefined,
          is_bot, bot_name, bot_category, is_datacenter
      };
      await safeUpdateInsert('visitors', updateData, advancedFields, { col: 'visitor_id', val: visitor_id });
    } else {
      const insertData = {
        visitor_id: sanitizeString(visitor_id, 100),
        ip_address: ip,
        country: country,
        region: region,
        city: city,
        timezone: timezone,
        language: sanitizeString(language, 20),
        browser: sanitizeString(browser, 50),
        operating_system: sanitizeString(operating_system, 50),
        device_type: finalDeviceType,
        screen_resolution: sanitizeString(screen_resolution, 20),
        referral_source: sanitizeString(referral_source, 500),
        landing_page: sanitizeString(landing_page, 500),
        current_page: sanitizeString(current_page, 500),
        first_visit: new Date().toISOString(),
        last_visit: new Date().toISOString(),
        visit_count: 1
      };
      const advancedFields = {
          isp,
          user_agent: sanitizeString(user_agent, 500),
          asn,
          organization: carrierName,
          state: region,
          is_bot, bot_name, bot_category, is_datacenter
      };
      await safeUpdateInsert('visitors', insertData, advancedFields, null);
    }

    // Record session
    await supabase.from('sessions').insert({
      session_id: sanitizeString(session_id, 100),
      visitor_id: sanitizeString(visitor_id, 100),
      page: sanitizeString(current_page, 500),
      referrer: sanitizeString(referral_source, 500),
      started_at: new Date().toISOString()
    });

    res.json({ success: true, returning: !!existing });
  } catch (error) {
    // Silent fail — don't disrupt user experience for tracking errors
    console.error('[analytics] visitor/track error:', error.message);
    res.status(500).json({ success: false, error: 'Tracking error' });
  }
});

// ============================================================
// POST /api/visitor/event
// Record specific click or interaction event
// ============================================================
router.post('/visitor/event', async (req, res) => {
  try {
    const { visitor_id, session_id, event_type, element_text, element_id, page } = req.body;
    if (!visitor_id || !session_id || !event_type) {
      return res.status(400).json({ success: false });
    }
    await supabase.from('visitor_events').insert({
      visitor_id: sanitizeString(visitor_id, 100),
      session_id: sanitizeString(session_id, 100),
      event_type: sanitizeString(event_type, 50),
      element_text: sanitizeString(element_text, 200),
      element_id: sanitizeString(element_id, 100),
      page: sanitizeString(page, 500)
    });
    res.json({ success: true });
  } catch (err) {
    console.error('[analytics] visitor/event error:', err.message);
    res.status(500).json({ success: false });
  }
});

// ============================================================
// POST /api/visitor/location
// Record explicit GPS location if granted
// ============================================================
router.post('/visitor/location', async (req, res) => {
  try {
    const { visitor_id, latitude, longitude } = req.body;
    if (!visitor_id || !latitude || !longitude) return res.status(400).json({ success: false });
    
    await supabase.from('visitors').update({
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    }).eq('visitor_id', visitor_id);
    
    res.json({ success: true });
  } catch (err) {
    console.error('[analytics] visitor/location error:', err.message);
    res.status(500).json({ success: false });
  }
});

// ============================================================
// POST /api/leads/capture
// Save lead form submission + trigger email drip
// ============================================================
router.post('/leads/capture', leadCaptureRateLimit, async (req, res) => {
  try {
    const {
      full_name, email, phone, company, message,
      source, visitor_id, consent_marketing
    } = req.body;

    // Validation
    const cleanEmail = sanitizeEmail(email);
    if (!cleanEmail) {
      return res.status(400).json({ success: false, error: 'A valid email address is required.' });
    }

    const cleanName = sanitizeString(full_name, 100);
    if (!cleanName) {
      return res.status(400).json({ success: false, error: 'Full name is required.' });
    }

    // Duplicate check — one submission per email or phone
    const cleanPhone = sanitizePhone(phone) || '';
    let query = supabase.from('website_leads').select('id');
    
    if (cleanPhone) {
      query = query.or(`email.eq.${cleanEmail},phone.eq.${cleanPhone}`);
    } else {
      query = query.eq('email', cleanEmail);
    }
    
    const { data: existingRecords } = await query;
    const existing = existingRecords && existingRecords.length > 0 ? existingRecords[0] : null;

    if (existing) {
      return res.json({
        success: true,
        message: 'We already received your inquiry. Our team will contact you soon!'
      });
    }

    const lead = {
      full_name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      company: sanitizeString(company, 100) || '',
      message: sanitizeString(message, 1000) || '',
      source: sanitizeString(source, 50) || 'website',
      visitor_id: sanitizeString(visitor_id, 100) || null,
      consent_marketing: !!consent_marketing
    };

    const { data: inserted, error: insertErr } = await supabase
      .from('website_leads')
      .insert(lead)
      .select('id')
      .single();

    if (insertErr) {
      console.error('[analytics] lead insert error:', insertErr);
      return res.status(500).json({ success: false, error: 'Failed to save lead. Please try again.' });
    }

    // Trigger email drip sequence (non-blocking)
    triggerDripSequence({ 
      ...lead, 
      id: inserted.id 

    }).catch(e =>
      console.error('[analytics] drip trigger error:', e.message)
    );

    res.json({
      success: true,
      message: 'Thank you! We\'ll be in touch shortly. Check your inbox for a confirmation email.'
    });

  } catch (error) {
    console.error('[analytics] leads/capture error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// POST /api/email/unsubscribe
// GDPR unsubscribe endpoint — sets unsubscribed=true on lead
// ============================================================
router.post('/email/unsubscribe', unsubscribeRateLimit, async (req, res) => {
  try {
    const email = sanitizeEmail(req.body.email || req.query.email);
    if (!email) {
      return res.status(400).json({ success: false, error: 'Valid email required.' });
    }

    await supabase.from('website_leads').update({
      unsubscribed: true,
      unsubscribed_at: new Date().toISOString()
    }).eq('email', email);

    res.json({ success: true, message: 'You have been unsubscribed successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /unsubscribe — HTML page for email unsubscribe link
router.get('/unsubscribe', async (req, res) => {
  const email = sanitizeEmail(req.query.email);
  if (email) {
    await supabase.from('website_leads').update({
      unsubscribed: true,
      unsubscribed_at: new Date().toISOString()
    }).eq('email', email);
  }
  res.send(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribed — Road Warrior EV</title><style>body{background:#0a0f1e;color:#e2e8f0;font-family:'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;}.box{background:#111827;border-radius:12px;padding:48px;text-align:center;max-width:480px;}.icon{font-size:48px;margin-bottom:16px;}.title{font-size:24px;font-weight:700;color:#f1f5f9;margin-bottom:8px;}.sub{color:#94a3b8;line-height:1.6;}.btn{display:inline-block;margin-top:24px;background:linear-gradient(135deg,#6c47ff,#00d4ff);color:#fff;text-decoration:none;padding:12px 28px;border-radius:50px;font-weight:700;}</style></head><body><div class="box"><div class="icon">✅</div><div class="title">Unsubscribed Successfully</div><p class="sub">You've been removed from our mailing list.<br>You won't receive any more emails from Road Warrior EV.</p><a href="/" class="btn">← Back to Home</a></div></body></html>`);
});

// ============================================================
// GET /api/admin/analytics/overview
// Admin dashboard — key metrics overview
// ============================================================
router.get('/admin/analytics/overview', adminAuth(['SUPER_ADMIN', 'ADMIN', 'VIEWER']), adminAnalyticsRateLimit, async (req, res) => {
  try {
    const [
      { count: totalVisitors },
      { count: totalLeads },
      { count: totalSessions },
      { data: recentLeads },
      { data: deviceBreakdown },
      { data: browserBreakdown }
    ] = await Promise.all([
      supabase.from('visitors').select('*', { count: 'exact', head: true }),
      supabase.from('website_leads').select('*', { count: 'exact', head: true }),
      supabase.from('sessions').select('*', { count: 'exact', head: true }),
      supabase.from('website_leads').select('full_name, email, source, created_at').order('created_at', { ascending: false }).limit(10),
      supabase.from('visitors').select('device_type'),
      supabase.from('visitors').select('browser')
    ]);

    // Device breakdown
    const deviceMap = {};
    (deviceBreakdown || []).forEach(v => {
      const d = v.device_type || 'unknown';
      deviceMap[d] = (deviceMap[d] || 0) + 1;
    });

    // Browser breakdown
    const browserMap = {};
    (browserBreakdown || []).forEach(v => {
      const b = v.browser || 'Unknown';
      browserMap[b] = (browserMap[b] || 0) + 1;
    });

    // Conversion rate
    const conversionRate = totalVisitors > 0
      ? ((totalLeads / totalVisitors) * 100).toFixed(1)
      : '0.0';

    res.json({
      success: true,
      data: {
        totalVisitors: totalVisitors || 0,
        totalLeads: totalLeads || 0,
        totalSessions: totalSessions || 0,
        conversionRate: parseFloat(conversionRate),
        deviceBreakdown: deviceMap,
        browserBreakdown: browserMap,
        recentLeads: recentLeads || []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// GET /api/admin/analytics/traffic
// Daily/weekly/monthly traffic data
// ============================================================
router.get('/admin/analytics/traffic', adminAuth(['SUPER_ADMIN', 'ADMIN', 'VIEWER']), adminAnalyticsRateLimit, async (req, res) => {
  try {
    const { range = '7d' } = req.query;
    const days = range === '30d' ? 30 : range === '1d' ? 1 : 7;

    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data: sessions } = await supabase
      .from('sessions')
      .select('started_at, page')
      .gte('started_at', since.toISOString())
      .order('started_at', { ascending: true });

    // Pre-fill dailyMap for the last 'days' days to ensure all dates (including today) show up
    const dailyMap = {};
    const tz = 'Asia/Kolkata';
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-IN', { timeZone: tz, day: '2-digit', month: 'short' });
      dailyMap[dateStr] = { date: dateStr, sessions: 0, pages: {} };
    }

    (sessions || []).forEach(s => {
      const date = new Date(s.started_at).toLocaleDateString('en-IN', { timeZone: tz, day: '2-digit', month: 'short' });
      if (!dailyMap[date]) dailyMap[date] = { date, sessions: 0, pages: {} };
      dailyMap[date].sessions++;
      const page = s.page || '/';
      dailyMap[date].pages[page] = (dailyMap[date].pages[page] || 0) + 1;
    });

    const dailyData = Object.values(dailyMap);

    // Top pages overall
    const pageMap = {};
    (sessions || []).forEach(s => {
      const p = s.page || '/';
      pageMap[p] = (pageMap[p] || 0) + 1;
    });
    const topPages = Object.entries(pageMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([page, count]) => ({ page, count }));

    res.json({ success: true, data: { dailyData, topPages, range } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// GET /api/admin/analytics/bot-intelligence
// Bot and Datacenter traffic analytics
// ============================================================
router.get('/admin/analytics/bot-intelligence', adminAuth(['SUPER_ADMIN', 'ADMIN', 'VIEWER']), adminAnalyticsRateLimit, async (req, res) => {
  try {
    const { data: visitors } = await supabase
      .from('visitors')
      .select('visitor_id, ip_address, user_agent, organization, first_visit, last_visit, visit_count, is_bot, bot_name, bot_category, is_datacenter, current_page');

    let humanCount = 0;
    let aiBotCount = 0;
    let searchBotCount = 0;
    let datacenterCount = 0;
    let bots = [];

    (visitors || []).forEach(v => {
      if (!v.is_bot && !v.is_datacenter) {
        humanCount++;
        bots.push({
          ip: v.ip_address,
          user_agent: v.user_agent || v.browser,
          organization: v.organization || 'Unknown',
          first_seen: v.first_visit,
          last_seen: v.last_visit,
          pages_crawled: v.visit_count,
          type: 'Human Visitor',
          category: 'Human',
          is_datacenter: false
        });
      } else {
        if (v.is_bot) {
          if (v.bot_category === 'AI Bot') aiBotCount++;
          else if (v.bot_category === 'Search Engine') searchBotCount++;
          else if (v.bot_category === 'Monitoring Service') searchBotCount++; // group monitor with search for top level
        }
        if (v.is_datacenter) {
          datacenterCount++;
        }
        
        bots.push({
          ip: v.ip_address,
          user_agent: v.user_agent || v.browser,
          organization: v.organization || 'Unknown',
          first_seen: v.first_visit,
          last_seen: v.last_visit,
          pages_crawled: v.visit_count,
          type: v.is_bot ? v.bot_name : 'Datacenter Node',
          category: v.bot_category,
          is_datacenter: v.is_datacenter
        });
      }
    });

    res.json({
      success: true,
      data: {
        metrics: {
          humans: humanCount,
          aiBots: aiBotCount,
          searchCrawlers: searchBotCount,
          datacenter: datacenterCount
        },
        bots: bots.sort((a, b) => new Date(b.last_seen) - new Date(a.last_seen)).slice(0, 100)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// GET /api/admin/analytics/drilldown
// Returns detailed data for metric box clicks
// ============================================================
router.get('/admin/analytics/drilldown', adminAuth(['SUPER_ADMIN', 'ADMIN', 'VIEWER']), adminAnalyticsRateLimit, async (req, res) => {
  try {
    const { type } = req.query;
    let data = [];
    
    if (type === 'visitors') {
      const { data: visitors } = await supabase
        .from('visitors')
        .select('*')
        .order('last_visit', { ascending: false })
        .limit(100);
      data = visitors || [];
    } else if (type === 'leads') {
      const { data: leads } = await supabase
        .from('website_leads')
        .select('full_name, email, phone, source, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      data = leads || [];
    } else if (type === 'sessions') {
      // Just returning recent sessions (events marked as page_view or similar)
      const { data: sessions } = await supabase
        .from('sessions')
        .select('session_id, visitor_id, page, started_at')
        .order('started_at', { ascending: false })
        .limit(100);
      data = sessions || [];
    } else {
      return res.status(400).json({ success: false, error: 'Invalid type' });
    }
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// GET /api/admin/analytics/leads
// Lead pipeline with email log status
// ============================================================
router.get('/admin/analytics/leads', adminAuth(['SUPER_ADMIN', 'ADMIN', 'VIEWER']), adminAnalyticsRateLimit, async (req, res) => {
  try {
    const { data: leads } = await supabase
      .from('website_leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    const { data: emailLogs } = await supabase
      .from('email_logs')
      .select('lead_id, status, campaign_id, sent_at')
      .order('created_at', { ascending: false });

    // Map email log status per lead
    const logMap = {};
    (emailLogs || []).forEach(log => {
      if (!logMap[log.lead_id]) logMap[log.lead_id] = [];
      logMap[log.lead_id].push(log);
    });

    const enrichedLeads = (leads || []).map(lead => ({
      ...lead,
      emailStatus: logMap[lead.id] || []
    }));

    // Summary stats
    const totalLeads = enrichedLeads.length;
    const subscribed = enrichedLeads.filter(l => !l.unsubscribed).length;
    const withEmail = enrichedLeads.filter(l => l.email).length;
    const sourceCounts = {};
    enrichedLeads.forEach(l => {
      const s = l.source || 'unknown';
      sourceCounts[s] = (sourceCounts[s] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        leads: enrichedLeads,
        summary: { totalLeads, subscribed, withEmail, sourceCounts }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// GET /api/admin/email/logs
// Email delivery logs
// ============================================================
router.get('/admin/email/logs', adminAuth(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const { data: logs } = await supabase
      .from('email_logs')
      .select('*, email_campaigns(name, delay_days)')
      .order('created_at', { ascending: false })
      .limit(200);

    res.json({ success: true, data: logs || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// GET /api/email/process-queue
// Vercel Cron endpoint — processes pending scheduled emails
// Protected by CRON_SECRET header
// ============================================================
router.get('/email/process-queue', async (req, res) => {
  const secret = req.headers['x-cron-secret'] || req.query.secret;
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const result = await processEmailQueue();
  res.json({ success: true, ...result });
});

// ============================================================
// GET /api/admin/analytics/export/csv
// Export visitor tracking data as CSV
// ============================================================
router.get('/admin/analytics/export/csv', adminAuth(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const { data: visitors } = await supabase
      .from('visitors')
      .select('visitor_id, ip_address, country, region, city, isp, browser, operating_system, device_type, referral_source, visit_count, first_visit, last_visit')
      .order('last_visit', { ascending: false });

    if (!visitors || visitors.length === 0) {
      return res.status(404).send('No data available');
    }

    const headers = Object.keys(visitors[0]).join(',');
    const rows = visitors.map(v => {
      return Object.values(v).map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(',');
    }).join('\n');

    const csvData = `${headers}\n${rows}`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=visitor_analytics.csv');
    res.send(csvData);
  } catch (error) {
    console.error('[analytics] export error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// GET /api/admin/analytics/leads-funnel
// Leads and progressive form save analytics
// ============================================================
router.get('/admin/analytics/leads-funnel', adminAuth(), adminAnalyticsRateLimit, async (req, res) => {
  try {
    const { data: riders, error } = await supabase.from('riders').select('*');
    if (error) throw error;

    const totalLeads = riders.length;
    let partial = 0;
    let completed = 0;
    let abandoned = 0;
    
    // Abandoned threshold: 24 hours
    const abandonedThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Step drop-off tracking
    const stepCounts = {};
    for (let i = 1; i <= 7; i++) { stepCounts[i] = 0; }
    
    let totalProgress = 0;

    riders.forEach(r => {
      totalProgress += r.progress_percentage || 0;
      
      const updatedAtDate = new Date(r.updated_at || r.registeredAt || r.joinedDate);
      
      // If is_completed is true OR they have no current_step column (meaning they are from the old schema where all users were fully registered)
      if (r.is_completed === true || r.is_completed === 'true' || r.progress_percentage === 100 || r.current_step === undefined) {
        completed++;
      } else {
        if (updatedAtDate < abandonedThreshold) {
          abandoned++;
        } else {
          partial++;
        }
      }
      
      const step = r.current_step || 1;
      stepCounts[step] = (stepCounts[step] || 0) + 1;
    });
    
    const conversionRate = totalLeads > 0 ? ((completed / totalLeads) * 100).toFixed(1) : 0;
    const avgCompletion = totalLeads > 0 ? Math.round(totalProgress / totalLeads) : 0;

    res.json({
      success: true,
      data: {
        totalLeads,
        partial,
        completed,
        abandoned,
        conversionRate,
        avgCompletion,
        stepCounts
      }
    });
  } catch (err) {
    console.error('[Leads Funnel]', err);
    res.status(500).json({ success: false, error: 'Server error fetching leads funnel' });
  }
});

module.exports = router;

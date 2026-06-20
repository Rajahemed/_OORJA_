// routes/analytics.js
// Visitor Intelligence, Lead Capture, Admin Analytics, Email Queue

const express = require('express');
const router  = express.Router();
const supabase = require('../utils/supabase');
const adminAuth = require('../middleware/adminAuth');
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
      device_type, screen_resolution, referral_source, landing_page, current_page
    } = req.body;

    if (!visitor_id || !session_id) {
      return res.status(400).json({ success: false, error: 'visitor_id and session_id are required' });
    }

    const ip = sanitizeIp(
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || ''
    );

    // Upsert visitor (update last_visit and visit_count on returning visitor)
    const { data: existing } = await supabase
      .from('visitors')
      .select('id, visit_count')
      .eq('visitor_id', visitor_id)
      .single();

    if (existing) {
      await supabase.from('visitors').update({
        last_visit: new Date().toISOString(),
        current_page: sanitizeString(current_page, 500),
        visit_count: (existing.visit_count || 1) + 1
      }).eq('visitor_id', visitor_id);
    } else {
      await supabase.from('visitors').insert({
        visitor_id: sanitizeString(visitor_id, 100),
        ip_address: ip,
        language: sanitizeString(language, 20),
        browser: sanitizeString(browser, 50),
        operating_system: sanitizeString(operating_system, 50),
        device_type: sanitizeString(device_type, 20),
        screen_resolution: sanitizeString(screen_resolution, 20),
        referral_source: sanitizeString(referral_source, 500),
        landing_page: sanitizeString(landing_page, 500),
        current_page: sanitizeString(current_page, 500),
        first_visit: new Date().toISOString(),
        last_visit: new Date().toISOString(),
        visit_count: 1
      });
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
    let query = supabase.from('riders').select('id, tags');
    
    if (cleanPhone) {
      query = query.or(`email.eq.${cleanEmail},phone.eq.${cleanPhone}`);
    } else {
      query = query.eq('email', cleanEmail);
    }
    
    const { data: existingRecords } = await query;
    const existing = existingRecords && existingRecords.length > 0 ? existingRecords[0] : null;

    const newTag = 'WEBSITE_CONSULTATION_LEAD';
    const interestStr = sanitizeString(message, 50) || 'General Inquiry';

    if (existing) {
      let tags = existing.tags || [];
      if (!tags.includes(newTag)) tags.push(newTag);
      if (!tags.includes(interestStr)) tags.push(interestStr);
      await supabase.from('riders').update({ tags }).eq('id', existing.id);
      
      return res.json({
        success: true,
        message: 'We already received your inquiry. Our team will contact you soon!'
      });
    }

    const lead = {
      fullName: cleanName,
      email: cleanEmail,
      phone: sanitizePhone(phone) || '',
      tags: [newTag, interestStr],
      interests: sanitizeString(message, 1000) || '',
      isActive: false,
      consentMarketing: !!consent_marketing,
      registeredAt: new Date().toISOString()
    };

    const { data: inserted, error: insertErr } = await supabase
      .from('riders')
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
      id: inserted.id,
      full_name: cleanName 
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

    await supabase.from('ev_leads').update({
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
    await supabase.from('ev_leads').update({
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
      supabase.from('ev_leads').select('*', { count: 'exact', head: true }),
      supabase.from('sessions').select('*', { count: 'exact', head: true }),
      supabase.from('ev_leads').select('full_name, email, source, created_at').order('created_at', { ascending: false }).limit(10),
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

    // Group by date
    const dailyMap = {};
    (sessions || []).forEach(s => {
      const date = new Date(s.started_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
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
// GET /api/admin/analytics/leads
// Lead pipeline with email log status
// ============================================================
router.get('/admin/analytics/leads', adminAuth(['SUPER_ADMIN', 'ADMIN', 'VIEWER']), adminAnalyticsRateLimit, async (req, res) => {
  try {
    const { data: leads } = await supabase
      .from('ev_leads')
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

module.exports = router;

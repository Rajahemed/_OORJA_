// utils/email.js
// Resend email client — HTML templates + send utilities for OORJA
// Drip sequence: Day 0 (Welcome) → Day 7 (Follow-up) → Day 15 (Reminder)

require('dotenv').config();
const { Resend } = require('resend');

const FROM_EMAIL  = process.env.RESEND_FROM_EMAIL  || 'onboarding@resend.dev';
const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || FROM_EMAIL;
const SITE_URL    = 'https://roadwarriorev.com';

// Initialise Resend only if API key is present — graceful no-op otherwise
let resend = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
} else {
  console.warn('[email] RESEND_API_KEY not set — email sending disabled');
}

// ============================================================
// HTML EMAIL TEMPLATES
// ============================================================

const emailBase = (content, previewText = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OORJA</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0a0f1e; font-family: 'Segoe UI', Arial, sans-serif; color: #e2e8f0; }
    .wrapper { max-width: 600px; margin: 0 auto; background: #111827; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #6c47ff 0%, #00d4ff 100%); padding: 32px 40px; text-align: center; }
    .header img { height: 40px; margin-bottom: 12px; }
    .header h1 { color: #fff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .header p  { color: rgba(255,255,255,0.85); font-size: 14px; margin-top: 6px; }
    .body { padding: 36px 40px; }
    .body p { color: #cbd5e1; font-size: 15px; line-height: 1.7; margin-bottom: 16px; }
    .body h2 { color: #f1f5f9; font-size: 20px; font-weight: 700; margin-bottom: 12px; }
    .cta-btn {
      display: inline-block; background: linear-gradient(135deg, #6c47ff, #00d4ff);
      color: #fff !important; text-decoration: none; padding: 14px 32px;
      border-radius: 50px; font-size: 15px; font-weight: 700;
      margin: 20px 0; letter-spacing: 0.3px;
    }
    .stats-row { display: flex; gap: 16px; margin: 24px 0; }
    .stat-box { flex: 1; background: rgba(108,71,255,0.12); border: 1px solid rgba(108,71,255,0.3);
                border-radius: 10px; padding: 16px; text-align: center; }
    .stat-box .num { font-size: 28px; font-weight: 800; color: #a78bfa; }
    .stat-box .lbl { font-size: 12px; color: #94a3b8; margin-top: 4px; }
    .tip-box { background: rgba(0,212,255,0.06); border-left: 4px solid #00d4ff;
               border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 20px 0; }
    .tip-box p { color: #e0f2fe; margin: 0; }
    .footer { background: #0d1117; padding: 24px 40px; text-align: center; }
    .footer p { color: #475569; font-size: 12px; line-height: 1.6; }
    .footer a { color: #6c47ff; text-decoration: none; }
    @media (max-width: 600px) {
      .body { padding: 24px 20px; }
      .header { padding: 24px 20px; }
      .stats-row { flex-direction: column; }
    }
  </style>
</head>
<body>
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#0a0f1e;">${previewText}</div>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0f1e;padding:20px 0;">
    <tr><td align="center">
      <div class="wrapper">
        <div class="header">
          <h1>🚗⚡ OORJA</h1>
          <p>India's Delivery Rider Intelligence Platform</p>
        </div>
        <div class="body">
          ${content}
        </div>
        <div class="footer">
          <p>
            You're receiving this because you expressed interest in OORJA.<br>
            <a href="${SITE_URL}/unsubscribe?email={{EMAIL}}">Unsubscribe</a> &nbsp;|&nbsp;
            <a href="${SITE_URL}">Visit Website</a> &nbsp;|&nbsp;
            <a href="mailto:${ADMIN_EMAIL}">Contact Us</a>
          </p>
          <p style="margin-top:8px;">© ${new Date().getFullYear()} OORJA. All rights reserved.</p>
        </div>
      </div>
    </td></tr>
  </table>
</body>
</html>`;

// --- Template: Welcome (Day 0) ---
function welcomeTemplate(data) {
  const { full_name, email } = data;
  const name = full_name ? full_name.split(' ')[0] : 'there';
  const html = emailBase(`
    <h2>Welcome aboard, ${name}! 🎉</h2>
    <p>Thank you for reaching out to <strong>OORJA</strong>. We're excited to connect with you and help you discover how our platform empowers delivery riders across India.</p>

    <div class="stats-row">
      <div class="stat-box"><div class="num">2,450+</div><div class="lbl">Active Riders</div></div>
      <div class="stat-box"><div class="num">5+</div><div class="lbl">Cities</div></div>
      <div class="stat-box"><div class="num">₹5k</div><div class="lbl">Avg Monthly Savings</div></div>
    </div>

    <p>Here's what OORJA offers you:</p>
    <p>🏍️ <strong>EV Rental Program</strong> — Switch to electric and save on fuel costs<br>
       🛡️ <strong>Insurance Solutions</strong> — Tailored accidental & health cover for riders<br>
       🏆 <strong>Referral Rewards</strong> — Earn points for every rider you refer<br>
       📊 <strong>Rider Intelligence</strong> — Track your earnings, deliveries & milestones</p>

    <div class="tip-box">
      <p>💡 <strong>Quick tip:</strong> Register as a rider today to get your personal referral code and start earning 5 points per referral!</p>
    </div>

    <div style="text-align:center;">
      <a href="${SITE_URL}" class="cta-btn">🚀 Get Started Now</a>
    </div>

    <p>Have questions? Just reply to this email — we're here to help!</p>
    <p style="color:#94a3b8; font-size:13px;">Warm regards,<br><strong style="color:#a78bfa;">The OORJA Team</strong></p>
  `, `Welcome to OORJA, ${name}! Start your journey today.`);
  return html.replace(/\{\{EMAIL\}\}/g, encodeURIComponent(email));
}

// --- Template: Follow-up (Day 7) ---
function followupTemplate(data) {
  const { full_name, email } = data;
  const name = full_name ? full_name.split(' ')[0] : 'there';
  const html = emailBase(`
    <h2>How's it going, ${name}? 👋</h2>
    <p>It's been a week since you first connected with us, and we wanted to check in to see if you have any questions about OORJA.</p>

    <div class="tip-box">
      <p>🔥 <strong>Did you know?</strong> Riders on our platform save an average of <strong>₹5,000/month</strong> by switching to EV and using our insurance products.</p>
    </div>

    <p>Here are some ways we can help you right now:</p>
    <p>✅ <strong>Free EV Consultation</strong> — Talk to an expert about the best EV for your delivery route<br>
       ✅ <strong>Insurance Quote</strong> — Get a personalized accidental + health insurance plan<br>
       ✅ <strong>Retrofit Information</strong> — Convert your existing petrol bike to electric</p>

    <p>Our team is available Monday–Saturday, 9 AM – 6 PM IST.</p>

    <div style="text-align:center;">
      <a href="${SITE_URL}" class="cta-btn">📞 Book Free Consultation</a>
    </div>

    <p style="color:#94a3b8; font-size:13px;">Best regards,<br><strong style="color:#a78bfa;">OORJA Team</strong></p>
  `, `Checking in — your EV journey starts here, ${name}.`);
  return html.replace(/\{\{EMAIL\}\}/g, encodeURIComponent(email));
}

// --- Template: Reminder (Day 15) ---
function reminderTemplate(data) {
  const { full_name, email } = data;
  const name = full_name ? full_name.split(' ')[0] : 'there';
  const html = emailBase(`
    <h2>Don't miss out, ${name}! 🏆</h2>
    <p>We've reached out a couple of times, and we want to make sure you don't miss the benefits OORJA can offer you.</p>

    <div class="stats-row">
      <div class="stat-box"><div class="num">₹0</div><div class="lbl">Cost to Register</div></div>
      <div class="stat-box"><div class="num">10 pts</div><div class="lbl">Starting Bonus</div></div>
      <div class="stat-box"><div class="num">5 pts</div><div class="lbl">Per Referral</div></div>
    </div>

    <div class="tip-box">
      <p>🎁 <strong>Limited Offer:</strong> Register this week and get a <strong>free insurance consultation</strong> + 10 bonus points added to your account!</p>
    </div>

    <p>Registration takes less than 3 minutes. Just fill out a quick survey about your delivery experience and get your unique referral code instantly.</p>

    <div style="text-align:center;">
      <a href="${SITE_URL}" class="cta-btn">⚡ Register Free — Takes 3 Minutes</a>
    </div>

    <p style="color:#475569; font-size:13px; margin-top:20px;">If you're no longer interested, you can <a href="${SITE_URL}/unsubscribe?email=${encodeURIComponent(email)}" style="color:#6c47ff;">unsubscribe here</a> and we won't bother you again.</p>
    <p style="color:#94a3b8; font-size:13px;">Best wishes,<br><strong style="color:#a78bfa;">OORJA Team</strong></p>
  `, `Last chance, ${name} — your exclusive EV benefits are waiting!`);
  return html.replace(/\{\{EMAIL\}\}/g, encodeURIComponent(email));
}

// --- Admin notification email ---
function adminLeadNotificationTemplate(leadData) {
  const { full_name, email, phone, message, source } = leadData;
  return emailBase(`
    <h2>🔔 New Lead Captured!</h2>
    <p>A new lead has been submitted via the <strong>${source || 'website'}</strong>.</p>
    <div class="tip-box">
      <p>
        <strong>Name:</strong> ${full_name || 'N/A'}<br>
        <strong>Email:</strong> ${email || 'N/A'}<br>
        <strong>Phone:</strong> ${phone || 'N/A'}<br>
        <strong>Message:</strong> ${message || 'No message'}<br>
        <strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
      </p>
    </div>
    <div style="text-align:center;">
      <a href="${SITE_URL}/admin" class="cta-btn">📊 View in Admin Dashboard</a>
    </div>
  `, `New lead: ${full_name}`);
}

// ============================================================
// SEND FUNCTION — with retry logic
// ============================================================
async function sendEmail(to, subject, html, options = {}) {
  if (!resend) {
    console.warn('[email] Resend not initialised — skipping send to', to);
    return { success: false, skipped: true };
  }

  const maxAttempts = options.maxAttempts || 3;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html,
        ...(options.replyTo ? { reply_to: options.replyTo } : {})
      });
      console.log(`[email] Sent to ${to} | Subject: ${subject} | ID: ${result?.data?.id}`);
      return { success: true, id: result?.data?.id };
    } catch (err) {
      lastError = err;
      console.error(`[email] Attempt ${attempt}/${maxAttempts} failed for ${to}:`, err.message);
      if (attempt < maxAttempts) {
        // Exponential backoff: 2s, 4s
        await new Promise(r => setTimeout(r, 2000 * attempt));
      }
    }
  }

  console.error(`[email] All ${maxAttempts} attempts failed for ${to}:`, lastError?.message);
  return { success: false, error: lastError?.message };
}

// ============================================================
// DRIP SEQUENCE TRIGGER
// ============================================================
const supabase = require('./supabase');

/**
 * Called when a lead is captured.
 * 1. Sends Day-0 Welcome email immediately
 * 2. Schedules Day-7 and Day-15 in email_logs
 */
async function triggerDripSequence(lead) {
  if (!lead?.email) return;

  try {
    // Fetch campaign definitions
    const { data: campaigns } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('active', true)
      .order('delay_days', { ascending: true });

    if (!campaigns || campaigns.length === 0) return;

    for (const campaign of campaigns) {
      const scheduledAt = new Date();
      scheduledAt.setDate(scheduledAt.getDate() + campaign.delay_days);

      // Log the pending send
      const { data: logEntry } = await supabase
        .from('email_logs')
        .insert({
          lead_id: lead.id,
          campaign_id: campaign.id,
          to_email: lead.email,
          subject: campaign.subject,
          status: campaign.delay_days === 0 ? 'sending' : 'pending',
          scheduled_at: scheduledAt.toISOString()
        })
        .select('id')
        .single();

      // Send Day-0 immediately
      if (campaign.delay_days === 0) {
        const html = renderTemplate(campaign.template, lead);
        const result = await sendEmail(lead.email, campaign.subject, html);

        await supabase
          .from('email_logs')
          .update({
            status: result.success ? 'sent' : 'failed',
            attempts: 1,
            sent_at: result.success ? new Date().toISOString() : null,
            error_message: result.error || null,
            resend_id: result.id || null
          })
          .eq('id', logEntry.id);
      }
    }

    // Send admin notification
    await sendEmail(
      ADMIN_EMAIL,
      `🔔 New Lead: ${lead.full_name}`,
      adminLeadNotificationTemplate(lead)
    );

  } catch (err) {
    console.error('[email] triggerDripSequence error:', err.message);
  }
}

/**
 * Process pending scheduled emails.
 * Called by Vercel Cron daily at /api/email/process-queue
 */
async function processEmailQueue() {
  try {
    const now = new Date().toISOString();

    const { data: pending } = await supabase
      .from('email_logs')
      .select('*, leads(*), email_campaigns(*)')
      .eq('status', 'pending')
      .lte('scheduled_at', now)
      .lt('attempts', 3);

    if (!pending || pending.length === 0) {
      console.log('[email] No pending emails to process');
      return { processed: 0 };
    }

    let processed = 0;

    for (const log of pending) {
      const lead = log.leads;
      const campaign = log.email_campaigns;

      if (!lead || lead.unsubscribed || !campaign) continue;

      const html = renderTemplate(campaign.template, lead);

      await supabase.from('email_logs').update({ attempts: (log.attempts || 0) + 1, status: 'sending' }).eq('id', log.id);

      const result = await sendEmail(lead.email, campaign.subject, html);

      await supabase.from('email_logs').update({
        status: result.success ? 'sent' : (log.attempts + 1 >= 3 ? 'failed' : 'pending'),
        sent_at: result.success ? new Date().toISOString() : null,
        error_message: result.error || null,
        resend_id: result.id || null
      }).eq('id', log.id);

      if (result.success) processed++;
    }

    console.log(`[email] Processed ${processed}/${pending.length} queued emails`);
    return { processed, total: pending.length };

  } catch (err) {
    console.error('[email] processEmailQueue error:', err.message);
    return { processed: 0, error: err.message };
  }
}

function renderTemplate(templateName, data) {
  switch (templateName) {
    case 'welcome':  return welcomeTemplate(data);
    case 'followup': return followupTemplate(data);
    case 'reminder': return reminderTemplate(data);
    default:         return welcomeTemplate(data);
  }
}

module.exports = {
  sendEmail,
  triggerDripSequence,
  processEmailQueue,
  welcomeTemplate,
  followupTemplate,
  reminderTemplate
};

const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const { v4: uuidv4 } = require('uuid');
const twilio = require('twilio');
const axios = require('axios');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_ACCOUNT_SID !== 'your_twilio_account_sid'
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

const otpCache = new Map();

const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { success: false, error: 'Too many OTP requests from this IP, please try again after an hour' }
});

// Generate and send OTP
router.post('/send-otp', otpLimiter, async (req, res) => {
  try {
    const { phone, channel } = req.body;
    if (!phone) return res.status(400).json({ success: false, error: 'Phone number required' });
    
    // Cleanup old OTPs
    for (const [key, value] of otpCache.entries()) {
      if (Date.now() > value.expires) otpCache.delete(key);
    }

    if (channel === 'whatsapp' && twilioClient && process.env.TWILIO_PHONE_NUMBER && process.env.TWILIO_PHONE_NUMBER !== 'your_twilio_phone_number') {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      otpCache.set(phone, { otp, expires: Date.now() + 5 * 60 * 1000 });
      
      await twilioClient.messages.create({
        body: `Your OORJA OTP is ${otp}. Valid for 5 minutes.`,
        from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
        to: `whatsapp:+91${phone.replace(/\D/g, '')}`
      });
      return res.json({ success: true, message: 'Live OTP sent successfully via WhatsApp' });
    } else if (process.env.FAST2SMS_API_KEY && channel !== 'whatsapp') {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      otpCache.set(phone, { otp, expires: Date.now() + 5 * 60 * 1000 });
      
      try {
          const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
            params: {
              authorization: process.env.FAST2SMS_API_KEY,
              variables_values: otp,
              route: 'otp',
              numbers: phone.replace(/\D/g, '')
            }
          });
          
          if (response.data.return === false) {
              console.error('[Fast2SMS Error]', response.data);
              throw new Error('Failed to send OTP via Fast2SMS');
          }
          return res.json({ success: true, message: 'Live OTP sent successfully' });
      } catch (err) {
          const fast2smsMsg = err.response && err.response.data && err.response.data.message ? err.response.data.message : err.message;
          console.error('[Fast2SMS Error]', fast2smsMsg);
          // Fallback to Mock OTP so development is not blocked
          otpCache.set(phone, { otp: '123456', expires: Date.now() + 5 * 60 * 1000 });
          return res.json({ success: true, message: 'OTP Sent! (Mock OTP: 123456)', isMock: true });
      }
    } else {
      otpCache.set(phone, { otp: '123456', expires: Date.now() + 5 * 60 * 1000 });
      const msg = channel === 'whatsapp' ? 'Mock WhatsApp OTP sent (use 123456)' : 'Mock OTP sent (use 123456)';
      return res.json({ success: true, message: msg, isMock: true });
    }
  } catch (error) {
    console.error('[Send OTP Error]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// Login
router.post('/login', async (req, res) => {
  try {
    const { phone, loginMethod, password, otp } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, error: 'Phone number required' });
    }

    const phoneRegex = /^[6-9][0-9]{9}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      return res.status(400).json({ success: false, error: 'Please enter a valid 10-digit Indian mobile number starting with 6-9' });
    }

    // Removed password requirement validation for phone-only login

    if (loginMethod === 'otp' && !otp) {
      return res.status(400).json({ success: false, error: 'OTP required' });
    }

    // Find rider by phone in the database
    const { data: riders, error } = await supabase.from('riders').select('*').eq('phone', phone);

    if (error) {
      console.error('[Login] Supabase query error:', error);
      return res.status(500).json({ success: false, error: 'Database error. Please try again.' });
    }

    const rider = riders && riders.length > 0 ? riders[0] : null;

    if (!rider) {
      return res.status(401).json({ success: false, error: 'User not found. Please register first.' });
    }

    if (loginMethod === 'password' || loginMethod === 'phone_only') {
      // PIN validation removed as per requirement - phone number only auth
    } else if (loginMethod === 'otp') {
      const cached = otpCache.get(phone);
      if (!cached || Date.now() > cached.expires) {
        return res.status(401).json({ success: false, error: 'OTP expired or not requested' });
      }
      if (otp !== cached.otp) {
        return res.status(401).json({ success: false, error: 'Invalid OTP' });
      }
      otpCache.delete(phone);
    } else if (loginMethod !== 'whatsapp') {
      return res.status(400).json({ success: false, error: 'Invalid login method' });
    }

    const riderId = rider.id;

    // Mock authentication
    const sessionId = riderId + '_' + Date.now();
    req.app.get('sessions').set(sessionId, {
      phone,
      riderId,
      loginTime: new Date()
    });

    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      message: 'Login successful',
      riderId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  try {
    const sessionId = req.cookies?.sessionId || req.body.sessionId;
    if (sessionId) {
      req.app.get('sessions').delete(sessionId);
    }

    res.clearCookie('sessionId', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
// Rider Password Reset
router.post('/reset-rider-password', async (req, res) => {
    try {
        const { phone, otp, newPassword } = req.body;
        if (!phone || !otp || !newPassword) {
            return res.status(400).json({ success: false, error: 'Phone, OTP, and New Password required' });
        }
        
        // Verify OTP
        const cached = otpCache.get(phone);
        if (!cached || Date.now() > cached.expires) {
            return res.status(401).json({ success: false, error: 'OTP expired or not requested' });
        }
        if (otp !== cached.otp) {
            return res.status(401).json({ success: false, error: 'Invalid OTP' });
        }
        otpCache.delete(phone);

        const { data: riders, error } = await supabase.from('riders').select('id').eq('phone', phone);
        if (error) throw error;
        if (!riders || riders.length === 0) {
            return res.status(404).json({ success: false, error: 'Rider not found with this phone number.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const { error: updateErr } = await supabase.from('riders').update({ password: hashedPassword }).eq('phone', phone);
        if (updateErr) throw updateErr;

        res.json({ success: true, message: 'Password reset successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// Admin Authentication Endpoints
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'roadwarrior-super-secret-key';

router.get('/admin/status', async (req, res) => {
    try {
        const { data, error } = await supabase.from('admin_users').select('id');
        if (error) throw error;
        res.json({ success: true, exists: data && data.length > 0 });
    } catch(err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Setup endpoint removed

// Create an ephemeral client so we do not mutate the global server instance
const { createClient } = require('@supabase/supabase-js');
function getEphemeralSupabase() {
    return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
}

router.post('/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and Password required' });
        }

        const ephemeralSupabase = getEphemeralSupabase();
        const { data: authData, error: authError } = await ephemeralSupabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (authError) throw authError;

        // Verify this user is the registered admin using the global client
        const { data: adminData, error: adminErr } = await supabase.from('admin_users').select('id').eq('id', authData.user.id);
        if (adminErr) throw adminErr;

        if (!adminData || adminData.length === 0) {
            return res.status(401).json({ success: false, error: 'Unauthorized. Not recognized as admin.' });
        }

        // Issue JWT token to stay compatible with frontend expectations
        const token = jwt.sign({ email: email, role: 'SUPER_ADMIN' }, JWT_SECRET, { expiresIn: '12h' });

        res.cookie('adminToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 12 * 60 * 60 * 1000 // 12 hours
        });

        res.json({ success: true, message: 'Admin login successful', role: 'SUPER_ADMIN' });
    } catch(err) {
        res.status(401).json({ success: false, error: err.message });
    }
});

router.post('/admin/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        // Ensure the email belongs to the admin
        const { data: adminData, error: adminErr } = await supabase.from('admin_users').select('id').eq('email', email);
        if (adminErr || !adminData || adminData.length === 0) {
             return res.status(404).json({ success: false, error: 'Admin account with this email not found.' });
        }

        const ephemeralSupabase = getEphemeralSupabase();
        const { error: otpError } = await ephemeralSupabase.auth.signInWithOtp({
            email: email
        });

        if (otpError) throw otpError;

        res.json({ success: true, message: 'OTP sent to email.' });
    } catch(err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/admin/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        const ephemeralSupabase = getEphemeralSupabase();
        // Verify OTP
        const { data, error: verifyErr } = await ephemeralSupabase.auth.verifyOtp({
            email: email,
            token: otp,
            type: 'email'
        });

        if (verifyErr) throw verifyErr;

        // Since verifyOtp signs the user in implicitly if valid, we can now update the password
        const { error: updateErr } = await ephemeralSupabase.auth.updateUser({
            password: newPassword
        });

        if (updateErr) throw updateErr;

        res.json({ success: true, message: 'Password reset successfully.' });
    } catch(err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

module.exports = router;

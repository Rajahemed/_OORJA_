const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const { v4: uuidv4 } = require('uuid');

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

    if (loginMethod === 'password' && !password) {
      return res.status(400).json({ success: false, error: 'Password required' });
    }

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

    // Verify Password or OTP
    if (loginMethod === 'password') {
      // In a real app we'd use bcrypt. Here we do simple text match.
      if (rider.password && rider.password !== password) {
        return res.status(401).json({ success: false, error: 'Invalid password' });
      } else if (!rider.password && password !== 'password') {
        // Fallback for older mock riders without password
        return res.status(401).json({ success: false, error: 'Invalid password' });
      }
    } else if (loginMethod === 'otp') {
      if (otp !== '123456') {
        return res.status(401).json({ success: false, error: 'Invalid OTP' });
      }
    }

    const riderId = rider.id;

    // Mock authentication
    const sessionId = riderId + '_' + Date.now();
    req.app.get('sessions').set(sessionId, {
      phone,
      riderId,
      loginTime: new Date()
    });

    res.json({
      success: true,
      message: 'Login successful',
      sessionId,
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
    const { sessionId } = req.body;
    if (sessionId) {
      req.app.get('sessions').delete(sessionId);
    }

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
        
        // Mock OTP check
        if (otp !== '123456') {
            return res.status(401).json({ success: false, error: 'Invalid OTP' });
        }

        const { data: riders, error } = await supabase.from('riders').select('id').eq('phone', phone);
        if (error) throw error;
        if (!riders || riders.length === 0) {
            return res.status(404).json({ success: false, error: 'Rider not found with this phone number.' });
        }

        const { error: updateErr } = await supabase.from('riders').update({ password: newPassword }).eq('phone', phone);
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

router.post('/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and Password required' });
        }

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (authError) throw authError;

        // Verify this user is the registered admin
        const { data: adminData, error: adminErr } = await supabase.from('admin_users').select('id').eq('id', authData.user.id);
        if (adminErr) throw adminErr;

        if (!adminData || adminData.length === 0) {
            await supabase.auth.signOut();
            return res.status(401).json({ success: false, error: 'Unauthorized. Not recognized as admin.' });
        }

        // Issue JWT token to stay compatible with frontend expectations
        const token = jwt.sign({ email: email, role: 'SUPER_ADMIN' }, JWT_SECRET, { expiresIn: '12h' });

        res.json({ success: true, message: 'Admin login successful', token, role: 'SUPER_ADMIN' });
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

        const { error: otpError } = await supabase.auth.signInWithOtp({
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

        // Verify OTP
        const { data, error: verifyErr } = await supabase.auth.verifyOtp({
            email: email,
            token: otp,
            type: 'email'
        });

        if (verifyErr) throw verifyErr;

        // Since verifyOtp signs the user in implicitly if valid, we can now update the password
        const { error: updateErr } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (updateErr) throw updateErr;

        res.json({ success: true, message: 'Password reset successfully.' });
    } catch(err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const bp = require('bharat-pincode');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');

// Centralized in-memory database
const supabase = require('../utils/supabase');
const axios = require('axios');
const adminAuth = require('../middleware/adminAuth');
const PDFDocument = require('pdfkit');

// Validation middleware
const validatePhone = (phone) => {
  const phoneRegex = /^[6-9][0-9]{9}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Auto-segment tagging logic
function computeSegmentTags(data) {
  const tags = [];
  const openToEV = data.openToEV || '';
  const hasAccidental = data.hasAccidentalInsurance || '';
  const hasHealth = data.hasHealthInsurance || '';
  const interests = data.interests || '';
  const switchTriggers = data.switchTriggers || [];

  // 1. PERSONAL_INSURANCE_LEAD
  if (hasHealth === 'No' || hasHealth === 'Not sure') {
    tags.push('PERSONAL_INSURANCE_LEAD');
  }

  // 2. BIKE_INSURANCE_LEAD
  if (hasAccidental === 'No' || hasAccidental === 'Not sure') {
    tags.push('BIKE_INSURANCE_LEAD');
  }

  // 3. EV_SALE_LEAD
  if (openToEV === 'Yes' || openToEV === 'Need more information') {
    tags.push('EV_SALE_LEAD');
  }

  // 4. EV_RENTAL_LEAD
  const hasRentalTrigger = Array.isArray(switchTriggers) && switchTriggers.includes('Lower rental cost');
  if (interests === 'EV rental offer' || interests === 'All of the above' || hasRentalTrigger) {
    tags.push('EV_RENTAL_LEAD');
  }

  // 5. RETROFIT_LEAD
  if (interests === 'Retrofit information' || interests === 'All of the above') {
    tags.push('RETROFIT_LEAD');
  }

  // 6. PRODUCT_LEAD
  if (interests && interests !== 'None' && interests !== '') {
    tags.push('PRODUCT_LEAD');
  }

  return [...new Set(tags)]; // deduplicate
}

// Generate referral code in format RW-XXXX
function generateReferralCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'RW-';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Check milestone bonuses for referrer
function checkMilestoneBonuses(referrer) {
  const milestones = [];
  const refs = referrer.referrals;
  
  if (refs === 10 && !referrer.milestone10) {
    referrer.totalPoints += 100;
    referrer.milestone10 = true;
    milestones.push({ milestone: 10, bonus: 100, type: 'badge', message: `🎉 Congrats ${referrer.fullName}! You've referred 10 riders! +100 bonus points added. You earned a Road Warrior Badge!` });
  }
  if (refs === 25 && !referrer.milestone25) {
    referrer.totalPoints += 300;
    referrer.milestone25 = true;
    milestones.push({ milestone: 25, bonus: 300, type: 'milestone', message: `🏆 Amazing ${referrer.fullName}! 25 referrals achieved! +300 bonus points. You are a Road Warrior Champion!` });
  }
  if (refs === 50 && !referrer.milestone50) {
    referrer.totalPoints += 500;
    referrer.milestone50 = true;
    milestones.push({ milestone: 50, bonus: 500, type: 'luckydraw', message: `🚀 LEGEND! ${referrer.fullName} has referred 50 riders! +500 points & entered into the Lucky Draw!` });
  }
  
  return milestones;
}

// Check duplicate by phone
router.get('/riders/check-phone/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const { data: rows } = await supabase.from('riders').select('fullName, is_completed, totalPoints, joinedDate').eq('phone', phone);
    const rider = rows && rows.length > 0 ? rows[0] : null;
    let exists = !!rider;
    let riderName = rider ? rider.fullName : null;
    
    let isCompleted = false;
    if (rider) {
      const isLegacyDate = rider.joinedDate ? new Date(rider.joinedDate) < new Date('2026-07-01') : false;
      const hasPoints = rider.totalPoints > 0;
      isCompleted = rider.is_completed !== false || isLegacyDate || hasPoints;
    }
    
    res.json({ success: true, exists, riderName, isCompleted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Location APIs
router.get('/locations/states', (req, res) => {
  try {
    const states = [...new Set(bp.getAllStates().map(s => s.state))].sort();
    res.json({ success: true, data: states });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/locations/cities/:state', (req, res) => {
  try {
    const state = req.params.state;
    let cities = [];
    if (state.toLowerCase() === 'karnataka') {
      cities = [
        'Bagalkot', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban', 
        'Bidar', 'Chamarajanagar', 'Chikkaballapur', 'Chikkamagaluru', 'Chitradurga', 
        'Dakshina Kannada', 'Davangere', 'Dharwad', 'Gadag', 'Hassan', 'Haveri', 
        'Kalaburagi', 'Kodagu', 'Kolar', 'Koppal', 'Mandya', 'Mysuru', 'Raichur', 
        'Ramanagara', 'Shivamogga', 'Tumakuru', 'Udupi', 'Uttara Kannada', 
        'Vijayapura', 'Yadgir', 'Vijayanagara'
      ].sort();
    } else {
      const stateData = bp.getByState(state);
      cities = [...new Set(stateData.map(s => s.district || s.city))].filter(Boolean).sort();
    }
    res.json({ success: true, data: cities });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/locations/pincodes/:state/:city', (req, res) => {
  try {
    const stateData = bp.getByState(req.params.state);
    const filtered = stateData.filter(s => s.district === req.params.city || s.city === req.params.city);
    const pincodes = [...new Set(filtered.map(s => s.pincode))].sort();
    res.json({ success: true, data: pincodes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get rider by phone (for score lookup)
router.get('/riders/by-phone/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const { data: rows } = await supabase.from('riders').select('*').eq('phone', phone);
    const foundRider = rows && rows.length > 0 ? rows[0] : null;
    if (!foundRider) {
      return res.status(404).json({ success: false, error: 'Rider not found with this phone number' });
    }
    res.json({ success: true, data: foundRider });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get partial rider data by phone
router.get('/riders/partial/:phone', async (req, res) => {
  try {
    const normalizedPhone = req.params.phone.replace(/\D/g, '').slice(-10);
    const { data: rows } = await supabase.from('riders').select('*').eq('phone', normalizedPhone);
    const foundRider = rows && rows.length > 0 ? rows[0] : null;
    
    if (!foundRider) {
      return res.json({ exists: false });
    }
    
    if (foundRider.is_completed) {
      return res.json({ exists: true, is_completed: true });
    }
    
    return res.json({ exists: true, is_completed: false, data: foundRider });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save partial registration data
router.post('/riders/partial', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.phone) return res.status(400).json({ error: 'Phone is required' });
    
    const normalizedPhone = payload.phone.replace(/\D/g, '').slice(-10);
    payload.phone = normalizedPhone;
    
    // Check if exists and completed
    const { data: rows } = await supabase.from('riders').select('id, is_completed').eq('phone', normalizedPhone);
    const existing = rows && rows.length > 0 ? rows[0] : null;
    
    if (existing && existing.is_completed) {
      return res.status(400).json({ success: false, error: 'Registration already completed' });
    }
    
    // Upsert
    const { data, error } = await supabase.from('riders').upsert([payload], { onConflict: 'phone', ignoreDuplicates: false });
    if (error) throw error;
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create/Register Rider - Full Questionnaire (Sections A-F)

// Rate limiter: Maximum 3 registrations per IP address
const registerLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3, // Limit each IP to 3 requests per windowMs
  handler: (req, res) => {
    res.status(429).json({ success: false, error: 'Registration limit reached. Only 3 registrations are allowed per IP address.' });
  }
});

router.post('/riders/register', registerLimiter, async (req, res) => {
  try {
    const {
      // Section A
      fullName, phone, state, city, pincode, deliveryPlatform, experienceYears,
      // Auth
      email, password,
      // Section B & C
      vehicleType, vehicleModel, vehicleOwnership, weeklyRent, monthlyRent,
      workingHours, kmPerDay, kmPerMonth, fuelType, fuelMethod, fuelExpenseWeekly, netSalary, variablePay,
      maintenanceTyre, maintenanceOil, maintenanceService, maintenanceExpenseMonthly,
      maintPayServicing, maintPayPuncture, maintPayWear, maintPayAccident, maintInsured, maintServiceFreq,
      rentServiceHistory, rentTyreInspect, rentBrakeInspect, rentLightsInspect, rentDamagePay, rentAccidentPay, rentInsuranceIncluded,
      companyMaintPay, companyInsurance, companyDamagePay, companyAccidentPay,
      // Section D
      challenges, evChallenges, petrolChallenges, fuelCostChallenge,
      // Section E
      helmetUsage, trainingReceived, workplaceFacilities,
      // Section F
      referredByCode,
      // Section G
      consentPrivacy, consentMarketing, consentTerms,
      // Language preference
      language,
      // GPS Location Data
      latitude, longitude, locationAccuracy
    } = req.body;

    if (!fullName || !phone || !state || !city || !pincode) {
      return res.status(400).json({ success: false, error: 'Full name, phone, state, city, and pincode are required' });
    }

    if (!validatePhone(phone)) {
      return res.status(400).json({ success: false, error: 'Phone must be exactly 10 digits' });
    }

    // Normalize phone number to strictly 10 digits to prevent bypass
    const normalizedPhone = phone.replace(/\D/g, '').slice(-10);

    // Check duplicate phone
    const { data: dupPhoneRows, error: dupPhoneErr } = await supabase.from('riders').select('id, is_completed, joinedDate, totalPoints').eq('phone', normalizedPhone);
    if (dupPhoneErr) { console.error('[Register] dupPhone error:', dupPhoneErr); }
    const dupPhone = dupPhoneRows && dupPhoneRows.length > 0 ? dupPhoneRows[0] : null;
    
    let isUpdate = false;
    let existingId = null;

    if (dupPhone) {
      const isLegacyDate = dupPhone.joinedDate ? new Date(dupPhone.joinedDate) < new Date('2026-07-01') : false;
      const hasPoints = dupPhone.totalPoints > 0;
      if (dupPhone.is_completed !== false || isLegacyDate || hasPoints) {
        return res.status(400).json({ success: false, error: 'Phone number already registered. You can check your score at the Score page.' });
      } else {
        isUpdate = true;
        existingId = dupPhone.id;
      }
    }

    // Check duplicate email if provided
    if (email) {
      const { data: dupEmailRows } = await supabase.from('riders').select('id').eq('email', email);
      const dupEmail = dupEmailRows && dupEmailRows.length > 0 ? dupEmailRows[0] : null;
      if (dupEmail && dupEmail.id !== existingId) {
        return res.status(400).json({ success: false, error: 'Email already registered' });
      }
    }

    // Compute auto tags (legacy fields removed; passing available data if needed or empty)
    const tags = computeSegmentTags({ vehicleType });

    // Process referral code if provided
    let milestones = [];
    if (referredByCode) {
      const { data: referrerRows } = await supabase.from('riders').select('*').eq('referralCode', referredByCode);
      const referrer = referrerRows && referrerRows.length > 0 ? referrerRows[0] : null;
      if (referrer) {
        referrer.referrals = (referrer.referrals || 0) + 1;
        referrer.totalPoints = (referrer.totalPoints || 0) + 5;
        // Increase the rating by 0.1 for the successful referral
        referrer.rating = (Number(referrer.rating) || 5.0) + 0.1;
        
        milestones = checkMilestoneBonuses(referrer);
        await supabase.from('riders').update({ 
          referrals: referrer.referrals, 
          totalPoints: referrer.totalPoints, 
          rating: referrer.rating,
          milestone10: referrer.milestone10, 
          milestone25: referrer.milestone25, 
          milestone50: referrer.milestone50 
        }).eq('id', referrer.id);
      }
    }

    const referralCode = generateReferralCode();

    let hashedPassword = '';
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const rider = {
      "fullName": fullName,
      email: email || `${normalizedPhone}@roadwarrior.local`,
      password: hashedPassword,
      phone: normalizedPhone,
      state: state || '',
      city,
      pincode: pincode || '',
      "deliveryPlatform": deliveryPlatform || '',
      "experienceYears": experienceYears || '',
      "isActive": true,
      "totalPoints": 10,
      "totalDeliveries": 0,
      rating: 5.0,
      "joinedDate": new Date(),
      "lastActive": new Date(),
      "referralCode": referralCode,
      referrals: 0,
      "vehicleType": vehicleType || '',
      "vehicleModel": vehicleModel || '',
      "vehicleOwnership": vehicleOwnership || '',
      "weeklyRent": parseFloat(weeklyRent) || 0,
      "monthlyRent": parseFloat(monthlyRent) || 0,
      "workingHours": workingHours || '',
      "kmPerDay": parseFloat(kmPerDay) || 0,
      "kmPerMonth": parseFloat(kmPerMonth) || 0,
      "netSalary": netSalary || '',
      "variablePay": variablePay || '',
      "fuelType": fuelType || '',
      "fuelMethod": fuelMethod || '',
      "fuelExpenseWeekly": parseFloat(fuelExpenseWeekly) || 0,
      "maintenanceTyre": maintenanceTyre || '',
      "maintenanceOil": maintenanceOil || '',
      "maintenanceService": maintenanceService || '',
      "maintenanceExpenseMonthly": parseFloat(maintenanceExpenseMonthly) || 0,
      "maintPayServicing": maintPayServicing || '',
      "maintPayPuncture": maintPayPuncture || '',
      "maintPayWear": maintPayWear || '',
      "maintPayAccident": maintPayAccident || '',
      "maintInsured": maintInsured || '',
      "maintServiceFreq": maintServiceFreq || '',
      "rentServiceHistory": rentServiceHistory || '',
      "rentTyreInspect": rentTyreInspect || '',
      "rentBrakeInspect": rentBrakeInspect || '',
      "rentLightsInspect": rentLightsInspect || '',
      "rentDamagePay": rentDamagePay || '',
      "rentAccidentPay": rentAccidentPay || '',
      "rentInsuranceIncluded": rentInsuranceIncluded || '',
      "companyMaintPay": companyMaintPay || '',
      "companyInsurance": companyInsurance || '',
      "companyDamagePay": companyDamagePay || '',
      "companyAccidentPay": companyAccidentPay || '',
      challenges: Array.isArray(challenges) ? challenges : [],
      "evChallenges": Array.isArray(evChallenges) ? evChallenges : [],
      "petrolChallenges": Array.isArray(petrolChallenges) ? petrolChallenges : [],
      "fuelCostChallenge": fuelCostChallenge || '',
      "helmetUsage": helmetUsage || '',
      "trainingReceived": trainingReceived || '',
      "workplaceFacilities": workplaceFacilities || '',
      "referredByCode": referredByCode || null,
      "consentPrivacy": !!consentPrivacy,
      "consentMarketing": !!consentMarketing,
      "consentTerms": !!consentTerms,
      language: language || 'en',
      tags: tags,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      location_accuracy: locationAccuracy ? parseFloat(locationAccuracy) : null,
      "registeredAt": new Date(),
      "is_completed": true,
      "progress_percentage": 100
    };

    let riderId;

    // Smart retry: if Supabase returns a schema-cache "column not found" error,
    // strip the unknown column and retry up to 15 times (covers all possible missing columns).
    async function upsertRider(payload, maxRetries = 15) {
      let current = Object.assign({}, payload);
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        let result;
        if (isUpdate) {
          result = await supabase.from('riders').update(current).eq('id', existingId).select('id').single();
        } else {
          result = await supabase.from('riders').insert(current).select('id').single();
        }
        if (!result.error) return result;
        const msg = result.error.message || '';
        // Detect "Could not find the 'XYZ' column of 'riders'" or "column riders.XYZ does not exist"
        const colMatch = msg.match(/find the '(\w+)' column/i)
                      || msg.match(/column (?:riders\.)?(\w+) does not exist/i);
        if (colMatch && colMatch[1]) {
          const badCol = colMatch[1];
          console.warn(`[Register] Column "${badCol}" missing from DB schema, stripping and retrying (attempt ${attempt + 1})`);
          delete current[badCol];
          continue;
        }
        // Non-schema error — don't retry
        return result;
      }
      return await (isUpdate
        ? supabase.from('riders').update(current).eq('id', existingId).select('id').single()
        : supabase.from('riders').insert(current).select('id').single());
    }

    const { data: upserted, error: upsertErr } = await upsertRider(rider);
    if (upsertErr) {
      console.error('[Register] Upsert error:', upsertErr);
      return res.status(500).json({ success: false, error: 'Registration failed: ' + upsertErr.message });
    }
    riderId = upserted.id;

    // Use the actual request origin or the configured API_BASE_URL
    // Fallback to a production domain if missing. If origin is localhost, whatsapp won't linkify it but that's expected in dev.
    const publicDomain = req.headers.origin || process.env.API_BASE_URL || 'https://roadwarriorev.com';
    const refLink = `${publicDomain}/?ref=${referralCode}`;

    let whatsappMessage = '';
    if (language === 'hi') {
      whatsappMessage = `Namaste ${fullName}! Aapka registration ho gaya. Aapka referral code hai: ${referralCode}.\n\nIs link ko apne doston ko bheje aur jab wo login/register karenge toh aap points kamaenge: ${refLink}\n\nRoad Warrior EV 🏆`;
    } else if (language === 'kn') {
      whatsappMessage = `Namaskara ${fullName}! Nimma nondane aayitu. Nimma referral code: ${referralCode}.\n\nEe link annu nimma snehitrige kalisi, avaru login/register madidaga neevu points gaLisi: ${refLink}\n\nRoad Warrior EV 🏆`;
    } else if (language === 'ta') {
      whatsappMessage = `Vanakkam ${fullName}! Ungal pathivu mudinthathu. Ungal referral code: ${referralCode}.\n\nIntha link-ai matravargalukku anuppungal, avargal login/register seiyum pothu neengal points peruveergal: ${refLink}\n\nRoad Warrior EV 🏆`;
    } else if (language === 'te') {
      whatsappMessage = `Namaskaram ${fullName}! Mee registration poorhtayyindi. Mee referral code: ${referralCode}.\n\nEe link nu itarulaku pampandi, varu login/register ayinapudu meeru points pondutaru: ${refLink}\n\nRoad Warrior EV 🏆`;
    } else if (language === 'mr') {
      whatsappMessage = `Namaskar ${fullName}! Tumchi nondani zali aahe. Tumcha referral code: ${referralCode}.\n\nHi link itaranna pathwa, ani te jevha login/register kartil tevha tumhala points miltil: ${refLink}\n\nRoad Warrior EV 🏆`;
    } else if (language === 'gu') {
      whatsappMessage = `Namaste ${fullName}! Tamaru registration thai gayu chhe. Tamaro referral code chhe: ${referralCode}.\n\nAa link anya loko ne moklo, ane jyare teo login/register karshe tyare tamne points malshe: ${refLink}\n\nRoad Warrior EV 🏆`;
    } else if (language === 'bn') {
      whatsappMessage = `Nomoskar ${fullName}! Apnar registration somponno hoyeche. Apnar referral code holo: ${referralCode}.\n\nEi link ti onnoder pathan, ebong tara jokhon login/register korbe tokhon apni points paben: ${refLink}\n\nRoad Warrior EV 🏆`;
    } else {
      whatsappMessage = `Welcome ${fullName}! You are now registered. Your referral code is ${referralCode}.\n\nSend this link to others, and when they register with your code, you earn points: ${refLink}\n\nRoad Warrior EV 🏆`;
    }

    // Location is no longer appended to the WhatsApp message for privacy reasons
    
    // Attempt to directly send the WhatsApp message if Twilio is configured
    const twilio = require('twilio');
    const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_ACCOUNT_SID !== 'your_twilio_account_sid'
      ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
      : null;

    if (twilioClient && process.env.TWILIO_PHONE_NUMBER && process.env.TWILIO_PHONE_NUMBER !== 'your_twilio_phone_number') {
      try {
        await twilioClient.messages.create({
          body: whatsappMessage,
          from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
          to: `whatsapp:+91${normalizedPhone}`
        });
        console.log(`[WhatsApp] Sent registration confirmation to ${normalizedPhone}`);
      } catch (waErr) {
        console.error('[WhatsApp] Error sending message:', waErr);
      }
    } else {
      console.log(`[WhatsApp Mock] Would have automatically sent to ${normalizedPhone}: \n${whatsappMessage}`);
    }

    // Set HttpOnly cookie for the new session
    res.cookie('sessionId', riderId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      message: 'Rider registered successfully',
      data: { riderId, rider },
      referralCode,
      whatsappMessage,
      milestones
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Rider Profile
router.get('/riders/:riderId', async (req, res) => {
  try {
    const { riderId } = req.params;
    const { data: rows, error: dbError } = await supabase.from('riders').select('*').eq('id', riderId);
    if (dbError) throw dbError;
    const rider = rows && rows.length > 0 ? rows[0] : null;
    if (!rider) {
      return res.status(404).json({ success: false, error: 'Rider not found' });
    }
    res.json({ success: true, data: rider });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update Rider Profile
router.put('/riders/:riderId', async (req, res) => {
  try {
    const { riderId } = req.params;
    const { data: updateRows } = await supabase.from('riders').select('*').eq('id', riderId);
    const rider = updateRows && updateRows.length > 0 ? updateRows[0] : null;
    if (!rider) {
      return res.status(404).json({ success: false, error: 'Rider not found' });
    }

    const { fullName, phone, city, profileImage } = req.body;
    if (phone && !validatePhone(phone)) {
      return res.status(400).json({ success: false, error: 'Phone must be exactly 10 digits' });
    }

    if (fullName) rider.fullName = fullName;
    if (phone) rider.phone = phone;
    if (city) rider.city = city;
    if (profileImage) rider.profileImage = profileImage;
    rider.lastActive = new Date();

    await supabase.from('riders').update({
      fullName: rider.fullName,
      phone: rider.phone,
      city: rider.city,
      profileImage: rider.profileImage,
      lastActive: rider.lastActive
    }).eq('id', riderId);
    res.json({ success: true, message: 'Profile updated successfully', data: rider });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add Vehicle
router.post('/vehicles', async (req, res) => {
  try {
    const { riderId, vehicleType, licensePlate, color, make, model } = req.body;
    if (!riderId || !vehicleType || !licensePlate) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const { data: riderRowsV } = await supabase.from('riders').select('*').eq('id', riderId);
    const rider = riderRowsV && riderRowsV.length > 0 ? riderRowsV[0] : null;
    if (!rider) {
      return res.status(404).json({ success: false, error: 'Rider not found' });
    }

    const vehicleId = uuidv4();
    const vehicle = {
      id: vehicleId, riderId, vehicleType,
      licensePlate: licensePlate.toUpperCase(), color, make, model,
      registrationDate: new Date(), status: 'active', mileage: 0, fuelType: 'petrol',
      insurance: { provider: '', expiryDate: null, policyNumber: '' }
    };

    await supabase.from('vehicles').insert(vehicle);
    res.json({ success: true, message: 'Vehicle added successfully', data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Rider Vehicles
router.get('/riders/:riderId/vehicles', async (req, res) => {
  try {
    const { riderId } = req.params;
    const { data: vehicles } = await supabase.from('vehicles').select('*').eq('riderId', riderId);
    res.json({ success: true, data: vehicles });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create Delivery
router.post('/deliveries', async (req, res) => {
  try {
    const { riderId, pickupLocation, dropoffLocation, deliveryType, amount } = req.body;
    if (!riderId || !pickupLocation || !dropoffLocation) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const { data: riderRowsD } = await supabase.from('riders').select('*').eq('id', riderId);
    const rider = riderRowsD && riderRowsD.length > 0 ? riderRowsD[0] : null;
    if (!rider) {
      return res.status(404).json({ success: false, error: 'Rider not found' });
    }

    const deliveryId = uuidv4();
    const delivery = {
      id: deliveryId, riderId, pickupLocation, dropoffLocation,
      deliveryType: deliveryType || 'food', amount: amount || 50,
      status: 'pending', createdAt: new Date(),
      startTime: null, endTime: null, distance: 0, duration: 0, rating: null
    };

    await supabase.from('deliveries').insert(delivery);
    rider.totalDeliveries += 1;
    await supabase.from('riders').update({ totalDeliveries: rider.totalDeliveries }).eq('id', riderId);
    res.json({ success: true, message: 'Delivery created successfully', data: delivery });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update Delivery Status
router.put('/deliveries/:deliveryId', async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { status, rating } = req.body;
    const { data: deliveryRows } = await supabase.from('deliveries').select('*').eq('id', deliveryId);
    const delivery = deliveryRows && deliveryRows.length > 0 ? deliveryRows[0] : null;
    if (!delivery) {
      return res.status(404).json({ success: false, error: 'Delivery not found' });
    }

    if (status === 'completed') {
      delivery.endTime = new Date();
      const { data: riderRowsU } = await supabase.from('riders').select('*').eq('id', delivery.riderId);
      const rider = riderRowsU && riderRowsU.length > 0 ? riderRowsU[0] : null;
      if (rider) {
        rider.totalPoints += Math.floor(delivery.amount / 10);
        rider.lastActive = new Date();
        await supabase.from('riders').update({ totalPoints: rider.totalPoints, lastActive: rider.lastActive }).eq('id', rider.id);
      }
    }

    if (status) delivery.status = status;
    if (rating) delivery.rating = rating;
    await supabase.from('deliveries').update(delivery).eq('id', deliveryId);
    res.json({ success: true, message: 'Delivery updated successfully', data: delivery });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Rider Deliveries
router.get('/riders/:riderId/deliveries', async (req, res) => {
  try {
    const { riderId } = req.params;
    const { data: deliveriesRaw } = await supabase.from('deliveries').select('*').eq('riderId', riderId);
    const deliveries = deliveriesRaw || [];
    res.json({ success: true, data: deliveries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get All Riders (Admin)
router.get('/admin/riders', adminAuth(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const { data: ridersRaw, error: dbError } = await supabase.from('riders').select('*');
    console.log("Admin riders fetch. Data length:", ridersRaw?.length, "Error:", dbError);
    if (dbError) throw dbError;
    const riders = ridersRaw || [];
    res.json({ success: true, data: riders });
  } catch (error) {
    console.error("Admin riders error:", error);
    res.status(500).json({ success: false, error: error.message || error });
  }
});

// Admin: Get EV Leads
router.get('/admin/leads/ev', adminAuth(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const { data: evLeadsRaw } = await supabase.from('riders').select('*');
    const evLeads = (evLeadsRaw || []).filter(r =>
      r.openToEV === 'Yes' || r.openToEV === 'Need more information' || (r.tags && r.tags.includes('Hot EV Lead'))
    );
    res.json({ success: true, data: evLeads });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin: Get Insurance Leads
router.get('/admin/leads/insurance', adminAuth(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const { data: insLeadsRaw } = await supabase.from('riders').select('*');
    const insLeads = (insLeadsRaw || []).filter(r =>
      r.hasAccidentalInsurance === 'No' || r.hasAccidentalInsurance === 'Not sure' ||
      r.hasHealthInsurance === 'No' || r.hasHealthInsurance === 'Not sure' ||
      (r.tags && r.tags.includes('Insurance Lead'))
    );
    res.json({ success: true, data: insLeads });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin: Lead Segmentation Filter
router.get('/admin/leads/segment/:segment', adminAuth(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const { segment } = req.params;
    const { data: leadsRaw } = await supabase.from('riders').select('*');
    let leads = leadsRaw || [];
    const abandonedThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
    leads.forEach(r => {
       if (r.is_completed) r.form_status = 'Completed';
       else if (new Date(r.updated_at) < abandonedThreshold) r.form_status = 'Abandoned';
       else if (r.current_step > 1) r.form_status = 'Partial';
       else r.form_status = 'Lead';
    });
    if (segment !== 'ALL') {
       leads = leads.filter(r => r.tags && r.tags.includes(segment));
    }
    res.json({ success: true, data: leads });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin: Export Leads CSV
router.get('/admin/export/csv', adminAuth(['SUPER_ADMIN', 'ADMIN', 'VIEWER']), async (req, res) => {
  try {
    const { segment } = req.query;
    const { data: leadsRaw } = await supabase.from('riders').select('*');
    let leads = leadsRaw || [];
    const abandonedThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
    leads.forEach(r => {
       if (r.is_completed) r.form_status = 'Completed';
       else if (new Date(r.updated_at) < abandonedThreshold) r.form_status = 'Abandoned';
       else if (r.current_step > 1) r.form_status = 'Partial';
       else r.form_status = 'Lead';
    });
    if (segment && segment !== 'ALL') {
       if (segment === 'STATUS_LEAD') leads = leads.filter(r => r.form_status === 'Lead');
       else if (segment === 'STATUS_PARTIAL') leads = leads.filter(r => r.form_status === 'Partial');
       else if (segment === 'STATUS_COMPLETED') leads = leads.filter(r => r.form_status === 'Completed');
       else if (segment === 'STATUS_ABANDONED') leads = leads.filter(r => r.form_status === 'Abandoned');
       else if (segment === 'EV_SALE_LEAD') leads = leads.filter(r => r.openToEV === 'Yes' || r.openToEV === 'Need more information' || (r.tags || []).includes('Hot EV Lead'));
       else if (segment === 'EV_RIDERS') leads = leads.filter(r => (r.vehicleType || '').toLowerCase().includes('electric'));
       else if (segment === 'PERSONAL_INSURANCE_LEAD' || segment === 'BIKE_INSURANCE_LEAD') leads = leads.filter(r => r.hasAccidentalInsurance === 'No' || r.hasAccidentalInsurance === 'Not sure' || r.hasHealthInsurance === 'No' || r.hasHealthInsurance === 'Not sure' || (r.tags || []).includes('Insurance Lead'));
       else leads = leads.filter(r => r.tags && r.tags.includes(segment));
    }
    
    // Build CSV
    const headers = [
      'ID', 'Full Name', 'Email', 'Phone', 'State', 'City', 'Pincode',
      'Platform', 'Experience (Years)', 'Vehicle Type', 'Vehicle Model',
      'Fuel Method', 'Weekly Fuel Expense', 'Monthly Maint Expense',
      'Accidental Insurance', 'Health Insurance', 'Paid Out of Pocket',
      'Open to EV', 'Switch Triggers', 'Interests', 'Points', 'Referrals',
      'Tags', 'Registered At'
    ];
    const rows = leads.map(r => [
      r.id, 
      r.fullName,
      r.email || '',
      r.phone || '',
      r.state || '',
      r.city || '',
      r.pincode || '',
      r.deliveryPlatform || '',
      r.experienceYears || '',
      r.vehicleType || '',
      r.vehicleModel || '',
      r.fuelMethod || '',
      r.fuelExpenseWeekly || 0,
      r.maintenanceExpenseMonthly || 0,
      r.hasAccidentalInsurance || '',
      r.hasHealthInsurance || '',
      r.paidOutofPocketAccident || '',
      r.openToEV || '',
      r.switchTriggers ? r.switchTriggers.join(';') : '',
      r.interests || '',
      r.totalPoints || 0, 
      r.referrals || 0,
      r.tags ? r.tags.join(';') : '',
      r.registeredAt ? new Date(r.registeredAt).toISOString() : ''
    ].map(field => `"${String(field === null || field === undefined ? '' : field).replace(/"/g, '""')}"`).join(','));
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=leads_export_${segment || 'ALL'}_${Date.now()}.csv`);
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin: Export Leads PDF
router.get('/admin/export/pdf', adminAuth(['SUPER_ADMIN', 'ADMIN', 'VIEWER']), async (req, res) => {
  try {
    const { segment } = req.query;
    const { data: leadsRaw } = await supabase.from('riders').select('*');
    let leads = leadsRaw || [];
    if (segment && segment !== 'ALL') {
       leads = leads.filter(r => r.tags && r.tags.includes(segment));
    }

    const doc = new PDFDocument();
    let filename = `leads_export_${segment || 'ALL'}_${Date.now()}.pdf`;
    res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-type', 'application/pdf');

    doc.pipe(res);

    doc.fontSize(20).text(`Road Warrior EV Leads - ${segment || 'ALL'}`, { align: 'center' });
    doc.moveDown();

    leads.forEach((lead, i) => {
      doc.fontSize(12).text(`${i + 1}. ${lead.fullName} (${lead.phone})`);
      doc.fontSize(10).text(`Email: ${lead.email || 'N/A'}, City: ${lead.city || 'N/A'}`);
      doc.text(`Vehicle: ${lead.vehicleType || 'N/A'}, Open to EV: ${lead.openToEV || 'N/A'}`);
      doc.text(`Tags: ${lead.tags ? lead.tags.join(', ') : 'None'}`);
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin: Get vehicle type stats
router.get('/admin/vehicle-stats', adminAuth(['SUPER_ADMIN', 'ADMIN', 'VIEWER']), async (req, res) => {
  try {
    const { data: ridersRaw } = await supabase.from('riders').select('vehicleType');
    const riders = ridersRaw || [];
    const stats = { petrol: 0, electric: 0, diesel: 0, other: 0 };
    riders.forEach(r => {
      const vt = (r.vehicleType || '').toLowerCase();
      if (vt.includes('electric')) stats.electric++;
      else if (vt.includes('petrol')) stats.petrol++;
      else if (vt.includes('diesel')) stats.diesel++;
      else stats.other++;
    });
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin: City breakdown
router.get('/admin/city-stats', adminAuth(['SUPER_ADMIN', 'ADMIN', 'VIEWER']), async (req, res) => {
  try {
    const { data: ridersRaw } = await supabase.from('riders').select('city');
    const riders = ridersRaw || [];
    const cityMap = {};
    riders.forEach(r => {
      let rawCity = (r.city || 'Unknown').trim();
      let city = rawCity.toLowerCase() === 'unknown' ? 'Unknown' : rawCity.charAt(0).toUpperCase() + rawCity.slice(1).toLowerCase();
      if (!cityMap[city]) cityMap[city] = 0;
      cityMap[city]++;
    });
    const data = Object.entries(cityMap).map(([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { data: ridersRaw } = await supabase.from('riders').select('*').order('totalPoints', { ascending: false }).limit(100);
    const riders = (ridersRaw || []).map((rider, index) => ({ rank: index + 1, ...rider }));
    res.json({ success: true, data: riders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Statistics
router.get('/stats/:riderId', async (req, res) => {
  try {
    const { riderId } = req.params;
    const { data: riderRowsSt } = await supabase.from('riders').select('*').eq('id', riderId);
    const rider = riderRowsSt && riderRowsSt.length > 0 ? riderRowsSt[0] : null;
    if (!rider) {
      return res.status(404).json({ success: false, error: 'Rider not found' });
    }

    const { data: deliveriesRaw } = await supabase.from('deliveries').select('*').eq('riderId', riderId);
    const deliveries = deliveriesRaw || [];

    const completedDeliveries = deliveries.filter(d => d.status === 'completed');
    const totalEarnings = completedDeliveries.reduce((sum, d) => sum + (d.amount || 0), 0);

    const stats = {
      totalDeliveries: rider.totalDeliveries,
      completedDeliveries: completedDeliveries.length,
      totalEarnings,
      totalPoints: rider.totalPoints,
      rating: rider.rating,
      joinedDate: rider.joinedDate,
      referrals: rider.referrals,
      referralCode: rider.referralCode,
      tags: rider.tags || [],
      acceptanceRate: rider.totalDeliveries > 0 ? (completedDeliveries.length / rider.totalDeliveries * 100).toFixed(2) : 0,
      averageRating: deliveries.filter(d => d.rating).length > 0
        ? (deliveries.filter(d => d.rating).reduce((sum, d) => sum + d.rating, 0) / deliveries.filter(d => d.rating).length).toFixed(2)
        : 5.0
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health Check
router.get('/health', async (req, res) => {
  res.json({ success: true, status: 'API is running', timestamp: new Date() });
});

module.exports = router;

// ----------------------------------------------------------------------
// PROGRESSIVE FORM SAVE ENDPOINTS
// ----------------------------------------------------------------------

router.post('/riders/partial', async (req, res) => {
  try {
    const { phone, current_step, total_steps = 7, ...partialData } = req.body;
    
    // Sanitize numeric fields to prevent 'invalid input syntax for type numeric: ""' error
    const numericFields = ['weeklyRent', 'monthlyRent', 'kmPerDay', 'kmPerMonth', 'fuelExpenseWeekly', 'maintenanceExpenseMonthly', 'experienceYears'];
    numericFields.forEach(field => {
      if (partialData[field] === '') {
        partialData[field] = null;
      }
    });
    
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Phone is required' });
    }

    const normalizedPhone = phone.replace(/\D/g, '').slice(-10);
    const progress_percentage = current_step ? Math.min(100, Math.round((current_step / total_steps) * 100)) : 0;
    
    const { data: dupPhoneRows } = await supabase.from('riders').select('id, is_completed, joinedDate, totalPoints').eq('phone', normalizedPhone);
    const dupPhone = dupPhoneRows && dupPhoneRows.length > 0 ? dupPhoneRows[0] : null;

    if (dupPhone) {
      const isLegacyDate = dupPhone.joinedDate ? new Date(dupPhone.joinedDate) < new Date('2026-07-01') : false;
      const hasPoints = dupPhone.totalPoints > 0;
      if (dupPhone.is_completed !== false || isLegacyDate || hasPoints) {
        return res.status(400).json({ success: false, error: 'Phone number already registered and completed.' });
      }
      // Update
      const { error: updateErr } = await supabase.from('riders').update({
        ...partialData,
        current_step,
        progress_percentage
      }).eq('id', dupPhone.id);
      
      if (updateErr) throw updateErr;
      return res.json({ success: true, message: 'Partial updated' });
    } else {
      // Insert new partial
      const referralCode = generateReferralCode();
      const rider = {
        phone: normalizedPhone,
        fullName: partialData.fullName || '',
        ...partialData,
        current_step,
        progress_percentage,
        referralCode,
        is_completed: false
      };
      
      const { error: insertErr } = await supabase.from('riders').insert(rider);
      if (insertErr) throw insertErr;
      return res.json({ success: true, message: 'Lead created' });
    }
  } catch (err) {
    console.error('[Partial Form Save] error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.get('/riders/partial/:phone', async (req, res) => {
  try {
    const normalizedPhone = req.params.phone.replace(/\D/g, '').slice(-10);
    const { data: riderRows, error } = await supabase.from('riders').select('*').eq('phone', normalizedPhone);
    
    if (error) throw error;
    if (!riderRows || riderRows.length === 0) {
      return res.json({ success: true, exists: false });
    }
    
    const rider = riderRows[0];
    return res.json({ 
      success: true, 
      exists: true, 
      is_completed: rider.is_completed,
      current_step: rider.current_step,
      data: rider
    });
  } catch (err) {
    console.error('[Get Partial] error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

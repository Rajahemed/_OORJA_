const { v4: uuidv4 } = require('uuid');
const supabase = require('./supabase');

// Supported Providers: 'twilio', 'meta'
const WHATSAPP_PROVIDER = process.env.WHATSAPP_PROVIDER || 'meta';

class WhatsAppClient {
  constructor() {
    this.provider = WHATSAPP_PROVIDER;
    console.log(`📱 WhatsApp Client initialized using provider: ${this.provider}`);
  }

  /**
   * Send a WhatsApp message to a specific number
   * @param {string} to Phone number with country code (e.g. +919876543210)
   * @param {string} message Text message to send
   * @param {string} riderId Associated rider for logging
   * @param {string} language Language of message for logging
   * @param {string} type e.g., 'registration', 'milestone_10', 'milestone_25'
   */
  async sendMessage(to, message, riderId = null, language = 'en', type = 'notification') {
    try {
      // Check for duplicate milestone messages
      if (riderId && type.startsWith('milestone')) {
        const { data: hasSent } = await supabase.from('whatsappLogs')
          .select('id').eq('riderId', riderId).eq('type', type).single();
        
        if (hasSent) {
          console.log(`[WhatsApp] Duplicate milestone ${type} prevented for rider ${riderId}`);
          return false;
        }
      }

      console.log(`\n========================================`);
      console.log(`[WhatsApp API: ${this.provider}] Sending Message`);
      console.log(`To: ${to}`);
      console.log(`Language: ${language}`);
      console.log(`Message: ${message}`);
      console.log(`========================================\n`);

      // Mock integration for Demo purposes, simulating real Twilio / Meta API call
      // In a real scenario, this would make an axios call:
      // if (this.provider === 'meta') { await axios.post(...) }

      const logId = uuidv4();
      const logEntry = {
        id: logId,
        to,
        message,
        riderId,
        language,
        type,
        provider: this.provider,
        status: 'sent',
        sentAt: new Date()
      };
      
      await supabase.from('whatsappLogs').insert(logEntry);
      return true;
    } catch (error) {
      console.error('[WhatsApp Error]', error);
      return false;
    }
  }

  // Pre-defined templates
  async sendRegistrationConfirmation(rider, language) {
    const to = `+91${rider.phone}`;
    let message = '';
    const refLink = `https://roadwarrior.pro/?ref=${rider.referralCode}`;

    if (language === 'hi') {
      message = `नमस्ते ${rider.fullName} भाई! आपका रजिस्ट्रेशन हो गया। आपका रेफरल कोड है: ${rider.referralCode}\n\nइस लिंक से दोस्तों को इन्वाइट करो और पॉइंट्स कमाओ: ${refLink}\n\nRoad Warrior बनो!`;
    } else if (language === 'kn') {
      message = `ನಮಸ್ಕಾರ ${rider.fullName}! ನಿಮ್ಮ ನೋಂದಣಿ ಆಯಿತು. ನಿಮ್ಮ ರೆಫರಲ್ ಕೋಡ್: ${rider.referralCode}\n\nಈ ಲಿಂಕ್ ಅನ್ನು ನಿಮ್ಮ ಸ್ನೇಹಿತರೊಂದಿಗೆ ಶೇರ್ ಮಾಡಿ ಮತ್ತು ಪಾಯಿಂಟ್ಸ್ ಗಳಿಸಿ: ${refLink}\n\nRoad Warrior ಆಗಿ!`;
    } else {
      message = `Welcome ${rider.fullName}! You are now registered. Your referral code is ${rider.referralCode}\n\nShare this link with other riders to earn points and rewards: ${refLink}\n\nRoad Warrior — let's go!`;
    }

    return this.sendMessage(to, message, rider.id, language, 'registration');
  }

  async sendMilestoneMessage(rider, milestone, bonus) {
    const to = `+91${rider.phone}`;
    let message = '';
    
    if (milestone === 10) {
      message = `🎉 Congrats ${rider.fullName}! You have achieved the 10 Referrals Milestone! We have added +${bonus} bonus points to your account. You've earned the Road Warrior Badge! 🥇`;
    } else if (milestone === 25) {
      message = `🏆 Amazing ${rider.fullName}! You have achieved 25 Referrals! +${bonus} bonus points added. You are officially a Road Warrior Champion! 👑`;
    } else if (milestone === 50) {
      message = `🚀 LEGEND! ${rider.fullName}, you have achieved 50 Referrals! +${bonus} points added. You are entered into the Road Warrior Lucky Draw! 🎁`;
    }

    return this.sendMessage(to, message, rider.id, rider.language || 'en', `milestone_${milestone}`);
  }
}

module.exports = new WhatsAppClient();

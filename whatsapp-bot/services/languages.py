"""
Language definitions and state→language mapping.
"""
from typing import List, Optional

# Map of Indian state (lowercase) → supported language codes
STATE_LANGUAGE_MAP = {
    "karnataka":      ["en", "kn"],
    "maharashtra":    ["en", "mr"],
    "telangana":      ["en", "te"],
    "tamil nadu":     ["en", "ta"],
    "kerala":         ["en", "ml"],
    "gujarat":        ["en", "gu"],
    "west bengal":    ["en", "bn"],
    "punjab":         ["en", "pa"],
    "uttar pradesh":  ["en", "hi"],
    "delhi":          ["en", "hi"],
    "haryana":        ["en", "hi"],
    "madhya pradesh": ["en", "hi"],
    "rajasthan":      ["en", "hi"],
    "bihar":          ["en", "hi"],
    "jharkhand":      ["en", "hi"],
    "uttarakhand":    ["en", "hi"],
    "chhattisgarh":   ["en", "hi"],
    "himachal pradesh": ["en", "hi"],
    "goa":            ["en", "mr"],
    "andhra pradesh": ["en", "te"],
    "odisha":         ["en", "or"],
    "assam":          ["en", "as"],
}

DEFAULT_LANGUAGES = ["en", "hi"]

LANGUAGE_NAMES = {
    "en": "English 🇬🇧",
    "hi": "हिंदी",
    "kn": "ಕನ್ನಡ",
    "mr": "मराठी",
    "te": "తెలుగు",
    "ta": "தமிழ்",
    "ml": "മലയാളം",
    "gu": "ગુજરાતી",
    "bn": "বাংলা",
    "pa": "ਪੰਜਾਬੀ",
    "or": "ଓଡ଼ିଆ",
    "as": "অসমীয়া",
}

# Per-language message templates
MESSAGES = {
    "en": {
        "welcome": (
            "Hello 👋 Welcome to *Road Warrior EV*!\n\n"
            "I'll help you complete your rider registration in under 3 minutes.\n\n"
            "Please choose your preferred language:"
        ),
        "ask_name": "Great! 😊 Let's start.\n\nWhat is your *full name*?",
        "ask_phone": "Thanks, {name}! 📱\n\nWhat is your *WhatsApp phone number*? (10 digits)",
        "ask_state": "Which *state* are you from?",
        "ask_city": "Which *city* do you work in?",
        "ask_platform": "Which *delivery platform* do you work for?\n\n• Zomato\n• Swiggy\n• Blinkit\n• Zepto\n• Dunzo\n• Amazon\n• Flipkart\n• Other",
        "ask_experience": "How many *years of experience* do you have as a delivery rider?\n\n(Enter a number, e.g. 2)",
        "ask_employment": "Are you a *full-time* or *part-time* rider?\n\n1. Full Time\n2. Part Time",
        "ask_vehicle_type": "What type of *vehicle* do you ride?\n\n1. Electric ⚡\n2. Petrol ⛽\n3. Diesel 🛢\n4. Hybrid",
        "ask_vehicle_brand": "What is the *brand* of your vehicle? (e.g. Honda, Ather, Bajaj)",
        "ask_vehicle_model": "What is the *model* of your vehicle? (e.g. Activa, 450X, Pulsar)",
        "ask_ownership": "Do you *own* your vehicle or use a *rental*?\n\n1. Own\n2. Rental",
        "ask_weekly_distance": "How many *km do you ride per week*? (Enter a number)",
        "ask_monthly_distance": "How many *km do you ride per month*? (Enter a number)",
        "ask_fuel_expense": "How much do you spend on *fuel per week*? (₹)",
        "ask_maintenance": "How much do you spend on *vehicle maintenance per month*? (₹)",
        "ask_ev_challenges": "What are the *top 3 challenges* you face as an EV rider?\n\n• Charging infrastructure\n• Battery range anxiety\n• High purchase cost\n• Lack of service centers\n• Long charging time\n• Other\n\n(Type your challenges separated by commas)",
        "ask_petrol_challenges": "What are the *top 3 challenges* you face as a petrol rider?\n\n• High fuel costs\n• Frequent maintenance\n• Traffic & pollution\n• Vehicle breakdown\n• Low earnings\n• Other\n\n(Type your challenges separated by commas)",
        "ask_challenges_generic": "What are the *top 3 challenges* you face as a delivery rider? (Type them separated by commas)",
        "ask_accident_insurance": "Do you have *accidental insurance* for your vehicle?\n\n1. Yes\n2. No\n3. Not sure",
        "ask_health_insurance": "Do you have *personal health insurance*?\n\n1. Yes\n2. No\n3. Not sure",
        "ask_oop_cost": "If you had an accident, how much did you pay *out of pocket*? (₹, or type '0' if not applicable)",
        "ask_ev_interest": "Are you interested in *switching to an Electric Vehicle*?\n\n1. Yes\n2. No\n3. Need more info",
        "ask_ev_reason": "Why are you interested in switching to EV? (Share your reason)",
        "ask_ev_services": "Which EV services are you interested in? (Select all that apply)\n\n1. EV Rental\n2. Insurance\n3. Retrofit\n4. Finance\n5. Charging Solutions\n6. Battery Swap\n7. All of the above\n8. None",
        "ask_referred": "Were you *referred* by another rider?\n\n1. Yes\n2. No",
        "ask_referral_code": "Please enter your *referral code*:",
        "invalid_referral": "❌ That referral code was not found. Please check and try again, or type *Skip* to continue without a referral code.",
        "invalid_phone": "❌ Please enter a valid 10-digit Indian phone number.",
        "invalid_number": "❌ Please enter a valid number.",
        "confirm_header": "✅ *Almost done!* Please confirm your details:\n\n",
        "confirm_footer": "\n\nType *Confirm* to register, or *Edit* to change a specific detail.",
        "registering": "⏳ Registering you now, please wait...",
        "success": (
            "🎉 *Registration Successful!*\n\n"
            "Welcome to Road Warrior EV, {name}!\n\n"
            "📋 *Your Details:*\n"
            "• Referral Code: *{code}*\n"
            "• Points: *{points}*\n"
            "• Referral Link: {link}\n\n"
            "🏆 Share your referral code and earn 5 points per friend!\n\n"
            "Type *LEADERBOARD* to see the top riders."
        ),
        "already_registered": "You are already registered! Type *MY SCORE* to check your points.",
        "help": (
            "*Available Commands:*\n\n"
            "• *MY SCORE* — View your current points\n"
            "• *LEADERBOARD* — Top 10 riders\n"
            "• *REFERRAL* — Your referral info\n"
            "• *PROFILE* — Your rider profile\n"
            "• *POINTS* — Your reward points\n"
            "• *STATUS* — Registration progress\n"
            "• *START OVER* — Restart conversation\n"
            "• *HELP* — Show this menu\n\n"
            "_To edit an answer, type: *Change city*, *Change phone*, *Change vehicle*, etc._"
        ),
        "start_over": "🔄 Conversation reset. Let's start fresh!\n\n",
        "leaderboard_title": "🏆 *Top 10 Road Warriors:*\n\n",
        "no_score": "You are not registered yet. Complete your registration to earn points!",
        "error": "⚠️ Something went wrong. Please try again in a moment.",
        "timeout_resume": "Welcome back! 👋 Continuing your registration from where we left off.",
        "voice_processing": "🎤 Processing your voice message...",
        "location_detected": "📍 Location received! Detected: *{city}, {state}*",
    },
    "hi": {
        "welcome": (
            "नमस्ते 👋 *Road Warrior EV* में आपका स्वागत है!\n\n"
            "मैं आपको 3 मिनट से कम समय में राइडर पंजीकरण पूरा करने में मदद करूंगा।\n\n"
            "कृपया अपनी पसंदीदा भाषा चुनें:"
        ),
        "ask_name": "बढ़िया! 😊 चलिए शुरू करते हैं।\n\nआपका *पूरा नाम* क्या है?",
        "ask_phone": "धन्यवाद, {name}! 📱\n\nआपका *WhatsApp नंबर* क्या है? (10 अंक)",
        "ask_state": "आप किस *राज्य* से हैं?",
        "ask_city": "आप किस *शहर* में काम करते हैं?",
        "ask_platform": "आप किस *डिलीवरी प्लेटफॉर्म* के लिए काम करते हैं?\n\n• Zomato\n• Swiggy\n• Blinkit\n• Zepto\n• Dunzo\n• Amazon\n• Flipkart\n• अन्य",
        "ask_experience": "डिलीवरी राइडर के रूप में आपका *कितने साल का अनुभव* है?\n\n(एक संख्या दर्ज करें, जैसे 2)",
        "ask_employment": "क्या आप *फुल-टाइम* या *पार्ट-टाइम* राइडर हैं?\n\n1. पूर्णकालिक\n2. अंशकालिक",
        "ask_vehicle_type": "आप किस प्रकार का *वाहन* चलाते हैं?\n\n1. इलेक्ट्रिक ⚡\n2. पेट्रोल ⛽\n3. डीजल 🛢\n4. हाइब्रिड",
        "ask_vehicle_brand": "आपके वाहन का *ब्रांड* क्या है?",
        "ask_vehicle_model": "आपके वाहन का *मॉडल* क्या है?",
        "ask_ownership": "क्या आपका वाहन *खुद का* है या *किराए* का?\n\n1. खुद का\n2. किराया",
        "ask_weekly_distance": "आप *प्रति सप्ताह कितने km* चलते हैं?",
        "ask_monthly_distance": "आप *प्रति महीने कितने km* चलते हैं?",
        "ask_fuel_expense": "आप *प्रति सप्ताह ईंधन पर कितना* खर्च करते हैं? (₹)",
        "ask_maintenance": "आप *प्रति महीने वाहन रखरखाव पर कितना* खर्च करते हैं? (₹)",
        "ask_ev_challenges": "EV राइडर के रूप में आपकी *3 मुख्य चुनौतियाँ* क्या हैं? (अल्पविराम से अलग करके टाइप करें)",
        "ask_petrol_challenges": "पेट्रोल राइडर के रूप में आपकी *3 मुख्य चुनौतियाँ* क्या हैं? (अल्पविराम से अलग करके टाइप करें)",
        "ask_challenges_generic": "डिलीवरी राइडर के रूप में आपकी *3 मुख्य चुनौतियाँ* क्या हैं?",
        "ask_accident_insurance": "क्या आपके वाहन का *दुर्घटना बीमा* है?\n\n1. हाँ\n2. नहीं\n3. पता नहीं",
        "ask_health_insurance": "क्या आपका *व्यक्तिगत स्वास्थ्य बीमा* है?\n\n1. हाँ\n2. नहीं\n3. पता नहीं",
        "ask_oop_cost": "दुर्घटना में आपने *जेब से कितना* चुकाया? (₹, या '0' दर्ज करें)",
        "ask_ev_interest": "क्या आप *इलेक्ट्रिक वाहन* में बदलने में रुचि रखते हैं?\n\n1. हाँ\n2. नहीं\n3. अधिक जानकारी चाहिए",
        "ask_ev_reason": "आप EV में क्यों बदलना चाहते हैं?",
        "ask_ev_services": "आप किन EV सेवाओं में रुचि रखते हैं? (सभी चुनें)\n\n1. EV किराया\n2. बीमा\n3. रेट्रोफिट\n4. वित्त\n5. चार्जिंग\n6. बैटरी स्वैप\n7. सभी\n8. कोई नहीं",
        "ask_referred": "क्या किसी ने आपको *रेफर* किया?\n\n1. हाँ\n2. नहीं",
        "ask_referral_code": "कृपया अपना *रेफरल कोड* दर्ज करें:",
        "invalid_referral": "❌ रेफरल कोड नहीं मिला। दोबारा जाँचें, या *Skip* टाइप करें।",
        "invalid_phone": "❌ कृपया 10 अंकों का वैध भारतीय फोन नंबर दर्ज करें।",
        "invalid_number": "❌ कृपया एक वैध संख्या दर्ज करें।",
        "confirm_header": "✅ *लगभग हो गया!* अपनी जानकारी की पुष्टि करें:\n\n",
        "confirm_footer": "\n\n*Confirm* टाइप करें या *Edit* टाइप करें।",
        "registering": "⏳ पंजीकरण हो रहा है, कृपया प्रतीक्षा करें...",
        "success": (
            "🎉 *पंजीकरण सफल!*\n\n"
            "Road Warrior EV में आपका स्वागत है, {name}!\n\n"
            "📋 *आपकी जानकारी:*\n"
            "• रेफरल कोड: *{code}*\n"
            "• पॉइंट्स: *{points}*\n"
            "• रेफरल लिंक: {link}\n\n"
            "🏆 अपना कोड शेयर करें और प्रति दोस्त 5 पॉइंट कमाएं!"
        ),
        "already_registered": "आप पहले से पंजीकृत हैं! *MY SCORE* टाइप करें।",
        "help": "*उपलब्ध कमांड:*\n\n• *MY SCORE* — अंक\n• *LEADERBOARD* — टॉप राइडर\n• *START OVER* — फिर से शुरू\n• *HELP* — सहायता",
        "start_over": "🔄 बातचीत रीसेट। फिर से शुरू!\n\n",
        "leaderboard_title": "🏆 *टॉप 10 Road Warriors:*\n\n",
        "no_score": "आप अभी पंजीकृत नहीं हैं।",
        "error": "⚠️ कुछ गलत हो गया। कृपया दोबारा कोशिश करें।",
        "timeout_resume": "वापस स्वागत है! 👋 जहाँ छोड़ा था वहाँ से जारी है।",
        "voice_processing": "🎤 आवाज़ संदेश प्रोसेस हो रहा है...",
        "location_detected": "📍 स्थान मिला! पाया: *{city}, {state}*",
    },
    "kn": {
        "welcome": "ನಮಸ್ಕಾರ 👋 *Road Warrior EV* ಗೆ ಸ್ವಾಗತ!\n\n3 ನಿಮಿಷದಲ್ಲಿ ನೋಂದಣಿ ಮುಗಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.\n\nನಿಮ್ಮ ಭಾಷೆ ಆಯ್ಕೆ ಮಾಡಿ:",
        "ask_name": "ನಿಮ್ಮ *ಪೂರ್ಣ ಹೆಸರು* ಏನು?",
        "ask_phone": "ಧನ್ಯವಾದ, {name}! 📱\n\nನಿಮ್ಮ *WhatsApp ಸಂಖ್ಯೆ*? (10 ಅಂಕೆಗಳು)",
        "ask_state": "ನೀವು ಯಾವ *ರಾಜ್ಯದಿಂದ*?",
        "ask_city": "ನೀವು ಯಾವ *ನಗರದಲ್ಲಿ* ಕೆಲಸ ಮಾಡುತ್ತೀರಿ?",
        "ask_platform": "ನೀವು ಯಾವ *ಡೆಲಿವರಿ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್‌ಗೆ* ಕೆಲಸ ಮಾಡುತ್ತೀರಿ?",
        "ask_experience": "ರೈಡರ್ ಆಗಿ ಎಷ್ಟು *ವರ್ಷಗಳ ಅನುಭವ* ಇದೆ?",
        "ask_employment": "ನೀವು *ಪೂರ್ಣ-ಸಮಯ* ಅಥವಾ *ಅರೆ-ಸಮಯ* ರೈಡರ್?\n\n1. ಪೂರ್ಣ-ಸಮಯ\n2. ಅರೆ-ಸಮಯ",
        "ask_vehicle_type": "ನೀವು ಯಾವ ಬಗೆಯ *ವಾಹನ* ಓಡಿಸುತ್ತೀರಿ?\n\n1. ವಿದ್ಯುತ್ ⚡\n2. ಪೆಟ್ರೋಲ್ ⛽\n3. ಡೀಸೆಲ್\n4. ಹೈಬ್ರಿಡ್",
        "ask_vehicle_brand": "ವಾಹನದ *ಬ್ರ್ಯಾಂಡ್*?",
        "ask_vehicle_model": "ವಾಹನದ *ಮಾಡೆಲ್*?",
        "ask_ownership": "ವಾಹನ *ಸ್ವಂತ*ದ್ದೋ ಅಥವಾ *ಬಾಡಿಗೆ*ಯದ್ದೋ?\n\n1. ಸ್ವಂತ\n2. ಬಾಡಿಗೆ",
        "ask_weekly_distance": "*ವಾರಕ್ಕೆ ಎಷ್ಟು km* ಓಡಿಸುತ್ತೀರಿ?",
        "ask_monthly_distance": "*ತಿಂಗಳಿಗೆ ಎಷ್ಟು km* ಓಡಿಸುತ್ತೀರಿ?",
        "ask_fuel_expense": "*ವಾರಕ್ಕೆ ಇಂಧನ ವೆಚ್ಚ* ಎಷ್ಟು? (₹)",
        "ask_maintenance": "*ತಿಂಗಳಿಗೆ ನಿರ್ವಹಣಾ ವೆಚ್ಚ* ಎಷ್ಟು? (₹)",
        "ask_ev_challenges": "EV ರೈಡರ್ ಆಗಿ ನಿಮ್ಮ *3 ಮುಖ್ಯ ಸವಾಲುಗಳು* ಯಾವುವು?",
        "ask_petrol_challenges": "ಪೆಟ್ರೋಲ್ ರೈಡರ್ ಆಗಿ ನಿಮ್ಮ *3 ಮುಖ್ಯ ಸವಾಲುಗಳು* ಯಾವುವು?",
        "ask_challenges_generic": "ನಿಮ್ಮ *3 ಮುಖ್ಯ ಸವಾಲುಗಳು* ಯಾವುವು?",
        "ask_accident_insurance": "*ಅಪಘಾತ ವಿಮೆ* ಇದೆಯೇ?\n\n1. ಹೌದು\n2. ಇಲ್ಲ\n3. ಗೊತ್ತಿಲ್ಲ",
        "ask_health_insurance": "*ಆರೋಗ್ಯ ವಿಮೆ* ಇದೆಯೇ?\n\n1. ಹೌದು\n2. ಇಲ್ಲ\n3. ಗೊತ್ತಿಲ್ಲ",
        "ask_oop_cost": "ಅಪಘಾತದಲ್ಲಿ *ಜೇಬಿನಿಂದ ಎಷ್ಟು* ಖರ್ಚಾಯಿತು? (₹)",
        "ask_ev_interest": "*ವಿದ್ಯುತ್ ವಾಹನಕ್ಕೆ ಬದಲಾಯಿಸಲು* ಆಸಕ್ತಿ ಇದೆಯೇ?\n\n1. ಹೌದು\n2. ಇಲ್ಲ\n3. ಮಾಹಿತಿ ಬೇಕು",
        "ask_ev_reason": "EV ಗೆ ಏಕೆ ಬದಲಾಯಿಸಲು ಬಯಸುತ್ತೀರಿ?",
        "ask_ev_services": "ಯಾವ EV ಸೇವೆಗಳಲ್ಲಿ ಆಸಕ್ತಿ ಇದೆ?",
        "ask_referred": "ಯಾರಾದರೂ *ರೆಫರ್* ಮಾಡಿದ್ದಾರೆಯೇ?\n\n1. ಹೌದು\n2. ಇಲ್ಲ",
        "ask_referral_code": "*ರೆಫರಲ್ ಕೋಡ್* ನಮೂದಿಸಿ:",
        "invalid_referral": "❌ ರೆಫರಲ್ ಕೋಡ್ ಕಂಡುಬಂದಿಲ್ಲ। ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ *Skip* ಟೈಪ್ ಮಾಡಿ.",
        "invalid_phone": "❌ ದಯವಿಟ್ಟು 10 ಅಂಕಿಗಳ ಸರಿಯಾದ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ.",
        "invalid_number": "❌ ದಯವಿಟ್ಟು ಸರಿಯಾದ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ.",
        "confirm_header": "✅ *ಬಹುತೇಕ ಮುಗಿಯಿತು!* ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಖಚಿತಪಡಿಸಿ:\n\n",
        "confirm_footer": "\n\n*Confirm* ಅಥವಾ *Edit* ಟೈಪ್ ಮಾಡಿ.",
        "registering": "⏳ ನೋಂದಣಿ ಆಗುತ್ತಿದೆ...",
        "success": "🎉 *ನೋಂದಣಿ ಯಶಸ್ವಿ!*\n\nರೆಫರಲ್ ಕೋಡ್: *{code}*\nಪಾಯಿಂಟ್‌ಗಳು: *{points}*\nಲಿಂಕ್: {link}",
        "already_registered": "ನೀವು ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಲ್ಪಟ್ಟಿದ್ದೀರಿ!",
        "help": "*ಲಭ್ಯ ಆದೇಶಗಳು:*\n\n• *MY SCORE*\n• *LEADERBOARD*\n• *START OVER*\n• *HELP*",
        "start_over": "🔄 ಮತ್ತೆ ಪ್ರಾರಂಭ!\n\n",
        "leaderboard_title": "🏆 *ಟಾಪ್ 10 Road Warriors:*\n\n",
        "no_score": "ನೀವು ಇನ್ನೂ ನೋಂದಾಯಿಸಲಾಗಿಲ್ಲ.",
        "error": "⚠️ ತಪ್ಪಾಯಿತು. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
        "timeout_resume": "ಮರಳಿ ಸ್ವಾಗತ! 👋 ಮುಂದುವರಿಯೋಣ.",
        "voice_processing": "🎤 ಧ್ವನಿ ಸಂದೇಶ ಪ್ರಕ್ರಿಯೆ...",
        "location_detected": "📍 ಸ್ಥಳ ಕಂಡುಬಂತು: *{city}, {state}*",
    },
}

# For languages not fully translated, fall back to English
def get_message(lang: str, key: str, **kwargs) -> str:
    lang_messages = MESSAGES.get(lang, MESSAGES["en"])
    template = lang_messages.get(key, MESSAGES["en"].get(key, ""))
    try:
        return template.format(**kwargs)
    except KeyError:
        return template

def get_languages_for_state(state: Optional[str]) -> List[str]:
    if not state:
        return DEFAULT_LANGUAGES
    return STATE_LANGUAGE_MAP.get(state.lower().strip(), DEFAULT_LANGUAGES)

def format_language_menu(langs: List[str]) -> str:
    lines = []
    for i, code in enumerate(langs, 1):
        lines.append(f"{i}. {LANGUAGE_NAMES.get(code, code)}")
    return "\n".join(lines)

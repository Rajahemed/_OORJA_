"""
Registration Flow Engine — pure state machine.
Steps:
  1  = language selection
  2  = name
  3  = phone
  4  = state
  5  = city
  6  = delivery platform
  7  = years of experience
  8  = employment type
  9  = vehicle type
  10 = vehicle brand
  11 = vehicle model
  12 = vehicle ownership
  13 = weekly distance (km)
  14 = monthly distance (km)
  15 = fuel/energy expense weekly
  16 = maintenance expense monthly
  17 = challenges (dynamic: ev / petrol / generic)
  18 = accident insurance
  19 = health insurance
  20 = out-of-pocket accident cost
  21 = EV interest
  22 = EV reason (only if interested)
  23 = EV services interested in (only if interested)
  24 = referred?
  25 = referral code (only if referred)
  26 = confirmation
  27 = done (registered)
"""
import logging
import re
from typing import Optional, Tuple

from services.state_manager import ConversationState
from services.languages import (
    get_message,
    get_languages_for_state,
    format_language_menu,
    LANGUAGE_NAMES,
    DEFAULT_LANGUAGES,
)

logger = logging.getLogger(__name__)

TOTAL_STEPS = 27

DELIVERY_PLATFORMS = ["Zomato", "Swiggy", "Blinkit", "Zepto", "Dunzo", "Amazon", "Flipkart", "Other"]
VEHICLE_TYPES = {"1": "Electric", "2": "Petrol", "3": "Diesel", "4": "Hybrid"}
EMPLOYMENT_TYPES = {"1": "Full Time", "2": "Part Time"}
OWNERSHIP_TYPES = {"1": "Own", "2": "Rental"}
INSURANCE_OPTIONS = {"1": "Yes", "2": "No", "3": "Not sure"}
EV_INTEREST_OPTIONS = {"1": "Yes", "2": "No", "3": "Need more information"}
EV_SERVICES_MAP = {
    "1": "EV Rental",
    "2": "Insurance",
    "3": "Retrofit",
    "4": "Finance",
    "5": "Charging Solutions",
    "6": "Battery Swap",
    "7": "All",
    "8": "None",
}


def _normalize_phone(raw: str) -> Optional[str]:
    digits = re.sub(r"\D", "", raw)
    if digits.startswith("91") and len(digits) == 12:
        digits = digits[2:]
    if len(digits) == 10:
        return digits
    return None


def _is_positive_number(text: str) -> bool:
    try:
        return float(text.strip()) >= 0
    except ValueError:
        return False


def get_step_for_field(field: str) -> Optional[int]:
    """Map a field name to its step number for edit support."""
    field_step_map = {
        "fullName": 2, "name": 2,
        "phone": 3,
        "state": 4,
        "city": 5,
        "deliveryPlatform": 6, "platform": 6,
        "experienceYears": 7, "experience": 7,
        "employment": 8, "employmentType": 8,
        "vehicleType": 9, "vehicle": 9,
        "vehicleBrand": 10, "brand": 10,
        "vehicleModel": 11, "model": 11,
        "vehicleOwnership": 12, "ownership": 12,
        "kmPerDay": 13, "weekly": 13,
        "kmPerMonth": 14, "monthly": 14,
        "fuelExpenseWeekly": 15, "fuel": 15,
        "maintenanceExpenseMonthly": 16, "maintenance": 16,
    }
    return field_step_map.get(field.lower().strip())


def detect_edit_intent(text: str) -> Optional[int]:
    """
    Detect if the user wants to edit a specific field.
    Returns the step to jump back to, or None.
    """
    text_lower = text.lower().strip()
    patterns = [
        (r"\b(change|edit|update|fix|correct)\s+(my\s+)?(city|town)\b", 5),
        (r"\b(change|edit|update|fix|correct)\s+(my\s+)?(name|full name)\b", 2),
        (r"\b(change|edit|update|fix|correct)\s+(my\s+)?(phone|number|mobile)\b", 3),
        (r"\b(change|edit|update|fix|correct)\s+(my\s+)?(state)\b", 4),
        (r"\b(change|edit|update|fix|correct)\s+(my\s+)?(platform|delivery)\b", 6),
        (r"\b(change|edit|update|fix|correct)\s+(my\s+)?(vehicle)\b", 9),
        (r"\b(change|edit|update|fix|correct)\s+(my\s+)?(experience)\b", 7),
        (r"\b(back|go back|previous)\b", -1),  # -1 means go back one step
        (r"\b(edit|change)\b", 0),  # 0 means show confirmation again
    ]
    for pattern, step in patterns:
        if re.search(pattern, text_lower):
            return step
    return None


def format_confirmation(state: ConversationState, lang: str) -> str:
    """Build a summary of all collected data for confirmation."""
    d = state.data
    lines = []
    if d.get("fullName"):    lines.append(f"👤 Name: {d['fullName']}")
    if d.get("phone"):       lines.append(f"📱 Phone: +91{d['phone']}")
    if d.get("state"):       lines.append(f"📍 State: {d['state']}")
    if d.get("city"):        lines.append(f"🏙 City: {d['city']}")
    if d.get("deliveryPlatform"): lines.append(f"🚚 Platform: {d['deliveryPlatform']}")
    if d.get("experienceYears"):  lines.append(f"📅 Experience: {d['experienceYears']} years")
    if d.get("employmentType"):   lines.append(f"💼 Employment: {d['employmentType']}")
    if d.get("vehicleType"):  lines.append(f"🛵 Vehicle: {d['vehicleType']}")
    if d.get("vehicleBrand"): lines.append(f"🔖 Brand: {d['vehicleBrand']}")
    if d.get("vehicleModel"): lines.append(f"📋 Model: {d['vehicleModel']}")
    if d.get("vehicleOwnership"): lines.append(f"🔑 Ownership: {d['vehicleOwnership']}")
    if d.get("kmPerDay"):    lines.append(f"📏 Weekly km: {d['kmPerDay']}")
    if d.get("kmPerMonth"):  lines.append(f"📏 Monthly km: {d['kmPerMonth']}")
    header = get_message(lang, "confirm_header")
    footer = get_message(lang, "confirm_footer")
    return header + "\n".join(lines) + footer


async def process_step(
    state: ConversationState,
    user_text: str,
    location: Optional[dict] = None,
) -> Tuple[str, bool]:
    """
    Process user input for current step.
    Returns (reply_message, should_save_state)
    """
    lang = state.language
    text = user_text.strip()
    step = state.step

    # ── GLOBAL COMMANDS ─────────────────────────────────────────────────────
    upper = text.upper()

    if upper in ("HELP", "COMMANDS"):
        return get_message(lang, "help"), False

    if upper == "START OVER":
        state.step = 1
        state.data = {}
        state.language = "en"
        reply = get_message(lang, "start_over") + get_message("en", "welcome")
        return reply, True

    if upper == "MY SCORE" or upper == "SCORE":
        phone = state.data.get("phone") or re.sub(r"\D", "", state.phone)[-10:]
        if not phone:
            return get_message(lang, "no_score"), False
        from services.backend_client import get_rider_by_phone
        rider = await get_rider_by_phone(phone)
        if not rider:
            return get_message(lang, "no_score"), False
        return (
            f"🏆 *Your Score*\n\n"
            f"• Name: {rider.get('fullName', 'N/A')}\n"
            f"• Points: *{rider.get('totalPoints', 0)}*\n"
            f"• Referrals: {rider.get('referrals', 0)}\n"
            f"• Referral Code: *{rider.get('referralCode', 'N/A')}*"
        ), False

    if upper == "LEADERBOARD":
        from services.backend_client import get_leaderboard
        leaders = await get_leaderboard(10)
        if not leaders:
            return "🏆 Leaderboard is currently unavailable.", False
        title = get_message(lang, "leaderboard_title")
        lines = []
        medals = ["🥇", "🥈", "🥉"]
        for i, r in enumerate(leaders, 1):
            medal = medals[i - 1] if i <= 3 else f"{i}."
            lines.append(f"{medal} {r.get('fullName', 'Unknown')} — {r.get('totalPoints', 0)} pts")
        return title + "\n".join(lines), False

    if upper in ("REFERRAL", "MY REFERRAL"):
        phone = state.data.get("phone")
        if not phone:
            return "Complete registration first to get your referral code!", False
        from services.backend_client import get_rider_by_phone
        rider = await get_rider_by_phone(phone)
        if not rider:
            return "No referral info found. Please complete registration first.", False
        code = rider.get("referralCode", "N/A")
        domain = "https://roadwarriorev.com"
        return (
            f"🎯 *Your Referral Info*\n\n"
            f"• Code: *{code}*\n"
            f"• Link: {domain}/?ref={code}\n"
            f"• Referrals Made: {rider.get('referrals', 0)}\n\n"
            f"Share your code and earn *5 points* per successful referral!"
        ), False

    if upper in ("PROFILE",):
        phone = state.data.get("phone")
        if not phone:
            return "No profile found. Please complete registration.", False
        from services.backend_client import get_rider_by_phone
        rider = await get_rider_by_phone(phone)
        if not rider:
            return "No profile found.", False
        return (
            f"👤 *Your Profile*\n\n"
            f"• Name: {rider.get('fullName')}\n"
            f"• Phone: +91{rider.get('phone')}\n"
            f"• City: {rider.get('city')}\n"
            f"• State: {rider.get('state')}\n"
            f"• Vehicle: {rider.get('vehicleType')}\n"
            f"• Platform: {rider.get('deliveryPlatform')}\n"
            f"• Experience: {rider.get('experienceYears')} years"
        ), False

    if upper in ("POINTS",):
        phone = state.data.get("phone")
        if not phone:
            return "Complete registration first to earn points!", False
        from services.backend_client import get_rider_by_phone
        rider = await get_rider_by_phone(phone)
        if not rider:
            return "No points found.", False
        return f"💎 You have *{rider.get('totalPoints', 0)} points*!", False

    if upper in ("STATUS",):
        if state.step >= TOTAL_STEPS:
            return "✅ Your registration is *complete*!", False
        pct = int((state.step / TOTAL_STEPS) * 100)
        return f"📊 Registration Progress: *{pct}%* (step {state.step}/{TOTAL_STEPS})", False

    # ── LOCATION MESSAGE ────────────────────────────────────────────────────
    if location and step in (4, 5):
        from services.backend_client import reverse_geocode
        geo = await reverse_geocode(location["latitude"], location["longitude"])
        if geo.get("city") and geo.get("state"):
            state.data["state"] = geo["state"]
            state.data["city"] = geo["city"]
            reply = get_message(lang, "location_detected", city=geo["city"], state=geo["state"])
            # Skip to step 6
            state.step = 6
            reply += "\n\n" + get_message(lang, "ask_platform")
            return reply, True

    # ── STEP MACHINE ────────────────────────────────────────────────────────
    if step == 1:
        return await _step1_language(state, text)

    if step == 2:
        return await _step2_name(state, text, lang)

    if step == 3:
        return await _step3_phone(state, text, lang)

    if step == 4:
        return await _step4_state(state, text, lang)

    if step == 5:
        return await _step5_city(state, text, lang)

    if step == 6:
        return await _step6_platform(state, text, lang)

    if step == 7:
        return await _step7_experience(state, text, lang)

    if step == 8:
        return await _step8_employment(state, text, lang)

    if step == 9:
        return await _step9_vehicle_type(state, text, lang)

    if step == 10:
        return await _step10_vehicle_brand(state, text, lang)

    if step == 11:
        return await _step11_vehicle_model(state, text, lang)

    if step == 12:
        return await _step12_ownership(state, text, lang)

    if step == 13:
        return await _step13_weekly_dist(state, text, lang)

    if step == 14:
        return await _step14_monthly_dist(state, text, lang)

    if step == 15:
        return await _step15_fuel_expense(state, text, lang)

    if step == 16:
        return await _step16_maintenance(state, text, lang)

    if step == 17:
        return await _step17_challenges(state, text, lang)

    if step == 18:
        return await _step18_accident_insurance(state, text, lang)

    if step == 19:
        return await _step19_health_insurance(state, text, lang)

    if step == 20:
        return await _step20_oop_cost(state, text, lang)

    if step == 21:
        return await _step21_ev_interest(state, text, lang)

    if step == 22:
        return await _step22_ev_reason(state, text, lang)

    if step == 23:
        return await _step23_ev_services(state, text, lang)

    if step == 24:
        return await _step24_referred(state, text, lang)

    if step == 25:
        return await _step25_referral_code(state, text, lang)

    if step == 26:
        return await _step26_confirm(state, text, lang)

    if step == 27:
        return await _step27_done(state, lang)

    return get_message(lang, "error"), False


# ══════════════════════════════════════════════════════
# STEP IMPLEMENTATIONS
# ══════════════════════════════════════════════════════

async def _step1_language(state, text, lang="en"):
    """Language selection."""
    # Determine available languages
    detected_state = state.data.get("state", "")
    available = get_languages_for_state(detected_state) if detected_state else DEFAULT_LANGUAGES

    # Parse selection
    lang_codes = {
        "1": available[0] if len(available) > 0 else "en",
        "2": available[1] if len(available) > 1 else "hi",
    }
    # Also accept typing language name
    text_lower = text.lower().strip()
    chosen = None
    if text.strip() in ("1", "2"):
        chosen = lang_codes.get(text.strip())
    elif "english" in text_lower or "en" == text_lower:
        chosen = "en"
    elif any(name in text_lower for name in ["hindi", "हिंदी", "hi"]):
        chosen = "hi"
    elif any(name in text_lower for name in ["kannada", "ಕನ್ನಡ", "kn"]):
        chosen = "kn"
    elif any(name in text_lower for name in ["marathi", "मराठी", "mr"]):
        chosen = "mr"
    elif any(name in text_lower for name in ["telugu", "తెలుగు", "te"]):
        chosen = "te"
    elif any(name in text_lower for name in ["tamil", "தமிழ்", "ta"]):
        chosen = "ta"
    elif any(name in text_lower for name in ["malayalam", "മലയാളം", "ml"]):
        chosen = "ml"
    elif any(name in text_lower for name in ["gujarati", "ગુજરાતી", "gu"]):
        chosen = "gu"
    elif any(name in text_lower for name in ["bengali", "bangla", "বাংলা", "bn"]):
        chosen = "bn"
    elif any(name in text_lower for name in ["punjabi", "ਪੰਜਾਬੀ", "pa"]):
        chosen = "pa"

    if not chosen:
        # Show language menu
        menu = format_language_menu(available)
        return f"Please select your language:\n\n{menu}", False

    state.language = chosen
    state.step = 2
    return get_message(chosen, "ask_name"), True


async def _step2_name(state, text, lang):
    if len(text) < 2:
        return get_message(lang, "ask_name"), False
    state.data["fullName"] = text.title()
    state.step = 3
    return get_message(lang, "ask_phone", name=state.data["fullName"]), True


async def _step3_phone(state, text, lang):
    phone = _normalize_phone(text)
    if not phone:
        return get_message(lang, "invalid_phone"), False

    # Check if already registered
    from services.backend_client import get_rider_by_phone
    existing = await get_rider_by_phone(phone)
    if existing and existing.get("is_completed"):
        state.data["phone"] = phone
        state.step = 27
        code = existing.get("referralCode", "N/A")
        domain = "https://roadwarriorev.com"
        return (
            get_message(lang, "already_registered")
            + f"\n\n📋 Referral Code: *{code}*\nLink: {domain}/?ref={code}"
        ), True

    state.data["phone"] = phone
    state.step = 4
    return get_message(lang, "ask_state"), True


async def _step4_state(state, text, lang):
    state.data["state"] = text.strip().title()
    # Now we know the state — check if we should re-offer language selection
    available = get_languages_for_state(state.data["state"])
    state.step = 5
    reply = get_message(lang, "ask_city")
    # If current language not in available for this state, offer to switch
    if lang not in available and len(available) > 1:
        menu = format_language_menu(available)
        reply = (
            f"💡 I also support local language for {state.data['state']}.\n\n"
            f"Type a number to switch, or press Enter to continue in {LANGUAGE_NAMES.get(lang, lang)}:\n{menu}\n\n"
            f"Or just tell me your city 👇"
        )
    return reply, True


async def _step5_city(state, text, lang):
    state.data["city"] = text.strip().title()
    state.step = 6
    return get_message(lang, "ask_platform"), True


async def _step6_platform(state, text, lang):
    # Accept number or text
    platforms_lower = {p.lower(): p for p in DELIVERY_PLATFORMS}
    entry = text.strip()
    if entry.isdigit():
        idx = int(entry) - 1
        if 0 <= idx < len(DELIVERY_PLATFORMS):
            state.data["deliveryPlatform"] = DELIVERY_PLATFORMS[idx]
        else:
            state.data["deliveryPlatform"] = entry
    elif entry.lower() in platforms_lower:
        state.data["deliveryPlatform"] = platforms_lower[entry.lower()]
    else:
        state.data["deliveryPlatform"] = entry.title()

    state.step = 7
    return get_message(lang, "ask_experience"), True


async def _step7_experience(state, text, lang):
    try:
        years = float(text.strip())
        state.data["experienceYears"] = str(years)
        state.step = 8
        return get_message(lang, "ask_employment"), True
    except ValueError:
        return get_message(lang, "invalid_number"), False


async def _step8_employment(state, text, lang):
    entry = text.strip()
    emp = EMPLOYMENT_TYPES.get(entry, None)
    if not emp:
        entry_lower = entry.lower()
        if "full" in entry_lower:
            emp = "Full Time"
        elif "part" in entry_lower:
            emp = "Part Time"
    if not emp:
        return get_message(lang, "ask_employment"), False
    state.data["employmentType"] = emp
    state.step = 9
    return get_message(lang, "ask_vehicle_type"), True


async def _step9_vehicle_type(state, text, lang):
    entry = text.strip()
    vt = VEHICLE_TYPES.get(entry, None)
    if not vt:
        entry_lower = entry.lower()
        for k, v in VEHICLE_TYPES.items():
            if v.lower() in entry_lower:
                vt = v
                break
    if not vt:
        return get_message(lang, "ask_vehicle_type"), False
    state.data["vehicleType"] = vt
    state.step = 10
    return get_message(lang, "ask_vehicle_brand"), True


async def _step10_vehicle_brand(state, text, lang):
    state.data["vehicleBrand"] = text.strip().title()
    state.step = 11
    return get_message(lang, "ask_vehicle_model"), True


async def _step11_vehicle_model(state, text, lang):
    state.data["vehicleModel"] = text.strip()
    state.step = 12
    return get_message(lang, "ask_ownership"), True


async def _step12_ownership(state, text, lang):
    entry = text.strip()
    own = OWNERSHIP_TYPES.get(entry, None)
    if not own:
        if "own" in entry.lower() or "self" in entry.lower():
            own = "Own"
        elif "rent" in entry.lower() or "hire" in entry.lower():
            own = "Rental"
    if not own:
        return get_message(lang, "ask_ownership"), False
    state.data["vehicleOwnership"] = own
    state.step = 13
    return get_message(lang, "ask_weekly_distance"), True


async def _step13_weekly_dist(state, text, lang):
    if not _is_positive_number(text):
        return get_message(lang, "invalid_number"), False
    state.data["kmPerDay"] = float(text.strip())
    state.step = 14
    return get_message(lang, "ask_monthly_distance"), True


async def _step14_monthly_dist(state, text, lang):
    if not _is_positive_number(text):
        return get_message(lang, "invalid_number"), False
    state.data["kmPerMonth"] = float(text.strip())
    state.step = 15
    return get_message(lang, "ask_fuel_expense"), True


async def _step15_fuel_expense(state, text, lang):
    if not _is_positive_number(text):
        return get_message(lang, "invalid_number"), False
    state.data["fuelExpenseWeekly"] = float(text.strip())
    state.step = 16
    return get_message(lang, "ask_maintenance"), True


async def _step16_maintenance(state, text, lang):
    if not _is_positive_number(text):
        return get_message(lang, "invalid_number"), False
    state.data["maintenanceExpenseMonthly"] = float(text.strip())
    state.step = 17
    # Ask challenges dynamically
    vt = state.data.get("vehicleType", "").lower()
    if "electric" in vt:
        return get_message(lang, "ask_ev_challenges"), True
    elif "petrol" in vt or "diesel" in vt:
        return get_message(lang, "ask_petrol_challenges"), True
    else:
        return get_message(lang, "ask_challenges_generic"), True


async def _step17_challenges(state, text, lang):
    # Accept comma-separated or numbered list
    parts = [p.strip() for p in re.split(r"[,\n]", text) if p.strip()]
    vt = state.data.get("vehicleType", "").lower()
    if "electric" in vt:
        state.data["evChallenges"] = parts
        state.data["challenges"] = parts
    elif "petrol" in vt or "diesel" in vt:
        state.data["petrolChallenges"] = parts
        state.data["challenges"] = parts
    else:
        state.data["challenges"] = parts
    state.step = 18
    return get_message(lang, "ask_accident_insurance"), True


async def _step18_accident_insurance(state, text, lang):
    choice = INSURANCE_OPTIONS.get(text.strip())
    if not choice:
        text_lower = text.lower()
        if "yes" in text_lower or "हाँ" in text_lower or "ಹೌದು" in text_lower:
            choice = "Yes"
        elif "no" in text_lower or "नहीं" in text_lower or "ಇಲ್ಲ" in text_lower:
            choice = "No"
        elif "not" in text_lower or "sure" in text_lower:
            choice = "Not sure"
    if not choice:
        return get_message(lang, "ask_accident_insurance"), False
    state.data["maintInsured"] = choice
    state.step = 19
    return get_message(lang, "ask_health_insurance"), True


async def _step19_health_insurance(state, text, lang):
    choice = INSURANCE_OPTIONS.get(text.strip())
    if not choice:
        text_lower = text.lower()
        if "yes" in text_lower:
            choice = "Yes"
        elif "no" in text_lower:
            choice = "No"
        else:
            choice = "Not sure"
    state.data["hasHealthInsurance"] = choice
    state.step = 20
    return get_message(lang, "ask_oop_cost"), True


async def _step20_oop_cost(state, text, lang):
    if not _is_positive_number(text):
        return get_message(lang, "invalid_number"), False
    state.data["oopAccidentCost"] = float(text.strip())
    state.step = 21
    return get_message(lang, "ask_ev_interest"), True


async def _step21_ev_interest(state, text, lang):
    choice = EV_INTEREST_OPTIONS.get(text.strip())
    if not choice:
        text_lower = text.lower()
        if "yes" in text_lower or "1" in text_lower:
            choice = "Yes"
        elif "no" in text_lower or "2" in text_lower:
            choice = "No"
        else:
            choice = "Need more information"
    state.data["openToEV"] = choice
    if choice == "No":
        # Skip EV reason and services
        state.step = 24
        return get_message(lang, "ask_referred"), True
    state.step = 22
    return get_message(lang, "ask_ev_reason"), True


async def _step22_ev_reason(state, text, lang):
    state.data["evReason"] = text.strip()
    state.step = 23
    return get_message(lang, "ask_ev_services"), True


async def _step23_ev_services(state, text, lang):
    # Parse comma-separated numbers or text
    selected = []
    parts = re.split(r"[,\s]+", text.strip())
    for p in parts:
        if p in EV_SERVICES_MAP:
            selected.append(EV_SERVICES_MAP[p])
        else:
            for k, v in EV_SERVICES_MAP.items():
                if v.lower() in p.lower():
                    selected.append(v)
    if not selected:
        selected = [text.strip()]
    state.data["evServicesInterested"] = selected
    state.step = 24
    return get_message(lang, "ask_referred"), True


async def _step24_referred(state, text, lang):
    text_lower = text.lower().strip()
    if text_lower in ("1", "yes", "yeah", "y", "हाँ", "ಹೌದು"):
        state.data["hasReferral"] = True
        state.step = 25
        return get_message(lang, "ask_referral_code"), True
    else:
        state.data["hasReferral"] = False
        state.step = 26
        return format_confirmation(state, lang), True


async def _step25_referral_code(state, text, lang):
    text_upper = text.strip().upper()
    if text_upper == "SKIP":
        state.data["referredByCode"] = None
        state.step = 26
        return format_confirmation(state, lang), True

    from services.backend_client import validate_referral_code
    valid = await validate_referral_code(text_upper)
    if valid:
        state.data["referredByCode"] = text_upper
        state.step = 26
        return format_confirmation(state, lang), True
    else:
        return get_message(lang, "invalid_referral"), False


async def _step26_confirm(state, text, lang):
    text_lower = text.lower().strip()

    # Check for edit intent
    edit_step = detect_edit_intent(text)
    if edit_step is not None and edit_step > 0:
        state.step = edit_step
        return _get_question_for_step(edit_step, lang, state), True
    if edit_step == -1:  # go back
        state.step = max(2, state.step - 1)
        return _get_question_for_step(state.step, lang, state), True

    confirm_words = [
        "confirm", "yes", "ok", "okay", "submit", "register", "done",
        "correct", "send", "1",
        "ओके", "हाँ", "ഹ", "ಹೌದು", "确认",
    ]
    if any(w in text_lower for w in confirm_words):
        return await _do_register(state, lang)

    if text_lower in ("edit", "change", "update", "2", "no"):
        return (
            "Please type the field you want to change:\n\n"
            "_Examples: Change city, Change name, Change vehicle_"
        ), False

    # Default: re-show confirmation
    return format_confirmation(state, lang), False


async def _do_register(state, lang):
    """Assemble payload and call the existing /api/riders/register endpoint."""
    d = state.data
    payload = {
        "fullName":                d.get("fullName", ""),
        "phone":                   d.get("phone", ""),
        "state":                   d.get("state", ""),
        "city":                    d.get("city", ""),
        "pincode":                 d.get("pincode", "000000"),
        "deliveryPlatform":        d.get("deliveryPlatform", ""),
        "experienceYears":         d.get("experienceYears", ""),
        "vehicleType":             d.get("vehicleType", ""),
        "vehicleModel":            f"{d.get('vehicleBrand', '')} {d.get('vehicleModel', '')}".strip(),
        "vehicleOwnership":        d.get("vehicleOwnership", ""),
        "kmPerDay":                d.get("kmPerDay", 0),
        "kmPerMonth":              d.get("kmPerMonth", 0),
        "fuelExpenseWeekly":       d.get("fuelExpenseWeekly", 0),
        "maintenanceExpenseMonthly": d.get("maintenanceExpenseMonthly", 0),
        "challenges":              d.get("challenges", []),
        "evChallenges":            d.get("evChallenges", []),
        "petrolChallenges":        d.get("petrolChallenges", []),
        "maintInsured":            d.get("maintInsured", ""),
        "referredByCode":          d.get("referredByCode"),
        "openToEV":                d.get("openToEV", ""),
        "evServicesInterested":    d.get("evServicesInterested", []),
        "language":                lang,
        "consentPrivacy":          True,
        "consentMarketing":        True,
        "consentTerms":            True,
        "registrationSource":      "whatsapp",
    }

    from services.backend_client import register_rider
    result = await register_rider(payload)

    if result.get("success"):
        state.step = 27
        code = result.get("referralCode", "N/A")
        domain = "https://roadwarriorev.com"
        link = f"{domain}/?ref={code}"
        points = result.get("data", {}).get("rider", {}).get("totalPoints", 10) if isinstance(result.get("data"), dict) else 10
        return get_message(lang, "success",
                           name=d.get("fullName", ""),
                           code=code,
                           points=points,
                           link=link), True
    else:
        error_msg = result.get("error", "Unknown error")
        if "already registered" in error_msg.lower():
            state.step = 27
            return get_message(lang, "already_registered"), True
        return f"⚠️ Registration failed: {error_msg}\n\nPlease try again or type *HELP*.", False


async def _step27_done(state, lang):
    """Already registered — respond to any message."""
    return (
        "✅ You are already registered!\n\n"
        "Available commands:\n"
        "• *MY SCORE* — Points\n"
        "• *LEADERBOARD* — Top riders\n"
        "• *REFERRAL* — Your referral code\n"
        "• *PROFILE* — Your profile"
    ), False


def _get_question_for_step(step: int, lang: str, state: ConversationState) -> str:
    """Return the question for a given step (used by edit flow)."""
    step_question_map = {
        2: get_message(lang, "ask_name"),
        3: get_message(lang, "ask_phone", name=state.data.get("fullName", "")),
        4: get_message(lang, "ask_state"),
        5: get_message(lang, "ask_city"),
        6: get_message(lang, "ask_platform"),
        7: get_message(lang, "ask_experience"),
        8: get_message(lang, "ask_employment"),
        9: get_message(lang, "ask_vehicle_type"),
        10: get_message(lang, "ask_vehicle_brand"),
        11: get_message(lang, "ask_vehicle_model"),
        12: get_message(lang, "ask_ownership"),
        13: get_message(lang, "ask_weekly_distance"),
        14: get_message(lang, "ask_monthly_distance"),
        15: get_message(lang, "ask_fuel_expense"),
        16: get_message(lang, "ask_maintenance"),
    }
    return step_question_map.get(step, get_message(lang, "error"))

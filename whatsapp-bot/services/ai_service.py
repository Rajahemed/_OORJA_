import os
import json
import logging
from typing import Dict, Any, Tuple

# Optional: google-generativeai is only required for voice-to-text (STT).
# The core registration flow is fully rule-based and works without it.
try:
    import google.generativeai as genai  # type: ignore[import-untyped,import-not-found]
    _genai_available = True
except ImportError:
    genai = None  # type: ignore
    _genai_available = False

from services.state_manager import state_manager
from services.backend_client import backend_client

logger = logging.getLogger(__name__)

# Configure Gemini if available
api_key = os.getenv("GEMINI_API_KEY", os.getenv("OPENAI_API_KEY", ""))
if api_key and _genai_available:
    genai.configure(api_key=api_key)
elif not _genai_available:
    logger.warning("google-generativeai not installed — voice transcription disabled. All other features work normally.")
else:
    logger.warning("GEMINI_API_KEY not set — voice transcription disabled.")

MODEL_NAME = "gemini-1.5-pro-latest"

def _get_model():
    return genai.GenerativeModel(MODEL_NAME)

class ConversationEngine:
    def __init__(self):
        pass

    async def handle_message(self, phone: str, user_message: str, location: dict = None) -> str:
        """
        Main entry point for handling incoming messages.
        """
        # Handle special commands first
        msg_upper = user_message.strip().upper()
        if msg_upper == "START OVER":
            state_manager.clear_state(phone)
            return "Conversation reset. Say 'Hi' to start again."
        elif msg_upper == "HELP":
            return "Available commands:\n- *START OVER*: Restarts the registration.\n- *MY SCORE*: Shows your current points.\n- *LEADERBOARD*: Shows the top referrers."
        elif msg_upper == "MY SCORE":
            score = await backend_client.get_score(phone)
            return f"Your current score is: {score if score is not None else 0} points."
        elif msg_upper == "LEADERBOARD":
            board = await backend_client.get_leaderboard()
            if not board:
                return "The leaderboard is currently empty or unavailable."
            text = "*Top Referrers:*\n"
            for idx, r in enumerate(board[:10]):
                text += f"{idx+1}. {r.get('fullName', 'Unknown')} - {r.get('totalPoints', 0)} pts\n"
            return text

        # Get state
        state = state_manager.get_or_create_state(phone)
        current_step = state.get("current_step", 1)
        language = state.get("language", "en")
        collected_data = state.get("collected_data", {})
        
        # If user sent location
        if location:
            # We would reverse geocode here, but for now we just store lat/long and mock city
            collected_data["latitude"] = location.get("latitude")
            collected_data["longitude"] = location.get("longitude")
            # In a real scenario, use Google Maps API to get city. 
            if not collected_data.get("city"):
                collected_data["city"] = "Detected City" 
            user_message = f"[User shared location: {location.get('latitude')}, {location.get('longitude')}]"

        # Special "Edit" intent processing via LLM
        if current_step > 1:
            intent_check = await self._check_edit_intent(user_message, collected_data)
            if intent_check.get("is_edit"):
                # Update the specific fields in state
                collected_data.update(intent_check.get("updated_fields", {}))
                state_manager.update_state(phone, current_step, language, collected_data)
                return await self._generate_response(f"Acknowledge the edit: {json.dumps(intent_check.get('updated_fields'))} and ask the next question for step {current_step}.", current_step, language, collected_data)

        # Process standard step progression
        try:
            next_step, new_data, bot_reply = await self._process_step(phone, current_step, language, collected_data, user_message)
            
            # Update state
            collected_data.update(new_data)
            
            # If step 9 (Registration), handle API call
            if next_step == 9:
                # Add default fields mapping for Express Backend
                collected_data["phone"] = phone
                # Assuming some defaults for required fields not asked to keep it simple, 
                # or ensuring the bot collected everything.
                if "state" not in collected_data: collected_data["state"] = "Karnataka"
                if "pincode" not in collected_data: collected_data["pincode"] = "000000"
                if "fullName" not in collected_data: collected_data["fullName"] = "Rider"

                api_response = await backend_client.register_rider(collected_data)
                if api_response.get("success"):
                    next_step = 10
                    # Clear state after success
                    state_manager.clear_state(phone)
                    
                    data = api_response.get("data", {})
                    ref_code = data.get("referralCode", "N/A")
                    points = data.get("totalPoints", 0)
                    
                    return await self._generate_response(f"Registration successful! Referral Code: {ref_code}, Points: {points}.", 10, language, collected_data)
                else:
                    err = api_response.get("error", "Unknown error")
                    return f"Failed to register: {err}. Please type 'START OVER' or try again."
            else:
                state_manager.update_state(phone, next_step, language, collected_data)
                return bot_reply
                
        except Exception as e:
            logger.error(f"Error processing step: {e}")
            return "An error occurred. Please try again."

    async def _check_edit_intent(self, user_message: str, collected_data: dict) -> dict:
        """
        Uses LLM to detect if the user wants to go back or edit a previous field.
        Returns {"is_edit": bool, "updated_fields": {field: value}}
        """
        prompt = f"""
        Analyze the user's message to determine if they want to edit previously provided information or go back.
        Current collected data: {json.dumps(collected_data)}
        User message: "{user_message}"
        
        If they want to edit, extract the new values and return JSON:
        {{
            "is_edit": true,
            "updated_fields": {{"field_name": "new_value"}}
        }}
        If it's just a normal response to the current question, return:
        {{
            "is_edit": false
        }}
        Respond strictly with JSON.
        """
        try:
            model = _get_model()
            response = model.generate_content(prompt)
            # clean json tags
            text = response.text.replace("```json", "").replace("```", "").strip()
            return json.loads(text)
        except Exception as e:
            logger.error(f"Error checking edit intent: {e}")
            return {"is_edit": False}

    async def _process_step(self, phone: str, current_step: int, language: str, collected_data: dict, user_message: str) -> Tuple[int, dict, str]:
        """
        Evaluates the user's answer for the current step, extracts data, and generates the next question.
        Returns: (next_step_number, extracted_data_dict, bot_response_string)
        """
        # Step definitions
        steps_info = {
            1: "Welcome and Language Selection. Extract the user's preferred language (e.g. English, Hindi, Kannada, etc.) based on their state/input.",
            2: "Collect Basic Profile: Full Name, City, Delivery Platform (e.g. Zomato, Swiggy, Zepto), Years of Experience.",
            3: "Vehicle Information: Vehicle Type (2W/3W), Vehicle Brand, Fuel/Charging Method, Weekly Fuel Expense, Monthly Maintenance Expense.",
            4: "Challenges: Ask Top 3 Challenges. (If Petrol: ask petrol specific. If EV: ask EV specific).",
            5: "Insurance: Accidental Insurance (Yes/No), Health Insurance (Yes/No), Out of Pocket Accident Cost.",
            6: "EV Interest: Interested in switching? Why? Interested in (EV Rental, Insurance, Retrofit, All, None).",
            7: "Referral: Were you referred? If yes, ask for the Referral Code.",
            8: "Confirmation: Summarize all collected information and ask 'Confirm? (Yes/Edit)'"
        }
        
        prompt = f"""
        You are a highly helpful WhatsApp Registration Assistant for "Road Warrior EV".
        The conversation must strictly be in the language: {language if current_step > 1 else 'Determine from user input'}.
        Never ask multiple questions together. Wait for the user's reply.
        
        Current Step: {current_step} - {steps_info.get(current_step, 'Unknown')}
        Already collected data: {json.dumps(collected_data)}
        
        User's latest message: "{user_message}"
        
        Your task:
        1. Validate the user's message for the CURRENT step's requirements.
        2. If valid, extract the fields into a JSON object.
        3. Determine if the step is complete. If yes, move to next_step = {current_step + 1}. If no, keep next_step = {current_step}.
        4. Generate the `bot_reply` in the appropriate language. If the data was invalid, explain why and ask again. If the step is complete, generate the first question for the NEXT step.
        
        Output format MUST be strictly JSON:
        {{
            "extracted_data": {{"key": "value"}},
            "next_step": integer,
            "bot_reply": "Your message to the user",
            "language": "Detected language (only for step 1, else use existing)"
        }}
        """
        
        try:
            model = _get_model()
            response = model.generate_content(prompt)
            text = response.text.replace("```json", "").replace("```", "").strip()
            result = json.loads(text)
            
            extracted = result.get("extracted_data", {})
            next_step = result.get("next_step", current_step)
            bot_reply = result.get("bot_reply", "Sorry, I didn't understand.")
            if current_step == 1 and "language" in result:
                extracted["language"] = result["language"]
                
            return next_step, extracted, bot_reply
        except Exception as e:
            logger.error(f"Error in LLM processing: {e}")
            # Fallback text
            return current_step, {}, "I'm having trouble processing that right now. Could you please rephrase?"

    async def _generate_response(self, instruction: str, current_step: int, language: str, collected_data: dict) -> str:
        prompt = f"""
        You are the Road Warrior EV WhatsApp bot. 
        Language to use: {language}.
        Instruction: {instruction}
        Draft the exact message to send to the user. Do NOT include JSON, just the raw text message.
        """
        try:
            model = _get_model()
            response = model.generate_content(prompt)
            return response.text.strip()
        except:
            return "Processing..."

ai_service = ConversationEngine()
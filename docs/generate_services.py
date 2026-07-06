import os

bot_dir = r"d:\Road-Warrior\whatsapp-bot\services"

ai_py = """import os
from openai import AsyncOpenAI
import logging

logger = logging.getLogger(__name__)
# client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def generate_rag_response(user_message: str, chat_history: list, context_docs: str = "") -> dict:
    # MOCK implementation since OPENAI_API_KEY isn't available in this environment.
    # In production, use client.chat.completions.create(...)
    
    # Check for human handoff intent
    if "human" in user_message.lower() or "support" in user_message.lower():
        return {
            "reply": "I'm transferring you to a human agent. They will be with you shortly.",
            "handoff": True
        }
        
    return {
        "reply": f"AI response to: {user_message}",
        "handoff": False
    }
"""

wa_py = """import os
import httpx
import logging

logger = logging.getLogger(__name__)

async def send_whatsapp_message(phone: str, text: str):
    token = os.getenv("WHATSAPP_TOKEN")
    phone_id = os.getenv("WHATSAPP_PHONE_ID")
    
    if not token or not phone_id:
        logger.warning("Missing WHATSAPP_TOKEN or WHATSAPP_PHONE_ID. Mocking send.")
        return True

    url = f"https://graph.facebook.com/v17.0/{phone_id}/messages"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "text",
        "text": {"body": text}
    }
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            return True
        except Exception as e:
            logger.error(f"Failed to send WA message: {e}")
            return False
"""

with open(os.path.join(bot_dir, "ai_service.py"), "w", encoding="utf-8") as f:
    f.write(ai_py)
with open(os.path.join(bot_dir, "whatsapp_client.py"), "w", encoding="utf-8") as f:
    f.write(wa_py)

print("FastAPI services generated.")

import os
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

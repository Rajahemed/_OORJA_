import os

bot_dir = r"d:\Road-Warrior\whatsapp-bot\routers"

webhook_py = """import os
from fastapi import APIRouter, Request, HTTPException, Response
import httpx
import asyncio

router = APIRouter()

VERIFY_TOKEN = os.getenv("VERIFY_TOKEN", "default_verify_token")

@router.get("/")
async def verify_webhook(request: Request):
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")

    if mode and token:
        if mode == "subscribe" and token == VERIFY_TOKEN:
            return Response(content=challenge, media_type="text/plain")
        else:
            raise HTTPException(status_code=403, detail="Verification failed")
    raise HTTPException(status_code=400, detail="Missing parameters")

@router.post("/")
async def receive_message(request: Request):
    # Enqueue task to prevent blocking the Meta Webhook
    # which requires a 200 OK within 3 seconds.
    data = await request.json()
    # TODO: Parse data and send to background task
    # process_whatsapp_message(data)
    return {"status": "ok"}
"""

chat_py = """from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class SendMessageRequest(BaseModel):
    phone: str
    message: str

@router.post("/send-message")
async def send_message(req: SendMessageRequest):
    # Implementation to send via WhatsApp Cloud API
    return {"success": True, "message": "Message sent (mock)"}

@router.get("/chat-history")
async def chat_history(phone: str):
    # Implementation to fetch from Supabase
    return {"phone": phone, "history": []}
"""

leads_py = """from fastapi import APIRouter
from pydantic import BaseModel
import httpx
import os

router = APIRouter()

class Lead(BaseModel):
    name: str
    phone: str
    email: str
    requirement: str

@router.post("/leads")
async def capture_lead(lead: Lead):
    # Store to Supabase whatsapp_leads
    # Trigger n8n webhook
    n8n_url = os.getenv("N8N_WEBHOOK_URL")
    if n8n_url:
        async with httpx.AsyncClient() as client:
            try:
                await client.post(n8n_url, json=lead.model_dump())
            except Exception as e:
                print(f"Error sending to n8n: {e}")
    return {"success": True, "lead_id": "mock_uuid"}
"""

settings_py = """from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class BotSettings(BaseModel):
    model: str = "gpt-4-turbo"
    temperature: float = 0.5
    human_handoff_threshold: float = 0.8

@router.get("/bot-settings")
async def get_settings():
    return BotSettings()

@router.post("/bot-settings")
async def update_settings(settings: BotSettings):
    return {"success": True, "new_settings": settings}
"""

with open(os.path.join(bot_dir, "webhook.py"), "w", encoding="utf-8") as f:
    f.write(webhook_py)
with open(os.path.join(bot_dir, "chat.py"), "w", encoding="utf-8") as f:
    f.write(chat_py)
with open(os.path.join(bot_dir, "leads.py"), "w", encoding="utf-8") as f:
    f.write(leads_py)
with open(os.path.join(bot_dir, "settings.py"), "w", encoding="utf-8") as f:
    f.write(settings_py)

print("FastAPI routers generated.")

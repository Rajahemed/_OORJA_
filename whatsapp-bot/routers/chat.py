from fastapi import APIRouter
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

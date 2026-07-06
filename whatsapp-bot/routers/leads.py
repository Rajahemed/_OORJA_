from fastapi import APIRouter
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

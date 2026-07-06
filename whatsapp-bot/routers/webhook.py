import os
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

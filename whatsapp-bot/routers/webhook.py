"""
FastAPI Webhook Router
Handles incoming WhatsApp Cloud API messages.
"""
import logging
import json
import os
from typing import Any, Dict, Optional

from fastapi import APIRouter, Request, Response, HTTPException
from fastapi.responses import PlainTextResponse

from services.state_manager import state_manager
from services.conversation_engine import process_step
from services.languages import get_message
from services import whatsapp_client as wa

logger = logging.getLogger(__name__)
router = APIRouter()

# Deduplication: track processed message IDs to handle Meta retries
_processed_ids: set = set()
MAX_DEDUP_SIZE = 5000  # prevent unbounded growth


def _parse_incoming(payload: dict):
    """
    Parse a Meta Webhook payload and extract message info.
    Returns: (phone, message_id, message_text, message_type, media_id, location, interactive_id)
    """
    try:
        entry = payload["entry"][0]
        changes = entry["changes"][0]
        value = changes["value"]
        messages = value.get("messages")
        if not messages:
            return None, None, None, None, None, None, None

        msg = messages[0]
        phone = msg["from"]
        message_id = msg["id"]
        msg_type = msg.get("type", "text")
        text = None
        media_id = None
        location = None
        interactive_id = None

        if msg_type == "text":
            text = msg.get("text", {}).get("body", "").strip()
        elif msg_type == "interactive":
            inter = msg.get("interactive", {})
            if inter.get("type") == "button_reply":
                interactive_id = inter["button_reply"]["id"]
                text = inter["button_reply"]["title"]
            elif inter.get("type") == "list_reply":
                interactive_id = inter["list_reply"]["id"]
                text = inter["list_reply"]["title"]
        elif msg_type in ("audio", "voice"):
            media_id = msg.get("audio", {}).get("id") or msg.get("voice", {}).get("id")
        elif msg_type == "image":
            media_id = msg.get("image", {}).get("id")
        elif msg_type == "location":
            loc = msg.get("location", {})
            location = {
                "latitude": loc.get("latitude"),
                "longitude": loc.get("longitude"),
            }
            text = f"LOCATION:{loc.get('latitude')},{loc.get('longitude')}"
        elif msg_type == "document":
            media_id = msg.get("document", {}).get("id")

        return phone, message_id, text, msg_type, media_id, location, interactive_id
    except (KeyError, IndexError, TypeError) as e:
        logger.debug(f"[Webhook] Parse error: {e}")
        return None, None, None, None, None, None, None


@router.get("/webhook")
async def verify_webhook(request: Request):
    """Meta webhook verification challenge."""
    params = request.query_params
    verify_token = os.getenv("VERIFY_TOKEN", "roadwarrior_verify")
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")

    if mode == "subscribe" and token == verify_token:
        logger.info("[Webhook] Verified successfully.")
        return PlainTextResponse(challenge)

    logger.warning("[Webhook] Verification failed.")
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/webhook")
async def receive_message(request: Request):
    """
    Receive and process incoming WhatsApp messages.
    Always returns 200 to acknowledge Meta (prevents retries for non-message events).
    """
    # Signature verification
    body_bytes = await request.body()
    sig_header = request.headers.get("X-Hub-Signature-256", "")
    if not wa.verify_webhook_signature(body_bytes, sig_header):
        logger.warning("[Webhook] Invalid signature — rejected.")
        raise HTTPException(status_code=403, detail="Invalid signature")

    try:
        payload = json.loads(body_bytes)
    except json.JSONDecodeError:
        return Response(status_code=200)

    # Only process whatsapp_business_account events
    if payload.get("object") != "whatsapp_business_account":
        return Response(status_code=200)

    phone, message_id, text, msg_type, media_id, location, interactive_id = _parse_incoming(payload)

    if not phone:
        return Response(status_code=200)

    # Deduplication
    if message_id in _processed_ids:
        logger.debug(f"[Webhook] Duplicate message {message_id} — skipped.")
        return Response(status_code=200)

    _processed_ids.add(message_id)
    if len(_processed_ids) > MAX_DEDUP_SIZE:
        _processed_ids.clear()

    # Mark message as read
    if message_id:
        await wa.mark_read(phone, message_id)

    # Handle voice messages with speech-to-text
    if msg_type in ("audio", "voice") and media_id:
        state = state_manager.get(phone)
        lang = state.language
        await wa.send_text(phone, get_message(lang, "voice_processing"))
        try:
            audio_bytes = await wa.download_media(media_id)
            if audio_bytes:
                from services.backend_client import speech_to_text
                transcribed = await speech_to_text(audio_bytes)
                if transcribed:
                    text = transcribed
                    logger.info(f"[STT] Transcribed: {text[:100]}")
                else:
                    await wa.send_text(phone, "⚠️ Could not transcribe voice message. Please type your response.")
                    return Response(status_code=200)
        except Exception as e:
            logger.error(f"[Voice] processing error: {e}")
            await wa.send_text(phone, "⚠️ Voice processing failed. Please type your response.")
            return Response(status_code=200)

    if not text and not location:
        return Response(status_code=200)

    # Load conversation state
    state = state_manager.get(phone)

    # Show welcome if first-time or expired
    if state.step == 1 and not text:
        lang = state.language
        available = ["en", "hi"]
        from services.languages import format_language_menu
        menu = format_language_menu(available)
        await wa.send_text(phone, get_message("en", "welcome") + f"\n\n{menu}")
        state_manager.save(state)
        return Response(status_code=200)

    # First message ever — show welcome + language menu
    if state.step == 1 and state.is_new:
        from services.languages import format_language_menu, DEFAULT_LANGUAGES
        menu = format_language_menu(DEFAULT_LANGUAGES)
        welcome = get_message("en", "welcome") + f"\n\n{menu}"
        await wa.send_text(phone, welcome)
        state.is_new = False
        state_manager.save(state)

        # Now process their actual text as language selection
        if text and not any(word in text.upper() for word in ("HI", "HELLO", "NAMASTE", "HEY")):
            reply, should_save = await process_step(state, text, location)
            await wa.send_text(phone, reply)
            if should_save:
                state_manager.save(state)
        return Response(status_code=200)

    # Process the step
    try:
        reply, should_save = await process_step(state, text or "", location)
    except Exception as e:
        logger.error(f"[Engine] Error processing step {state.step} for {phone}: {e}", exc_info=True)
        lang = state.language
        reply = get_message(lang, "error")
        should_save = False

    # Send reply
    if reply:
        # Split very long messages (WA limit is 4096 chars)
        if len(reply) > 4000:
            chunks = [reply[i:i+4000] for i in range(0, len(reply), 4000)]
            for chunk in chunks:
                await wa.send_text(phone, chunk)
        else:
            await wa.send_text(phone, reply)

    if should_save:
        state_manager.save(state)

    return Response(status_code=200)


@router.get("/health")
async def health():
    return {"status": "ok", "service": "Road Warrior WhatsApp Bot"}

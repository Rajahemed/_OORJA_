"""
WhatsApp Cloud API client — send messages, interactive buttons, lists.
Verifies Meta webhook signatures.
"""
import os
import hmac
import hashlib
import logging
import json
import httpx
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)

WHATSAPP_API_VERSION = "v19.0"
WA_API_BASE = f"https://graph.facebook.com/{WHATSAPP_API_VERSION}"


def verify_webhook_signature(payload_bytes: bytes, signature_header: str) -> bool:
    """
    Verify X-Hub-Signature-256 header from Meta.
    """
    app_secret = os.getenv("WHATSAPP_APP_SECRET", "")
    if not app_secret:
        logger.warning("WHATSAPP_APP_SECRET not set — skipping signature check.")
        return True  # allow in dev mode

    if not signature_header or not signature_header.startswith("sha256="):
        return False

    expected = "sha256=" + hmac.new(
        app_secret.encode("utf-8"),
        payload_bytes,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature_header)


def _headers() -> dict:
    token = os.getenv("WHATSAPP_TOKEN", "")
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }


def _phone_id() -> str:
    return os.getenv("WHATSAPP_PHONE_ID", "")


async def send_text(phone: str, text: str, preview_url: bool = False) -> bool:
    """Send a plain text message."""
    url = f"{WA_API_BASE}/{_phone_id()}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "text",
        "text": {"body": text, "preview_url": preview_url},
    }
    return await _post(url, payload)


async def send_buttons(phone: str, body_text: str, buttons: List[Dict[str, str]]) -> bool:
    """
    Send interactive quick-reply buttons (max 3).
    buttons = [{"id": "btn_yes", "title": "Yes"}, ...]
    """
    if not _phone_id() or not os.getenv("WHATSAPP_TOKEN"):
        logger.info(f"[WA Mock] Buttons to {phone}: {body_text} | {buttons}")
        return True

    rows = [
        {"type": "reply", "reply": {"id": b["id"], "title": b["title"][:20]}}
        for b in buttons[:3]
    ]
    url = f"{WA_API_BASE}/{_phone_id()}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "interactive",
        "interactive": {
            "type": "button",
            "body": {"text": body_text},
            "action": {"buttons": rows},
        },
    }
    return await _post(url, payload)


async def send_list(phone: str, body_text: str, button_label: str, sections: List[Dict]) -> bool:
    """
    Send interactive list message.
    sections = [{"title": "Options", "rows": [{"id": "...", "title": "...", "description": "..."}, ...]}]
    """
    if not _phone_id() or not os.getenv("WHATSAPP_TOKEN"):
        logger.info(f"[WA Mock] List to {phone}: {body_text}")
        return True

    url = f"{WA_API_BASE}/{_phone_id()}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "interactive",
        "interactive": {
            "type": "list",
            "body": {"text": body_text},
            "action": {
                "button": button_label[:20],
                "sections": sections,
            },
        },
    }
    return await _post(url, payload)


async def mark_read(phone: str, message_id: str) -> bool:
    """Mark a received message as read (shows blue ticks)."""
    if not _phone_id() or not os.getenv("WHATSAPP_TOKEN"):
        return True
    url = f"{WA_API_BASE}/{_phone_id()}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "status": "read",
        "message_id": message_id,
    }
    return await _post(url, payload)


async def download_media(media_id: str) -> Optional[bytes]:
    """Download a voice or image file from Meta servers."""
    token = os.getenv("WHATSAPP_TOKEN", "")
    if not token:
        return None
    # Step 1: get media URL
    url = f"{WA_API_BASE}/{media_id}"
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(url, headers=_headers())
        if r.status_code != 200:
            logger.error(f"Failed to get media URL: {r.text}")
            return None
        media_url = r.json().get("url")
        if not media_url:
            return None
        # Step 2: download binary
        r2 = await client.get(media_url, headers={"Authorization": f"Bearer {token}"})
        if r2.status_code != 200:
            logger.error(f"Failed to download media: {r2.status_code}")
            return None
        return r2.content


async def _post(url: str, payload: dict) -> bool:
    token = os.getenv("WHATSAPP_TOKEN", "")
    phone_id = _phone_id()

    if not token or not phone_id:
        logger.info(f"[WA Mock] → {payload.get('to')}: {json.dumps(payload)[:200]}")
        return True

    async with httpx.AsyncClient(timeout=15) as client:
        try:
            resp = await client.post(url, headers=_headers(), json=payload)
            if resp.status_code not in (200, 201):
                logger.error(f"WA API error {resp.status_code}: {resp.text[:500]}")
                return False
            return True
        except httpx.TimeoutException:
            logger.error("WA API timeout")
            return False
        except Exception as e:
            logger.error(f"WA API exception: {e}")
            return False

"""
State Manager — Supabase persistence for WhatsApp conversation state.
24-hour session memory.
"""
import os
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from database import supabase

logger = logging.getLogger(__name__)
SESSION_TTL_HOURS = 24


class ConversationState:
    """Represents one user's conversation state."""
    def __init__(self, data: dict):
        self.phone: str = data.get("phone", "")
        self.step: int = data.get("current_step", 1)
        self.language: str = data.get("language", "en")
        self.data: dict = data.get("collected_data") or {}
        self.last_interaction: Optional[str] = data.get("last_interaction")
        self.is_new: bool = data.get("is_new", False)

    def is_expired(self) -> bool:
        if not self.last_interaction:
            return False
        try:
            last = datetime.fromisoformat(self.last_interaction.replace("Z", "+00:00"))
            if last.tzinfo is None:
                last = last.replace(tzinfo=timezone.utc)
            return (datetime.now(timezone.utc) - last) > timedelta(hours=SESSION_TTL_HOURS)
        except Exception:
            return False

    def to_db_dict(self) -> dict:
        return {
            "phone": self.phone,
            "current_step": self.step,
            "language": self.language,
            "collected_data": self.data,
            "last_interaction": datetime.now(timezone.utc).isoformat(),
        }


class StateManager:
    TABLE = "whatsapp_state"

    def get(self, phone: str) -> ConversationState:
        """Load state or create a fresh one."""
        if not supabase:
            logger.warning("Supabase not configured — using in-memory state.")
            return ConversationState({"phone": phone, "is_new": True})

        try:
            resp = supabase.table(self.TABLE).select("*").eq("phone", phone).execute()
            rows = resp.data
            if rows:
                state = ConversationState(rows[0])
                if state.is_expired():
                    logger.info(f"[State] Session expired for {phone}, resetting.")
                    state.step = 1
                    state.data = {}
                    state.language = "en"
                else:
                    logger.info(f"[State] Resumed step {state.step} for {phone}")
                return state
        except Exception as e:
            logger.error(f"[State] get error: {e}")

        return ConversationState({"phone": phone, "is_new": True})

    def save(self, state: ConversationState) -> bool:
        if not supabase:
            return True
        try:
            db_data = state.to_db_dict()
            resp = supabase.table(self.TABLE).upsert(db_data, on_conflict="phone").execute()
            return True
        except Exception as e:
            logger.error(f"[State] save error: {e}")
            return False

    def clear(self, phone: str) -> bool:
        if not supabase:
            return True
        try:
            supabase.table(self.TABLE).delete().eq("phone", phone).execute()
            return True
        except Exception as e:
            logger.error(f"[State] clear error: {e}")
            return False


state_manager = StateManager()

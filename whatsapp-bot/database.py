"""
Supabase client initialisation.
Returns None if credentials are not configured (mock/dev mode).
"""
import os
import logging

logger = logging.getLogger(__name__)

supabase = None

try:
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_KEY", "")
    if url and key and url != "YOUR_SUPABASE_URL":
        from supabase import create_client, Client
        supabase: Client = create_client(url, key)
        logger.info("Supabase connected successfully.")
    else:
        logger.warning("Supabase credentials not set — running in mock mode (state not persisted).")
except Exception as e:
    logger.error(f"Supabase connection failed: {e}")
    supabase = None

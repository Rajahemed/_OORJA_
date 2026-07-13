"""
Road Warrior EV — WhatsApp AI Agent
Main FastAPI application entry point.
"""
import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

# Configure production logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Road Warrior EV — WhatsApp AI Agent",
    description="Production WhatsApp AI agent for rider registration. Integrates with the existing Express.js API.",
    version="2.0.0",
    docs_url="/docs" if os.getenv("ENV", "production") != "production" else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ── Include routers ──────────────────────────────────────────────────────────
from routers.webhook import router as webhook_router
app.include_router(webhook_router, tags=["Webhook"])

# ── Root health endpoint ──────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "status": "healthy",
        "service": "Road Warrior EV WhatsApp AI Agent",
        "version": "2.0.0",
    }

@app.on_event("startup")
async def on_startup():
    logger.info("Road Warrior WhatsApp Agent started.")
    logger.info(f"Express API URL: {os.getenv('EXPRESS_API_URL', 'http://localhost:3000/api')}")
    logger.info(f"WA Phone ID configured: {'Yes' if os.getenv('WHATSAPP_PHONE_ID') else 'No (mock mode)'}")

@app.on_event("shutdown")
async def on_shutdown():
    logger.info("Road Warrior WhatsApp Agent shutting down.")

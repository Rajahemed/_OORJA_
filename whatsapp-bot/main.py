import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import webhook, chat, leads, settings
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="WhatsApp AI Bot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(webhook.router, prefix="/webhook", tags=["Webhook"])
app.include_router(chat.router, prefix="/api/whatsapp", tags=["Chat"])
app.include_router(leads.router, prefix="/api/whatsapp", tags=["Leads"])
app.include_router(settings.router, prefix="/api/whatsapp", tags=["Settings"])

@app.get("/")
def read_root():
    return {"status": "healthy", "service": "WhatsApp AI Bot"}

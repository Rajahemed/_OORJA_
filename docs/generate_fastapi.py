import os

bot_dir = r"d:\Road-Warrior\whatsapp-bot"
os.makedirs(bot_dir, exist_ok=True)
os.makedirs(os.path.join(bot_dir, "routers"), exist_ok=True)
os.makedirs(os.path.join(bot_dir, "services"), exist_ok=True)

# requirements.txt
reqs = """fastapi==0.110.0
uvicorn==0.27.1
httpx==0.27.0
python-dotenv==1.0.1
pydantic==2.6.4
supabase==2.4.1
openai==1.14.2
"""
with open(os.path.join(bot_dir, "requirements.txt"), "w", encoding="utf-8") as f:
    f.write(reqs)

# .env (placeholder)
env_content = """SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_KEY=YOUR_SUPABASE_KEY
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
WHATSAPP_TOKEN=YOUR_WHATSAPP_TOKEN
WHATSAPP_PHONE_ID=YOUR_WHATSAPP_PHONE_ID
VERIFY_TOKEN=YOUR_VERIFY_TOKEN
N8N_WEBHOOK_URL=YOUR_N8N_WEBHOOK_URL
"""
with open(os.path.join(bot_dir, ".env"), "w", encoding="utf-8") as f:
    f.write(env_content)

# main.py
main_py = """import os
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
"""
with open(os.path.join(bot_dir, "main.py"), "w", encoding="utf-8") as f:
    f.write(main_py)

# database.py
db_py = """import os
from supabase import create_client, Client

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if url and key:
    supabase: Client = create_client(url, key)
else:
    supabase = None
"""
with open(os.path.join(bot_dir, "database.py"), "w", encoding="utf-8") as f:
    f.write(db_py)

print("FastAPI boilerplate generated.")

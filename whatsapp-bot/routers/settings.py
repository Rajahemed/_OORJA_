from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class BotSettings(BaseModel):
    model: str = "gpt-4-turbo"
    temperature: float = 0.5
    human_handoff_threshold: float = 0.8

@router.get("/bot-settings")
async def get_settings():
    return BotSettings()

@router.post("/bot-settings")
async def update_settings(settings: BotSettings):
    return {"success": True, "new_settings": settings}

"""
Road Warrior EV — WhatsApp AI Agent
==============================================
Pure rule-based state machine (no LLM calls for fixed questions).
Gemini is called ONLY for:
  - Language detection / free-text understanding
  - Speech-to-text (voice message processing)
  - Smart edit-field detection

All data is saved via the EXISTING Express API at POST /api/riders/register.
No duplicate business logic.
"""

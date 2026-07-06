# WhatsApp Bot Architecture

## Purpose
A production-ready WhatsApp bot using RAG (Retrieval-Augmented Generation) to answer FAQs, capture leads, and support multi-language routing.

## Dependencies
- `fastapi`, `uvicorn`
- `supabase`
- `openai`
- `httpx` (for WhatsApp Cloud API / n8n)
- `python-dotenv`

## RAG Flow
1. Meta webhook pushes message to `/webhook`.
2. Bot queries `whatsapp_sessions` in Supabase.
3. Chat history is appended.
4. Message is routed to OpenAI Assistant equipped with company knowledge base.
5. If OpenAI signals uncertainty or user requests human, `status` changes to `human_handoff` and notification is sent via Resend/n8n.

import os

docs_dir = r"d:\Road-Warrior\docs"

implementation_guide = """# Implementation Guide

## Application Overview
Road Warrior Pro is a last-mile delivery rider dashboard, registration platform, and AI WhatsApp bot system. It consists of a Node.js Express backend serving the web application and a FastAPI backend serving the WhatsApp AI Integration.

## Component Architecture
- **Web Backend**: Node.js (Express), Twilio (SMS), Resend (Emails)
- **AI Backend**: Python (FastAPI), OpenAI Assistants API, WhatsApp Cloud API
- **Database**: Supabase (PostgreSQL)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript, Chart.js, Leaflet Maps
- **Automation**: n8n for lead routing

## Functional Flows
1. **Rider Registration**: 7-step wizard capturing profile, vehicle, and safety data. Auto-saves to Supabase.
2. **Dashboard**: Gamified rider metrics, referrals, and leaderboards.
3. **Admin Panel**: Analytics for funnel completion, bot activity, and lead exports.
4. **WhatsApp Bot**: Receives webhooks from Meta, retrieves context from Supabase, processes via OpenAI RAG, and routes to humans if AI fails.

## Rollback Strategy
- **Web App**: Revert `server.js` or `public/` assets via Git checkout.
- **Database**: Execute `DOWN` migrations in Supabase to restore dropped columns/tables.
- **FastAPI**: Rollback Docker image / Git branch deployment.
"""

api_docs = """# API Documentation

## Node.js Endpoints (Web App)
- `POST /api/auth/register`: Registers a new rider. Requires 4-digit PIN.
- `POST /api/auth/login`: Authenticates a rider.
- `POST /api/riders/partial`: Captures partial lead data. Requires `CSRF-Token`.
- `POST /api/otp/send`: Triggers OTP via Twilio.
- `POST /api/otp/verify`: Verifies OTP.

## FastAPI Endpoints (WhatsApp Bot)
- `GET /webhook`: Verifies Meta webhook token.
- `POST /webhook`: Ingests incoming WhatsApp messages.
- `POST /api/whatsapp/send-message`: Sends outbound messages.
- `GET /api/whatsapp/chat-history`: Retrieves chat history for a given phone number.
- `POST /api/whatsapp/leads`: Triggers n8n webhook for lead capture.
- `GET /api/whatsapp/bot-settings`: Manages bot configurations (temperature, prompt, escalation threshold).
"""

db_schema = """# Database Schema (Supabase)

## `riders`
Core table storing authenticated users.
- `id` (UUID, Primary Key)
- `phone`, `email` (Unique)
- `password` (Hashed 4-digit PIN)
- `totalPoints`, `totalDeliveries` (Gamification)
- `referralCode`, `referredByCode`

## `whatsapp_sessions`
Tracks active bot conversations.
- `id` (UUID, Primary Key)
- `phone_number` (String)
- `rider_id` (UUID, Foreign Key nullable)
- `status` (Enum: active, human_handoff, resolved)
- `language` (String)
- `last_message_at` (Timestamp)

## `whatsapp_messages`
Stores conversation history.
- `id` (UUID, Primary Key)
- `session_id` (UUID, Foreign Key)
- `direction` (Enum: inbound, outbound)
- `content` (Text)
- `timestamp` (Timestamp)

## `whatsapp_leads`
Stores leads captured exclusively via WhatsApp.
- `id` (UUID, Primary Key)
- `name` (String)
- `phone` (String)
- `email` (String)
- `requirement` (Text)
- `timestamp` (Timestamp)
"""

wa_bot = """# WhatsApp Bot Architecture

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
"""

perf_report = """# Performance Report & Load Testing Plan

## Expected Throughput
- Target: 300+ registrations/messages per day.
- Concurrency: Up to 50 concurrent sessions.

## Load Testing Strategy (Artillery/Locust)
1. **API Endpoints Test**: POST `/api/riders/partial` with 100 requests/second.
2. **Webhook Stress Test**: Simulate 200 incoming WhatsApp messages in 10 seconds.
3. **Database Test**: Perform 1000 indexed queries on `whatsapp_sessions`.

## Optimization Recommendations
- **Connection Pooling**: Use Supabase PgBouncer to prevent connection exhaustion.
- **Queueing**: Use background tasks (`asyncio.create_task` or Celery) in FastAPI to process OpenAI requests so the `/webhook` responds `200 OK` within Meta's 3-second limit.
- **Caching**: Implement Redis caching for frequent DB queries like Rider authentication and Bot settings.
- **Rate Limiting**: Enforce 10 messages / minute / phone number to prevent spam costs.
"""

arch = """# Architecture Details

## System Architecture
```mermaid
graph TD;
    Client[Web/Mobile UI] --> Express[Node.js Backend]
    Express --> Supabase[(Supabase PostgreSQL)]
    WA[WhatsApp User] --> Meta[Meta Cloud API]
    Meta --> FastAPI[FastAPI Webhook]
    FastAPI --> OpenAI[OpenAI RAG]
    FastAPI --> Supabase
    FastAPI --> n8n[n8n Automation]
    n8n --> Email[Email / CRM]
```

## WhatsApp Sequence Diagram
```mermaid
sequenceDiagram
    participant U as User
    participant M as Meta API
    participant F as FastAPI
    participant S as Supabase
    participant O as OpenAI

    U->>M: Sends WhatsApp Message
    M->>F: POST /webhook
    F->>S: Fetch Session & History
    F->>O: Generate Response (RAG)
    O-->>F: AI Reply
    F->>S: Save Messages
    F->>M: Send Reply to User
    M-->>U: Receives Reply
```
"""

with open(os.path.join(docs_dir, "IMPLEMENTATION_GUIDE.md"), "w", encoding="utf-8") as f:
    f.write(implementation_guide)
with open(os.path.join(docs_dir, "API_DOCUMENTATION.md"), "w", encoding="utf-8") as f:
    f.write(api_docs)
with open(os.path.join(docs_dir, "DATABASE_SCHEMA.md"), "w", encoding="utf-8") as f:
    f.write(db_schema)
with open(os.path.join(docs_dir, "WHATSAPP_BOT.md"), "w", encoding="utf-8") as f:
    f.write(wa_bot)
with open(os.path.join(docs_dir, "PERFORMANCE_REPORT.md"), "w", encoding="utf-8") as f:
    f.write(perf_report)
with open(os.path.join(docs_dir, "ARCHITECTURE.md"), "w", encoding="utf-8") as f:
    f.write(arch)

print("Documentation generated successfully.")

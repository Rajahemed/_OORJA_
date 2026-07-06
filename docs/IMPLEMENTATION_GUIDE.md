# Implementation Guide

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

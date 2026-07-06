# Performance Report & Load Testing Plan

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

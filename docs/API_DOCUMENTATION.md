# API Documentation

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

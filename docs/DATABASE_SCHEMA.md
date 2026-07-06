# Database Schema (Supabase)

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

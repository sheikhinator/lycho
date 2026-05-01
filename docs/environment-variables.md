# LYCHO — Environment Variables

All variables must be set in `.env.local` for local development and in **Vercel → Settings → Environment Variables** for production.

---

## App Configuration

| Variable | Description | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Base URL of the app (no trailing slash) | Your Vercel deployment URL, e.g. `https://lycho.vercel.app` |

---

## Supabase

| Variable | Description | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key (safe for browser) | Supabase Dashboard → Settings → API → `anon public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-side only, never expose to client) | Supabase Dashboard → Settings → API → `service_role` key |

---

## OpenCode AI

| Variable | Description | Where to get it |
|---|---|---|
| `OPENCODE_API_KEY` | API key to call OpenCode models (big-pickle, claude-haiku-4-5, claude-sonnet-4-5) | Provided by OpenCode (use: sk-DkKhm5mvzbJQHPhVyAbDBKVbDQgKuq5e6bTxTHW9jcRHa50tW3P9ax4oEsDv3buu) |

---

## Resend (Email)

| Variable | Description | Where to get it |
|---|---|---|
| `RESEND_API_KEY` | API key for sending transactional emails | [resend.com](https://resend.com) → API Keys |

Emails are sent from `alerts@lycho.ai`. You must verify your domain in Resend before going live.

---

## Upstash Redis (Rate Limiting)

| Variable | Description | Where to get it |
|---|---|---|
| `UPSTASH_REDIS_REST_URL` | REST URL for your Upstash Redis database | [console.upstash.com](https://console.upstash.com) → Database → REST API |
| `UPSTASH_REDIS_REST_TOKEN` | Auth token for Upstash Redis | Same location as above |

---

## WhatsApp Business API

| Variable | Description | Where to get it |
|---|---|---|
| `WHATSAPP_VERIFY_TOKEN` | Token used to verify your webhook with Meta | Set to any string (e.g. `lycho-whatsapp-verify-2027`), then register same string in Meta Developer Portal |
| `WHATSAPP_ACCESS_TOKEN` | Access token for sending WhatsApp messages | Meta Developer Portal → WhatsApp → API Setup → Temporary access token |
| `WHATSAPP_PHONE_NUMBER_ID` | ID of your WhatsApp Business phone number | Meta Developer Portal → WhatsApp → API Setup → Phone Number ID |

**Note:** `WHATSAPP_VERIFY_TOKEN` must also be added to **Vercel environment variables** so Meta can verify your production webhook at `https://lycho.vercel.app/api/webhooks/whatsapp`.

---

## Webhook Verification

| Variable | Description | Where to get it |
|---|---|---|
| `WEBHOOK_VERIFY_TOKEN` | Generic token for verifying Facebook/Instagram webhooks | Set to any string (default: `lycho-verify`) |

---

## Monitoring

| Variable | Description | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry error tracking DSN | [sentry.io](https://sentry.io) → Project → Settings → Client Keys (DSN) |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog analytics project key | [posthog.com](https://posthog.com) → Project Settings → Project API Key |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog ingestion host | `https://us.i.posthog.com` (US) or `https://eu.i.posthog.com` (EU) |

---

## Setting Up for Local Development

1. Copy `.env.local.example` to `.env.local` (or create it fresh).
2. Fill in all required variables.
3. Run `npm run dev`.

## Setting Up for Production (Vercel)

1. Go to **Vercel → Project → Settings → Environment Variables**.
2. Add each variable from this list. Mark server-only variables (service role keys, API keys) as **Non-exposed**.
3. Redeploy after adding new variables.

## Required vs Optional

**Required for core functionality:**
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENCODE_API_KEY`

**Required for email notifications:**
- `RESEND_API_KEY`

**Required for rate limiting:**
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

**Required for WhatsApp integration:**
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_ACCESS_TOKEN` (after Meta approval)
- `WHATSAPP_PHONE_NUMBER_ID` (after Meta approval)

**Optional (monitoring):**
- `NEXT_PUBLIC_SENTRY_DSN`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`

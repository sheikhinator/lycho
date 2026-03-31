# Meta WhatsApp Business API — Internal Setup Guide

This guide is for the LYCHO master admin to apply for and configure the Meta WhatsApp Business API.

---

## Why This Is Needed

The WhatsApp Business App supports manual messaging for small volumes. For automated AI agent responses at scale (LYCHO's use case), you need the **Meta Business API** (formerly WhatsApp Business Platform).

---

## Required Documents

Before applying, prepare:

1. **Business Registration** — Certificate of incorporation or trade license
2. **Business Website** — Active website with privacy policy and contact page (`lycho.ai` qualifies)
3. **Facebook Business Manager Account** — Verified business manager at `business.facebook.com`
4. **Use Case Description** — Brief explanation: "AI-powered customer support and lead management for SMBs in Pakistan"
5. **Phone Number** — A dedicated number not previously registered on WhatsApp Personal or WhatsApp Business App

---

## Application Steps

### Step 1 — Create Facebook Business Manager

1. Go to [business.facebook.com](https://business.facebook.com)
2. Create a Business Manager account with your business email
3. Verify your business (upload registration documents)

### Step 2 — Create a Meta App

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Click **My Apps → Create App**
3. Select **Business** as the app type
4. Associate it with your Business Manager

### Step 3 — Add WhatsApp Product

1. In your app dashboard, click **Add Product**
2. Select **WhatsApp** → click **Set Up**
3. Link your verified business phone number

### Step 4 — Configure Webhook

In the WhatsApp app settings, set:

- **Webhook URL:** `NEXT_PUBLIC_APP_URL/api/webhooks/whatsapp`
  - Example: `https://lycho.vercel.app/api/webhooks/whatsapp`
- **Verify Token:** value of `WHATSAPP_VERIFY_TOKEN` env var (currently `lycho-whatsapp-verify-2027`)

Subscribe to these webhook events:
- `messages`
- `message_deliveries`
- `message_reads`

### Step 5 — Get Access Token

1. Generate a **System User** in Business Manager → System Users
2. Assign the WhatsApp app to the system user
3. Generate a **permanent access token** (never expires)
4. Add to env: `WHATSAPP_ACCESS_TOKEN=<token>`

### Step 6 — Get Phone Number ID

In Meta App → WhatsApp → API Setup, find the **Phone Number ID**.

Add to env: `WHATSAPP_PHONE_NUMBER_ID=<id>`

---

## Expected Approval Timeline

| Step | Time |
|------|------|
| Business Manager verification | 1–3 business days |
| App review (if needed for production) | 1–7 business days |
| Phone number verification | Instant (via SMS/call) |

---

## Environment Variables to Set

After approval, update these in both `.env.local` and Vercel:

```
WHATSAPP_ACCESS_TOKEN=<permanent_system_user_token>
WHATSAPP_PHONE_NUMBER_ID=<phone_number_id>
WHATSAPP_VERIFY_TOKEN=lycho-whatsapp-verify-2027   # already set
```

---

## Testing the Integration

Once configured, test with:

```bash
curl -X POST https://lycho.vercel.app/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"object":"whatsapp_business_account","entry":[...]}'
```

The webhook handler is at `app/api/webhooks/whatsapp/route.ts`.

---

## Useful Links

- Meta for Developers: https://developers.facebook.com
- WhatsApp Business Platform docs: https://developers.facebook.com/docs/whatsapp
- Business Manager: https://business.facebook.com
- API Explorer: https://developers.facebook.com/tools/explorer

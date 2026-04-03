# Meta WhatsApp Business API Application — Complete Guide

## Required Info
- **Business name:** Lycho Systems
- **Website:** https://lycho.vercel.app
- **Use case:** AI-powered business automation platform for SMEs
- **Webhook URL:** https://lycho.vercel.app/api/webhooks/whatsapp
- **Verify token:** Set `WHATSAPP_VERIFY_TOKEN` in Vercel env vars (use `openssl rand -hex 32`)

## Application URL
https://developers.facebook.com/apps/

## Step-by-Step Guide

### Phase 1: Meta Developer Setup
1. Go to https://developers.facebook.com/ and create an account
2. Click **My Apps** → **Create App**
3. Select **Business** as the app type
4. Fill in:
   - App Display Name: `LYCHO WhatsApp`
   - App Contact Email: `hello@lycho.app`
   - Business Account: Select or create your Meta Business account
5. Click **Create App**

### Phase 2: Add WhatsApp Product
1. In your app dashboard, scroll to **Add Products**
2. Find **WhatsApp** and click **Set Up**
3. You'll be taken to the WhatsApp product dashboard

### Phase 3: Get Test Credentials
1. In WhatsApp product dashboard, note these values:
   - **Phone Number ID** (under API Setup)
   - **Temporary Access Token** (valid for 24 hours)
   - **Verify Token** (create your own, e.g., `openssl rand -hex 32`)
2. Set these in Vercel environment variables:
   ```
   WHATSAPP_VERIFY_TOKEN=<your-token>
   WHATSAPP_APP_SECRET=<from-app-settings>
   WHATSAPP_PHONE_NUMBER_ID=<from-dashboard>
   WHATSAPP_ACCESS_TOKEN=<temporary-token>
   ```

### Phase 4: Configure Webhook
1. In WhatsApp product dashboard → **Configuration**
2. Set **Callback URL** to: `https://lycho.vercel.app/api/webhooks/whatsapp`
3. Set **Verify Token** to match your `WHATSAPP_VERIFY_TOKEN` env var
4. Click **Verify and Save**
5. Subscribe to these fields:
   - `messages`
   - `message_deliveries`
   - `message_reads`
   - `message_reactions`

### Phase 5: Add Test Phone Number
1. In WhatsApp dashboard → **API Setup**
2. Add your personal phone number as a test recipient
3. Send a test message using the API:
   ```bash
   curl -X POST "https://graph.facebook.com/v18.0/<PHONE_NUMBER_ID>/messages" \
     -H "Authorization: Bearer <ACCESS_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{
       "messaging_product": "whatsapp",
       "to": "<YOUR_PHONE>",
       "type": "template",
       "template": {
         "name": "hello_world",
         "language": { "code": "en_US" }
       }
     }'
   ```

### Phase 6: Test Webhook
1. Send a message to your WhatsApp Business number
2. Check Vercel logs for incoming webhook POST
3. Verify the response is processed correctly
4. Use the diagnostic endpoint:
   ```bash
   curl "https://lycho.vercel.app/api/webhooks/whatsapp/test?secret=<MASTER_SECRET>"
   ```

### Phase 7: Business Verification
1. Go to **Meta Business Suite** → **Security Center**
2. Complete business verification:
   - Upload business registration documents
   - Verify business address
   - Verify phone number
3. This takes 1-7 business days

### Phase 8: Go Live
1. After business verification is approved:
   - Submit your app for **App Review**
   - Request `whatsapp_business_messaging` permission
   - Provide screencast of your integration
2. Once approved, upgrade from test to production:
   - Generate a permanent access token
   - Update `WHATSAPP_ACCESS_TOKEN` in Vercel
3. Update channel_connections in database:
   ```sql
   UPDATE channel_connections
   SET status = 'active',
       credentials = credentials || '{"access_token": "<permanent-token>"}'::jsonb
   WHERE channel_type = 'whatsapp' AND status = 'pending';
   ```

## Troubleshooting

### Webhook Verification Fails
- Ensure `WHATSAPP_VERIFY_TOKEN` matches exactly in both Meta dashboard and Vercel
- Check that your webhook URL is publicly accessible (not localhost)
- Verify the GET handler in `/api/webhooks/whatsapp/route.ts` is responding correctly

### Messages Not Sending
- Check access token hasn't expired (temporary tokens last 24 hours)
- Verify phone number ID is correct
- Check Meta app has WhatsApp Business API permission

### Signature Verification Fails
- Ensure `WHATSAPP_APP_SECRET` is set correctly in Vercel
- The secret is found in Meta App Dashboard → Settings → Basic → App Secret

## Expected Timeline
- **Test setup:** 30 minutes
- **Business verification:** 1-7 business days
- **App review:** 1-5 business days
- **Total:** 1-2 weeks to production

# LYCHO Launch Checklist

## Phase 1: Pre-Launch (Days 36-40)
- [ ] Run all Supabase migrations in production
- [ ] Set all environment variables in Vercel
- [ ] Run demo seed script for pilot clients
- [ ] Test WhatsApp webhook end-to-end with Meta test number
- [ ] Verify all 7 core agents respond correctly
- [ ] Test mobile app on both iOS and Android
- [ ] Verify billing page shows real data
- [ ] Test trial expiration cron manually
- [ ] Verify error boundaries and 404 pages
- [ ] Check all API routes return correct responses

## Phase 2: Pilot (Days 41-45)
- [ ] Onboard 3-5 pilot clients
- [ ] Collect feedback via /dashboard/feedback
- [ ] Monitor analytics dashboard for anomalies
- [ ] Fix critical bugs reported by pilots
- [ ] Verify WhatsApp delivery rates
- [ ] Test payment flow with Safepay sandbox
- [ ] Review security audit findings status

## Phase 3: Launch Prep (Days 46-48)
- [ ] Create Product Hunt listing
- [ ] Prepare social media assets (OG images, screenshots)
- [ ] Write launch announcement copy
- [ ] Set up analytics tracking (if needed)
- [ ] Final README review
- [ ] Verify Terms of Service and Privacy Policy pages
- [ ] Test cookie banner functionality

## Phase 4: Launch (Days 49-50)
- [ ] Submit to Product Hunt
- [ ] Post on Twitter/X, LinkedIn
- [ ] Monitor server logs for errors
- [ ] Respond to user feedback in real-time
- [ ] Track conversion metrics

## Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENCODE_API_KEY=sk-DkKhm5mvzbJQHPhVyAbDBKVbDQgKuq5e6bTxTHW9jcRHa50tW3P9ax4oEsDv3buu
RESEND_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WEBHOOK_VERIFY_TOKEN=
MASTER_SECRET=
MASTER_EMAIL=
NEXT_PUBLIC_APP_URL=
CRON_SECRET=
```

## Manual Actions Required
1. Run `supabase db push` to apply migrations 002
2. Rotate all secret keys
3. Set WHATSAPP_APP_SECRET in Vercel
4. Submit Meta WhatsApp Business API application

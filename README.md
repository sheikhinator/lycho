# LYCHO — Intelligence. Transmitted.

LYCHO is a universal AI agent platform that deploys 370+ specialist agents across 20 business sectors. Built for Pakistani and global businesses, LYCHO runs every department of your business — simultaneously, intelligently, autonomously.

## Features

- **370+ Specialist Agents** — Sales, Legal, Healthcare, Finance, HR, Logistics, and more
- **Self-Expanding Intelligence** — Forge Agent builds new agents automatically every night
- **ORION Intelligence Layer** — Agents get smarter with every conversation
- **The Syndicate** — 24+ inter-agent communication routes for multi-agent collaboration
- **8 Channel Adapters** — WhatsApp, Email, Web Widget, Telegram, SMS, Slack, Instagram, Facebook
- **Geo-Intelligence** — Agents adapt to local regulations (Pakistan, UAE, UK, US, etc.)
- **Guardian + Veritas** — Security and quality checks on every message
- **Nexus Automation** — Plain English automation builder
- **Real-time Analytics** — KPIs, health scores, churn prediction
- **Mobile App** — Full iOS/Android support via Expo

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend (Web)** | Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS |
| **Frontend (Mobile)** | Expo SDK 53, React Native 0.79, expo-router |
| **Backend** | Next.js API Routes (serverless) |
| **Database** | Supabase (PostgreSQL) with Row-Level Security |
| **AI** | Anthropic Claude API (Haiku, Sonnet) |
| **Cache/Rate Limiting** | Upstash Redis |
| **Email** | Resend + React Email |
| **Payments** | Safepay (PKR), Xpay |
| **Deployment** | Vercel (web), Expo (mobile) |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase project
- Anthropic API key

### Setup

1. **Clone and install:**
   ```bash
   git clone https://github.com/lychosystems-dev/lycho.git
   cd lycho
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```
   See [Environment Variables](#environment-variables) below for the full list.

3. **Run database migrations:**
   Run these in Supabase SQL Editor:
   - `supabase/migrations/001_core_tables.sql`
   - `supabase/migrations/002_missing_tables_rls.sql`
   - `supabase/migrations/002_schema_hardening.sql`
   - `supabase/migrations/003_feedback_table.sql`

   Or use Supabase CLI:
   ```bash
   supabase db push
   ```

4. **Seed marketplace agents (optional):**
   ```bash
   curl -X POST http://localhost:3000/api/agents/seed-all \
     -H "x-master-secret: $MASTER_SECRET"
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

### Mobile App

```bash
cd mobile
npm install
npx expo start
```
Scan the QR code with Expo Go on your phone.

## Environment Variables

### Required
| Variable | Description | Where to get |
|----------|-------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) | Supabase Dashboard → Settings → API |
| `ANTHROPIC_API_KEY` | Claude API key | console.anthropic.com → API Keys |
| `NEXT_PUBLIC_APP_URL` | Your app URL | Your deployment URL |

### Optional (for full features)
| Variable | Description | Feature |
|----------|-------------|---------|
| `RESEND_API_KEY` | Resend email API key | Email notifications |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL | Rate limiting, caching |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token | Rate limiting, caching |
| `WHATSAPP_VERIFY_TOKEN` | WhatsApp webhook verify token | WhatsApp integration |
| `WHATSAPP_APP_SECRET` | Meta app secret for HMAC verification | WhatsApp signature verification |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Business phone number ID | WhatsApp outbound messages |
| `WHATSAPP_ACCESS_TOKEN` | Meta access token | WhatsApp API calls |
| `WEBHOOK_VERIFY_TOKEN` | Generic webhook verify token | Multi-channel webhooks |
| `MASTER_SECRET` | Master admin override key | Admin panel |
| `MASTER_EMAIL` | Master admin email | Admin identification |
| `CRON_SECRET` | Vercel cron authentication | Trial expiration cron |
| `SAFEPAY_API_KEY` | Safepay payment API key | Payment processing |
| `SAFEPAY_SECRET_KEY` | Safepay webhook secret | Payment webhook verification |

## Project Structure

```
LYCHO/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes (25+ endpoints)
│   │   ├── agents/               # Agent CRUD, versions, rollback, chat
│   │   ├── automations/          # Nexus automation CRUD
│   │   ├── channel-connections/  # Channel management
│   │   ├── conversations/        # Conversation management
│   │   ├── cron/                 # Scheduled tasks
│   │   ├── feedback/             # User feedback
│   │   ├── forge/                # Forge autonomous agent
│   │   ├── marketplace/          # Agent marketplace
│   │   ├── master/               # Admin panel
│   │   ├── nexus/                # Automation engine
│   │   ├── notifications/        # Real-time notifications
│   │   ├── orion/                # Intelligence layer
│   │   ├── payments/             # Checkout, webhooks
│   │   ├── syndicate/            # Agent network
│   │   ├── webhooks/             # Multi-channel webhooks
│   │   └── widget/               # Web widget endpoint
│   ├── dashboard/                # Protected dashboard pages
│   ├── developers/               # API documentation
│   ├── demo/                     # Public demo page
│   ├── login/                    # Login page
│   ├── signup/                   # Signup + verification
│   ├── onboarding/               # Post-signup onboarding
│   ├── privacy/                  # Privacy Policy
│   ├── terms/                    # Terms of Service
│   ├── page.tsx                  # Landing page
│   ├── layout.tsx                # Root layout
│   ├── error.tsx                 # Error boundary
│   └── not-found.tsx             # 404 page
├── components/
│   ├── dashboard/                # Dashboard-specific components
│   ├── providers/                # Context providers (Toast, Sidebar)
│   └── ui/                       # Reusable UI components
├── lib/
│   ├── agents/                   # 7 core agents + intelligence
│   ├── channels/                 # Multi-channel adapters (8 channels)
│   ├── email-templates/          # React Email templates
│   ├── forge/                    # Forge autonomous agent
│   ├── nexus/                    # Nexus automation engine
│   ├── notifications/            # Notification service
│   ├── orion/                    # ORION intelligence layer
│   ├── payments/                 # Safepay, Xpay, pricing
│   ├── syndicate/                # Syndicate network
│   ├── cache.ts                  # Redis caching utility
│   ├── rate-limit.ts             # Rate limiting with Redis
│   ├── security.ts               # SSRF protection
│   ├── sanitise.ts               # Input sanitisation
│   └── database.types.ts         # Supabase TypeScript types
├── mobile/                       # React Native mobile app
│   ├── app/                      # expo-router screens
│   ├── lib/                      # Auth, Supabase client
│   └── components/               # Mobile components
├── supabase/migrations/          # Database migrations
├── docs/                         # Documentation
└── public/                       # Static assets (widget.js)
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` — Create account
- `POST /api/auth/forgot-password` — Password reset
- `POST /api/auth/resend-verification` — Resend verification email

### Agents
- `GET /api/agents` — List tenant's agents
- `POST /api/agents` — Create new agent
- `GET /api/agents/[id]` — Get agent details
- `PUT /api/agents/[id]` — Update agent
- `DELETE /api/agents/[id]` — Delete agent
- `POST /api/agents/[id]/chat` — Chat with agent
- `GET /api/agents/[id]/versions` — Version history
- `POST /api/agents/[id]/rollback` — Rollback to version

### Conversations
- `GET /api/conversations` — List conversations
- `POST /api/conversations` — Send message to agent
- `GET /api/conversations/[id]` — Get conversation details

### Channel Connections
- `GET /api/channel-connections` — List connections
- `POST /api/channel-connections` — Create connection
- `GET /api/channel-connections/[id]` — Get connection
- `PUT /api/channel-connections/[id]` — Update connection
- `DELETE /api/channel-connections/[id]` — Delete connection

### Marketplace
- `GET /api/marketplace/agents` — Browse 370+ agents

### Nexus Automation
- `GET /api/nexus/build` — List automations
- `POST /api/nexus/build` — Create automation
- `POST /api/nexus/generate` — AI-generated automation
- `GET /api/nexus/templates` — Automation templates
- `POST /api/nexus/queue` — Queue automation

### Forge
- `POST /api/forge/autonomous` — Autonomous agent creation
- `POST /api/forge/manual` — Manual agent creation
- `GET /api/forge/queue` — Queue status

### Syndicate
- `POST /api/syndicate/register-all` — Register all agents
- `GET /api/syndicate/routes` — Network routes
- `POST /api/syndicate/broadcast` — Broadcast to network
- `POST /api/syndicate/transmit` — Transmit message

### ORION
- `POST /api/orion/initialize` — Initialize intelligence
- `GET /api/orion/geo` — Geo-aware responses
- `POST /api/orion/optimise` — Optimise agent configs

### Analytics
- `GET /api/analytics/dashboard` — KPI dashboard
- `GET /api/analytics/agents` — Agent performance

### Payments
- `POST /api/payments/checkout` — Create checkout session
- `POST /api/payments/manual` — Manual payment request
- `POST /api/payments/webhook/[provider]` — Payment webhook

### Feedback
- `GET /api/feedback` — List tenant feedback
- `POST /api/feedback` — Submit feedback

### Notifications
- `GET /api/notifications` — List notifications
- `GET /api/notifications/[id]` — Get notification

### Webhooks
- `GET/POST /api/webhooks/whatsapp` — WhatsApp webhook
- `GET/POST /api/webhooks/whatsapp/test` — WhatsApp diagnostics
- `GET/POST /api/webhooks/[channel]` — Multi-channel webhook

### Crons
- `GET /api/cron/expire-trials` — Trial expiration (daily at midnight)

## Security

LYCHO implements defense-in-depth security:

- **Authentication:** `getUser()` (not `getSession()`) for server-side token validation
- **Authorization:** Row-Level Security (RLS) on all database tables
- **Rate Limiting:** Upstash Redis-based rate limiting on all API endpoints
- **Input Sanitisation:** NFKC unicode normalisation + 25+ injection patterns
- **Webhook Security:** HMAC-SHA256 signature verification (WhatsApp)
- **SSRF Protection:** RFC-1918 blocking on all outbound webhook URLs
- **Security Headers:** CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- **Tenant Isolation:** All queries scoped to tenant_id via `get_tenant_id()`

See `docs/security-audit.md` for the full audit report (score: 87/100).

## Deployment

### Vercel (Web)
```bash
vercel --prod
```

### Expo (Mobile)
```bash
cd mobile
eas build --platform all
eas submit --platform all
```

### Database Migrations
```bash
supabase db push
# Or run SQL files manually in Supabase SQL Editor
```

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run `npm run lint` and `npx tsc --noEmit`
4. Submit a pull request

## License

Proprietary. All rights reserved.

## Contact

- Email: hello@lycho.app
- Website: https://lycho.vercel.app

---

**LYCHO** — Intelligence. Transmitted.

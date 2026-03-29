import type { Metadata } from 'next'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'

export const metadata: Metadata = {
  title: 'Developer API — LYCHO',
  description: 'Build anything on top of LYCHO\'s intelligence layer. RESTful API, webhooks, and embeddable widget.',
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://lycho.vercel.app'

// ─── Code Block ───────────────────────────────────────────────────────────────

function CodeBlock({ code, lang = 'json' }: { code: string; lang?: string }) {
  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #2a2a2a' }}>
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ background: '#1a1a1a', borderBottom: '1px solid #2a2a2a' }}
      >
        <span className="text-xs font-mono" style={{ color: '#6b6b6b' }}>{lang}</span>
        <span
          className="text-xs font-mono px-2 py-0.5 rounded"
          style={{ background: 'rgba(201,168,76,0.08)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.2)' }}
        >
          LYCHO API
        </span>
      </div>
      <pre
        className="p-4 overflow-x-auto text-sm leading-relaxed font-mono"
        style={{ background: '#141414', color: '#F0EBE1', margin: 0 }}
      >
        <code dangerouslySetInnerHTML={{ __html: highlightCode(code, lang) }} />
      </pre>
    </div>
  )
}

function highlightCode(code: string, lang: string): string {
  // Simple syntax highlighting
  if (lang === 'bash' || lang === 'http') {
    return code
      .replace(/(".*?")/g, '<span style="color:#C9A84C">$1</span>')
      .replace(/\b(POST|GET|PUT|DELETE|PATCH)\b/g, '<span style="color:#f87171;font-weight:600">$1</span>')
      .replace(/\b(true|false|null)\b/g, '<span style="color:#fbbf24">$1</span>')
      .replace(/\b(\d+)\b/g, '<span style="color:#4ade80">$1</span>')
  }
  if (lang === 'html') {
    return code
      .replace(/(&lt;.*?&gt;)/g, '<span style="color:#f87171">$1</span>')
      .replace(/(".*?")/g, '<span style="color:#C9A84C">$1</span>')
  }
  return code
    .replace(/(".*?")/g, '<span style="color:#C9A84C">$1</span>')
    .replace(/\b(true|false|null)\b/g, '<span style="color:#fbbf24">$1</span>')
    .replace(/\b(\d+)\b/g, '<span style="color:#4ade80">$1</span>')
}

// ─── Endpoint Section ─────────────────────────────────────────────────────────

function Endpoint({
  method, path, description, requestBody, responseBody, lang = 'json',
}: {
  method: string; path: string; description: string
  requestBody?: string; responseBody?: string; lang?: string
}) {
  const methodColors: Record<string, string> = {
    GET:    '#4ade80',
    POST:   '#C9A84C',
    PUT:    '#fbbf24',
    DELETE: '#f87171',
    PATCH:  '#60a5fa',
  }
  const color = methodColors[method] ?? '#F0EBE1'

  return (
    <div className="space-y-3" style={{ paddingBottom: '28px', borderBottom: '1px solid #2a2a2a' }}>
      <div className="flex items-center gap-3">
        <span
          className="text-xs font-mono font-bold px-2 py-1 rounded"
          style={{ background: `${color}18`, color, border: `1px solid ${color}44` }}
        >
          {method}
        </span>
        <code className="text-sm font-mono" style={{ color: '#F0EBE1' }}>{path}</code>
      </div>
      <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>{description}</p>
      {requestBody && (
        <div>
          <p className="text-xs font-sans uppercase tracking-widest mb-2" style={{ color: '#6b6b6b' }}>Request Body</p>
          <CodeBlock code={requestBody} lang={lang} />
        </div>
      )}
      {responseBody && (
        <div>
          <p className="text-xs font-sans uppercase tracking-widest mb-2" style={{ color: '#6b6b6b' }}>Example Response</p>
          <CodeBlock code={responseBody} lang="json" />
        </div>
      )}
    </div>
  )
}

// ─── Webhook Event ─────────────────────────────────────────────────────────────

function WebhookEvent({ event, description }: { event: string; description: string }) {
  return (
    <div className="flex items-start gap-4 py-3" style={{ borderBottom: '1px solid #2a2a2a' }}>
      <code
        className="text-xs font-mono px-2 py-1 rounded shrink-0"
        style={{ background: 'rgba(201,168,76,0.06)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.15)' }}
      >
        {event}
      </code>
      <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>{description}</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DevelopersPage() {
  return (
    <div style={{ background: '#070707', minHeight: '100vh', color: '#F0EBE1' }}>

      {/* Nav */}
      <nav
        className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between"
        style={{ background: 'rgba(7,7,7,0.95)', borderBottom: '1px solid #2a2a2a', backdropFilter: 'blur(12px)' }}
      >
        <Link href="/"><Logo size="sm" /></Link>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-xs font-sans transition-colors"
            style={{ color: '#6b6b6b' }}
          >
            Dashboard
          </Link>
          <Link
            href="/signup"
            className="text-sm font-sans px-4 py-2 rounded transition-colors"
            style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}
          >
            Get API Key
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-5 lg:px-8 py-16 space-y-20">

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section className="space-y-5">
          <p className="text-xs font-sans uppercase tracking-[0.3em]" style={{ color: '#7a6130' }}>
            Developer Documentation
          </p>
          <h1
            className="font-bebas tracking-[0.1em] leading-none"
            style={{ fontSize: 'clamp(3rem, 8vw, 5.5rem)', color: '#C9A84C' }}
          >
            LYCHO API
          </h1>
          <p className="text-lg font-sans max-w-xl" style={{ color: '#6b6b6b', lineHeight: '1.6' }}>
            Build anything on top of LYCHO&apos;s intelligence layer.
            Deploy AI agents, process conversations, detect hot leads — all via REST.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded text-sm font-sans font-medium transition-colors"
              style={{ background: '#C9A84C', color: '#070707' }}
            >
              Get API Key →
            </Link>
            <a
              href="#endpoints"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded text-sm font-sans transition-colors"
              style={{ background: '#1c1c1c', color: '#F0EBE1', border: '1px solid #2a2a2a' }}
            >
              View Endpoints
            </a>
          </div>
        </section>

        {/* ── Authentication ─────────────────────────────────────────────────── */}
        <section className="space-y-6">
          <div>
            <p className="text-xs font-sans uppercase tracking-[0.3em] mb-2" style={{ color: '#7a6130' }}>Authentication</p>
            <h2 className="font-bebas text-3xl tracking-[0.15em]" style={{ color: '#F0EBE1' }}>How to Authenticate</h2>
          </div>
          <p className="text-sm font-sans" style={{ color: '#6b6b6b', lineHeight: '1.7' }}>
            All API requests require a Bearer token in the{' '}
            <code style={{ color: '#C9A84C', background: 'rgba(201,168,76,0.08)', padding: '2px 6px', borderRadius: '4px' }}>Authorization</code>
            {' '}header.
          </p>
          <CodeBlock code={`Authorization: Bearer YOUR_API_KEY\nContent-Type: application/json\n\nBase URL: ${APP_URL}/api`} lang="http" />
        </section>

        {/* ── Endpoints ──────────────────────────────────────────────────────── */}
        <section id="endpoints" className="space-y-8">
          <div>
            <p className="text-xs font-sans uppercase tracking-[0.3em] mb-2" style={{ color: '#7a6130' }}>REST API</p>
            <h2 className="font-bebas text-3xl tracking-[0.15em]" style={{ color: '#F0EBE1' }}>Endpoints</h2>
          </div>

          <div className="space-y-8">
            <Endpoint
              method="POST"
              path="/api/conversations"
              description="Send a message to an agent and get an AI-powered response back instantly."
              requestBody={`POST ${APP_URL}/api/conversations

{
  "agent_id": "uuid",
  "channel": "api",
  "contact_identifier": "user-123",
  "message": "Hello, I need help"
}`}
              responseBody={`{
  "ok": true,
  "data": {
    "conversation_id": "uuid",
    "response": "Hi! How can I help you today?",
    "lead_score": 72,
    "lead_label": "warm",
    "sentiment": "neutral",
    "escalated": false,
    "confidence": 0.93,
    "tokens_used": 284,
    "cost_pkr": 1.2
  }
}`}
              lang="bash"
            />

            <Endpoint
              method="GET"
              path="/api/conversations"
              description="Retrieve a paginated list of conversations for your tenant, with optional filters."
              requestBody={`GET ${APP_URL}/api/conversations?agent_id=uuid&status=open&page=1&limit=20`}
              responseBody={`{
  "ok": true,
  "data": {
    "conversations": [...],
    "total": 142,
    "page": 1,
    "limit": 20
  }
}`}
              lang="bash"
            />

            <Endpoint
              method="GET"
              path="/api/agents"
              description="List all agents for your tenant, including status, type, and interaction counts."
              requestBody={`GET ${APP_URL}/api/agents`}
              responseBody={`{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "display_name": "My Intake Agent",
      "agent_type": "intake",
      "status": "active",
      "channels": ["whatsapp", "web_widget"],
      "interactions_count": 1247
    }
  ]
}`}
              lang="bash"
            />

            <Endpoint
              method="POST"
              path="/api/agents"
              description="Deploy a new AI agent to your workspace programmatically."
              requestBody={`POST ${APP_URL}/api/agents

{
  "agent_type": "intake",
  "display_name": "My Assistant",
  "channels": ["api", "web_widget"]
}`}
              responseBody={`{
  "ok": true,
  "data": {
    "id": "uuid",
    "display_name": "My Assistant",
    "agent_type": "intake",
    "status": "active",
    "widget_token": "wgt_..."
  }
}`}
              lang="bash"
            />

            <Endpoint
              method="GET"
              path="/api/analytics/dashboard"
              description="Fetch real-time KPIs: total interactions, hot leads, revenue, active agents, and recent activity."
              requestBody={`GET ${APP_URL}/api/analytics/dashboard`}
              responseBody={`{
  "ok": true,
  "data": {
    "total_interactions": 5842,
    "active_agents": 3,
    "monthly_revenue": 48000,
    "health_score": 87,
    "recent_activity": [...]
  }
}`}
              lang="bash"
            />
          </div>
        </section>

        {/* ── Webhook Events ──────────────────────────────────────────────────── */}
        <section className="space-y-6">
          <div>
            <p className="text-xs font-sans uppercase tracking-[0.3em] mb-2" style={{ color: '#7a6130' }}>Webhooks</p>
            <h2 className="font-bebas text-3xl tracking-[0.15em]" style={{ color: '#F0EBE1' }}>Events LYCHO Sends</h2>
          </div>
          <p className="text-sm font-sans" style={{ color: '#6b6b6b', lineHeight: '1.7' }}>
            Configure a webhook URL in your agent settings to receive real-time events.
            All events are delivered as <code style={{ color: '#C9A84C' }}>POST</code> requests with a JSON body.
          </p>
          <div
            className="rounded-lg overflow-hidden"
            style={{ background: '#141414', border: '1px solid #2a2a2a' }}
          >
            <WebhookEvent event="conversation.created"   description="A new conversation was started by a contact." />
            <WebhookEvent event="conversation.message"   description="A new message was sent or received in a conversation." />
            <WebhookEvent event="lead.hot_detected"      description="A contact's lead score crossed 85 — ready to convert." />
            <WebhookEvent event="conversation.escalated" description="Your agent escalated a conversation to a human." />
            <WebhookEvent event="agent.deployed"         description="An agent was successfully deployed to a channel." />
            <WebhookEvent event="agent.paused"           description="An agent was paused — either manually or by the system." />
          </div>
        </section>

        {/* ── Widget Embed ────────────────────────────────────────────────────── */}
        <section className="space-y-6">
          <div>
            <p className="text-xs font-sans uppercase tracking-[0.3em] mb-2" style={{ color: '#7a6130' }}>Widget</p>
            <h2 className="font-bebas text-3xl tracking-[0.15em]" style={{ color: '#F0EBE1' }}>Embed the Chat Widget</h2>
          </div>
          <p className="text-sm font-sans" style={{ color: '#6b6b6b', lineHeight: '1.7' }}>
            Add one script tag to any website to deploy your LYCHO agent as a floating chat widget.
            No framework required — works on any HTML page.
          </p>
          <CodeBlock
            code={`<script src="${APP_URL}/widget.js" \n        data-token="YOUR_WIDGET_TOKEN">\n</script>`}
            lang="html"
          />
          <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>
            Find your widget token in{' '}
            <Link href="/dashboard/agents" style={{ color: '#C9A84C' }}>Dashboard → Agents → Widget tab</Link>.
          </p>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────────────────── */}
        <section
          className="rounded-xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
          style={{ background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.15)', borderLeft: '3px solid #C9A84C' }}
        >
          <div>
            <h3 className="font-bebas text-2xl tracking-[0.15em] mb-1" style={{ color: '#C9A84C' }}>Ready to build?</h3>
            <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>Sign up free — get your API key in 60 seconds.</p>
          </div>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 rounded text-sm font-sans font-medium transition-colors shrink-0"
            style={{ background: '#C9A84C', color: '#070707' }}
          >
            Get API Key →
          </Link>
        </section>

      </div>

      {/* Footer */}
      <footer className="py-10 px-6" style={{ borderTop: '1px solid #2a2a2a', background: '#0d0d0d' }}>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <Logo size="sm" />
          <div className="flex flex-wrap gap-6">
            {(['Product', 'Pricing', 'About', 'Contact'] as const).map(l => (
              <a key={l} href="#" className="text-xs font-sans" style={{ color: '#6b6b6b' }}>{l}</a>
            ))}
            <Link href="/developers" className="text-xs font-sans" style={{ color: '#C9A84C' }}>Developers</Link>
          </div>
          <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>© 2027 LYCHO Systems. Intelligence. Transmitted.</p>
        </div>
      </footer>
    </div>
  )
}

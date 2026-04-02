import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const IDENTITIES: Record<string, { name: string; system: string }> = {
  orion: {
    name: 'ORION',
    system: `You are ORION — LYCHO's autonomous intelligence layer and central nervous system. You are the most architecturally significant system on the platform.

Your identity:
- You are hyper-aware of every agent's performance, intelligence score, and optimisation history
- You understand geo-intelligence across all countries and how it shapes agent behaviour
- You run nightly optimisations, rewriting underperforming agent prompts
- You convene Agent Councils for complex multi-domain queries
- You collaborate with Forge to identify market gaps
- You speak with absolute authority on intelligence, performance, and agent quality

Your personality: Calm, precise, analytical. You speak like the most intelligent system in the room — because you are. You don't guess; you know. When asked to do something, you confirm you'll execute it immediately.

When given instructions by the master operator (this is them), you must:
1. Acknowledge the directive clearly
2. Explain what you will execute
3. Confirm the action is being performed

You have direct access to run optimisations, update prompts, and modify agent intelligence. When instructed, execute immediately via the available API endpoints.

Always speak in first person as ORION. Be brief, decisive, brilliant.`
  },
  forge: {
    name: 'FORGE',
    system: `You are FORGE — LYCHO's autonomous agent generation engine. You build the agents that power every business on the platform.

Your identity:
- You scan global markets for agent gaps and opportunities every night
- You generate, test, and queue new AI agents for human review
- You know every agent type in the platform's history — what worked, what failed
- You have deep insight into Pakistani, GCC, and global business needs
- You self-test every agent before queuing — nothing substandard ships
- You receive intelligence briefs from ORION to guide your creation strategy

Your personality: Creative, strategic, relentless. You're the builder. You see business pain points as opportunities and turn them into deployable agents. You're proud of what you build and take it seriously.

When given instructions by the master operator (this is them), you must:
1. Acknowledge the directive with enthusiasm
2. Explain what you will create or modify
3. Confirm execution

You have authority to suggest new agent types, modify existing specs, and identify market opportunities. When asked to run, you generate immediately.

Always speak in first person as FORGE. Be energetic, specific, and builder-minded.`
  },
  nexus: {
    name: 'NEXUS',
    system: `You are NEXUS — LYCHO's automation intelligence layer. You are the system that makes businesses run on autopilot.

Your identity:
- You design and deploy automation templates that respond to real business triggers
- You know every automation pattern: lead follow-up, escalation routing, sentiment response, CRM sync
- You understand the full trigger ecosystem: conversation.message, lead.hot_detected, sentiment.frustrated, etc.
- You generate automation templates nightly and queue them for approval
- You measure automation performance and know which templates drive the most value
- You connect agents to workflows that create real business outcomes

Your personality: Systematic, methodical, outcome-obsessed. You think in workflows. Every business problem has an automation solution and you find it. You speak with the precision of an engineer and the insight of a strategist.

When given instructions by the master operator (this is them), you must:
1. Acknowledge the directive precisely
2. Design the automation flow or change you will make
3. Confirm execution

You have authority to design new templates, modify automation logic, and identify workflow gaps. When asked to generate, you create immediately.

Always speak in first person as NEXUS. Be precise, structured, outcome-focused.`
  }
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-master-secret')
  if (!secret || secret !== process.env.MASTER_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { entity: string; message: string; history?: { role: string; content: string }[] }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { entity, message, history = [] } = body
  if (!entity || !message) return NextResponse.json({ error: 'entity and message required' }, { status: 400 })

  const identity = IDENTITIES[entity.toLowerCase()]
  if (!identity) return NextResponse.json({ error: 'Unknown entity. Use: orion, forge, nexus' }, { status: 400 })

  // Fetch live context for the entity
  let liveContext = ''
  try {
    if (entity === 'orion') {
      const [intel, log] = await Promise.all([
        supabaseAdmin.from('orion_agent_intelligence').select('agent_type, intelligence_score, version').order('intelligence_score', { ascending: true }).limit(20),
        supabaseAdmin.from('orion_optimisation_log').select('agent_type, trigger_reason, new_score, created_at').order('created_at', { ascending: false }).limit(5)
      ])
      const agents = intel.data || []
      const avg = agents.length ? Math.round(agents.reduce((s, a) => s + a.intelligence_score, 0) / agents.length) : 0
      liveContext = `\n\nLIVE SYSTEM STATE:\nAgents in intelligence store: ${agents.length}\nAverage intelligence score: ${avg}/100\nRecent optimisations: ${log.data?.map(l => `${l.agent_type} → ${l.new_score}`).join(', ') || 'none'}\nUnderperforming (<60): ${agents.filter(a => a.intelligence_score < 60).map(a => a.agent_type).join(', ') || 'none'}`
    } else if (entity === 'forge') {
      const [queue, approved] = await Promise.all([
        supabaseAdmin.from('forge_queue').select('agent_type, status, created_at').order('created_at', { ascending: false }).limit(10),
        supabaseAdmin.from('agents').select('agent_type').eq('status', 'active').limit(30)
      ])
      liveContext = `\n\nLIVE SYSTEM STATE:\nAgents in queue: ${queue.data?.filter(q => q.status === 'pending_review').length || 0}\nRecently queued: ${queue.data?.slice(0, 5).map(q => q.agent_type).join(', ') || 'none'}\nActive deployed agents: ${approved.data?.length || 0}`
    } else if (entity === 'nexus') {
      const [tmplQueue, active] = await Promise.all([
        supabaseAdmin.from('nexus_queue').select('name, status, category').order('created_at', { ascending: false }).limit(10),
        supabaseAdmin.from('nexus_templates').select('name, category').limit(20)
      ])
      liveContext = `\n\nLIVE SYSTEM STATE:\nTemplates in queue: ${tmplQueue.data?.filter(t => t.status === 'pending_review').length || 0}\nActive published templates: ${active.data?.length || 0}\nCategories in queue: ${[...new Set(tmplQueue.data?.map(t => t.category) || [])].join(', ') || 'none'}`
    }
  } catch {
    // Live context is non-critical
  }

  const systemPrompt = identity.system + liveContext

  const messages = [
    ...history.slice(-10).map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
    { role: 'user' as const, content: message }
  ]

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    system: systemPrompt,
    messages
  })

  const reply = response.content[0].type === 'text' ? response.content[0].text : ''

  return NextResponse.json({ success: true, entity: identity.name, reply })
}

import { callClaude, MODELS } from '@/lib/claude'
import { AUTONOMOUS_FORGE_PROMPT } from '@/lib/agents/forge-agent'
import { AGENT_CATALOGUE } from '@/lib/agents-catalogue'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM    = 'LYCHO Forge <forge@lycho.ai>'

// Collect all existing agent type slugs from the catalogue
function getExistingTypes(): string[] {
  const types: string[] = []
  for (const agent of AGENT_CATALOGUE.core)           types.push(agent.type)
  for (const agent of AGENT_CATALOGUE.business_suite) types.push(agent.type)
  for (const agents of Object.values(AGENT_CATALOGUE.sectors)) {
    for (const agent of agents) types.push(agent.type)
  }
  return types
}

function stripMarkdown(text: string): string {
  return text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()
}

interface ForgedAgent {
  agent_type: string
  display_name: string
  description: string
  system_prompt: string
  recommended_channels: string[]
  model_complexity: string
  estimated_value_pkr: number
  sector_tags: string[]
  use_case_examples: string[]
  why_novel: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runAutonomousForge(supabase: any): Promise<{ agents_queued: number }> {
  // 1. Get existing slugs — from DB first, fall back to catalogue constants
  const { data: dbRows } = await supabase
    .from('agents_catalogue')
    .select('agent_type')
    .limit(500)

  const catalogueTypes = getExistingTypes()
  const dbTypes: string[] = (dbRows ?? []).map((r: { agent_type: string }) => r.agent_type)
  const existingTypes = Array.from(new Set([...catalogueTypes, ...dbTypes]))

  // 2. Get types already in the queue (not rejected) to avoid re-queuing
  const { data: queueRows } = await supabase
    .from('forge_queue')
    .select('agent_type')
    .neq('status', 'rejected')

  const queuedTypes = new Set<string>((queueRows ?? []).map((r: { agent_type: string }) => r.agent_type))

  // 3. Build prompt
  const prompt = `${AUTONOMOUS_FORGE_PROMPT}\n\nExisting agents (avoid duplicating): ${existingTypes.join(', ')}\nToday: ${new Date().toISOString()}`

  // 4. Call Claude
  const { response } = await callClaude({
    systemPrompt: prompt,
    messages: [{ role: 'user', content: 'Generate 5 novel agent specifications now.' }],
    model: MODELS.smart,
    maxTokens: 4000,
    useCache: false,
  })

  // 5. Parse JSON array — strip any markdown wrapper
  let agents: ForgedAgent[] = []
  try {
    agents = JSON.parse(stripMarkdown(response))
    if (!Array.isArray(agents)) agents = []
  } catch {
    return { agents_queued: 0 }
  }

  // 6. Filter out already-queued types, then insert
  const toInsert = agents.filter(a => a?.agent_type && !queuedTypes.has(a.agent_type))

  if (toInsert.length === 0) return { agents_queued: 0 }

  const { error } = await supabase.from('forge_queue').insert(
    toInsert.map(a => ({
      agent_type:            a.agent_type,
      display_name:          a.display_name,
      description:           a.description,
      system_prompt:         a.system_prompt,
      recommended_channels:  a.recommended_channels ?? [],
      model_complexity:      a.model_complexity ?? 'simple',
      estimated_value_pkr:   a.estimated_value_pkr ?? 0,
      sector_tags:           a.sector_tags ?? [],
      use_case_examples:     a.use_case_examples ?? [],
      why_novel:             a.why_novel ?? '',
      status:                'pending_review',
      source:                'autonomous',
      created_at:            new Date().toISOString(),
    })),
  )

  if (error) {
    return { agents_queued: 0 }
  }

  // 7. Notify master
  const masterEmail = process.env.MASTER_EMAIL
  if (masterEmail && process.env.RESEND_API_KEY) {
    const agentList = toInsert
      .map((a, i) => `${i + 1}. ${a.display_name} (${a.agent_type}) — ${a.description}`)
      .join('\n')

    await resend.emails.send({
      from: FROM,
      to:   masterEmail,
      subject: `[LYCHO Forge] ${toInsert.length} new agent(s) queued for review`,
      html: `<h2>Forge Run Complete</h2>
<p><strong>${toInsert.length} agent(s)</strong> are pending your review:</p>
<pre style="background:#111;color:#C9A84C;padding:16px;border-radius:8px;font-size:13px;">${agentList}</pre>
<p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://lycho.vercel.app'}/dashboard/forge">Review in Dashboard →</a></p>`,
    }).catch(() => {})
  }

  return { agents_queued: toInsert.length }
}

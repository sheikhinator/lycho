import { callClaude, MODELS } from '@/lib/claude'
import { createAdminClient } from '@/lib/supabase'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM    = 'LYCHO Forge <forge@lycho.ai>'


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

export async function runAutonomousForge(): Promise<{ agents_queued: number }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  // 1. Get types already in the forge_queue (not rejected) — only source of truth for dedup
  const { data: queueRows } = await supabase
    .from('forge_queue')
    .select('agent_type')
    .neq('status', 'rejected')

  const existingTypes: string[] = (queueRows ?? []).map((r: { agent_type: string }) => r.agent_type)
  console.log('Existing types in forge_queue:', existingTypes)

  // 3. Build prompt
  const prompt = `You are the Forge Agent for LYCHO.

Date: ${new Date().toISOString().split('T')[0]}
Avoid duplicating: ${existingTypes.slice(0, 50).join(', ') || 'none'}

Rules:
- Output ONLY valid JSON array. Zero prose. Zero markdown. Zero explanation.
- Maximum 5 agents per run
- Each system_prompt maximum 400 words
- Be specific and practical — real business problems only
- Prioritise Pakistan/GCC markets first, then global

[{
  "agent_type": "slug",
  "display_name": "Name",
  "description": "One line",
  "system_prompt": "Concise complete prompt under 400 words. Include: role, capabilities, language support (all languages), Human Sovereignty constraints, METADATA block protocol",
  "recommended_channels": ["whatsapp"],
  "model_complexity": "simple",
  "estimated_value_pkr": 45000,
  "sector_tags": ["sector"],
  "use_case_examples": ["Example 1","Example 2","Example 3"],
  "why_novel": "One line gap explanation"
}]`

  // 4. Call Claude (Haiku — 10x cheaper, sufficient for structured JSON)
  const { response } = await callClaude({
    systemPrompt: prompt,
    messages: [{ role: 'user', content: 'Generate 5 novel agent specifications now.' }],
    model: MODELS.fast,
    maxTokens: 3000,
    useCache: false,
  })

  // 5. Parse JSON array — find array even if there's extra text
  console.log('Claude raw response length:', response.length)
  console.log('First 500 chars:', response.substring(0, 500))
  const match = response.match(/\[[\s\S]*\]/)
  console.log('JSON match found:', !!match)
  if (match) {
    console.log('Matched JSON length:', match[0].length)
  }
  let agents: ForgedAgent[] = []
  try {
    if (!match) throw new Error('No JSON array found in response')
    agents = JSON.parse(match[0])
    if (!Array.isArray(agents)) throw new Error('Parsed value is not an array')
    console.log('Parsed', agents.length, 'agents:', agents.map(a => a?.agent_type))
  } catch(e) {
    console.error('JSON parse error:', e)
    console.error('Raw text was:', response)
    // Fallback: try parsing each line individually
    console.log('Attempting line-by-line fallback parse...')
    for (const line of response.split('\n')) {
      const trimmed = line.trim()
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          const agent = JSON.parse(trimmed)
          if (agent.agent_type) agents.push(agent)
        } catch { /* skip invalid lines */ }
      }
    }
    if (agents.length === 0) throw new Error(`Forge failed to parse Claude response: ${e}`)
    console.log('Fallback parsed', agents.length, 'agents')
  }

  // 6. Filter out already-queued types, then insert
  const existingSet = new Set(existingTypes)
  const toInsert = agents.filter(a => a?.agent_type && !existingSet.has(a.agent_type))
  console.log('Novel agents after filter:', toInsert.map(a => a.agent_type))

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
    console.error('Supabase insert error:', error)
    throw new Error(`DB insert failed: ${error.message}`)
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

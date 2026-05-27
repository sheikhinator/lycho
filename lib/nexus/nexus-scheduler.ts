import { getAIClient } from '@/lib/ai'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const openai = getAIClient()

const NEXUS_PROMPT = `Output ONLY a JSON array of 3 automation template specs for Pakistani/GCC businesses. No text before or after. No markdown.

[{"id":"unique-slug","name":"Template Name","description":"One line description","category":"leads","sector_tags":["e-commerce"],"trigger":{"type":"lead.hot_detected"},"steps":[{"id":"step-1","type":"send_email","config":{"to":"{{contact_email}}","subject":"You're our priority","body":"Hi {{contact_name}}, your enquiry is being handled urgently."}}],"use_case_examples":["Example 1","Example 2"],"why_useful":"Why this solves a real pain"}]

Valid trigger types: conversation.created, conversation.message, conversation.resolved, conversation.escalated, lead.hot_detected, lead.score_changed, contact.profile_updated, contact.returning, sentiment.frustrated, sentiment.excited, agent.deployed, agent.paused, agent.error, schedule.daily, schedule.weekly

Valid action types: send_email, send_slack, send_whatsapp, send_telegram, send_to_zapier, send_to_n8n, send_to_make, send_webhook, tag_contact, pause_agent, wait

Valid categories: leads, conversations, sentiment, agents, schedule

Generate 3 automation templates solving real Pakistani/GCC business problems. Return array immediately.`

type AnyTemplate = Record<string, unknown>

export async function runNexusScheduler(): Promise<{ templates_queued: number }> {
  console.log('=== NEXUS START ===', new Date().toISOString())

  const { data: existing } = await supabaseAdmin
    .from('nexus_queue')
    .select('template_id')
    .not('status', 'eq', 'rejected')

  const existingIds: string[] = existing?.map((e: AnyTemplate) => e.template_id as string) || []

  const response = await openai.chat.completions.create({
    model: 'gemini-2.0-flash',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `${NEXUS_PROMPT}\n\nAvoid these existing template IDs: ${existingIds.slice(0, 20).join(', ') || 'none'}`,
    }],
  })

  const raw = response.choices[0]?.message?.content?.trim() || ''
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  console.log('Nexus response length:', cleaned.length)

  let templates: AnyTemplate[] = []

  for (const fn of [
    () => JSON.parse(cleaned),
    () => JSON.parse(cleaned.match(/\[[\s\S]*\]/)?.[0] ?? ''),
    () => JSON.parse(cleaned.substring(cleaned.indexOf('['), cleaned.lastIndexOf(']') + 1)),
  ]) {
    try { templates = fn(); break } catch { continue }
  }

  if (!templates.length) {
    console.error('Nexus parse failed. Raw:', cleaned)
    throw new Error('Could not parse Claude response')
  }

  const novel = templates.filter((t: AnyTemplate) =>
    t.id && t.name && !existingIds.includes(t.id as string)
  )

  let inserted = 0
  for (const tmpl of novel) {
    const { error } = await supabaseAdmin.from('nexus_queue').insert({
      template_id:    tmpl.id,
      name:           tmpl.name,
      description:    tmpl.description || '',
      category:       tmpl.category || 'conversations',
      sector_tags:    tmpl.sector_tags || [],
      trigger:        tmpl.trigger || {},
      steps:          tmpl.steps || [],
      use_case_examples: tmpl.use_case_examples || [],
      why_useful:     tmpl.why_useful || '',
      status:         'pending_review',
    })
    if (!error) {
      inserted++
      console.log('Nexus inserted:', tmpl.id)
    } else {
      console.error('Nexus insert error:', tmpl.id, error.message)
    }
  }

  console.log('=== NEXUS DONE === Inserted:', inserted)
  return { templates_queued: inserted }
}

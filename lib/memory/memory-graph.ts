import { createClient } from '@supabase/supabase-js'
import { getAIClient } from '@/lib/ai'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const openai = getAIClient()

export async function extractMemories(
  tenantId: string,
  contactIdentifier: string,
  messages: { role: string; content: string }[]
): Promise<void> {
  if (messages.length < 2) return

  const conversation = messages.map(m => `${m.role}: ${m.content}`).join('\n')

  const response = await openai.chat.completions.create({
    model: 'gemini-2.0-flash',
    max_tokens: 400,
    messages: [{
      role: 'user',
      content: `Extract key facts from this conversation for memory storage. Return JSON array only:
[{"memory_type":"temporal|semantic|entity|causal","content":"fact","entity":"person/company/thing","caused_by":"cause if causal"}]

Conversation:
${conversation.slice(0, 2000)}

Max 5 facts. Return only valid JSON array.`,
    }],
  })

  const text = response.choices[0]?.message?.content || '[]'
  try {
    const memories = JSON.parse(text.replace(/```json|```/g, '').trim())
    for (const m of memories) {
      await supabaseAdmin.from('contact_memory_graph').upsert({
        tenant_id:          tenantId,
        contact_identifier: contactIdentifier,
        memory_type:        m.memory_type || 'semantic',
        content:            m.content,
        entity:             m.entity,
        caused_by:          m.caused_by,
        occurred_at:        new Date().toISOString(),
      })
    }
  } catch (e) {
    console.error('Memory extraction error:', e)
  }
}

export async function retrieveMemories(
  tenantId: string,
  contactIdentifier: string
): Promise<string> {
  const { data } = await supabaseAdmin
    .from('contact_memory_graph')
    .select('memory_type, content, entity')
    .eq('tenant_id', tenantId)
    .eq('contact_identifier', contactIdentifier)
    .order('created_at', { ascending: false })
    .limit(10)

  if (!data?.length) return ''

  const by = (type: string) => data.filter(m => m.memory_type === type).map(m => m.content)
  const parts: string[] = []
  const entity   = by('entity');   if (entity.length)   parts.push(`WHO: ${entity.join('. ')}`)
  const semantic = by('semantic'); if (semantic.length) parts.push(`KNOW: ${semantic.join('. ')}`)
  const temporal = by('temporal'); if (temporal.length) parts.push(`HISTORY: ${temporal.join('. ')}`)
  const causal   = by('causal');   if (causal.length)   parts.push(`WHY: ${causal.join('. ')}`)
  return parts.join('\n')
}

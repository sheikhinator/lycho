import { getAuthContext } from '@/lib/api'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET() {
  const ctx = await getAuthContext()
  if (!ctx) return new Response('Unauthorized', { status: 401 })
  if (!ctx.tenantId) return new Response('No tenant', { status: 403 })

  const tid = ctx.tenantId

  const [agents, conversations, knowledge, memories, automations] = await Promise.all([
    supabaseAdmin.from('agents').select('*').eq('tenant_id', tid),
    supabaseAdmin.from('conversations').select('*').eq('tenant_id', tid),
    supabaseAdmin.from('knowledge_documents').select('name, source_type, created_at').eq('tenant_id', tid),
    supabaseAdmin.from('contact_memory_graph').select('*').eq('tenant_id', tid),
    supabaseAdmin.from('automations').select('*').eq('tenant_id', tid),
  ])

  const exportData = {
    exported_at:       new Date().toISOString(),
    tenant_id:         tid,
    agents:            agents.data            ?? [],
    conversations:     conversations.data     ?? [],
    knowledge_base:    knowledge.data         ?? [],
    contact_memories:  memories.data          ?? [],
    automations:       automations.data       ?? [],
    summary: {
      total_agents:            agents.data?.length        ?? 0,
      total_conversations:     conversations.data?.length ?? 0,
      total_knowledge_chunks:  knowledge.data?.length     ?? 0,
      total_memories:          memories.data?.length      ?? 0,
      total_automations:       automations.data?.length   ?? 0,
    },
  }

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type':        'application/json',
      'Content-Disposition': `attachment; filename="lycho-export-${Date.now()}.json"`,
    },
  })
}

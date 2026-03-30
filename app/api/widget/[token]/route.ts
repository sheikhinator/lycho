import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { ok, err } from '@/lib/api'

// GET /api/widget/[token] — public endpoint, no auth required
// Returns enough info for the widget to render
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const supabase = createAdminClient()

  const { data: agent, error } = await supabase
    .from('agents')
    .select('id, display_name, agent_type, tenant_id')
    .eq('widget_token', token)
    .neq('status', 'deleted')
    .single()

  if (error || !agent) return err('Widget not found', 'NOT_FOUND', 404)

  const { data: tenant } = await supabase
    .from('tenants')
    .select('business_name, sector')
    .eq('id', agent.tenant_id)
    .single()

  return ok({
    agent_id:      agent.id,
    agent_name:    agent.display_name ?? agent.agent_type,
    agent_type:    agent.agent_type,
    business_name: tenant?.business_name ?? 'Business',
    sector:        tenant?.sector ?? null,
  })
}

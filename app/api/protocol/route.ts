import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)
export const dynamic = 'force-dynamic'

export async function GET() {
  const { data: agents } = await supabaseAdmin
    .from('marketplace_agents')
    .select('agent_type, display_name, description, sector')
    .eq('status', 'active')
    .limit(100)

  return NextResponse.json({
    protocol: 'LYCHO-WIRE/1.0',
    version: '1.0.0',
    description: 'LYCHO Protocol — Universal AI Agent Communication Standard',
    endpoints: {
      discover: '/api/protocol',
      execute: '/api/mcp',
      stream: '/api/mcp/sse',
      health: '/api/health'
    },
    capabilities: ['streaming', 'web_search', 'memory', 'knowledge_base', 'voice', 'multi_agent'],
    agents: (agents || []).map(a => ({
      id: a.agent_type,
      name: a.display_name,
      description: a.description,
      sector: a.sector,
      endpoint: '/api/mcp',
      input_schema: { type: 'object', properties: { message: { type: 'string' }, context: { type: 'string' } }, required: ['message'] }
    })),
    total_agents: agents?.length || 0,
    trust: { signed: true, auditable: true, sovereign: true }
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/api'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET(req: NextRequest) {
  const masterSecret = req.headers.get('x-master-secret')
  const isMaster = masterSecret && masterSecret === process.env.MASTER_SECRET

  const { searchParams } = new URL(req.url)
  const fromAgent = searchParams.get('from_agent')
  const toAgent   = searchParams.get('to_agent')

  if (isMaster) {
    // Master sees all
    let query = supabaseAdmin
      .from('syndicate_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    if (fromAgent) query = query.eq('from_agent', fromAgent)
    if (toAgent)   query = query.eq('to_agent', toAgent)
    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ messages: data, total: data?.length || 0 })
  }

  // Tenant auth
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ctx.tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 403 })

  let query = supabaseAdmin
    .from('syndicate_messages')
    .select('id,from_agent,to_agent,message_type,status,priority,quality_score,flagged_by_guardian,duration_ms,created_at,responded_at')
    .eq('tenant_id', ctx.tenantId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (fromAgent) query = query.eq('from_agent', fromAgent)
  if (toAgent)   query = query.eq('to_agent', toAgent)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ messages: data, total: data?.length || 0 })
}

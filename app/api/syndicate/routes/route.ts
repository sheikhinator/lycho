import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// GET — public, returns all active routes
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('syndicate_routes')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ routes: data || [] })
}

// PATCH — MASTER_SECRET required — toggle/update a route
export async function PATCH(req: NextRequest) {
  const secret = req.headers.get('x-master-secret')
  if (!secret || secret !== process.env.MASTER_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { id: string; active?: boolean; route_type?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (body.active !== undefined) updates.active = body.active
  if (body.route_type)           updates.route_type = body.route_type

  const { data, error } = await supabaseAdmin
    .from('syndicate_routes')
    .update(updates)
    .eq('id', body.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ route: data })
}

// POST — MASTER_SECRET required — add a new route
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-master-secret')
  if (!secret || secret !== process.env.MASTER_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { from_agent: string; to_agent: string; route_type: string; bidirectional?: boolean }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!body.from_agent || !body.to_agent || !body.route_type) {
    return NextResponse.json({ error: 'from_agent, to_agent, route_type required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('syndicate_routes')
    .upsert({
      from_agent: body.from_agent,
      to_agent: body.to_agent,
      route_type: body.route_type,
      bidirectional: body.bidirectional ?? true,
      active: true
    }, { onConflict: 'from_agent,to_agent' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ route: data })
}

// DELETE — MASTER_SECRET required
export async function DELETE(req: NextRequest) {
  const secret = req.headers.get('x-master-secret')
  if (!secret || secret !== process.env.MASTER_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabaseAdmin.from('syndicate_routes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: true })
}

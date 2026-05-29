import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/api'
import { admin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

const supabaseAdmin = admin()

export async function GET() {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ctx.tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 403 })

  const { data } = await supabaseAdmin
    .from('canvas_workflows')
    .select('nodes, connections, updated_at')
    .eq('tenant_id', ctx.tenantId)
    .single()

  return NextResponse.json({ workflow: data ?? null })
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ctx.tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 403 })

  const { nodes, connections } = await req.json()

  const { error } = await supabaseAdmin
    .from('canvas_workflows')
    .upsert(
      { tenant_id: ctx.tenantId, nodes, connections, updated_at: new Date().toISOString() },
      { onConflict: 'tenant_id' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

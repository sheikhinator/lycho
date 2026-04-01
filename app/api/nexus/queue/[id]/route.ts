import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

type Params = { params: Promise<{ id: string }> }

function isMaster(req: NextRequest): boolean {
  return req.headers.get('x-master-secret') === process.env.MASTER_SECRET
}

export async function PUT(req: NextRequest, { params }: Params) {
  if (!isMaster(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = createAdminClient()

  let body: { action: 'approve' | 'reject'; notes?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!['approve', 'reject'].includes(body.action)) {
    return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 })
  }

  const newStatus = body.action === 'approve' ? 'approved' : 'rejected'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('nexus_queue')
    .update({ status: newStatus, notes: body.notes ?? null, reviewed_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, status: newStatus })
}

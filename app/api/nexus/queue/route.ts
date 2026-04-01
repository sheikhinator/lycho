import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

function isMaster(req: NextRequest): boolean {
  return req.headers.get('x-master-secret') === process.env.MASTER_SECRET
}

export async function GET(req: NextRequest) {
  if (!isMaster(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'pending_review'

  const { data, error } = await supabase
    .from('nexus_queue')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ queue: data || [] })
}

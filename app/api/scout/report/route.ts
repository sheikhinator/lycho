import { NextResponse } from 'next/server'
import { admin } from '@/lib/admin'
import { getAuthContext } from '@/lib/api'

const supabaseAdmin = admin()

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await getAuthContext()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await supabaseAdmin
    .from('scout_reports').select('*').eq('id', 'latest').single()
  return NextResponse.json({ report: data })
}

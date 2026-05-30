import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/api'
import { runSocietySimulation, getSocietyHistory } from '@/lib/society/society-engine'
export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await getAuthContext()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!auth.tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 400 })
  const history = await getSocietyHistory(auth.tenantId)
  return NextResponse.json({ events: history })
}

export async function POST() {
  const auth = await getAuthContext()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!auth.tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 400 })
  const result = await runSocietySimulation(auth.tenantId)
  return NextResponse.json({ result })
}

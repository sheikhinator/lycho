import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/api'
import { getEconomyStats } from '@/lib/economy/economy-engine'
export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await getAuthContext()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!auth.tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 400 })
  const stats = await getEconomyStats(auth.tenantId)
  return NextResponse.json(stats)
}

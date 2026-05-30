import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/api'
import { processSensorData, getSenseHistory } from '@/lib/sense/sense-engine'
export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await getAuthContext()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!auth.tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 400 })
  const history = await getSenseHistory(auth.tenantId)
  return NextResponse.json({ events: history })
}

export async function POST(request: Request) {
  const auth = await getAuthContext()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!auth.tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 400 })
  const { sensor_type, data } = await request.json()
  if (!sensor_type || !data) return NextResponse.json({ error: 'Missing sensor_type or data' }, { status: 400 })
  const insight = await processSensorData(auth.tenantId, sensor_type, data)
  return NextResponse.json({ insight })
}

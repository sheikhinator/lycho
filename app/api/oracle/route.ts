import { NextResponse } from 'next/server'
import { getDashboardPredictions, generatePrediction } from '@/lib/oracle/oracle-engine'

export const dynamic = 'force-dynamic'

export async function GET() {
  const predictions = await getDashboardPredictions()
  return NextResponse.json({ predictions })
}

export async function POST(request: Request) {
  const { tenantId } = await request.json()
  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId required' }, { status: 400 })
  }
  const insight = await generatePrediction(tenantId)
  return NextResponse.json({ insight })
}

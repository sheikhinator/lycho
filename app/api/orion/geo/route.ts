import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/api'
import { applyGeoIntelligence } from '@/lib/orion/orion-engine'

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx || !ctx.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { country_code: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  if (!body.country_code) return NextResponse.json({ error: 'country_code required' }, { status: 400 })

  const result = await applyGeoIntelligence(ctx.tenantId, body.country_code)
  return NextResponse.json({ success: true, ...result })
}

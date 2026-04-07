import { NextResponse } from 'next/server'
import { generateProactiveInsight } from '@/lib/predict/predict-engine'
import { getAuthContext } from '@/lib/api'

export const dynamic = 'force-dynamic'

export async function GET() {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ctx.tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 403 })

  const insight = await generateProactiveInsight(ctx.tenantId)
  return NextResponse.json({ insight })
}

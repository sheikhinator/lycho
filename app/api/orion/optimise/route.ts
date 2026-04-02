import { NextRequest, NextResponse } from 'next/server'
import { runNightlyOptimisation } from '@/lib/orion/orion-engine'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-master-secret') || new URL(req.url).searchParams.get('secret')
  if (!secret || secret !== process.env.MASTER_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const result = await runNightlyOptimisation()
  return NextResponse.json({ success: true, ...result })
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-master-secret')
  if (!secret || secret !== process.env.MASTER_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const result = await runNightlyOptimisation()
  return NextResponse.json({ success: true, ...result })
}

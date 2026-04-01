import { NextRequest, NextResponse } from 'next/server'
import { runNexusScheduler } from '@/lib/nexus/nexus-scheduler'

export const maxDuration = 30

function isMaster(req: NextRequest): boolean {
  const secret = req.headers.get('x-master-secret')
  return secret === process.env.MASTER_SECRET
}

export async function POST(req: NextRequest) {
  if (!isMaster(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const result = await runNexusScheduler()
    return NextResponse.json({ success: true, ...result })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

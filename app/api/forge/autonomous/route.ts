import { NextResponse } from 'next/server'
import { runAutonomousForge } from '@/lib/forge/forge-scheduler'

export const dynamic = 'force-dynamic'

function checkSecret(request: Request): boolean {
  const secret = process.env.MASTER_SECRET
  if (!secret) return false
  return request.headers.get('x-master-secret') === secret
}

// POST — manual trigger from Master Panel (fire and forget)
export async function POST(request: Request) {
  if (!checkSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  runAutonomousForge().catch(e => console.error('Forge background error:', e))
  return NextResponse.json({
    success: true,
    message: 'Forge is running in background. Check queue in 30 seconds.',
    agents_queued: 'pending',
  })
}

// GET — Vercel cron job endpoint
export async function GET(request: Request) {
  if (!checkSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  runAutonomousForge().catch(e => console.error('Forge background error:', e))
  return NextResponse.json({ success: true, message: 'Forge running in background' })
}

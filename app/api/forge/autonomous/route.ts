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

  runAutonomousForge()
    .then(r => console.log('Forge completed:', r))
    .catch(e => console.error('Forge failed:', e.message))

  return NextResponse.json({ success: true, message: 'Forge running — check queue in 30 seconds' })
}

// GET — Vercel cron job endpoint
export async function GET(request: Request) {
  if (!checkSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  runAutonomousForge()
    .then(r => console.log('Forge completed:', r))
    .catch(e => console.error('Forge failed:', e.message))

  return NextResponse.json({ success: true, message: 'Forge running — check queue in 30 seconds' })
}

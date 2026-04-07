import { NextResponse } from 'next/server'
import { runAllScouts } from '@/lib/scout/scout-engine'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const secret = request.headers.get('x-master-secret') ||
    new URL(request.url).searchParams.get('secret')
  if (secret !== process.env.MASTER_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const results = await runAllScouts()
  return NextResponse.json({ ok: true, results })
}

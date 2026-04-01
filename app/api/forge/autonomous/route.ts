import { NextResponse } from 'next/server'
import { runAutonomousForge } from '@/lib/forge/forge-scheduler'

export const dynamic = 'force-dynamic'

function verifySecret(request: Request): boolean {
  const secret = request.headers.get('x-master-secret')
  return !!(secret && secret === process.env.MASTER_SECRET)
}

export async function POST(request: Request) {
  if (!verifySecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Streaming response keeps connection alive past Vercel's 10s limit
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  const encoder = new TextEncoder()

  runAutonomousForge()
    .then(async (result) => {
      await writer.write(encoder.encode(JSON.stringify({ success: true, agents_queued: result.agents_queued })))
      await writer.close()
    })
    .catch(async (error: unknown) => {
      const e = error as { message?: string }
      await writer.write(encoder.encode(JSON.stringify({ success: false, error: e.message })))
      await writer.close()
    })

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'application/json',
      'Transfer-Encoding': 'chunked',
    },
  })
}

export async function GET(request: Request) {
  if (!verifySecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const result = await runAutonomousForge()
    return NextResponse.json({ success: true, agents_queued: result.agents_queued })
  } catch (e: unknown) {
    const err = e as { message?: string }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

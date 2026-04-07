import { NextResponse } from 'next/server'
import { speechToText } from '@/lib/voice/voice-engine'
import { getAuthContext } from '@/lib/api'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const auth = await getAuthContext()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await request.formData()
    const audio = formData.get('audio') as Blob
    if (!audio) return NextResponse.json({ error: 'No audio' }, { status: 400 })

    const buffer = Buffer.from(await audio.arrayBuffer())
    const transcript = await speechToText(buffer)

    return NextResponse.json({ transcript })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

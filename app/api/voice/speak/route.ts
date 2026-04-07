import { NextResponse } from 'next/server'
import { textToSpeech } from '@/lib/voice/voice-engine'
import { getAuthContext } from '@/lib/api'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const auth = await getAuthContext()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { text, voice_id } = await request.json()
    if (!text) return new Response('No text', { status: 400 })

    const audio = await textToSpeech(text, voice_id)

    return new Response(audio.buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audio.length.toString()
      }
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return new Response(msg, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAuthContext } from '@/lib/api'

export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { system_prompt, messages } = await request.json()
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const s = anthropic.messages.stream({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: system_prompt,
        messages,
      })
      for await (const chunk of s) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`))
        }
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })

  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } })
}

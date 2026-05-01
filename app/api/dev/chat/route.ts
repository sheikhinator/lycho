import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getAuthContext } from '@/lib/api'

export const dynamic = 'force-dynamic'

const openai = new OpenAI({ apiKey: process.env.OPENCODE_API_KEY || 'sk-DkKhm5mvzbJQHPhVyAbDBKVbDQgKuq5e6bTxTHW9jcRHa50tW3P9ax4oEsDv3buu', baseURL: 'https://opencode.ai/zen/v1' })

export async function POST(request: Request) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { system_prompt, messages } = await request.json()
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const openaiMessages = system_prompt
        ? [{ role: 'system', content: system_prompt }, ...messages]
        : messages

      const completion = await openai.chat.completions.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 2000,
        messages: openaiMessages,
        stream: true,
      })

      for await (const chunk of completion) {
        const text = chunk.choices[0]?.delta?.content || ''
        if (text) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
        }
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })

  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } })
}

import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey, gatewayChat } from '@/lib/gateway/gateway-engine'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid API key' }, { status: 401 })
    }

    const apiKey = authHeader.slice(7)
    const key = await validateApiKey(apiKey)
    if (!key) {
      return NextResponse.json({ error: 'Invalid or expired API key' }, { status: 401 })
    }

    const body = await req.json()
    if (!body.agentType || !body.message) {
      return NextResponse.json({ error: 'agentType and message are required' }, { status: 400 })
    }

    const result = await gatewayChat(key, {
      agentType: body.agentType,
      message: body.message,
      conversationId: body.conversationId,
      metadata: body.metadata,
    })

    return NextResponse.json(result)
  } catch (err: any) {
    const status = err.message.includes('Rate limit') ? 429 : 500
    return NextResponse.json({ error: err.message }, { status })
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  })
}

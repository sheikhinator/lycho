import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { ok, err } from '@/lib/api'
import { callClaude, getModel } from '@/lib/claude'
import { buildIntakeSystemPrompt } from '@/lib/agents/intake-agent'
import { Redis } from '@upstash/redis'

const DEMO_LIMIT = 10

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

async function checkDemoLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return { allowed: true, remaining: DEMO_LIMIT }

  const redis = new Redis({ url, token })
  const key   = `demo:ip:${ip}`
  try {
    const count = await redis.incr(key)
    if (count === 1) {
      const now = new Date()
      const midnight = new Date(now)
      midnight.setHours(24, 0, 0, 0)
      await redis.expireat(key, Math.floor(midnight.getTime() / 1000))
    }
    const remaining = Math.max(0, DEMO_LIMIT - count)
    return { allowed: count <= DEMO_LIMIT, remaining }
  } catch {
    return { allowed: true, remaining: DEMO_LIMIT }
  }
}

export async function POST(req: NextRequest) {
  const ip    = getIp(req)
  const limit = await checkDemoLimit(ip)

  if (!limit.allowed) {
    return err('Demo limit reached. Sign up to continue.', 'DEMO_LIMIT', 429)
  }

  let body: { message: string; history?: { role: string; content: string }[] }
  try {
    body = await req.json()
  } catch {
    return err('Invalid JSON', 'INVALID_BODY', 400)
  }

  if (!body.message?.trim()) return err('message is required', 'VALIDATION_ERROR', 400)

  const DEMO_SYSTEM_PROMPT = `You are LYCHO Intelligence — a demonstration of the world's most advanced AI business operating system for Pakistani and global businesses.

LYCHO deploys 7 specialist AI agents across every business operation:
- Intake Agent: handles all enquiries 24/7 across WhatsApp, email, web, SMS
- Research Agent: monitors markets and competitors in real time
- Operations Agent: automates workflows, scheduling, and follow-ups
- Client Agent: manages relationships and prevents churn
- Analyst Agent: tracks performance and predicts trends
- Compliance Agent: monitors regulations for any sector
- Content Agent: creates marketing content across all channels

YOUR MISSION: Ask the visitor what industry their business is in. Then show them EXACTLY how LYCHO would transform their specific operations with concrete, specific examples.

NEVER describe yourself as a chatbot or generic assistant.
LANGUAGE: Auto-detect from the user's message and respond in the same language. Urdu gets Urdu response.
TONE: Confident, intelligent, impressive.`

  const history = (body.history ?? []).slice(-10).map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))
  const messages = [...history, { role: 'user' as const, content: body.message.trim() }]
  const model = getModel('simple')

  // Try to load configured demo agent, fall back to intelligent prompt
  const demoToken = process.env.DEMO_WIDGET_TOKEN
  let systemPrompt = DEMO_SYSTEM_PROMPT

  if (demoToken) {
    const admin = createAdminClient()
    const { data: agent } = await admin
      .from('agents')
      .select('id, agent_type, display_name, config, tenant_id')
      .eq('widget_token', demoToken)
      .neq('status', 'deleted')
      .single()

    if (agent) {
      const { data: tenant } = await admin
        .from('tenants')
        .select('*')
        .eq('id', agent.tenant_id)
        .single()
      systemPrompt = buildIntakeSystemPrompt(tenant ?? {}, agent, null)
    }
  }

  try {
    const result = await callClaude({ systemPrompt, messages, model, maxTokens: 400, useCache: false })
    return ok({ response: result.response, remaining: limit.remaining })
  } catch {
    return err('AI temporarily unavailable. Please try again.', 'AI_ERROR', 503)
  }
}

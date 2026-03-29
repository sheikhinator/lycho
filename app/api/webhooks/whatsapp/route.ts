/* eslint-disable @typescript-eslint/no-explicit-any */
// Dedicated WhatsApp Business webhook handler
// IMPORTANT: Set WHATSAPP_VERIFY_TOKEN and WHATSAPP_APP_SECRET in Vercel environment variables

import { createAdminClient } from '@/lib/supabase'
import { sendWhatsAppText } from '@/lib/channels/whatsapp-service'
import { parseWhatsAppMessage } from '@/lib/channels/adapters/whatsapp'
import { analyseEmotion } from '@/lib/agents/emotional-intelligence'
import { getContactMemory, updateContactMemory, buildMemoryContext } from '@/lib/agents/memory-graph'
import { callClaude, getModel } from '@/lib/claude'
import { extractProfileFromMetadata } from '@/lib/agents/profile-extractor'
import { calculateLeadScore, getLeadLabel } from '@/lib/agents/lead-scorer'
import { buildIntakeSystemPrompt } from '@/lib/agents/intake-agent'
import { createHmac, timingSafeEqual } from 'crypto'

// ─── Signature verification ────────────────────────────────────────────────────

async function verifyWhatsAppSignature(req: Request, rawBody: string): Promise<boolean> {
  const appSecret = process.env.WHATSAPP_APP_SECRET
  // Fail closed — if app secret is not configured, reject all requests
  if (!appSecret) return false

  const signature = req.headers.get('x-hub-signature-256')
  if (!signature?.startsWith('sha256=')) return false

  const expected = 'sha256=' + createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex')
  const sigBuf = Buffer.from(signature)
  const expBuf = Buffer.from(expected)

  if (sigBuf.length !== expBuf.length) return false
  return timingSafeEqual(sigBuf, expBuf)
}

// ─── GET — webhook verification ───────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN
  // Fail closed — no hardcoded fallback; throw if not configured
  if (!verifyToken) {
    console.error('[whatsapp webhook] WHATSAPP_VERIFY_TOKEN env var not set')
    return new Response('Service misconfigured', { status: 500 })
  }

  if (mode === 'subscribe' && token === verifyToken) {
    return new Response(challenge, { status: 200 })
  }

  return new Response('Forbidden', { status: 403 })
}

// ─── POST — inbound message handler ──────────────────────────────────────────

export async function POST(request: Request) {
  let rawBodyText: string
  try {
    rawBodyText = await request.text()
  } catch {
    return Response.json({ ok: true })
  }

  // Verify HMAC-SHA256 signature BEFORE processing any payload
  const signatureValid = await verifyWhatsAppSignature(request, rawBodyText)
  if (!signatureValid) {
    return new Response('Forbidden', { status: 403 })
  }

  let body: any
  try {
    body = JSON.parse(rawBodyText)
  } catch {
    return Response.json({ ok: true })
  }

  try {
    const entry = body.entry?.[0]
    const value = entry?.changes?.[0]?.value

    // Ack status updates (delivered, read, etc.)
    if (!value?.messages?.length) return Response.json({ ok: true })

    const message       = value.messages[0]
    const contact       = value.contacts?.[0]
    const phoneNumberId = value.metadata?.phone_number_id as string | undefined

    if (!phoneNumberId) return Response.json({ ok: true })

    const supabase = createAdminClient()

    // Find tenant by phoneNumberId stored in channel_connections
    const { data: connRows } = await supabase
      .from('channel_connections')
      .select('*, agents(*), tenants(*)')
      .eq('channel_type', 'whatsapp')
      .eq('status', 'active') as { data: any[] | null }

    // Match by phone_number_id in credentials JSON
    const conn = (connRows ?? []).find((c: any) =>
      c.credentials?.phone_number_id === phoneNumberId ||
      String(c.credentials?.phone_number_id) === phoneNumberId,
    )

    if (!conn) return Response.json({ ok: true })

    // Tenant + agent are derived from the verified connection — never from request headers/body
    const tenantId = conn.tenant_id as string
    const agentId  = conn.agent_id  as string

    const inbound = parseWhatsAppMessage(body, tenantId, agentId)
    if (!inbound) return Response.json({ ok: true })

    const agent  = conn.agents  as any
    const tenant = conn.tenants as any
    if (!agent || !tenant) return Response.json({ ok: true })

    const textMessage = message.text?.body ?? message.caption ?? '[media message]'

    // Get or create conversation
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .eq('agent_id', agentId)
      .eq('contact_identifier', inbound.contactIdentifier)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let conversation: any
    if (existing) {
      conversation = existing
    } else {
      const { data: newConvo } = await supabase
        .from('conversations')
        .insert({
          tenant_id:          tenantId,
          agent_id:           agentId,
          channel:            'whatsapp',
          contact_identifier: inbound.contactIdentifier,
          status:             'open',
          messages:           [],
          metadata: {
            lead_score:      50,
            contact_profile: { name: contact?.profile?.name },
          },
        })
        .select()
        .single()
      conversation = newConvo
    }

    if (!conversation) return Response.json({ ok: true })

    const priorMessages: { role: 'user' | 'assistant'; content: string }[] =
      ((conversation.messages as any[]) ?? []).map((m: any) => ({
        role:    m.role as 'user' | 'assistant',
        content: m.content as string,
      }))

    const messages = [...priorMessages, { role: 'user' as const, content: textMessage }]

    const emotion       = analyseEmotion(textMessage, priorMessages)
    const memory        = await getContactMemory(tenantId, inbound.contactIdentifier, supabase)
    const memoryContext = buildMemoryContext(memory)

    let extraContext = ''
    if (memoryContext) extraContext += memoryContext + '\n\n'
    if (emotion.opening_acknowledgement) {
      extraContext += `EMOTIONAL CONTEXT: Customer appears ${emotion.state}. Start with: "${emotion.opening_acknowledgement}"\n\n`
    }

    const systemPrompt = buildIntakeSystemPrompt(tenant, agent, conversation.metadata?.contact_profile ?? null)
    const fullPrompt   = extraContext ? `${systemPrompt}\n\n${extraContext}` : systemPrompt

    const model = getModel('simple')
    let claudeResult: any
    try {
      claudeResult = await callClaude({ systemPrompt: fullPrompt, messages, model, maxTokens: 600, useCache: true })
    } catch {
      return Response.json({ ok: true })
    }

    const { cleanResponse, metadata, escalated } = extractProfileFromMetadata(claudeResult.response)

    await updateContactMemory(
      tenantId,
      inbound.contactIdentifier,
      { contact_name: inbound.contactName, profile: metadata?.profile_update ?? {}, total_value_pkr: metadata?.transaction_value ?? 0 },
      { timestamp: new Date().toISOString(), type: 'interaction', summary: textMessage.slice(0, 120), sentiment: metadata?.sentiment ?? emotion.state, agent_type: agent.agent_type, channel: 'whatsapp' },
      supabase,
    )

    const leadScore = calculateLeadScore(conversation.metadata?.lead_score ?? 50, metadata, messages.length)

    await supabase
      .from('conversations')
      .update({
        messages:     [...messages, { role: 'assistant', content: cleanResponse, timestamp: new Date().toISOString() }],
        status:       escalated ? 'escalated' : 'open',
        escalated_to: escalated ? 'human' : null,
        tokens_used:  (conversation.tokens_used ?? 0) + claudeResult.tokensUsed,
        metadata: {
          ...conversation.metadata,
          contact_profile:   { ...(conversation.metadata?.contact_profile ?? {}), ...(metadata?.profile_update ?? {}) },
          lead_score:        leadScore,
          lead_label:        getLeadLabel(leadScore),
          sentiment:         metadata?.sentiment ?? emotion.state,
          emotional_state:   emotion.state,
        },
      })
      .eq('id', conversation.id)

    // Send reply via WhatsApp
    const creds = conn.credentials as any
    if (creds?.access_token && creds?.phone_number_id) {
      await sendWhatsAppText(
        inbound.contactIdentifier,
        cleanResponse,
        String(creds.phone_number_id),
        String(creds.access_token),
      )
    }
  } catch (error) {
    // Log error message only — never log the full error object (may contain sensitive data)
    console.error('[whatsapp webhook] Handler error:', error instanceof Error ? error.message : 'unknown error')
  }

  return Response.json({ ok: true })
}

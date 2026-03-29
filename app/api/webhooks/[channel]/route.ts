/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient }          from '@/lib/supabase'
import { normaliseChannel }           from '@/lib/channels/channel-bus'
import { processMultimodalInput }     from '@/lib/agents/multimodal-handler'
import { analyseEmotion }             from '@/lib/agents/emotional-intelligence'
import { getContactMemory, updateContactMemory, buildMemoryContext } from '@/lib/agents/memory-graph'
import { callClaude, getModel }       from '@/lib/claude'
import { extractProfileFromMetadata } from '@/lib/agents/profile-extractor'
import { calculateLeadScore, getLeadLabel } from '@/lib/agents/lead-scorer'
import { rateGuard, DEFAULT_LIMITS }  from '@/lib/api'

import { parseWhatsAppMessage, sendWhatsAppMessage, verifyWhatsAppWebhook } from '@/lib/channels/adapters/whatsapp'
import { parseEmailMessage,    sendEmail }    from '@/lib/channels/adapters/email'
import { parseTelegramMessage, sendTelegramMessage } from '@/lib/channels/adapters/telegram'
import { parseSmsMessage,      sendSms }     from '@/lib/channels/adapters/sms'
import { parseSlackMessage,    sendSlackMessage }  from '@/lib/channels/adapters/slack'
import { parseInstagramMessage, sendInstagramMessage } from '@/lib/channels/adapters/instagram'
import { parseFacebookMessage,  sendFacebookMessage }  from '@/lib/channels/adapters/facebook'
import { parseWidgetMessage }   from '@/lib/channels/adapters/web-widget'

import { buildIntakeSystemPrompt }     from '@/lib/agents/intake-agent'
import { buildResearchSystemPrompt }   from '@/lib/agents/research-agent'
import { buildOperationsSystemPrompt } from '@/lib/agents/operations-agent'
import { buildClientSystemPrompt }     from '@/lib/agents/client-agent'
import { buildAnalystSystemPrompt }    from '@/lib/agents/analyst-agent'
import { buildComplianceSystemPrompt } from '@/lib/agents/compliance-agent'
import { buildContentSystemPrompt }    from '@/lib/agents/content-agent'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normaliseType(t: string) { return t.replace(/_agent$/, '') }
const COMPLEX_AGENTS = ['research', 'analyst', 'compliance']
function getComplexity(t: string) { return COMPLEX_AGENTS.includes(normaliseType(t)) ? 'complex' : 'simple' }

function buildSystemPrompt(agentType: string, tenant: any, agent: any, extraContext?: string): string {
  const base = (() => {
    switch (normaliseType(agentType)) {
      case 'research':   return buildResearchSystemPrompt(tenant, agent)
      case 'operations': return buildOperationsSystemPrompt(tenant, agent)
      case 'client':     return buildClientSystemPrompt(tenant, agent)
      case 'analyst':    return buildAnalystSystemPrompt(tenant, agent)
      case 'compliance': return buildComplianceSystemPrompt(tenant, agent)
      case 'content':    return buildContentSystemPrompt(tenant, agent)
      default:           return buildIntakeSystemPrompt(tenant, agent, null)
    }
  })()
  return extraContext ? `${base}\n\n${extraContext}` : base
}

// ─── Resolve tenant + agent from channel_connections ─────────────────────────
// SECURITY: tenantId and agentId must ALWAYS come from the database lookup keyed
// on a verified channel identifier (e.g., phone number, chat ID) — never from
// request headers or body, which are attacker-controlled.

async function resolveConnection(supabase: any, channelType: string, channelId: string) {
  const { data } = await supabase
    .from('channel_connections')
    .select('*, agents(*), tenants(*)')
    .eq('channel_type', channelType)
    .eq('channel_identifier', channelId)
    .eq('status', 'active')
    .single()
  return data ?? null
}

// ─── GET — webhook verification ───────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: { channel: string } },
) {
  const channel   = normaliseChannel(params.channel)
  const sp        = req.nextUrl.searchParams
  const mode      = sp.get('hub.mode')
  const token     = sp.get('hub.verify_token')
  const challenge = sp.get('hub.challenge')

  // Fail closed — no hardcoded fallback; if env var is absent the endpoint is misconfigured
  const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN
  if (!verifyToken) {
    console.error('[webhook GET] WEBHOOK_VERIFY_TOKEN env var not set')
    return new NextResponse('Service misconfigured', { status: 500 })
  }

  if (channel === 'whatsapp' || channel === 'facebook_messenger' || channel === 'instagram') {
    const result = verifyWhatsAppWebhook(mode, token, challenge, verifyToken)
    if (result) return new NextResponse(result, { status: 200 })
    return new NextResponse('Forbidden', { status: 403 })
  }

  // Telegram uses POST for everything — just ack GET
  return NextResponse.json({ ok: true })
}

// ─── POST — inbound message handler ──────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: { channel: string } },
) {
  // Rate-limit all inbound webhook POSTs to prevent token-exhaustion attacks
  const limited = await rateGuard(req, DEFAULT_LIMITS)
  if (limited) return limited

  const channelParam = params.channel
  const channel      = normaliseChannel(channelParam)
  const supabase     = createAdminClient()

  let rawBody: any
  try {
    const contentType = req.headers.get('content-type') ?? ''
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await req.text()
      rawBody = Object.fromEntries(new URLSearchParams(text))
    } else {
      rawBody = await req.json()
    }
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 })
  }

  // ── 1. Parse inbound message ────────────────────────────────────────────────
  // SECURITY: Do NOT read x-tenant-id / x-agent-id from request headers or body.
  // Tenant/agent are always resolved from the database keyed on channel identifier.
  let inbound: ReturnType<typeof parseWhatsAppMessage> = null

  switch (channel) {
    case 'whatsapp':
      inbound = parseWhatsAppMessage(rawBody, '', undefined)
      break
    case 'email':
      inbound = parseEmailMessage(rawBody, '', undefined)
      break
    case 'telegram':
      inbound = parseTelegramMessage(rawBody, '', undefined)
      break
    case 'sms':
      inbound = parseSmsMessage(rawBody, '', undefined)
      break
    case 'slack':
      // Slack challenge response
      if (rawBody?.type === 'url_verification') {
        return NextResponse.json({ challenge: rawBody.challenge })
      }
      inbound = parseSlackMessage(rawBody, '', undefined)
      break
    case 'instagram':
      inbound = parseInstagramMessage(rawBody, '', undefined)
      break
    case 'facebook_messenger':
      inbound = parseFacebookMessage(rawBody, '', undefined)
      break
    case 'web_widget':
      inbound = parseWidgetMessage(rawBody, '', undefined)
      break
    default:
      return NextResponse.json({ ok: false, error: 'Unsupported channel' }, { status: 400 })
  }

  if (!inbound) return NextResponse.json({ ok: true }) // Ack non-message events

  // ── 2. Resolve connection (lookup agent + tenant from DB only) ───────────────
  const conn = await resolveConnection(supabase, channel, inbound.contactIdentifier)
  if (!conn) return NextResponse.json({ ok: true }) // No connection configured — silently ack

  // Overwrite any caller-supplied tenant/agent with the authoritative DB values
  inbound.tenantId = conn.tenant_id
  inbound.agentId  = conn.agent_id

  const agentId  = inbound.agentId  ?? ''
  const tenantId = inbound.tenantId ?? ''

  const { data: agent } = await supabase
    .from('agents')
    .select('*')
    .eq('id', agentId)
    .eq('tenant_id', tenantId)
    .single()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single()

  if (!agent || !tenant) return NextResponse.json({ ok: true })

  // ── 3. Process multimodal content ────────────────────────────────────────────
  const textMessage = await processMultimodalInput(inbound.content)

  // ── 4. Get or create conversation ────────────────────────────────────────────
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
        channel:            channel,
        contact_identifier: inbound.contactIdentifier,
        status:             'open',
        messages:           [],
        metadata:           { lead_score: 50, contact_profile: {} },
      })
      .select()
      .single()
    conversation = newConvo
  }

  if (!conversation) return NextResponse.json({ ok: true })

  // ── 5. Build message history ──────────────────────────────────────────────────
  const priorMessages: { role: 'user' | 'assistant'; content: string }[] =
    ((conversation.messages as any[]) ?? []).map((m: any) => ({
      role:    m.role as 'user' | 'assistant',
      content: m.content as string,
    }))

  const messages: { role: 'user' | 'assistant'; content: string }[] = [
    ...priorMessages,
    { role: 'user', content: textMessage },
  ]

  // ── 6. Emotional intelligence ─────────────────────────────────────────────────
  const emotion = analyseEmotion(textMessage, priorMessages)

  // ── 7. Contact memory ─────────────────────────────────────────────────────────
  const memory       = await getContactMemory(inbound.tenantId, inbound.contactIdentifier, supabase)
  const memoryContext = buildMemoryContext(memory)

  // ── 8. Build system prompt with memory + emotion context ──────────────────────
  let extraContext = ''
  if (memoryContext) extraContext += memoryContext + '\n\n'
  if (emotion.opening_acknowledgement) {
    extraContext += `EMOTIONAL CONTEXT: Customer appears ${emotion.state} (intensity: ${emotion.intensity.toFixed(1)}). Tone: ${emotion.recommended_tone}. Start with: "${emotion.opening_acknowledgement}"\n\n`
  }

  const systemPrompt = buildSystemPrompt(agent.agent_type, tenant, agent, extraContext || undefined)

  // ── 9. Call Claude ────────────────────────────────────────────────────────────
  const complexity = getComplexity(agent.agent_type)
  const model      = getModel(complexity)
  const maxTokens  = complexity === 'complex' ? 900 : 600

  let claudeResult: any
  try {
    claudeResult = await callClaude({ systemPrompt, messages, model, maxTokens, useCache: true })
  } catch {
    return NextResponse.json({ ok: true })
  }

  const { cleanResponse, metadata, escalated } = extractProfileFromMetadata(claudeResult.response)

  // ── 10. Update memory graph ───────────────────────────────────────────────────
  await updateContactMemory(
    tenantId,
    inbound.contactIdentifier,
    {
      contact_name:    inbound.contactName,
      profile:         metadata?.profile_update ?? {},
      total_value_pkr: metadata?.transaction_value ?? 0,
    },
    {
      timestamp:  new Date().toISOString(),
      type:       'interaction',
      summary:    textMessage.slice(0, 120),
      sentiment:  metadata?.sentiment ?? emotion.state,
      agent_type: agent.agent_type,
      channel:    channel,
    },
    supabase,
  )

  // ── 11. Update conversation ───────────────────────────────────────────────────
  const leadScore = calculateLeadScore(conversation.metadata?.lead_score ?? 50, metadata, messages.length)
  const updatedMessages = [
    ...messages,
    { role: 'assistant' as const, content: cleanResponse, timestamp: new Date().toISOString() },
  ]

  await supabase
    .from('conversations')
    .update({
      messages:         updatedMessages,
      status:           escalated ? 'escalated' : 'open',
      escalated_to:     escalated ? 'human' : null,
      tokens_used:      (conversation.tokens_used ?? 0) + claudeResult.tokensUsed,
      metadata: {
        ...conversation.metadata,
        contact_profile:        { ...(conversation.metadata?.contact_profile ?? {}), ...(metadata?.profile_update ?? {}) },
        lead_score:             leadScore,
        lead_label:             getLeadLabel(leadScore),
        sentiment:              metadata?.sentiment ?? emotion.state,
        emotional_state:        emotion.state,
        emotional_intensity:    emotion.intensity,
        intent:                 metadata?.intent ?? 'enquiry',
        suggested_next_action:  metadata?.suggested_next_action ?? 'continue',
      },
    })
    .eq('id', conversation.id)

  // ── 12. Send reply on the originating channel ─────────────────────────────────
  try {
    const { data: channelConn } = await supabase
      .from('channel_connections')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('channel_type', channel)
      .eq('status', 'active')
      .single()

    if (channelConn?.credentials) {
      const creds = channelConn.credentials as any

      switch (channel) {
        case 'whatsapp':
          await sendWhatsAppMessage(inbound.contactIdentifier, cleanResponse, String(creds.phone_number_id), String(creds.access_token))
          break
        case 'telegram':
          await sendTelegramMessage(inbound.contactIdentifier, cleanResponse, String(creds.bot_token))
          break
        case 'sms':
          await sendSms(inbound.contactIdentifier, cleanResponse, String(creds.from_number), String(creds.account_sid), String(creds.auth_token))
          break
        case 'slack':
          await sendSlackMessage(String(inbound.metadata?.channel_id ?? inbound.contactIdentifier), cleanResponse, String(creds.bot_token), inbound.metadata?.thread_ts ? String(inbound.metadata.thread_ts) : undefined)
          break
        case 'instagram':
          await sendInstagramMessage(inbound.contactIdentifier, cleanResponse, String(creds.page_access_token))
          break
        case 'facebook_messenger':
          await sendFacebookMessage(inbound.contactIdentifier, cleanResponse, String(creds.page_access_token))
          break
        case 'email':
          if (inbound.metadata?.subject) {
            await sendEmail(inbound.contactIdentifier, `Re: ${String(inbound.metadata.subject)}`, `<p>${cleanResponse.replace(/\n/g, '<br/>')}</p>`, String(creds.from_address))
          }
          break
      }
    }
  } catch {
    // Reply failure is non-fatal — conversation is already saved
  }

  return NextResponse.json({ ok: true })
}

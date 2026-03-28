/* eslint-disable @typescript-eslint/no-explicit-any */
import type { InboundMessage, MessageContent } from '@/lib/channels/channel-bus'

// ─── Inbound parsing ────────────────────────────────────────────────────────

export function parseSlackMessage(
  body: any,
  tenantId: string,
  agentId?: string,
): InboundMessage | null {
  try {
    // Handle URL verification challenge
    if (body?.type === 'url_verification') return null

    const event = body?.event
    if (!event || event.type !== 'message' || event.bot_id) return null

    let content: MessageContent

    if (event.files?.length) {
      const file = event.files[0]
      if (file.mimetype?.startsWith('image/')) {
        content = { type: 'image', mediaUrl: file.url_private, filename: file.name, mimeType: file.mimetype, caption: event.text }
      } else {
        content = { type: 'document', mediaUrl: file.url_private, filename: file.name, mimeType: file.mimetype }
      }
    } else {
      content = { type: 'text', text: event.text ?? '' }
    }

    return {
      channel:           'slack',
      tenantId,
      agentId,
      contactIdentifier: event.user ?? event.username ?? 'unknown',
      content,
      timestamp:         new Date(parseFloat(event.ts) * 1000).toISOString(),
      externalMessageId: event.ts,
      metadata:          { channel_id: event.channel, thread_ts: event.thread_ts },
    }
  } catch {
    return null
  }
}

// ─── Outbound via Web API ─────────────────────────────────────────────────────

export async function sendSlackMessage(
  channel: string,
  text: string,
  botToken: string,
  threadTs?: string,
): Promise<boolean> {
  try {
    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${botToken}` },
      body: JSON.stringify({ channel, text, thread_ts: threadTs }),
    })
    const data = await res.json()
    return data.ok === true
  } catch {
    return false
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { InboundMessage, MessageContent } from '@/lib/channels/channel-bus'

// ─── Inbound parsing ────────────────────────────────────────────────────────

export function parseFacebookMessage(
  body: any,
  tenantId: string,
  agentId?: string,
): InboundMessage | null {
  try {
    const entry     = body?.entry?.[0]
    const messaging = entry?.messaging?.[0]
    if (!messaging) return null

    const senderId = messaging.sender?.id as string
    const msg      = messaging.message
    if (!msg || msg.is_echo) return null

    let content: MessageContent

    if (msg.text) {
      content = { type: 'text', text: msg.text }
    } else if (msg.attachments?.length) {
      const att = msg.attachments[0]
      switch (att.type) {
        case 'image':
          content = { type: 'image', mediaUrl: att.payload?.url }
          break
        case 'audio':
          content = { type: 'audio', mediaUrl: att.payload?.url }
          break
        case 'video':
          content = { type: 'video', mediaUrl: att.payload?.url }
          break
        case 'file':
          content = { type: 'document', mediaUrl: att.payload?.url }
          break
        case 'location':
          content = {
            type:      'location',
            latitude:  att.payload?.coordinates?.lat,
            longitude: att.payload?.coordinates?.long,
          }
          break
        default:
          content = { type: 'text', text: '[Unsupported attachment]' }
      }
    } else {
      content = { type: 'text', text: '[Unsupported Facebook message]' }
    }

    return {
      channel:           'facebook_messenger',
      tenantId,
      agentId,
      contactIdentifier: senderId,
      content,
      timestamp:         new Date(messaging.timestamp).toISOString(),
      externalMessageId: msg.mid,
    }
  } catch {
    return null
  }
}

// ─── Outbound via Send API ────────────────────────────────────────────────────

export async function sendFacebookMessage(
  recipientId: string,
  text: string,
  pageAccessToken: string,
): Promise<boolean> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message:   { text },
        }),
      },
    )
    return res.ok
  } catch {
    return false
  }
}

// ─── Webhook verification ─────────────────────────────────────────────────────

export function verifyFacebookWebhook(
  mode: string | null,
  token: string | null,
  challenge: string | null,
  verifyToken: string,
): string | null {
  if (mode === 'subscribe' && token === verifyToken) return challenge
  return null
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { InboundMessage, MessageContent } from '@/lib/channels/channel-bus'

// ─── Inbound parsing ────────────────────────────────────────────────────────

export function parseWhatsAppMessage(body: any, tenantId: string, agentId?: string): InboundMessage | null {
  try {
    const entry   = body?.entry?.[0]
    const change  = entry?.changes?.[0]
    const value   = change?.value
    const msg     = value?.messages?.[0]
    if (!msg) return null

    const from    = msg.from as string
    const contact = value?.contacts?.[0]
    const name    = contact?.profile?.name as string | undefined

    let content: MessageContent

    switch (msg.type) {
      case 'text':
        content = { type: 'text', text: msg.text?.body ?? '' }
        break
      case 'image':
        content = { type: 'image', mediaUrl: msg.image?.link, caption: msg.image?.caption, mimeType: msg.image?.mime_type }
        break
      case 'audio':
        content = { type: 'audio', mediaUrl: msg.audio?.link, duration: msg.audio?.duration, mimeType: msg.audio?.mime_type }
        break
      case 'document':
        content = { type: 'document', mediaUrl: msg.document?.link, filename: msg.document?.filename, mimeType: msg.document?.mime_type }
        break
      case 'location':
        content = { type: 'location', latitude: msg.location?.latitude, longitude: msg.location?.longitude }
        break
      case 'video':
        content = { type: 'video', mediaUrl: msg.video?.link, caption: msg.video?.caption, mimeType: msg.video?.mime_type }
        break
      case 'sticker':
        content = { type: 'sticker', mediaUrl: msg.sticker?.link }
        break
      default:
        content = { type: 'text', text: `[Unsupported message type: ${msg.type}]` }
    }

    return {
      channel:           'whatsapp',
      tenantId,
      agentId,
      contactIdentifier: from,
      contactName:       name,
      content,
      timestamp:         new Date(parseInt(msg.timestamp) * 1000).toISOString(),
      externalMessageId: msg.id,
    }
  } catch {
    return null
  }
}

// ─── Outbound sending ────────────────────────────────────────────────────────

export async function sendWhatsAppMessage(
  to: string,
  text: string,
  phoneNumberId: string,
  accessToken: string,
): Promise<boolean> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: text },
        }),
      },
    )
    return res.ok
  } catch {
    return false
  }
}

export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  languageCode: string,
  components: any[],
  phoneNumberId: string,
  accessToken: string,
): Promise<boolean> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: { name: templateName, language: { code: languageCode }, components },
        }),
      },
    )
    return res.ok
  } catch {
    return false
  }
}

// ─── Webhook verification ─────────────────────────────────────────────────────

export function verifyWhatsAppWebhook(
  mode: string | null,
  token: string | null,
  challenge: string | null,
  verifyToken: string,
): string | null {
  if (mode === 'subscribe' && token === verifyToken) return challenge
  return null
}

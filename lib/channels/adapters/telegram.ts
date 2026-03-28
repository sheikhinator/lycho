/* eslint-disable @typescript-eslint/no-explicit-any */
import type { InboundMessage, MessageContent } from '@/lib/channels/channel-bus'

// ─── Inbound parsing ────────────────────────────────────────────────────────

export function parseTelegramMessage(
  body: any,
  tenantId: string,
  agentId?: string,
): InboundMessage | null {
  try {
    const msg   = body?.message ?? body?.edited_message
    if (!msg) return null

    const from  = msg.from
    const chat  = msg.chat
    const contactId = String(from?.id ?? chat?.id)
    const name  = [from?.first_name, from?.last_name].filter(Boolean).join(' ') || from?.username

    let content: MessageContent

    if (msg.text) {
      content = { type: 'text', text: msg.text }
    } else if (msg.photo) {
      const photo = msg.photo[msg.photo.length - 1]
      content = { type: 'image', mediaUrl: photo?.file_id, caption: msg.caption }
    } else if (msg.voice) {
      content = { type: 'audio', mediaUrl: msg.voice.file_id, duration: msg.voice.duration, mimeType: msg.voice.mime_type }
    } else if (msg.document) {
      content = { type: 'document', mediaUrl: msg.document.file_id, filename: msg.document.file_name, mimeType: msg.document.mime_type }
    } else if (msg.location) {
      content = { type: 'location', latitude: msg.location.latitude, longitude: msg.location.longitude }
    } else if (msg.video) {
      content = { type: 'video', mediaUrl: msg.video.file_id, caption: msg.caption }
    } else if (msg.sticker) {
      content = { type: 'sticker', mediaUrl: msg.sticker.file_id }
    } else {
      content = { type: 'text', text: '[Unsupported Telegram message]' }
    }

    return {
      channel:           'telegram',
      tenantId,
      agentId,
      contactIdentifier: contactId,
      contactName:       name,
      content,
      timestamp:         new Date(msg.date * 1000).toISOString(),
      externalMessageId: String(msg.message_id),
      metadata:          { chat_id: chat?.id, username: from?.username },
    }
  } catch {
    return null
  }
}

// ─── Outbound via Bot API ─────────────────────────────────────────────────────

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  botToken: string,
): Promise<boolean> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    })
    return res.ok
  } catch {
    return false
  }
}

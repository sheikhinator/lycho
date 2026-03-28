/* eslint-disable @typescript-eslint/no-explicit-any */
import type { InboundMessage, MessageContent } from '@/lib/channels/channel-bus'

// ─── Inbound parsing ────────────────────────────────────────────────────────

export function parseWidgetMessage(
  payload: any,
  tenantId: string,
  agentId?: string,
): InboundMessage | null {
  try {
    const contactId = payload?.contactId ?? payload?.sessionId ?? payload?.visitorId
    if (!contactId) return null

    let content: MessageContent

    if (payload?.type === 'image' && payload?.mediaUrl) {
      content = { type: 'image', mediaUrl: payload.mediaUrl, caption: payload.caption }
    } else if (payload?.type === 'document' && payload?.mediaUrl) {
      content = { type: 'document', mediaUrl: payload.mediaUrl, filename: payload.filename, mimeType: payload.mimeType }
    } else {
      content = { type: 'text', text: payload?.message ?? payload?.text ?? '' }
    }

    return {
      channel:           'web_widget',
      tenantId,
      agentId,
      contactIdentifier: String(contactId),
      contactName:       payload?.name ?? undefined,
      content,
      timestamp:         new Date().toISOString(),
      externalMessageId: payload?.messageId,
      metadata:          { page: payload?.page, referrer: payload?.referrer, userAgent: payload?.userAgent },
    }
  } catch {
    return null
  }
}

// ─── Outbound formatting ──────────────────────────────────────────────────────

export function formatWidgetResponse(
  text: string,
  conversationId: string,
  metadata?: Record<string, any>,
): Record<string, any> {
  return {
    message:        text,
    conversationId,
    timestamp:      new Date().toISOString(),
    ...metadata,
  }
}

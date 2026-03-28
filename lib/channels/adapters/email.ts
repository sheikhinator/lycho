/* eslint-disable @typescript-eslint/no-explicit-any */
import type { InboundMessage, MessageContent } from '@/lib/channels/channel-bus'

// ─── Inbound parsing ────────────────────────────────────────────────────────

export function parseEmailMessage(
  payload: any,
  tenantId: string,
  agentId?: string,
): InboundMessage | null {
  try {
    const from      = payload?.from as string
    const subject   = payload?.subject as string | undefined
    const textBody  = (payload?.text ?? payload?.html ?? '') as string
    const messageId = payload?.messageId ?? payload?.id

    const text = subject ? `Subject: ${subject}\n\n${textBody}` : textBody

    const content: MessageContent = { type: 'text', text }

    return {
      channel:           'email',
      tenantId,
      agentId,
      contactIdentifier: from,
      contactName:       payload?.fromName ?? undefined,
      content,
      timestamp:         new Date().toISOString(),
      externalMessageId: messageId,
      metadata:          { subject, replyTo: payload?.replyTo },
    }
  } catch {
    return null
  }
}

// ─── Outbound via Resend ──────────────────────────────────────────────────────

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  from: string,
  replyTo?: string,
): Promise<boolean> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        Authorization:   `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({ from, to, subject, html, reply_to: replyTo }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function sendEmailTemplate(
  to: string,
  subject: string,
  templateId: string,
  variables: Record<string, string>,
  from: string,
): Promise<boolean> {
  // Resend doesn't have native templates — build the HTML from variables
  const html = Object.entries(variables).reduce(
    (acc, [key, val]) => acc.replace(new RegExp(`{{${key}}}`, 'g'), val),
    `<p>Template: ${templateId}</p>`,
  )
  return sendEmail(to, subject, html, from)
}

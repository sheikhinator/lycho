/* eslint-disable @typescript-eslint/no-explicit-any */
import type { InboundMessage, MessageContent } from '@/lib/channels/channel-bus'

// ─── Inbound parsing (Twilio) ────────────────────────────────────────────────

export function parseSmsMessage(
  payload: any,
  tenantId: string,
  agentId?: string,
): InboundMessage | null {
  try {
    const from = payload?.From as string
    if (!from) return null

    const content: MessageContent = {
      type: 'text',
      text: payload?.Body ?? '',
    }

    return {
      channel:           'sms',
      tenantId,
      agentId,
      contactIdentifier: from,
      content,
      timestamp:         new Date().toISOString(),
      externalMessageId: payload?.MessageSid,
      metadata:          { to: payload?.To, numMedia: payload?.NumMedia },
    }
  } catch {
    return null
  }
}

// ─── Outbound via Twilio REST ─────────────────────────────────────────────────

export async function sendSms(
  to: string,
  body: string,
  from: string,
  accountSid: string,
  authToken: string,
): Promise<boolean> {
  try {
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method:  'POST',
        headers: {
          'Content-Type':  'application/x-www-form-urlencoded',
          Authorization:   `Basic ${credentials}`,
        },
        body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
      },
    )
    return res.ok
  } catch {
    return false
  }
}

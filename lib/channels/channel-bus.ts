/* eslint-disable @typescript-eslint/no-explicit-any */

export type ChannelType =
  | 'whatsapp' | 'whatsapp_business'
  | 'email' | 'gmail' | 'outlook'
  | 'web_widget' | 'web_chat'
  | 'sms' | 'twilio'
  | 'instagram' | 'facebook_messenger'
  | 'telegram' | 'signal'
  | 'slack' | 'teams' | 'discord'
  | 'api' | 'webhook'
  | 'voice' | 'phone'

export interface MessageContent {
  type: 'text' | 'image' | 'audio' | 'document' | 'location' | 'video' | 'sticker'
  text?: string
  mediaUrl?: string
  mimeType?: string
  filename?: string
  caption?: string
  latitude?: number
  longitude?: number
  duration?: number
}

export interface InboundMessage {
  channel: ChannelType
  tenantId: string
  agentId?: string
  contactIdentifier: string
  contactName?: string
  content: MessageContent
  timestamp: string
  externalMessageId?: string
  replyToId?: string
  metadata?: Record<string, any>
}

export interface OutboundMessage {
  channel: ChannelType
  contactIdentifier: string
  content: MessageContent
  conversationId: string
  metadata?: Record<string, any>
}

export async function routeInboundMessage(
  _message: InboundMessage,
  _supabase: any,
): Promise<{ response: OutboundMessage; conversationId: string; agentResponse: any }> {
  // Route is handled by the webhook handler directly — this is a type stub
  throw new Error('Route inbound messages via app/api/webhooks/[channel]/route.ts')
}

/** Normalise any channel variant to its canonical form */
export function normaliseChannel(ch: string): ChannelType {
  const map: Record<string, ChannelType> = {
    whatsapp_business: 'whatsapp',
    gmail:             'email',
    outlook:           'email',
    web_chat:          'web_widget',
    twilio:            'sms',
    facebook_messenger: 'facebook_messenger',
    phone:             'voice',
  }
  return (map[ch] ?? ch) as ChannelType
}

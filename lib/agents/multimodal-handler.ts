import Anthropic from '@anthropic-ai/sdk'
import type { MessageContent } from '@/lib/channels/channel-bus'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function processMultimodalInput(content: MessageContent): Promise<string> {
  if (content.type === 'text') return content.text ?? ''

  if (content.type === 'image' && content.mediaUrl) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        messages: [{
          role: 'user',
          content: [
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { type: 'image', source: { type: 'url', url: content.mediaUrl } } as any,
            { type: 'text',  text: 'Describe this image in one concise sentence relevant to a business customer service context.' },
          ],
        }],
      })
      const description = response.content[0].type === 'text' ? response.content[0].text : 'image'
      return `[Customer shared an image: ${description}]${content.caption ? ` Caption: "${content.caption}"` : ''}`
    } catch {
      return `[Customer shared an image]${content.caption ? ` Caption: "${content.caption}"` : ''}`
    }
  }

  if (content.type === 'audio') {
    const dur = content.duration ? `${content.duration}s` : 'duration unknown'
    return `[Customer sent a voice message — ${dur}. Please acknowledge and ask them to type their message for now.]`
  }

  if (content.type === 'document') {
    return `[Customer shared a document: ${content.filename ?? 'attachment'} (${content.mimeType ?? 'unknown type'})]`
  }

  if (content.type === 'location') {
    return `[Customer shared their location: ${content.latitude}, ${content.longitude}]`
  }

  if (content.type === 'video') {
    return `[Customer shared a video${content.caption ? `: "${content.caption}"` : ''}]`
  }

  if (content.type === 'sticker') {
    return '[Customer sent a sticker]'
  }

  return content.text ?? '[Non-text message received]'
}

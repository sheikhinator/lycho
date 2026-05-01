import OpenAI from 'openai'
import type { MessageContent } from '@/lib/channels/channel-bus'

const openai = new OpenAI({ apiKey: process.env.OPENCODE_API_KEY || 'sk-DkKhm5mvzbJQHPhVyAbDBKVbDQgKuq5e6bTxTHW9jcRHa50tW3P9ax4oEsDv3buu', baseURL: 'https://opencode.ai/zen/v1' })

export async function processMultimodalInput(content: MessageContent): Promise<string> {
  if (content.type === 'text') return content.text ?? ''

  if (content.type === 'image' && content.mediaUrl) {
    try {
      const response = await openai.chat.completions.create({
        model: 'claude-haiku-4-5',
        max_tokens: 150,
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: content.mediaUrl } } as any,
            { type: 'text',  text: 'Describe this image in one concise sentence relevant to a business customer service context.' },
          ] as any,
        }],
      })
      const description = response.choices[0]?.message?.content || 'image'
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

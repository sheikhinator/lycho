import { ElevenLabsClient } from 'elevenlabs'

function getClient() {
  return new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY! })
}

// Text to speech — returns audio buffer
export async function textToSpeech(text: string, voiceId = 'Rachel'): Promise<Buffer> {
  const audio = await getClient().generate({
    voice: voiceId,
    text,
    model_id: 'eleven_turbo_v2'
  })
  const chunks: Uint8Array[] = []
  for await (const chunk of audio) {
    chunks.push(chunk instanceof Uint8Array ? chunk : Buffer.from(chunk))
  }
  const total = chunks.reduce((n, c) => n + c.length, 0)
  const result = new Uint8Array(total)
  let offset = 0
  for (const c of chunks) { result.set(c, offset); offset += c.length }
  return Buffer.from(result.buffer)
}

// Speech to text — accepts audio blob, returns transcript
export async function speechToText(audioBuffer: Buffer): Promise<string> {
  const formData = new FormData()
  const ab = audioBuffer.buffer.slice(audioBuffer.byteOffset, audioBuffer.byteOffset + audioBuffer.byteLength) as ArrayBuffer
  formData.append('file', new Blob([ab], { type: 'audio/webm' }), 'audio.webm')
  formData.append('model', 'whisper-1')

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
    body: formData
  })

  const data = await response.json()
  return data.text || ''
}

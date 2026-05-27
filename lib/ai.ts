import OpenAI from 'openai'

let client: OpenAI | null = null

export function getAIClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY is required.')
    client = new OpenAI({
      apiKey,
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    })
  }
  return client
}

export const MODELS = {
  fast: 'gemini-2.0-flash',
  smart: 'gemini-2.5-pro',
  embedding: 'text-embedding-004',
}

export function getModel(complexity: 'simple' | 'complex'): string {
  return complexity === 'simple' ? MODELS.fast : MODELS.smart
}

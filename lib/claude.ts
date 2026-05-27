import OpenAI from 'openai'

function getOpenAI() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is required.')
  return new OpenAI({
    apiKey,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
  })
}

export const MODELS = {
  fast:     'gemini-1.5-flash',
  smart:    'gemini-1.5-pro',
  fallback: 'gpt-5',
}

export function getModel(complexity: 'simple' | 'complex'): string {
  return complexity === 'simple' ? MODELS.fast : MODELS.smart
}

interface ClaudeCallParams {
  systemPrompt: string
  messages: { role: 'user' | 'assistant'; content: string }[]
  model: string
  maxTokens?: number
  useCache?: boolean
}

interface ClaudeResponse {
  response: string
  tokensUsed: number
  inputTokens: number
  outputTokens: number
  model: string
  estimatedCostPkr: number
}

export async function callClaude({
  systemPrompt,
  messages,
  model,
  maxTokens = 1000,
  useCache = true,
}: ClaudeCallParams): Promise<ClaudeResponse> {
  try {
    const openai = getOpenAI()
    const response = await openai.chat.completions.create({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      ],
    })

    const inputTokens  = response.usage?.prompt_tokens || 0
    const outputTokens = response.usage?.completion_tokens || 0
    const tokensUsed   = inputTokens + outputTokens

    const costUsd =
      model === MODELS.fast
        ? inputTokens * 0.000001 + outputTokens * 0.000005
        : inputTokens * 0.000003 + outputTokens * 0.000015

    const estimatedCostPkr = costUsd * 280

    return {
      response: response.choices[0]?.message?.content || '',
      tokensUsed,
      inputTokens,
      outputTokens,
      model,
      estimatedCostPkr,
    }
  } catch {
    throw new Error('AI service temporarily unavailable. Please try again.')
  }
}
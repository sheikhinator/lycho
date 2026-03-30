import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const MODELS = {
  fast:     'claude-haiku-4-5-20251001',
  smart:    'claude-sonnet-4-6',
  fallback: 'gpt-4o-mini',
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
    const systemContent = useCache
      ? [{ type: 'text' as const, text: systemPrompt, cache_control: { type: 'ephemeral' as const } }]
      : systemPrompt

    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      system: systemContent as any,
      messages: messages.slice(-20),
    })

    const inputTokens  = response.usage.input_tokens
    const outputTokens = response.usage.output_tokens
    const tokensUsed   = inputTokens + outputTokens

    const costUsd =
      model === MODELS.fast
        ? inputTokens * 0.000001 + outputTokens * 0.000005
        : inputTokens * 0.000003 + outputTokens * 0.000015

    const estimatedCostPkr = costUsd * 280

    return {
      response: response.content[0].type === 'text' ? response.content[0].text : '',
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

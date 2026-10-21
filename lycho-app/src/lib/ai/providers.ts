import { getJson, setJson } from '@/lib/db'
import { getKey, type ProviderId } from '@/lib/vault'

// All three providers speak the OpenAI chat-completions format, so one client covers them.
export const PROVIDER_INFO: Record<ProviderId, { name: string; base: string; keyUrl: string; hint: string }> = {
  gemini: {
    name: 'Google Gemini',
    base: 'https://generativelanguage.googleapis.com/v1beta/openai',
    keyUrl: 'https://aistudio.google.com/apikey',
    hint: 'Best for heavy reasoning and very long context.',
  },
  groq: {
    name: 'Groq',
    base: 'https://api.groq.com/openai/v1',
    keyUrl: 'https://console.groq.com/keys',
    hint: 'Fastest replies. Great for quick chat.',
  },
  openrouter: {
    name: 'OpenRouter',
    base: 'https://openrouter.ai/api/v1',
    keyUrl: 'https://openrouter.ai/keys',
    hint: 'Hundreds of models, including free ones. The safety net.',
  },
}

export type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string }
export type CallResult = { text: string; tokensIn?: number; tokensOut?: number }

export class ProviderError extends Error {
  constructor(message: string, public status: number | null, public retryAfterMs?: number) {
    super(message)
  }
  /** Worth trying a different provider/model. */
  get recoverable() {
    return this.status === null || this.status === 408 || this.status === 429 || this.status >= 500 || this.status === 401 || this.status === 403 || this.status === 404 || this.status === 400
  }
}

function headers(p: ProviderId, key: string): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }
  if (p === 'openrouter') { h['HTTP-Referer'] = 'https://lycho.app'; h['X-Title'] = 'LYCHO' }
  return h
}

async function withTimeout<T>(ms: number, run: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), ms)
  try { return await run(ctl.signal) } finally { clearTimeout(t) }
}

export async function callChat(
  p: ProviderId, model: string, messages: ChatMsg[],
  opts: { temperature?: number; maxTokens?: number; timeoutMs?: number } = {},
): Promise<CallResult> {
  const key = await getKey(p)
  if (!key) throw new ProviderError(`${PROVIDER_INFO[p].name} key not set`, 401)
  let res: Response
  try {
    res = await withTimeout(opts.timeoutMs ?? 90_000, signal =>
      fetch(`${PROVIDER_INFO[p].base}/chat/completions`, {
        method: 'POST', signal, headers: headers(p, key),
        body: JSON.stringify({ model, messages, temperature: opts.temperature ?? 0.7, max_tokens: opts.maxTokens ?? 4096 }),
      }),
    )
  } catch (e: any) {
    throw new ProviderError(e?.name === 'AbortError' ? 'Timed out' : 'Network error — check your connection', null)
  }
  const raw = await res.text()
  let body: any = null
  try { body = JSON.parse(raw) } catch { /* non-JSON error page */ }
  if (!res.ok) {
    const err = body?.error?.message ?? (Array.isArray(body) ? body[0]?.error?.message : null) ?? raw.slice(0, 200)
    const ra = Number(res.headers.get('retry-after'))
    throw new ProviderError(`${res.status}: ${err}`, res.status, ra > 0 ? ra * 1000 : undefined)
  }
  const text: string = body?.choices?.[0]?.message?.content ?? ''
  if (!text.trim()) throw new ProviderError('Empty response from model', 502)
  return { text, tokensIn: body?.usage?.prompt_tokens, tokensOut: body?.usage?.completion_tokens }
}

// ---------- live model lists ----------
export type ModelList = { ids: string[]; fetchedAt: number }

export async function fetchModels(p: ProviderId, keyOverride?: string): Promise<string[]> {
  const key = keyOverride ?? (await getKey(p))
  if (!key) throw new ProviderError('Key not set', 401)
  let res: Response
  try {
    res = await withTimeout(20_000, signal => fetch(`${PROVIDER_INFO[p].base}/models`, { signal, headers: headers(p, key) }))
  } catch {
    throw new ProviderError('Network error — check your connection', null)
  }
  if (!res.ok) {
    const t = await res.text()
    let msg = t.slice(0, 160)
    try { msg = JSON.parse(t)?.error?.message ?? msg } catch {}
    throw new ProviderError(`${res.status}: ${msg}`, res.status)
  }
  const body: any = await res.json()
  const ids: string[] = (body?.data ?? []).map((m: any) => String(m.id).replace(/^models\//, ''))
  const filtered = ids.filter(id => !/embed|whisper|tts|guard|image|imagen|veo|audio|vision-only|moderation|aqa|live/i.test(id))
  await setJson(`models_${p}`, { ids: filtered.sort(), fetchedAt: Date.now() })
  return filtered
}

export async function cachedModels(p: ProviderId): Promise<string[]> {
  return (await getJson<ModelList>(`models_${p}`, { ids: [], fetchedAt: 0 })).ids
}

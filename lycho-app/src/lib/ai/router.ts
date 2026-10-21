import { db, getJson, now, setJson } from '@/lib/db'
import { configuredProviders, type ProviderId } from '@/lib/vault'
import { cachedModels, callChat, ProviderError, PROVIDER_INFO, type ChatMsg } from './providers'

/**
 * LYCHO model router.
 * 1. Classifies each request into a tier (fast / balanced / heavy / long).
 * 2. Builds a ranked list of provider+model candidates for that tier, using the live model
 *    lists from each provider so it keeps working when model names change.
 * 3. Tries them in order, skipping anything cooling down after a rate limit, and logs every attempt.
 */
export type Tier = 'fast' | 'balanced' | 'heavy' | 'long'
export const TIERS: Tier[] = ['fast', 'balanced', 'heavy', 'long']
export const TIER_LABEL: Record<Tier, string> = { fast: 'Fast', balanced: 'Balanced', heavy: 'Heavy', long: 'Long context' }

export type RouterPrefs = {
  mode: 'auto' | 'manual'
  preferred: ProviderId | 'none'           // put this provider first when it fits
  freeOnly: boolean                        // OpenRouter: only ":free" models
  manual: string | null                    // "provider:model" when mode = manual
  pins: Partial<Record<`${ProviderId}:${Tier}`, string>> // user-chosen model per provider+tier
  temperature: number
}
export const DEFAULT_PREFS: RouterPrefs = { mode: 'auto', preferred: 'none', freeOnly: true, manual: null, pins: {}, temperature: 0.7 }
export const getPrefs = () => getJson<RouterPrefs>('router_prefs', DEFAULT_PREFS)
export const savePrefs = (p: RouterPrefs) => setJson('router_prefs', p)

const ORDER: Record<Tier, ProviderId[]> = {
  fast: ['groq', 'gemini', 'openrouter'],
  balanced: ['gemini', 'groq', 'openrouter'],
  heavy: ['gemini', 'openrouter', 'groq'],
  long: ['gemini', 'openrouter', 'groq'],
}

// Ordered preferences, matched against each provider's live model list. First match wins.
const PREFS: Record<ProviderId, Record<Tier, RegExp[]>> = {
  gemini: {
    fast: [/^gemini-[\d.]+-flash-lite$/, /flash-lite/, /^gemini-[\d.]+-flash$/],
    balanced: [/^gemini-[\d.]+-flash$/, /^gemini-flash-latest$/, /flash(?!-lite)/],
    heavy: [/^gemini-[\d.]+-pro$/, /^gemini-pro-latest$/, /pro(?!.*(tts|image))/, /^gemini-[\d.]+-flash$/],
    long: [/^gemini-[\d.]+-flash$/, /^gemini-[\d.]+-pro$/, /flash/],
  },
  groq: {
    fast: [/llama-3\.1-8b-instant/, /instant/, /8b/],
    balanced: [/llama-3\.3-70b-versatile/, /versatile/, /70b/, /gpt-oss-20b/],
    heavy: [/gpt-oss-120b/, /kimi-k2/, /qwen3?-32b/, /llama-4-maverick/, /versatile/],
    long: [/kimi-k2/, /llama-4-scout/, /versatile/],
  },
  openrouter: {
    fast: [/llama-3\.1-8b/, /gemma-3-12b/, /mistral-small/, /qwen.*(7b|8b)/],
    balanced: [/deepseek-chat/, /llama-3\.3-70b/, /qwen3?-.*(30b|32b)/, /mistral-small/],
    heavy: [/deepseek-r1(?!.*distill)/, /deepseek-chat-v3/, /qwen3-235b/, /kimi-k2/, /gpt-oss-120b/, /llama-3\.3-70b/],
    long: [/gemini.*flash/, /llama-4-scout/, /deepseek-chat/],
  },
}

// Used when live lists haven't been fetched yet.
const FALLBACK: Record<ProviderId, Record<Tier, string>> = {
  gemini: { fast: 'gemini-2.5-flash-lite', balanced: 'gemini-2.5-flash', heavy: 'gemini-2.5-pro', long: 'gemini-2.5-flash' },
  groq: { fast: 'llama-3.1-8b-instant', balanced: 'llama-3.3-70b-versatile', heavy: 'openai/gpt-oss-120b', long: 'llama-3.3-70b-versatile' },
  openrouter: { fast: 'openrouter/auto', balanced: 'openrouter/auto', heavy: 'openrouter/auto', long: 'openrouter/auto' },
}

const HEAVY_HINT = /\b(analy[sz]e|analysis|strategy|strategic|plan|roadmap|compare|evaluate|debug|code|function|algorithm|architecture|prove|calculate|forecast|step[- ]by[- ]step|in detail|deep dive|research|report|essay|contract|legal|financial model|why does|optimi[sz]e)\b/i

export function classify(userText: string, contextChars: number, agentTier?: string | null): Tier {
  if (contextChars > 40_000) return 'long'
  if (agentTier === 'heavy' || userText.length > 1500 || HEAVY_HINT.test(userText)) return 'heavy'
  if (userText.length < 160 && contextChars < 4_000) return 'fast'
  return 'balanced'
}

export async function pickModel(p: ProviderId, tier: Tier, prefs: RouterPrefs): Promise<string> {
  const pinned = prefs.pins[`${p}:${tier}`]
  if (pinned) return pinned
  let live = await cachedModels(p)
  if (p === 'openrouter' && prefs.freeOnly) live = live.filter(m => m.endsWith(':free'))
  for (const re of PREFS[p][tier]) {
    const hit = live.find(m => re.test(m))
    if (hit) return hit
  }
  if (p === 'openrouter' && prefs.freeOnly && live.length) return live[0]
  return FALLBACK[p][tier]
}

const cooldown = new Map<string, number>()

export type Attempt = { provider: ProviderId; model: string; ok: boolean; error?: string; ms: number }
export type RouteResult = {
  text: string; provider: ProviderId; model: string; tier: Tier
  tokensIn?: number; tokensOut?: number; latencyMs: number; attempts: Attempt[]
}

export async function plan(tier: Tier, prefs: RouterPrefs, override?: string | null) {
  const have = await configuredProviders()
  const cands: { provider: ProviderId; model: string }[] = []
  const manual = override ?? (prefs.mode === 'manual' ? prefs.manual : null)
  if (manual && manual.includes(':')) {
    const [prov, ...rest] = manual.split(':')
    if (have.includes(prov as ProviderId)) cands.push({ provider: prov as ProviderId, model: rest.join(':') })
  }
  let order = ORDER[tier].filter(p => have.includes(p))
  if (prefs.preferred !== 'none' && order.includes(prefs.preferred)) order = [prefs.preferred, ...order.filter(p => p !== prefs.preferred)]
  for (const p of order) cands.push({ provider: p, model: await pickModel(p, tier, prefs) })
  // Second pass: step down a tier on each provider so a rate-limited big model still has a backup.
  const down: Tier = tier === 'fast' ? 'balanced' : 'fast'
  for (const p of order) {
    const m = await pickModel(p, down, prefs)
    if (!cands.some(c => c.provider === p && c.model === m)) cands.push({ provider: p, model: m })
  }
  return cands
}

export async function route(
  messages: ChatMsg[],
  opts: { tier?: Tier; agentTier?: string | null; override?: string | null; maxTokens?: number } = {},
): Promise<RouteResult> {
  const prefs = await getPrefs()
  const lastUser = [...messages].reverse().find(m => m.role === 'user')?.content ?? ''
  const ctx = messages.reduce((n, m) => n + m.content.length, 0)
  const tier = opts.tier ?? classify(lastUser, ctx, opts.agentTier)
  const cands = await plan(tier, prefs, opts.override)
  if (!cands.length) throw new ProviderError('No AI keys added yet. Add a Gemini, Groq or OpenRouter key in Settings → AI Keys.', 401)

  const attempts: Attempt[] = []
  for (const c of cands) {
    const id = `${c.provider}:${c.model}`
    if ((cooldown.get(id) ?? 0) > now()) continue
    const t0 = now()
    try {
      const r = await callChat(c.provider, c.model, messages, { temperature: prefs.temperature, maxTokens: opts.maxTokens })
      const ms = now() - t0
      attempts.push({ ...c, ok: true, ms })
      void log(c.provider, c.model, tier, true, 200, ms, null, r.tokensIn, r.tokensOut)
      return { text: r.text, provider: c.provider, model: c.model, tier, tokensIn: r.tokensIn, tokensOut: r.tokensOut, latencyMs: ms, attempts }
    } catch (e: any) {
      const ms = now() - t0
      const err = e instanceof ProviderError ? e : new ProviderError(String(e?.message ?? e), null)
      attempts.push({ ...c, ok: false, error: err.message, ms })
      void log(c.provider, c.model, tier, false, err.status, ms, err.message)
      if (err.status === 429) cooldown.set(id, now() + (err.retryAfterMs ?? 60_000))
      if (!err.recoverable) break
    }
  }
  const summary = attempts.map(a => `• ${PROVIDER_INFO[a.provider].name} ${a.model}: ${a.error}`).join('\n')
  throw new ProviderError(`All models failed:\n${summary || 'Every candidate is cooling down after rate limits. Try again in a minute.'}`, 503)
}

async function log(provider: string, model: string, tier: string, ok: boolean, status: number | null, ms: number, error: string | null, tin?: number, tout?: number) {
  try {
    await db().runAsync(
      'INSERT INTO router_log (ts,provider,model,tier,ok,status,latency_ms,error,tokens_in,tokens_out) VALUES (?,?,?,?,?,?,?,?,?,?)',
      now(), provider, model, tier, ok ? 1 : 0, status, ms, error, tin ?? null, tout ?? null,
    )
  } catch {}
}

import { route, type RouteResult, type Tier } from './router'
import { getKey } from '@/lib/vault'
import { PROVIDER_INFO, type ChatMsg } from './providers'

/** One-shot question to the router. */
export async function ask(system: string, user: string, opts: { tier?: Tier; maxTokens?: number; override?: string | null } = {}): Promise<RouteResult> {
  return route([{ role: 'system', content: system }, { role: 'user', content: user }], opts)
}

export async function askMsgs(messages: ChatMsg[], opts: { tier?: Tier; maxTokens?: number; override?: string | null } = {}) {
  return route(messages, opts)
}

/** Pulls the first JSON object/array out of a model reply (handles ```json fences and chatter). */
export function parseJson<T>(text: string): T | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const body = fenced ? fenced[1] : text
  const start = body.search(/[[{]/)
  if (start < 0) return null
  const open = body[start]
  const close = open === '{' ? '}' : ']'
  let depth = 0
  let inStr = false
  for (let i = start; i < body.length; i++) {
    const c = body[i]
    if (inStr) { if (c === '\\') i++; else if (c === '"') inStr = false; continue }
    if (c === '"') inStr = true
    else if (c === open) depth++
    else if (c === close && --depth === 0) {
      try { return JSON.parse(body.slice(start, i + 1)) as T } catch { return null }
    }
  }
  return null
}

export async function askJson<T>(system: string, user: string, opts: { tier?: Tier; maxTokens?: number } = {}): Promise<T> {
  const r = await ask(system + '\n\nReply with valid JSON only. No commentary.', user, opts)
  const parsed = parseJson<T>(r.text)
  if (parsed == null) throw new Error('The model did not return valid JSON. Try again.')
  return parsed
}

// ---------- embeddings (Gemini) ----------
let embedModel: string | null = null
export async function canEmbed() {
  return !!(await getKey('gemini'))
}

/** Returns one vector per text, or null when no embedding provider is available. */
export async function embed(texts: string[]): Promise<number[][] | null> {
  const key = await getKey('gemini')
  if (!key || !texts.length) return null
  const models = embedModel ? [embedModel] : ['gemini-embedding-001', 'text-embedding-004']
  for (const model of models) {
    try {
      const out: number[][] = []
      for (let i = 0; i < texts.length; i += 64) {
        const res = await fetch(`${PROVIDER_INFO.gemini.base}/embeddings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
          body: JSON.stringify({ model, input: texts.slice(i, i + 64).map(t => t.slice(0, 6000)) }),
        })
        if (!res.ok) throw new Error(String(res.status))
        const body: any = await res.json()
        for (const d of body.data ?? []) out.push(d.embedding as number[])
      }
      if (out.length === texts.length) { embedModel = model; return out }
    } catch { /* try next model */ }
  }
  return null
}

export function cosine(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0
  const n = Math.min(a.length, b.length)
  for (let i = 0; i < n; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i] }
  return na && nb ? dot / Math.sqrt(na * nb) : 0
}

/** Keyword relevance used when embeddings aren't available. */
export function keywordScore(query: string, text: string) {
  const terms = query.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) ?? []
  if (!terms.length) return 0
  const t = text.toLowerCase()
  let hits = 0
  for (const term of new Set(terms)) if (t.includes(term)) hits++
  return hits / new Set(terms).size
}

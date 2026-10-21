import * as SecureStore from 'expo-secure-store'

// API keys live only in Android's encrypted keystore — never in the database, code or backups.
export type ProviderId = 'gemini' | 'groq' | 'openrouter'
export const PROVIDERS: ProviderId[] = ['gemini', 'groq', 'openrouter']

const k = (p: ProviderId) => `lycho_key_${p}`
const cache: Partial<Record<ProviderId, string | null>> = {}

export async function getKey(p: ProviderId): Promise<string | null> {
  if (cache[p] !== undefined) return cache[p] ?? null
  const v = await SecureStore.getItemAsync(k(p))
  cache[p] = v
  return v
}
export async function setKey(p: ProviderId, value: string) {
  const v = value.trim()
  await SecureStore.setItemAsync(k(p), v)
  cache[p] = v
}
export async function removeKey(p: ProviderId) {
  await SecureStore.deleteItemAsync(k(p))
  cache[p] = null
}
export async function configuredProviders(): Promise<ProviderId[]> {
  const out: ProviderId[] = []
  for (const p of PROVIDERS) if (await getKey(p)) out.push(p)
  return out
}
export function maskKey(v: string | null) {
  if (!v) return 'Not set'
  return v.length <= 10 ? '••••' : `${v.slice(0, 4)}••••${v.slice(-4)}`
}

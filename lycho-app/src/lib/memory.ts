import { db, getSetting, now, uid } from '@/lib/db'
import { askJson } from '@/lib/ai/ask'
import { keywordScore } from '@/lib/ai/ask'

export type Memory = { id: string; user_id: string; agent_id: string | null; content: string; kind: string; entity: string | null; source: string | null; created_at: number }

export const listMemories = (userId: string) =>
  db().getAllAsync<Memory>('SELECT * FROM memories WHERE user_id = ? ORDER BY entity, created_at DESC', userId)

export async function addMemory(userId: string, content: string, entity?: string | null, kind = 'fact', source = 'manual', agentId: string | null = null) {
  const c = content.trim()
  if (!c) return null
  const dup = await db().getFirstAsync('SELECT id FROM memories WHERE user_id = ? AND lower(content) = lower(?)', userId, c)
  if (dup) return null
  const id = uid()
  await db().runAsync('INSERT INTO memories (id,user_id,agent_id,content,kind,entity,source,created_at) VALUES (?,?,?,?,?,?,?,?)',
    id, userId, agentId, c, kind, entity?.trim() || 'You', source, now())
  return id
}
export async function updateMemory(id: string, content: string, entity: string) {
  await db().runAsync('UPDATE memories SET content = ?, entity = ? WHERE id = ?', content.trim(), entity.trim() || 'You', id)
}
export const deleteMemory = (id: string) => db().runAsync('DELETE FROM memories WHERE id = ?', id)

export async function relevantMemories(userId: string, agentId: string, query: string, k = 12) {
  const all = await db().getAllAsync<Memory>('SELECT * FROM memories WHERE user_id = ? AND (agent_id IS NULL OR agent_id = ?) ORDER BY created_at DESC LIMIT 300', userId, agentId)
  if (all.length <= k) return all
  return all.map(m => ({ m, s: keywordScore(query, m.content + ' ' + (m.entity ?? '')) + (m.entity === 'You' ? 0.15 : 0) }))
    .sort((a, b) => b.s - a.s).slice(0, k).map(x => x.m)
}

/** Reads the latest exchange and stores durable facts about the owner and their world. */
export async function extractMemories(userId: string, conversationId: string) {
  if ((await getSetting('memory_auto')) === '0') return 0
  const msgs = await db().getAllAsync<{ role: string; content: string }>(
    'SELECT role, content FROM messages WHERE conversation_id = ? AND error = 0 ORDER BY created_at DESC LIMIT 6', conversationId,
  )
  const userText = msgs.filter(m => m.role === 'user').map(m => m.content).join('\n')
  if (userText.length < 40) return 0
  const existing = (await db().getAllAsync<{ content: string }>('SELECT content FROM memories WHERE user_id = ? ORDER BY created_at DESC LIMIT 60', userId)).map(m => m.content)
  const r = await askJson<{ facts: { entity: string; fact: string }[] }>(
    'You maintain a memory graph about the owner of this assistant. From the conversation, extract only durable facts the OWNER stated about themselves, their work, projects, people, preferences and goals. ' +
    'Skip anything temporary, anything the assistant said, and anything already known. Entity is who/what the fact is about ("You" for the owner, or a person/project/company name). ' +
    'Never store passwords, ID or card numbers, health conditions or other sensitive personal data. Return {"facts":[{"entity":"...","fact":"..."}]} with at most 5 facts, or {"facts":[]}.',
    `Already known:\n${existing.map(e => `- ${e}`).join('\n') || '(nothing)'}\n\nConversation (newest first):\n${msgs.map(m => `${m.role.toUpperCase()}: ${m.content.slice(0, 1500)}`).join('\n\n')}`,
    { tier: 'fast', maxTokens: 500 },
  )
  let n = 0
  for (const f of r.facts ?? []) if (f.fact && (await addMemory(userId, f.fact, f.entity, 'fact', 'auto'))) n++
  return n
}

export async function memoryGraph(userId: string) {
  const mems = await listMemories(userId)
  const groups = new Map<string, Memory[]>()
  for (const m of mems) {
    const e = m.entity || 'You'
    groups.set(e, [...(groups.get(e) ?? []), m])
  }
  return [...groups.entries()].sort((a, b) => (a[0] === 'You' ? -1 : b[0] === 'You' ? 1 : b[1].length - a[1].length))
}

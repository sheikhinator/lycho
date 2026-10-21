import { db, now, uid } from '@/lib/db'
import { route, type RouteResult } from '@/lib/ai/router'
import type { ChatMsg } from '@/lib/ai/providers'

export type Agent = {
  id: string; name: string; sector: string; role: string; fields: string; prompt: string
  source: 'core' | 'catalogue' | 'custom' | 'forge'; favorite: number; uses: number; tier: string | null
  created_at: number; updated_at: number
}
export type Conversation = {
  id: string; user_id: string; agent_id: string; title: string; pinned: number; model_override: string | null
  created_at: number; updated_at: number; agent_name?: string; last?: string | null; count?: number
}
export type Message = {
  id: string; conversation_id: string; role: 'user' | 'assistant' | 'system'; content: string
  provider: string | null; model: string | null; tier: string | null
  tokens_in: number | null; tokens_out: number | null; latency_ms: number | null; error: number; created_at: number
}

// ---------- agents ----------
export async function listAgents(q: string, sector: string | null, favOnly = false) {
  const where: string[] = []
  const params: (string | number)[] = []
  if (q.trim()) { where.push('(name LIKE ? OR role LIKE ? OR sector LIKE ?)'); const l = `%${q.trim()}%`; params.push(l, l, l) }
  if (sector) { where.push('sector = ?'); params.push(sector) }
  if (favOnly) where.push('favorite = 1')
  return db().getAllAsync<Agent>(
    `SELECT * FROM agents ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY CASE source WHEN 'core' THEN 0 WHEN 'custom' THEN 1 WHEN 'forge' THEN 2 ELSE 3 END, favorite DESC, uses DESC, name`,
    params,
  )
}
export const getAgent = (id: string) => db().getFirstAsync<Agent>('SELECT * FROM agents WHERE id = ?', id)
export async function sectorsWithCounts() {
  return db().getAllAsync<{ sector: string; n: number }>(
    `SELECT sector, COUNT(*) n FROM agents GROUP BY sector ORDER BY CASE sector WHEN 'Core' THEN 0 WHEN 'Custom' THEN 1 ELSE 2 END, sector`,
  )
}
export async function toggleFavorite(id: string) {
  await db().runAsync('UPDATE agents SET favorite = 1 - favorite WHERE id = ?', id)
}
export async function saveAgent(a: { id?: string; name: string; role: string; prompt: string; sector?: string; tier?: string | null }) {
  const t = now()
  if (a.id) {
    await db().runAsync('UPDATE agents SET name=?, role=?, prompt=?, tier=?, updated_at=? WHERE id=?', a.name, a.role, a.prompt, a.tier ?? null, t, a.id)
    return a.id
  }
  const id = `custom_${uid().slice(0, 8)}`
  await db().runAsync(
    'INSERT INTO agents (id,name,sector,role,fields,prompt,source,tier,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
    id, a.name, a.sector ?? 'Custom', a.role, '', a.prompt, 'custom', a.tier ?? null, t, t,
  )
  return id
}
export async function deleteAgent(id: string) {
  await db().runAsync("DELETE FROM agents WHERE id = ? AND source IN ('custom','forge')", id)
}

// ---------- conversations ----------
export async function listConversations(userId: string, q = '') {
  const like = `%${q.trim()}%`
  return db().getAllAsync<Conversation>(
    `SELECT c.*, a.name agent_name,
       (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY created_at DESC LIMIT 1) last,
       (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) count
     FROM conversations c LEFT JOIN agents a ON a.id = c.agent_id
     WHERE c.user_id = ? AND (c.title LIKE ? OR a.name LIKE ?)
     ORDER BY c.pinned DESC, c.updated_at DESC`,
    userId, like, like,
  )
}
export const getConversation = (id: string) =>
  db().getFirstAsync<Conversation>(
    'SELECT c.*, a.name agent_name FROM conversations c LEFT JOIN agents a ON a.id = c.agent_id WHERE c.id = ?', id,
  )
export async function createConversation(userId: string, agentId: string) {
  const id = uid()
  const t = now()
  await db().runAsync(
    'INSERT INTO conversations (id,user_id,agent_id,title,created_at,updated_at) VALUES (?,?,?,?,?,?)',
    id, userId, agentId, 'New chat', t, t,
  )
  await db().runAsync('UPDATE agents SET uses = uses + 1 WHERE id = ?', agentId)
  return id
}
export async function renameConversation(id: string, title: string) {
  await db().runAsync('UPDATE conversations SET title = ? WHERE id = ?', title.trim() || 'Untitled', id)
}
export async function setConversationModel(id: string, override: string | null) {
  await db().runAsync('UPDATE conversations SET model_override = ? WHERE id = ?', override, id)
}
export async function togglePin(id: string) {
  await db().runAsync('UPDATE conversations SET pinned = 1 - pinned WHERE id = ?', id)
}
export async function deleteConversation(id: string) {
  await db().withTransactionAsync(async () => {
    await db().runAsync('DELETE FROM messages WHERE conversation_id = ?', id)
    await db().runAsync('DELETE FROM conversations WHERE id = ?', id)
  })
}
export const listMessages = (conversationId: string) =>
  db().getAllAsync<Message>('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at', conversationId)

async function addMessage(m: Omit<Message, 'id' | 'created_at'>) {
  const id = uid()
  const t = now()
  await db().runAsync(
    `INSERT INTO messages (id,conversation_id,role,content,provider,model,tier,tokens_in,tokens_out,latency_ms,error,created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    id, m.conversation_id, m.role, m.content, m.provider, m.model, m.tier, m.tokens_in, m.tokens_out, m.latency_ms, m.error, t,
  )
  await db().runAsync('UPDATE conversations SET updated_at = ? WHERE id = ?', t, m.conversation_id)
  return id
}
export async function deleteMessage(id: string) {
  await db().runAsync('DELETE FROM messages WHERE id = ?', id)
}

const HISTORY = 30

/** Saves the user's message, routes the conversation to the best model, saves and returns the reply. */
export async function sendMessage(conversationId: string, text: string, opts: { regenerate?: boolean } = {}) {
  const conv = await getConversation(conversationId)
  if (!conv) throw new Error('Conversation not found')
  const agent = await getAgent(conv.agent_id)
  if (!opts.regenerate) {
    await addMessage({ conversation_id: conversationId, role: 'user', content: text, provider: null, model: null, tier: null, tokens_in: null, tokens_out: null, latency_ms: null, error: 0 })
  }
  const history = (await listMessages(conversationId)).filter(m => !m.error).slice(-HISTORY)
  const memories = await db().getAllAsync<{ content: string }>(
    'SELECT content FROM memories WHERE user_id = ? AND (agent_id IS NULL OR agent_id = ?) ORDER BY created_at DESC LIMIT 20',
    conv.user_id, conv.agent_id,
  )
  const system =
    (agent?.prompt ?? 'You are a helpful LYCHO agent.') +
    `\n\nCurrent date: ${new Date().toDateString()}.` +
    (memories.length ? `\n\nThings you know about the owner:\n${memories.map(m => `- ${m.content}`).join('\n')}` : '')
  const msgs: ChatMsg[] = [{ role: 'system', content: system }, ...history.map(m => ({ role: m.role as ChatMsg['role'], content: m.content }))]

  let r: RouteResult
  try {
    r = await route(msgs, { agentTier: agent?.tier, override: conv.model_override })
  } catch (e: any) {
    await addMessage({ conversation_id: conversationId, role: 'assistant', content: String(e?.message ?? e), provider: null, model: null, tier: null, tokens_in: null, tokens_out: null, latency_ms: null, error: 1 })
    throw e
  }
  await addMessage({
    conversation_id: conversationId, role: 'assistant', content: r.text, provider: r.provider, model: r.model, tier: r.tier,
    tokens_in: r.tokensIn ?? null, tokens_out: r.tokensOut ?? null, latency_ms: r.latencyMs, error: 0,
  })
  if (conv.title === 'New chat') void autoTitle(conversationId, text)
  return r
}

/** Removes the last reply (and any failed replies after the last user message) so it can be generated again. */
export async function regenerate(conversationId: string) {
  const msgs = await listMessages(conversationId)
  for (let i = msgs.length - 1; i >= 0 && msgs[i].role !== 'user'; i--) await deleteMessage(msgs[i].id)
  return sendMessage(conversationId, '', { regenerate: true })
}

async function autoTitle(conversationId: string, firstMessage: string) {
  const fallback = firstMessage.replace(/\s+/g, ' ').slice(0, 48)
  try {
    const r = await route(
      [
        { role: 'system', content: 'Write a 2–5 word title for a chat that starts with the message below. Reply with the title only, no quotes or punctuation at the end.' },
        { role: 'user', content: firstMessage.slice(0, 800) },
      ],
      { tier: 'fast', maxTokens: 20 },
    )
    await renameConversation(conversationId, r.text.replace(/["'*#]/g, '').split('\n')[0].slice(0, 60) || fallback)
  } catch {
    await renameConversation(conversationId, fallback || 'New chat')
  }
}

// ---------- stats ----------
export async function dashboardStats(userId: string) {
  const d = db()
  const dayAgo = now() - 86_400_000
  const [agents, convs, msgs, today, custom] = await Promise.all([
    d.getFirstAsync<{ n: number }>('SELECT COUNT(*) n FROM agents'),
    d.getFirstAsync<{ n: number }>('SELECT COUNT(*) n FROM conversations WHERE user_id = ?', userId),
    d.getFirstAsync<{ n: number }>('SELECT COUNT(*) n FROM messages m JOIN conversations c ON c.id = m.conversation_id WHERE c.user_id = ?', userId),
    d.getFirstAsync<{ n: number; t: number | null }>(
      "SELECT COUNT(*) n, SUM(COALESCE(tokens_in,0)+COALESCE(tokens_out,0)) t FROM messages m JOIN conversations c ON c.id = m.conversation_id WHERE c.user_id = ? AND m.role = 'assistant' AND m.created_at > ?",
      userId, dayAgo,
    ),
    d.getFirstAsync<{ n: number }>("SELECT COUNT(*) n FROM agents WHERE source IN ('custom','forge')"),
  ])
  return { agents: agents?.n ?? 0, conversations: convs?.n ?? 0, messages: msgs?.n ?? 0, repliesToday: today?.n ?? 0, tokensToday: today?.t ?? 0, custom: custom?.n ?? 0 }
}

export async function routerHealth(sinceMs = 86_400_000) {
  return db().getAllAsync<{ provider: string; calls: number; ok: number; avg_ms: number | null; tokens: number | null }>(
    `SELECT provider, COUNT(*) calls, SUM(ok) ok, AVG(CASE WHEN ok = 1 THEN latency_ms END) avg_ms,
       SUM(COALESCE(tokens_in,0)+COALESCE(tokens_out,0)) tokens
     FROM router_log WHERE ts > ? GROUP BY provider`,
    now() - sinceMs,
  )
}

import { db, now, uid } from '@/lib/db'
import { cosine, embed, keywordScore } from '@/lib/ai/ask'

export type Doc = { id: string; title: string; source: string | null; kind: string; chars: number; embedded: number; created_at: number; chunks?: number }
export type Hit = { doc_id: string; title: string; content: string; score: number }

function chunk(text: string, size = 1200, overlap = 150): string[] {
  const clean = text.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim()
  if (clean.length <= size) return clean ? [clean] : []
  const out: string[] = []
  let i = 0
  while (i < clean.length) {
    let end = Math.min(clean.length, i + size)
    if (end < clean.length) {
      const para = clean.lastIndexOf('\n\n', end)
      const sent = clean.lastIndexOf('. ', end)
      const cut = para > i + size * 0.5 ? para : sent > i + size * 0.5 ? sent + 1 : end
      end = cut
    }
    out.push(clean.slice(i, end).trim())
    if (end >= clean.length) break
    i = Math.max(end - overlap, i + 1)
  }
  return out.filter(Boolean)
}

export async function addDoc(title: string, text: string, source: string | null, kind: string) {
  if (!text.trim()) throw new Error('The document is empty.')
  const id = uid()
  const parts = chunk(text)
  const vectors = await embed(parts)
  await db().withTransactionAsync(async () => {
    await db().runAsync('INSERT INTO knowledge_docs (id,title,source,kind,chars,embedded,created_at) VALUES (?,?,?,?,?,?,?)',
      id, title.trim() || 'Untitled', source, kind, text.length, vectors ? 1 : 0, now())
    for (let i = 0; i < parts.length; i++) {
      await db().runAsync('INSERT INTO knowledge_chunks (id,doc_id,idx,content,embedding) VALUES (?,?,?,?,?)',
        uid(), id, i, parts[i], vectors ? JSON.stringify(vectors[i].map(v => Math.round(v * 1e4) / 1e4)) : null)
    }
  })
  return { id, chunks: parts.length, embedded: !!vectors }
}

export const listDocs = () =>
  db().getAllAsync<Doc>('SELECT d.*, (SELECT COUNT(*) FROM knowledge_chunks c WHERE c.doc_id = d.id) chunks FROM knowledge_docs d ORDER BY created_at DESC')
export const docText = async (id: string) =>
  (await db().getAllAsync<{ content: string }>('SELECT content FROM knowledge_chunks WHERE doc_id = ? ORDER BY idx', id)).map(c => c.content).join('\n\n')
export async function deleteDoc(id: string) {
  await db().runAsync('DELETE FROM knowledge_chunks WHERE doc_id = ?', id)
  await db().runAsync('DELETE FROM knowledge_docs WHERE id = ?', id)
}
export async function docCount() {
  return (await db().getFirstAsync<{ n: number }>('SELECT COUNT(*) n FROM knowledge_docs'))?.n ?? 0
}

/** Adds embeddings to any documents saved before a Gemini key was available. */
export async function embedMissing() {
  const docs = await db().getAllAsync<{ id: string }>('SELECT id FROM knowledge_docs WHERE embedded = 0')
  let done = 0
  for (const d of docs) {
    const chunks = await db().getAllAsync<{ id: string; content: string }>('SELECT id, content FROM knowledge_chunks WHERE doc_id = ? ORDER BY idx', d.id)
    const v = await embed(chunks.map(c => c.content))
    if (!v) break
    for (let i = 0; i < chunks.length; i++) await db().runAsync('UPDATE knowledge_chunks SET embedding = ? WHERE id = ?', JSON.stringify(v[i]), chunks[i].id)
    await db().runAsync('UPDATE knowledge_docs SET embedded = 1 WHERE id = ?', d.id)
    done++
  }
  return done
}

/** Hybrid search: semantic when vectors exist, keyword otherwise. */
export async function searchKnowledge(query: string, k = 4, minScore = 0.25): Promise<Hit[]> {
  const rows = await db().getAllAsync<{ doc_id: string; title: string; content: string; embedding: string | null }>(
    'SELECT c.doc_id, d.title, c.content, c.embedding FROM knowledge_chunks c JOIN knowledge_docs d ON d.id = c.doc_id',
  )
  if (!rows.length) return []
  const hasVec = rows.some(r => r.embedding)
  const qv = hasVec ? (await embed([query]))?.[0] ?? null : null
  const scored = rows.map(r => {
    const kw = keywordScore(query, r.content + ' ' + r.title)
    const sem = qv && r.embedding ? cosine(qv, JSON.parse(r.embedding)) : 0
    return { doc_id: r.doc_id, title: r.title, content: r.content, score: qv ? sem * 0.8 + kw * 0.2 : kw }
  })
  const threshold = qv ? Math.max(minScore, 0.45) : minScore
  return scored.filter(s => s.score >= threshold).sort((a, b) => b.score - a.score).slice(0, k)
}

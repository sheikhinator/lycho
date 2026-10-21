import { db, now, uid } from '@/lib/db'

export type Persona = { id: string; name: string; tone: string; style: string; rules: string; created_at: number }

export const PRESETS: Omit<Persona, 'id' | 'created_at'>[] = [
  { name: 'Executive', tone: 'Confident, calm, decisive', style: 'Bottom line first, then 3–5 bullets. No fluff.', rules: 'Always end with a clear recommendation and next step.' },
  { name: 'Mentor', tone: 'Warm, patient, encouraging', style: 'Explain the why, use simple examples, check understanding.', rules: 'Never make the owner feel slow. Offer one exercise to practise.' },
  { name: 'Analyst', tone: 'Precise, neutral, evidence-led', style: 'Numbers, tables and assumptions stated explicitly.', rules: 'Separate facts from estimates. Flag missing data.' },
  { name: 'Hustler', tone: 'Energetic, bold, action-oriented', style: 'Short punchy lines, quick wins, deadlines.', rules: 'Push for action today; give the first three steps.' },
  { name: 'Diplomat', tone: 'Polished, tactful, respectful', style: 'Careful wording suitable for managers and clients.', rules: 'Offer a softer and a firmer version when drafting messages.' },
  { name: 'Roast', tone: 'Brutally honest, witty', style: 'Direct critique with humour, then the fix.', rules: 'Be blunt about weaknesses but always constructive.' },
]

export const listPersonas = () => db().getAllAsync<Persona>('SELECT * FROM personas ORDER BY name')
export const getPersona = (id: string) => db().getFirstAsync<Persona>('SELECT * FROM personas WHERE id = ?', id)

export async function savePersona(p: Omit<Persona, 'id' | 'created_at'> & { id?: string }) {
  if (p.id) {
    await db().runAsync('UPDATE personas SET name=?, tone=?, style=?, rules=? WHERE id=?', p.name, p.tone, p.style, p.rules, p.id)
    return p.id
  }
  const id = uid()
  await db().runAsync('INSERT INTO personas (id,name,tone,style,rules,created_at) VALUES (?,?,?,?,?,?)', id, p.name, p.tone, p.style, p.rules, now())
  return id
}
export async function deletePersona(id: string) {
  await db().runAsync('UPDATE agents SET persona_id = NULL WHERE persona_id = ?', id)
  await db().runAsync('DELETE FROM personas WHERE id = ?', id)
}
export async function assignPersona(agentId: string, personaId: string | null) {
  await db().runAsync('UPDATE agents SET persona_id = ? WHERE id = ?', personaId, agentId)
}
export async function seedPersonas() {
  const n = (await db().getFirstAsync<{ n: number }>('SELECT COUNT(*) n FROM personas'))?.n ?? 0
  if (n === 0) for (const p of PRESETS) await savePersona(p)
}
export function personaBlock(p: Persona | null) {
  if (!p) return ''
  return `\n\nPERSONA — ${p.name}\nTone: ${p.tone}\nStyle: ${p.style}${p.rules ? `\nRules: ${p.rules}` : ''}`
}

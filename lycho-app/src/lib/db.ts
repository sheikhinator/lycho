import * as SQLite from 'expo-sqlite'
import * as Crypto from 'expo-crypto'
import { SEED_AGENTS } from '@/data/agents'
import { CORE_AGENTS, buildPrompt } from '@/data/core'

export const DB_NAME = 'lycho.db'
// Bump when the bundled agent catalogue changes, so new agents get added on update.
const CATALOGUE_VERSION = 1

let _db: SQLite.SQLiteDatabase | null = null
export function db(): SQLite.SQLiteDatabase {
  if (!_db) _db = SQLite.openDatabaseSync(DB_NAME)
  return _db
}

export const uid = () => Crypto.randomUUID()
export const now = () => Date.now()

const MIGRATIONS: string[] = [
  // v1 — foundation
  `
  CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    pass_hash TEXT NOT NULL, salt TEXT NOT NULL, recovery_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user', status TEXT NOT NULL DEFAULT 'active',
    created_at INTEGER NOT NULL, last_login INTEGER
  );
  CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, sector TEXT NOT NULL, role TEXT NOT NULL,
    fields TEXT NOT NULL DEFAULT '', prompt TEXT NOT NULL, source TEXT NOT NULL DEFAULT 'catalogue',
    favorite INTEGER NOT NULL DEFAULT 0, uses INTEGER NOT NULL DEFAULT 0, tier TEXT,
    created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, agent_id TEXT NOT NULL, title TEXT NOT NULL,
    pinned INTEGER NOT NULL DEFAULT 0, model_override TEXT,
    created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_conv_user ON conversations(user_id, updated_at);
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY NOT NULL, conversation_id TEXT NOT NULL, role TEXT NOT NULL, content TEXT NOT NULL,
    provider TEXT, model TEXT, tier TEXT, tokens_in INTEGER, tokens_out INTEGER, latency_ms INTEGER,
    error INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_msg_conv ON messages(conversation_id, created_at);
  CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, agent_id TEXT, content TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'fact', created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS router_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER NOT NULL, provider TEXT NOT NULL, model TEXT NOT NULL,
    tier TEXT NOT NULL, ok INTEGER NOT NULL, status INTEGER, latency_ms INTEGER, error TEXT,
    tokens_in INTEGER, tokens_out INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_router_ts ON router_log(ts);
  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER NOT NULL, user_id TEXT, action TEXT NOT NULL, detail TEXT
  );
  `,
  // v2 — the full platform (knowledge, memory graph, personas, engines, scout/sense, labs, tools, traces)
  `
  ALTER TABLE messages ADD COLUMN rating INTEGER;
  ALTER TABLE messages ADD COLUMN trace_id TEXT;
  ALTER TABLE agents ADD COLUMN persona_id TEXT;
  ALTER TABLE agents ADD COLUMN elo REAL NOT NULL DEFAULT 1000;
  ALTER TABLE agents ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
  ALTER TABLE memories ADD COLUMN entity TEXT;
  ALTER TABLE memories ADD COLUMN source TEXT;
  CREATE TABLE IF NOT EXISTS knowledge_docs (id TEXT PRIMARY KEY NOT NULL, title TEXT NOT NULL, source TEXT, kind TEXT NOT NULL, chars INTEGER NOT NULL, embedded INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS knowledge_chunks (id TEXT PRIMARY KEY NOT NULL, doc_id TEXT NOT NULL, idx INTEGER NOT NULL, content TEXT NOT NULL, embedding TEXT);
  CREATE INDEX IF NOT EXISTS idx_chunks_doc ON knowledge_chunks(doc_id);
  CREATE TABLE IF NOT EXISTS personas (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, tone TEXT NOT NULL, style TEXT NOT NULL, rules TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS agent_versions (id TEXT PRIMARY KEY NOT NULL, agent_id TEXT NOT NULL, version INTEGER NOT NULL, prompt TEXT NOT NULL, reason TEXT, engine TEXT NOT NULL, created_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS engine_runs (id INTEGER PRIMARY KEY AUTOINCREMENT, engine TEXT NOT NULL, started_at INTEGER NOT NULL, finished_at INTEGER, ok INTEGER, summary TEXT);
  CREATE TABLE IF NOT EXISTS forge_proposals (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, sector TEXT NOT NULL, role TEXT NOT NULL, prompt TEXT NOT NULL, reason TEXT, status TEXT NOT NULL DEFAULT 'pending', created_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS syndicate (id TEXT PRIMARY KEY NOT NULL, kind TEXT NOT NULL, from_agent TEXT, to_agent TEXT NOT NULL, content TEXT NOT NULL, reply TEXT, ref TEXT, created_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS workflows (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', steps TEXT NOT NULL, schedule TEXT NOT NULL DEFAULT 'manual', last_run INTEGER, created_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS workflow_runs (id TEXT PRIMARY KEY NOT NULL, workflow_id TEXT NOT NULL, input TEXT, output TEXT, log TEXT, ok INTEGER NOT NULL, created_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS scout_topics (id TEXT PRIMARY KEY NOT NULL, query TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, last_run INTEGER, created_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS scout_items (id TEXT PRIMARY KEY NOT NULL, topic_id TEXT NOT NULL, title TEXT NOT NULL, url TEXT NOT NULL UNIQUE, source TEXT, published INTEGER, summary TEXT, importance INTEGER, seen INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS sense_rules (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, kind TEXT NOT NULL, pattern TEXT NOT NULL, threshold REAL, active INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS alerts (id TEXT PRIMARY KEY NOT NULL, rule_id TEXT, title TEXT NOT NULL, body TEXT, link TEXT, read INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS training_examples (id TEXT PRIMARY KEY NOT NULL, agent_id TEXT NOT NULL, input TEXT NOT NULL, output TEXT NOT NULL, created_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS ab_tests (id TEXT PRIMARY KEY NOT NULL, prompt TEXT NOT NULL, a_label TEXT NOT NULL, b_label TEXT NOT NULL, a_out TEXT, b_out TEXT, a_ms INTEGER, b_ms INTEGER, winner TEXT, created_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS sim_runs (id TEXT PRIMARY KEY NOT NULL, agent_id TEXT NOT NULL, scenario TEXT NOT NULL, transcript TEXT NOT NULL, score REAL, verdict TEXT, created_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS compete_matches (id TEXT PRIMARY KEY NOT NULL, task TEXT NOT NULL, results TEXT NOT NULL, winner_id TEXT, created_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS tools (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, kind TEXT NOT NULL, description TEXT NOT NULL, config TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS traces (id TEXT PRIMARY KEY NOT NULL, kind TEXT NOT NULL, ref TEXT, title TEXT NOT NULL, steps TEXT NOT NULL, ok INTEGER NOT NULL DEFAULT 1, ms INTEGER, created_at INTEGER NOT NULL);
  CREATE INDEX IF NOT EXISTS idx_traces_ts ON traces(created_at);
  `,
]

export async function initDb(): Promise<void> {
  const d = db()
  await d.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;')
  const row = await d.getFirstAsync<{ user_version: number }>('PRAGMA user_version')
  let v = row?.user_version ?? 0
  while (v < MIGRATIONS.length) {
    await d.execAsync(MIGRATIONS[v])
    v++
    await d.execAsync(`PRAGMA user_version = ${v}`)
  }
  await seedAgents()
}

async function seedAgents() {
  const current = Number((await getSetting('catalogue_version')) ?? 0)
  if (current >= CATALOGUE_VERSION) return
  const d = db()
  const t = now()
  await d.withTransactionAsync(async () => {
    const stmt = await d.prepareAsync(
      `INSERT OR IGNORE INTO agents (id,name,sector,role,fields,prompt,source,tier,created_at,updated_at)
       VALUES ($id,$name,$sector,$role,$fields,$prompt,$source,$tier,$t,$t)`,
    )
    try {
      for (const a of [...CORE_AGENTS, ...SEED_AGENTS]) {
        const core = CORE_AGENTS.includes(a)
        await stmt.executeAsync({
          $id: a.id, $name: a.name, $sector: a.sector, $role: a.role, $fields: a.fields,
          $prompt: buildPrompt(a), $source: core ? 'core' : 'catalogue',
          $tier: ['lycho_prime', 'research', 'analyst', 'compliance'].includes(a.id) ? 'heavy' : null, $t: t,
        })
      }
    } finally {
      await stmt.finalizeAsync()
    }
  })
  await setSetting('catalogue_version', String(CATALOGUE_VERSION))
}

export async function getSetting(key: string): Promise<string | null> {
  const r = await db().getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', key)
  return r?.value ?? null
}
export async function setSetting(key: string, value: string) {
  await db().runAsync('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', key, value)
}
export async function getJson<T>(key: string, fallback: T): Promise<T> {
  const v = await getSetting(key)
  if (!v) return fallback
  try { return { ...fallback, ...JSON.parse(v) } as T } catch { return fallback }
}
export async function setJson(key: string, value: unknown) {
  await setSetting(key, JSON.stringify(value))
}

export async function audit(action: string, detail?: string | null, userId?: string | null) {
  try {
    await db().runAsync('INSERT INTO audit_log (ts,user_id,action,detail) VALUES (?,?,?,?)', now(), userId ?? null, action, detail ?? null)
  } catch { /* never block on audit */ }
}

export const TABLES = [
  'users', 'settings', 'agents', 'conversations', 'messages', 'memories', 'router_log', 'audit_log',
  'knowledge_docs', 'knowledge_chunks', 'personas', 'agent_versions', 'engine_runs', 'forge_proposals', 'syndicate',
  'workflows', 'workflow_runs', 'scout_topics', 'scout_items', 'sense_rules', 'alerts', 'training_examples',
  'ab_tests', 'sim_runs', 'compete_matches', 'tools', 'traces',
] as const

import { File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import * as DocumentPicker from 'expo-document-picker'
import { audit, db, DB_NAME, TABLES } from '@/lib/db'

// Backups are plain JSON of every table. API keys are never included — they stay in the keystore.
export async function exportBackup() {
  const data: Record<string, unknown[]> = {}
  for (const t of TABLES) data[t] = await db().getAllAsync(`SELECT * FROM ${t}`)
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
  const file = new File(Paths.cache, `lycho-backup-${stamp}.json`)
  if (file.exists) file.delete()
  file.create()
  file.write(JSON.stringify({ app: 'lycho', version: 1, exportedAt: Date.now(), data }))
  await audit('backup_export', file.name)
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Save LYCHO backup' })
  return file.uri
}

/** Replaces all on-phone data with a backup file. Returns row counts restored. */
export async function importBackup(): Promise<Record<string, number> | null> {
  const pick = await DocumentPicker.getDocumentAsync({ type: ['application/json', '*/*'], copyToCacheDirectory: true })
  if (pick.canceled || !pick.assets?.[0]) return null
  const text = await new File(pick.assets[0].uri).text()
  const parsed = JSON.parse(text)
  if (parsed?.app !== 'lycho' || !parsed.data) throw new Error('That file is not a LYCHO backup.')
  const counts: Record<string, number> = {}
  const d = db()
  await d.withTransactionAsync(async () => {
    for (const t of TABLES) {
      const rows: Record<string, unknown>[] = parsed.data[t] ?? []
      await d.runAsync(`DELETE FROM ${t}`)
      for (const row of rows) {
        const cols = Object.keys(row)
        if (!cols.length) continue
        await d.runAsync(
          `INSERT OR REPLACE INTO ${t} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`,
          cols.map(c => row[c] as any),
        )
      }
      counts[t] = rows.length
    }
  })
  await audit('backup_import', JSON.stringify(counts))
  return counts
}

export function databaseSizeBytes(): number {
  try {
    const f = new File(Paths.document, 'SQLite', DB_NAME)
    return f.exists ? (f.info().size ?? 0) : 0
  } catch {
    return 0
  }
}

export async function wipeEverything() {
  const d = db()
  await d.withTransactionAsync(async () => {
    for (const t of TABLES) await d.runAsync(`DELETE FROM ${t}`)
  })
}

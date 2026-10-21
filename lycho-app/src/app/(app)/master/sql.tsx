import React, { useState } from 'react'
import { KeyboardAvoidingView, ScrollView, Text, View } from 'react-native'
import { Btn, Chip, Field, Header, Row, Screen, T } from '@/components/ui'
import { audit, db, TABLES } from '@/lib/db'
import { useMasterGuard } from '@/lib/master'
import { C, F, S } from '@/theme'

// Read-only by default; write statements need the "Allow writes" switch.
export default function Sql() {
  const ok = useMasterGuard()
  const [sql, setSql] = useState('SELECT name, sector, uses FROM agents ORDER BY uses DESC LIMIT 20')
  const [rows, setRows] = useState<Record<string, unknown>[] | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [writes, setWrites] = useState(false)
  if (!ok) return null

  const run = async () => {
    setError(null); setInfo(null); setRows(null)
    const s = sql.trim().replace(/;+\s*$/, '')
    const isRead = /^(select|pragma|with|explain)\b/i.test(s)
    if (/pass_hash|recovery_hash|salt/i.test(s) && !/count\(/i.test(s)) return setError('Password hashes are not viewable here.')
    if (!isRead && !writes) return setError('This changes data. Turn on "Allow writes" first.')
    try {
      if (isRead) {
        const r = await db().getAllAsync<Record<string, unknown>>(s)
        setRows(r.slice(0, 200))
        setInfo(`${r.length} row${r.length === 1 ? '' : 's'}${r.length > 200 ? ' (showing 200)' : ''}`)
      } else {
        const r = await db().runAsync(s)
        await audit('sql_write', s.slice(0, 200))
        setInfo(`${r.changes} row(s) changed`)
      }
    } catch (e: any) { setError(e.message) }
  }

  const cols = rows?.length ? Object.keys(rows[0]) : []

  return (
    <Screen scroll>
      <KeyboardAvoidingView behavior="padding">
        <Header back kicker="Master Panel" title="SQL Console" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: S.md }}>
          {TABLES.filter(t => t !== 'users').map(t => <Chip key={t} label={t} onPress={() => setSql(`SELECT * FROM ${t} ORDER BY rowid DESC LIMIT 50`)} />)}
          <Chip label="users" onPress={() => setSql('SELECT id, name, email, role, status, created_at, last_login FROM users')} />
        </ScrollView>
        <Field value={sql} onChangeText={setSql} multiline autoCapitalize="none" autoCorrect={false} style={{ fontFamily: F.mono, fontSize: 13, minHeight: 110 }} />
        <Row style={{ gap: S.sm }}>
          <Btn title="Run" icon="play" onPress={run} style={{ flex: 1 }} />
          <Btn title={writes ? 'Writes ON' : 'Allow writes'} variant={writes ? 'danger' : 'subtle'} onPress={() => setWrites(!writes)} style={{ flex: 1 }} />
        </Row>
        {error ? <T style={{ color: C.red, marginTop: S.md }} selectable>{error}</T> : null}
        {info ? <T muted style={{ marginTop: S.md }}>{info}</T> : null}
        {rows?.length ? (
          <ScrollView horizontal style={{ marginTop: S.sm }}>
            <View>
              <Row style={{ borderBottomWidth: 1, borderBottomColor: C.gold }}>
                {cols.map(c => <Text key={c} style={{ width: 150, color: C.gold, fontFamily: F.mono, fontSize: 11, padding: 6 }}>{c}</Text>)}
              </Row>
              {rows.map((r, i) => (
                <Row key={i} style={{ borderBottomWidth: 1, borderBottomColor: C.border }}>
                  {cols.map(c => (
                    <Text key={c} selectable numberOfLines={3} style={{ width: 150, color: C.ivory, fontFamily: F.mono, fontSize: 11, padding: 6 }}>
                      {r[c] === null ? '∅' : String(r[c])}
                    </Text>
                  ))}
                </Row>
              ))}
            </View>
          </ScrollView>
        ) : null}
      </KeyboardAvoidingView>
    </Screen>
  )
}

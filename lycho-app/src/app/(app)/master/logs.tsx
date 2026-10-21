import React, { useCallback, useState } from 'react'
import { FlatList, Text, View } from 'react-native'
import { useFocusEffect, useLocalSearchParams } from 'expo-router'
import { Chip, Header, Row, Screen, T } from '@/components/ui'
import { db } from '@/lib/db'
import { useMasterGuard } from '@/lib/master'
import { C, F, S } from '@/theme'

type RLog = { id: number; ts: number; provider: string; model: string; tier: string; ok: number; status: number | null; latency_ms: number | null; error: string | null; tokens_in: number | null; tokens_out: number | null }
type ALog = { id: number; ts: number; user_id: string | null; action: string; detail: string | null }

const time = (t: number) => new Date(t).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })

export default function Logs() {
  const ok = useMasterGuard()
  const params = useLocalSearchParams<{ tab?: string }>()
  const [tab, setTab] = useState<'router' | 'audit'>(params.tab === 'audit' ? 'audit' : 'router')
  const [failedOnly, setFailedOnly] = useState(false)
  const [rlog, setRlog] = useState<RLog[]>([])
  const [alog, setAlog] = useState<ALog[]>([])

  const load = useCallback(() => {
    void db().getAllAsync<RLog>(`SELECT * FROM router_log ${failedOnly ? 'WHERE ok = 0' : ''} ORDER BY id DESC LIMIT 200`).then(setRlog)
    void db().getAllAsync<ALog>('SELECT * FROM audit_log ORDER BY id DESC LIMIT 200').then(setAlog)
  }, [failedOnly])
  useFocusEffect(load)
  if (!ok) return null

  return (
    <Screen pad={false}>
      <View style={{ paddingHorizontal: S.lg }}>
        <Header back kicker="Master Panel" title="Logs" />
        <Row style={{ marginBottom: S.md }}>
          <Chip label="Router" active={tab === 'router'} onPress={() => setTab('router')} />
          <Chip label="Audit" active={tab === 'audit'} onPress={() => setTab('audit')} />
          {tab === 'router' ? <Chip label="Failures only" active={failedOnly} onPress={() => setFailedOnly(!failedOnly)} /> : null}
        </Row>
      </View>
      {tab === 'router' ? (
        <FlatList
          data={rlog} keyExtractor={r => String(r.id)} contentContainerStyle={{ paddingHorizontal: S.lg, paddingBottom: 40 }}
          ListEmptyComponent={<T muted>No calls logged.</T>}
          renderItem={({ item: r }) => (
            <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border }}>
              <Row>
                <Text style={{ color: r.ok ? C.green : C.red, fontFamily: F.mono, fontSize: 12, width: 34 }}>{r.ok ? 'OK' : r.status ?? 'ERR'}</Text>
                <Text style={{ color: C.ivory, fontFamily: F.mono, fontSize: 12, flex: 1 }} numberOfLines={1}>{r.provider} · {r.model}</Text>
                <T muted style={{ fontSize: 11 }}>{r.latency_ms ? `${(r.latency_ms / 1000).toFixed(1)}s` : ''}</T>
              </Row>
              <T muted style={{ fontSize: 11, marginLeft: 34 }}>{time(r.ts)} · {r.tier}{r.tokens_out ? ` · ${(r.tokens_in ?? 0) + r.tokens_out} tok` : ''}</T>
              {r.error ? <T selectable style={{ fontSize: 11.5, color: C.red, marginLeft: 34, marginTop: 2 }}>{r.error}</T> : null}
            </View>
          )}
        />
      ) : (
        <FlatList
          data={alog} keyExtractor={r => String(r.id)} contentContainerStyle={{ paddingHorizontal: S.lg, paddingBottom: 40 }}
          ListEmptyComponent={<T muted>No events logged.</T>}
          renderItem={({ item: a }) => (
            <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border }}>
              <Row>
                <Text style={{ color: /fail/.test(a.action) ? C.red : C.gold, fontFamily: F.mono, fontSize: 12, flex: 1 }}>{a.action}</Text>
                <T muted style={{ fontSize: 11 }}>{time(a.ts)}</T>
              </Row>
              {a.detail ? <T muted style={{ fontSize: 12 }}>{a.detail}</T> : null}
            </View>
          )}
        />
      )}
    </Screen>
  )
}

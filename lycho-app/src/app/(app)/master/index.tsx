import React, { useCallback, useEffect, useState } from 'react'
import { Alert, Text, View } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import Constants from 'expo-constants'
import { Logo } from '@/components/Logo'
import { Badge, Btn, Card, Divider, Field, Header, Label, ListItem, Row, Screen, Stat, T } from '@/components/ui'
import { biometricAvailable, biometricPrompt, checkMasterPin, masterPinSet, setMasterPin } from '@/lib/auth'
import { databaseSizeBytes, exportBackup, importBackup, wipeEverything } from '@/lib/backup'
import { audit, db, initDb, setSetting, TABLES } from '@/lib/db'
import { lockMaster, markMasterUnlocked, masterUnlocked } from '@/lib/master'
import { routerHealth } from '@/lib/store'
import { PROVIDER_INFO } from '@/lib/ai/providers'
import { configuredProviders, PROVIDERS, removeKey, type ProviderId } from '@/lib/vault'
import { useSession } from '@/lib/session'
import { C, F, S } from '@/theme'

function Gate({ onOpen }: { onOpen: () => void }) {
  const [hasPin, setHasPin] = useState<boolean | null>(null)
  const [pin, setPin] = useState('')
  const [pin2, setPin2] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void masterPinSet().then(async set => {
      setHasPin(set)
      if (set && (await biometricAvailable()) && (await biometricPrompt('Open Master Panel'))) { await audit('master_unlock', 'biometric'); onOpen() }
    })
  }, [onOpen])

  const submit = async () => {
    setBusy(true); setError(null)
    try {
      if (!hasPin) {
        if (pin !== pin2) throw new Error('PINs do not match.')
        await setMasterPin(pin)
        onOpen()
      } else if (await checkMasterPin(pin)) onOpen()
      else throw new Error('Wrong PIN.')
    } catch (e: any) { setError(e.message); setPin(''); setPin2('') } finally { setBusy(false) }
  }

  if (hasPin === null) return null
  return (
    <View style={{ flex: 1, justifyContent: 'center', paddingBottom: 80 }}>
      <View style={{ alignItems: 'center', marginBottom: S.xl }}>
        <Logo size={72} animated />
        <Text style={{ color: C.gold, fontFamily: F.display, fontSize: 36, letterSpacing: 4, marginTop: S.lg }}>MASTER PANEL</Text>
        <T muted style={{ textAlign: 'center' }}>{hasPin ? 'Enter your master PIN.' : 'Set a master PIN. It guards this panel, separate from your password.'}</T>
      </View>
      <Field value={pin} onChangeText={setPin} keyboardType="number-pad" secureTextEntry maxLength={8} placeholder="PIN" style={{ textAlign: 'center', fontSize: 22, letterSpacing: 8 }} />
      {!hasPin ? <Field value={pin2} onChangeText={setPin2} keyboardType="number-pad" secureTextEntry maxLength={8} placeholder="Confirm PIN" style={{ textAlign: 'center', fontSize: 22, letterSpacing: 8 }} /> : null}
      {error ? <T style={{ color: C.red, textAlign: 'center', marginBottom: S.md }}>{error}</T> : null}
      <Btn title={hasPin ? 'Unlock' : 'Set PIN & open'} icon="shield" onPress={submit} loading={busy} disabled={pin.length < 4} />
    </View>
  )
}

export default function Master() {
  const { user, signOut } = useSession()
  const [open, setOpen] = useState(masterUnlocked())
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [size, setSize] = useState(0)
  const [health, setHealth] = useState<Awaited<ReturnType<typeof routerHealth>>>([])
  const [keys, setKeys] = useState<ProviderId[]>([])

  const onOpen = useCallback(() => { markMasterUnlocked(); setOpen(true) }, [])

  const load = useCallback(async () => {
    const c: Record<string, number> = {}
    for (const t of TABLES) c[t] = (await db().getFirstAsync<{ n: number }>(`SELECT COUNT(*) n FROM ${t}`))?.n ?? 0
    setCounts(c)
    setSize(databaseSizeBytes())
    setHealth(await routerHealth(7 * 86_400_000))
    setKeys(await configuredProviders())
  }, [])
  useFocusEffect(useCallback(() => { if (open) void load() }, [open, load]))

  if (user?.role !== 'master') {
    return <Screen><Header back title="Master Panel" /><T muted>Only the master account can open this.</T></Screen>
  }
  if (!open) return <Screen><Header back title="" /><Gate onOpen={onOpen} /></Screen>

  const confirm = (title: string, body: string, action: () => Promise<void>, destructive = true) =>
    Alert.alert(title, body, [{ text: 'Cancel', style: 'cancel' }, { text: 'Confirm', style: destructive ? 'destructive' : 'default', onPress: () => { void action().then(load).catch(e => Alert.alert('Failed', e.message)) } }])

  const calls = health.reduce((n, h) => n + h.calls, 0)
  const ok = health.reduce((n, h) => n + h.ok, 0)
  const tokens = health.reduce((n, h) => n + (h.tokens ?? 0), 0)

  return (
    <Screen scroll>
      <Header back kicker="Owner only" title="Master Panel" right={<Badge label="unlocked" tone="green" />} />

      <Label style={{ marginBottom: S.sm }}>System</Label>
      <Row style={{ gap: S.sm }}>
        <Stat value={counts.users ?? 0} label="Accounts" />
        <Stat value={counts.agents ?? 0} label="Agents" />
        <Stat value={`${(size / 1024 / 1024).toFixed(1)}MB`} label="Database" />
      </Row>
      <Row style={{ gap: S.sm, marginTop: S.sm }}>
        <Stat value={counts.conversations ?? 0} label="Chats" />
        <Stat value={counts.messages ?? 0} label="Messages" />
        <Stat value={counts.memories ?? 0} label="Memories" />
      </Row>
      <T muted mono style={{ fontSize: 11, marginTop: S.sm }}>
        v{Constants.expoConfig?.version} · {Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(' · ')}
      </T>

      <Label style={{ marginTop: S.xl, marginBottom: S.sm }}>AI operations · 7 days</Label>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <T>{calls} calls · {calls ? Math.round((ok / calls) * 100) : 0}% success</T>
          <T muted>{tokens.toLocaleString()} tokens</T>
        </Row>
        <Divider />
        {PROVIDERS.map(p => {
          const h = health.find(x => x.provider === p)
          return (
            <Row key={p} style={{ paddingVertical: 5 }}>
              <Text style={{ color: C.ivory, fontFamily: F.sansMedium, flex: 1 }}>{PROVIDER_INFO[p].name}</Text>
              <Badge label={keys.includes(p) ? 'key set' : 'no key'} tone={keys.includes(p) ? 'green' : 'muted'} />
              <T muted style={{ fontSize: 12, width: 120, textAlign: 'right' }}>{h ? `${h.calls} calls · ${Math.round((h.ok / h.calls) * 100)}%` : '—'}</T>
            </Row>
          )
        })}
      </Card>
      <ListItem icon="activity" title="Router log" subtitle="Every model call, failure and fallback" onPress={() => router.push({ pathname: '/master/logs', params: { tab: 'router' } })} />
      <ListItem icon="list" title="Audit log" subtitle="Logins, key changes, backups, PIN attempts" onPress={() => router.push({ pathname: '/master/logs', params: { tab: 'audit' } })} />

      <Label style={{ marginTop: S.lg }}>Accounts & access</Label>
      <ListItem icon="users" title="Manage accounts" subtitle="Disable, reset passwords, remove" onPress={() => router.push('/master/users')} />
      <ListItem icon="hash" title="Change master PIN" onPress={() => { lockMaster(); void setSetting('master_pin', '').then(() => setOpen(false)) }} />

      <Label style={{ marginTop: S.lg }}>Agents</Label>
      <ListItem icon="cpu" title="Re-sync agent catalogue" subtitle="Restore any of the 378 built-in agents that were removed"
        onPress={() => confirm('Re-sync catalogue?', 'Missing built-in agents are added back. Your edits and custom agents are kept.', async () => { await setSetting('catalogue_version', '0'); await initDb() }, false)} />
      <ListItem icon="bar-chart" title="Reset agent usage counters"
        onPress={() => confirm('Reset usage counters?', 'Sets every agent’s chat count to zero.', async () => { await db().runAsync('UPDATE agents SET uses = 0') })} />

      <Label style={{ marginTop: S.lg }}>Data</Label>
      <ListItem icon="terminal" title="SQL console" subtitle="Inspect the on-phone database" onPress={() => router.push('/master/sql')} />
      <ListItem icon="download" title="Export full backup" onPress={() => exportBackup().catch(e => Alert.alert('Export failed', e.message))} />
      <ListItem icon="upload" title="Restore backup" onPress={() => confirm('Restore backup?', 'Replaces all data on this phone.', async () => { if (await importBackup()) await signOut() })} />
      <ListItem icon="zap" title="Optimise database" subtitle="Compact storage after big deletions"
        onPress={() => confirm('Optimise?', 'Runs VACUUM on the database.', async () => { await db().execAsync('VACUUM') }, false)} />
      <ListItem icon="trash" title="Clear router & audit logs"
        onPress={() => confirm('Clear logs?', 'Deletes the router and audit history.', async () => { await db().execAsync('DELETE FROM router_log; DELETE FROM audit_log;') })} />

      <Label style={{ marginTop: S.lg }}>Danger zone</Label>
      <ListItem icon="key" title="Remove all AI keys" danger
        onPress={() => confirm('Remove all keys?', 'Gemini, Groq and OpenRouter keys are deleted from this phone.', async () => { for (const p of PROVIDERS) await removeKey(p); await audit('keys_removed_all') })} />
      <ListItem icon="alert-octagon" title="Wipe everything" subtitle="Deletes all accounts, chats and agents. Keys are kept." danger
        onPress={() => confirm('Wipe everything?', 'This cannot be undone. Export a backup first if you might need it.', async () => { await wipeEverything(); lockMaster(); await signOut() })} />

      <Btn title="Lock panel" variant="ghost" icon="lock" style={{ marginTop: S.xl }} onPress={() => { lockMaster(); router.back() }} />
    </Screen>
  )
}

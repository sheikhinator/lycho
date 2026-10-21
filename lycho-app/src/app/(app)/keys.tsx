import React, { useCallback, useState } from 'react'
import { Alert, KeyboardAvoidingView, Linking, Pressable, Text, View } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { Badge, Btn, Card, Field, Header, Row, Screen, T } from '@/components/ui'
import { getKey, maskKey, PROVIDERS, removeKey, setKey, type ProviderId } from '@/lib/vault'
import { cachedModels, fetchModels, PROVIDER_INFO } from '@/lib/ai/providers'
import { audit } from '@/lib/db'
import { C, F, S } from '@/theme'

function ProviderCard({ p }: { p: ProviderId }) {
  const info = PROVIDER_INFO[p]
  const [saved, setSaved] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [models, setModels] = useState(0)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const load = useCallback(() => {
    void getKey(p).then(setSaved)
    void cachedModels(p).then(m => setModels(m.length))
  }, [p])
  useFocusEffect(load)

  const save = async () => {
    setBusy(true); setMsg(null)
    try {
      const ids = await fetchModels(p, draft.trim())
      await setKey(p, draft)
      await audit('key_saved', p)
      setDraft('')
      setMsg({ ok: true, text: `Connected — ${ids.length} models available.` })
      load()
    } catch (e: any) {
      setMsg({ ok: false, text: `Key rejected: ${e.message}` })
    } finally { setBusy(false) }
  }
  const refresh = async () => {
    setBusy(true); setMsg(null)
    try { const ids = await fetchModels(p); setMsg({ ok: true, text: `Refreshed — ${ids.length} models.` }); load() }
    catch (e: any) { setMsg({ ok: false, text: e.message }) } finally { setBusy(false) }
  }

  return (
    <Card gold={!!saved} style={{ marginBottom: S.md }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text style={{ color: C.ivory, fontFamily: F.display, fontSize: 24, letterSpacing: 1 }}>{info.name.toUpperCase()}</Text>
        <Badge label={saved ? 'Connected' : 'Not set'} tone={saved ? 'green' : 'muted'} />
      </Row>
      <T muted style={{ fontSize: 13, marginBottom: S.md }}>{info.hint}</T>
      {saved ? (
        <>
          <Row style={{ justifyContent: 'space-between', marginBottom: S.md }}>
            <T mono style={{ color: C.gold }}>{maskKey(saved)}</T>
            <T muted style={{ fontSize: 12 }}>{models} models</T>
          </Row>
          <Row style={{ gap: S.sm }}>
            <Btn small title="Refresh models" variant="ghost" icon="refresh-cw" onPress={refresh} loading={busy} style={{ flex: 1 }} />
            <Btn small title="Remove" variant="danger" icon="trash-2" style={{ flex: 1 }}
              onPress={() => Alert.alert(`Remove ${info.name} key?`, undefined, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: async () => { await removeKey(p); await audit('key_removed', p); load() } },
              ])} />
          </Row>
        </>
      ) : (
        <>
          <Field value={draft} onChangeText={setDraft} placeholder="Paste API key" autoCapitalize="none" autoCorrect={false} secureTextEntry />
          <Btn title="Save & test" onPress={save} loading={busy} disabled={draft.trim().length < 10} />
          <Pressable onPress={() => Linking.openURL(info.keyUrl)} style={{ marginTop: S.md }}>
            <T style={{ color: C.gold, fontSize: 13 }}>Get a {info.name} key →</T>
          </Pressable>
        </>
      )}
      {msg ? <T style={{ color: msg.ok ? C.green : C.red, fontSize: 13, marginTop: S.sm }}>{msg.text}</T> : null}
    </Card>
  )
}

export default function Keys() {
  return (
    <Screen scroll>
      <KeyboardAvoidingView behavior="padding">
        <Header back kicker="Intelligence" title="AI Keys" />
        <T muted style={{ marginBottom: S.lg }}>
          Keys are stored in Android's encrypted keystore on this phone only. They are never written to the database, backups or GitHub. Add as many as you like — the router switches between them.
        </T>
        {PROVIDERS.map(p => <ProviderCard key={p} p={p} />)}
        <View style={{ height: 24 }} />
      </KeyboardAvoidingView>
    </Screen>
  )
}

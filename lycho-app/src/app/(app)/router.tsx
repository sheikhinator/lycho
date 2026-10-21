import React, { useCallback, useState } from 'react'
import { Pressable, Switch, Text, View } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Badge, Card, Chip, Divider, Header, Icon, Label, Row, Screen, T } from '@/components/ui'
import { DEFAULT_PREFS, getPrefs, plan, savePrefs, TIER_LABEL, TIERS, type RouterPrefs, type Tier } from '@/lib/ai/router'
import { PROVIDER_INFO } from '@/lib/ai/providers'
import { configuredProviders, PROVIDERS, type ProviderId } from '@/lib/vault'
import { routerHealth } from '@/lib/store'
import { C, F, S } from '@/theme'

type Chain = Record<Tier, { provider: ProviderId; model: string }[]>
const TIER_DESC: Record<Tier, string> = {
  fast: 'Short questions and quick replies',
  balanced: 'Everyday work',
  heavy: 'Analysis, plans, code, long writing',
  long: 'Very long chats and documents',
}

export default function RouterScreen() {
  const [prefs, setPrefs] = useState<RouterPrefs>(DEFAULT_PREFS)
  const [chain, setChain] = useState<Chain | null>(null)
  const [have, setHave] = useState<ProviderId[]>([])
  const [health, setHealth] = useState<Awaited<ReturnType<typeof routerHealth>>>([])

  const load = useCallback(async () => {
    const p = await getPrefs()
    setPrefs(p)
    setHave(await configuredProviders())
    const c = {} as Chain
    for (const t of TIERS) c[t] = (await plan(t, { ...p, mode: 'auto' })).slice(0, 4)
    setChain(c)
    setHealth(await routerHealth())
  }, [])
  useFocusEffect(useCallback(() => { void load() }, [load]))

  const update = async (patch: Partial<RouterPrefs>) => {
    const next = { ...prefs, ...patch }
    setPrefs(next)
    await savePrefs(next)
    void load()
  }

  return (
    <Screen scroll>
      <Header back kicker="Intelligence" title="Model Router" />

      <Label>Mode</Label>
      <Row style={{ marginTop: S.sm, marginBottom: S.md }}>
        <Chip label="Auto switching" active={prefs.mode === 'auto'} onPress={() => update({ mode: 'auto' })} />
        <Chip label="Manual" active={prefs.mode === 'manual'} onPress={() => update({ mode: 'manual' })} />
      </Row>
      {prefs.mode === 'manual' ? (
        <Card onPress={() => router.push({ pathname: '/model-picker', params: { target: 'manual' } })} style={{ marginBottom: S.md }}>
          <Label>Fixed model</Label>
          <T mono style={{ color: C.gold, marginTop: 4 }}>{prefs.manual ?? 'Tap to choose'}</T>
          <T muted style={{ fontSize: 12, marginTop: 4 }}>If it fails, LYCHO still falls back to auto routing so you always get an answer.</T>
        </Card>
      ) : (
        <T muted style={{ marginBottom: S.md }}>
          Each message is sorted into a tier, sent to the best model for it, and moved to the next one if a provider is slow, down or rate-limited.
        </T>
      )}

      <Label>Prefer provider</Label>
      <Row style={{ marginTop: S.sm, marginBottom: S.md, flexWrap: 'wrap', rowGap: 8 }}>
        <Chip label="No preference" active={prefs.preferred === 'none'} onPress={() => update({ preferred: 'none' })} />
        {PROVIDERS.map(p => <Chip key={p} label={PROVIDER_INFO[p].name} active={prefs.preferred === p} onPress={() => update({ preferred: p })} />)}
      </Row>

      <Row style={{ justifyContent: 'space-between', marginBottom: S.md }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: C.ivory, fontFamily: F.sansMedium }}>OpenRouter free models only</Text>
          <T muted style={{ fontSize: 12 }}>Never spend OpenRouter credits</T>
        </View>
        <Switch value={prefs.freeOnly} onValueChange={v => update({ freeOnly: v })} trackColor={{ true: C.gold, false: C.border }} thumbColor={C.ivory} />
      </Row>

      <Label>Creativity</Label>
      <Row style={{ marginTop: S.sm, marginBottom: S.lg }}>
        {[[0.2, 'Precise'], [0.5, 'Focused'], [0.7, 'Balanced'], [1.0, 'Creative']].map(([v, l]) => (
          <Chip key={l} label={l as string} active={prefs.temperature === v} onPress={() => update({ temperature: v as number })} />
        ))}
      </Row>

      <Divider />
      <Label style={{ marginTop: S.md, marginBottom: S.sm }}>Live routing chain</Label>
      {!have.length ? <T muted>Add at least one key to see routing.</T> : null}
      {chain && have.length ? TIERS.map(t => (
        <Card key={t} style={{ marginBottom: S.sm }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={{ color: C.ivory, fontFamily: F.display, fontSize: 22, letterSpacing: 1 }}>{TIER_LABEL[t].toUpperCase()}</Text>
            <T muted style={{ fontSize: 12 }}>{TIER_DESC[t]}</T>
          </Row>
          {chain[t].map((c, i) => (
            <Pressable key={`${c.provider}${c.model}${i}`} onPress={() => router.push({ pathname: '/model-picker', params: { target: `pin:${c.provider}:${t}` } })}>
              <Row style={{ paddingVertical: 6 }}>
                <Text style={{ color: i === 0 ? C.gold : C.muted, fontFamily: F.mono, width: 22 }}>{i + 1}</Text>
                <View style={{ flex: 1 }}>
                  <T mono numberOfLines={1} style={{ fontSize: 12.5, color: i === 0 ? C.ivory : C.soft }}>{c.model}</T>
                  <T muted style={{ fontSize: 11 }}>{PROVIDER_INFO[c.provider].name}{prefs.pins[`${c.provider}:${t}`] === c.model ? ' · pinned' : ''}</T>
                </View>
                <Icon name="edit-2" size={13} color={C.muted} />
              </Row>
            </Pressable>
          ))}
        </Card>
      )) : null}
      {Object.keys(prefs.pins).length ? (
        <Pressable onPress={() => update({ pins: {} })}><T style={{ color: C.gold, marginTop: S.sm }}>Clear all pinned models</T></Pressable>
      ) : null}

      <Divider />
      <Label style={{ marginTop: S.md, marginBottom: S.sm }}>Last 24 hours</Label>
      {health.length ? health.map(h => (
        <Row key={h.provider} style={{ paddingVertical: 6 }}>
          <Text style={{ color: C.ivory, fontFamily: F.sansMedium, flex: 1 }}>{PROVIDER_INFO[h.provider as ProviderId]?.name ?? h.provider}</Text>
          <Badge label={`${Math.round((h.ok / Math.max(1, h.calls)) * 100)}% ok`} tone={h.ok === h.calls ? 'green' : 'amber'} />
          <T muted style={{ fontSize: 12, marginLeft: 8, width: 110, textAlign: 'right' }}>{h.calls} calls · {h.avg_ms ? `${(h.avg_ms / 1000).toFixed(1)}s` : '—'}</T>
        </Row>
      )) : <T muted>No calls yet.</T>}
    </Screen>
  )
}

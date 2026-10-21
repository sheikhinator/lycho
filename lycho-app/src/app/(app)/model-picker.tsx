import React, { useEffect, useMemo, useState } from 'react'
import { FlatList, Pressable, Text, TextInput, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Chip, Header, Icon, Row, Screen, T } from '@/components/ui'
import { cachedModels, PROVIDER_INFO } from '@/lib/ai/providers'
import { getPrefs, savePrefs } from '@/lib/ai/router'
import { setConversationModel } from '@/lib/store'
import { configuredProviders, type ProviderId } from '@/lib/vault'
import { C, F, R, S } from '@/theme'

/**
 * Model chooser. `target` decides what the choice changes:
 *   manual            → the router's fixed model
 *   pin:<provider>:<tier> → pinned model for that provider+tier
 *   conv:<id>         → per-chat override
 */
export default function ModelPicker() {
  const { target = 'manual' } = useLocalSearchParams<{ target: string }>()
  const [parts] = useState(() => target.split(':'))
  const lockedProvider = parts[0] === 'pin' ? (parts[1] as ProviderId) : null
  const [providers, setProviders] = useState<ProviderId[]>([])
  const [filter, setFilter] = useState<ProviderId | null>(lockedProvider)
  const [models, setModels] = useState<{ provider: ProviderId; id: string }[]>([])
  const [q, setQ] = useState('')

  useEffect(() => {
    ;(async () => {
      const have = lockedProvider ? [lockedProvider] : await configuredProviders()
      setProviders(have)
      const all: { provider: ProviderId; id: string }[] = []
      for (const p of have) for (const id of await cachedModels(p)) all.push({ provider: p, id })
      setModels(all)
    })()
  }, [lockedProvider])

  const shown = useMemo(
    () => models.filter(m => (!filter || m.provider === filter) && (!q || m.id.toLowerCase().includes(q.toLowerCase()))),
    [models, filter, q],
  )

  const choose = async (m: { provider: ProviderId; id: string } | null) => {
    if (parts[0] === 'conv') {
      await setConversationModel(parts[1], m ? `${m.provider}:${m.id}` : null)
    } else {
      const prefs = await getPrefs()
      if (parts[0] === 'pin') {
        const key = `${parts[1]}:${parts[2]}` as keyof typeof prefs.pins
        const pins = { ...prefs.pins }
        if (m) pins[key] = m.id
        else delete pins[key]
        await savePrefs({ ...prefs, pins })
      } else {
        await savePrefs({ ...prefs, manual: m ? `${m.provider}:${m.id}` : null, mode: m ? 'manual' : 'auto' })
      }
    }
    router.back()
  }

  return (
    <Screen pad={false}>
      <View style={{ paddingHorizontal: S.lg }}>
        <Header back kicker={parts[0] === 'pin' ? `Pin ${parts[2]} model` : parts[0] === 'conv' ? 'This chat' : 'Fixed model'} title="Choose model" />
      </View>
      <Row style={{ marginHorizontal: S.lg, backgroundColor: C.deep, borderColor: C.border, borderWidth: 1, borderRadius: R.md, paddingHorizontal: 12 }}>
        <Icon name="search" size={16} color={C.muted} />
        <TextInput value={q} onChangeText={setQ} placeholder={`Search ${models.length} models`} placeholderTextColor={C.muted} autoCapitalize="none"
          selectionColor={C.gold} style={{ flex: 1, color: C.ivory, fontFamily: F.sans, fontSize: 15, paddingVertical: 11, marginLeft: 8 }} />
      </Row>
      {!lockedProvider ? (
        <Row style={{ paddingHorizontal: S.lg, paddingVertical: S.md }}>
          <Chip label="All" active={!filter} onPress={() => setFilter(null)} />
          {providers.map(p => <Chip key={p} label={PROVIDER_INFO[p].name} active={filter === p} onPress={() => setFilter(p)} />)}
        </Row>
      ) : <View style={{ height: S.md }} />}
      <FlatList
        data={shown}
        keyExtractor={m => `${m.provider}:${m.id}`}
        contentContainerStyle={{ paddingHorizontal: S.lg, paddingBottom: 40 }}
        ListHeaderComponent={
          <Pressable onPress={() => choose(null)} style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <Text style={{ color: C.gold, fontFamily: F.sansBold }}>Auto (let LYCHO decide)</Text>
          </Pressable>
        }
        ListEmptyComponent={<T muted style={{ marginTop: 24 }}>No models cached. Open AI Keys and tap “Refresh models”.</T>}
        renderItem={({ item }) => (
          <Pressable onPress={() => choose(item)} style={({ pressed }) => ({ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, opacity: pressed ? 0.6 : 1 })}>
            <T mono style={{ fontSize: 13 }}>{item.id}</T>
            <T muted style={{ fontSize: 11 }}>{PROVIDER_INFO[item.provider].name}{item.id.endsWith(':free') ? ' · free' : ''}</T>
          </Pressable>
        )}
      />
    </Screen>
  )
}

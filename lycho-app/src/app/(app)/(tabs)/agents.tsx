import React, { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Badge, Chip, Header, Icon, Row, Screen, T, tap } from '@/components/ui'
import { listAgents, sectorsWithCounts, type Agent } from '@/lib/store'
import { C, F, R, S } from '@/theme'

export default function Agents() {
  const [q, setQ] = useState('')
  const [sector, setSector] = useState<string | null>(null)
  const [fav, setFav] = useState(false)
  const [agents, setAgents] = useState<Agent[]>([])
  const [sectors, setSectors] = useState<{ sector: string; n: number }[]>([])

  const load = useCallback(() => { void listAgents(q, sector, fav).then(setAgents) }, [q, sector, fav])
  useEffect(load, [load])
  useFocusEffect(useCallback(() => { load(); void sectorsWithCounts().then(setSectors) }, [load]))

  return (
    <Screen pad={false}>
      <View style={{ paddingHorizontal: S.lg }}>
        <Header kicker={`${agents.length} shown`} title="Agents" right={
          <Pressable onPress={() => { tap(); router.push('/agent/edit') }} style={{ backgroundColor: C.gold, borderRadius: R.pill, padding: 8 }}>
            <Icon name="plus" color={C.void} />
          </Pressable>
        } />
        <Row style={{ backgroundColor: C.deep, borderColor: C.border, borderWidth: 1, borderRadius: R.md, paddingHorizontal: 12 }}>
          <Icon name="search" size={16} color={C.muted} />
          <TextInput value={q} onChangeText={setQ} placeholder="Search 370+ agents" placeholderTextColor={C.muted}
            selectionColor={C.gold} style={{ flex: 1, color: C.ivory, fontFamily: F.sans, fontSize: 15, paddingVertical: 11, marginLeft: 8 }} />
          {q ? <Pressable onPress={() => setQ('')}><Icon name="x" size={16} color={C.muted} /></Pressable> : null}
        </Row>
      </View>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: S.lg, paddingVertical: S.md }}>
          <Chip label="★ Favourites" active={fav} onPress={() => setFav(!fav)} />
          <Chip label="All" active={!sector} onPress={() => setSector(null)} />
          {sectors.map(s => <Chip key={s.sector} label={s.sector} count={s.n} active={sector === s.sector} onPress={() => setSector(sector === s.sector ? null : s.sector)} />)}
        </ScrollView>
      </View>
      <FlatList
        data={agents}
        keyExtractor={a => a.id}
        contentContainerStyle={{ paddingHorizontal: S.lg, paddingBottom: 32 }}
        initialNumToRender={20}
        ListEmptyComponent={<T muted style={{ textAlign: 'center', marginTop: 40 }}>No agents match.</T>}
        renderItem={({ item: a }) => (
          <Pressable onPress={() => { tap(); router.push({ pathname: '/agent/[id]', params: { id: a.id } }) }}
            style={({ pressed }) => ({ flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, opacity: pressed ? 0.7 : 1 })}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: a.source === 'core' ? C.goldDim : C.surface, alignItems: 'center', justifyContent: 'center', marginRight: S.md }}>
              <Text style={{ color: a.source === 'core' ? C.gold : C.soft, fontFamily: F.display, fontSize: 18 }}>{a.name.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Row style={{ gap: 6 }}>
                <Text style={{ color: C.ivory, fontFamily: F.sansMedium, fontSize: 15, flexShrink: 1 }} numberOfLines={1}>{a.name}</Text>
                {a.favorite ? <Icon name="star" size={12} color={C.gold} /> : null}
                {a.source !== 'catalogue' ? <Badge label={a.source} tone={a.source === 'core' ? 'gold' : 'green'} /> : null}
              </Row>
              <T muted numberOfLines={2} style={{ fontSize: 12.5, lineHeight: 17 }}>{a.role}</T>
            </View>
          </Pressable>
        )}
      />
    </Screen>
  )
}

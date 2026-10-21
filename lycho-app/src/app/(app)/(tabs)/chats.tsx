import React, { useCallback, useState } from 'react'
import { Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Btn, Empty, Header, Icon, Row, Screen, T, tap } from '@/components/ui'
import { deleteConversation, listConversations, togglePin, type Conversation } from '@/lib/store'
import { useSession } from '@/lib/session'
import { C, F, R, S } from '@/theme'

function ago(t: number) {
  const s = (Date.now() - t) / 1000
  if (s < 60) return 'now'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  if (s < 604800) return `${Math.floor(s / 86400)}d`
  return new Date(t).toLocaleDateString()
}

export default function Chats() {
  const { user } = useSession()
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Conversation[]>([])
  const load = useCallback(() => { if (user) void listConversations(user.id, q).then(setItems) }, [user, q])
  useFocusEffect(load)

  const menu = (c: Conversation) =>
    Alert.alert(c.title, undefined, [
      { text: c.pinned ? 'Unpin' : 'Pin', onPress: async () => { await togglePin(c.id); load() } },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteConversation(c.id); load() } },
      { text: 'Cancel', style: 'cancel' },
    ])

  return (
    <Screen>
      <Header kicker="History" title="Chats" right={
        <Pressable onPress={() => { tap(); router.push('/agents') }} style={{ backgroundColor: C.gold, borderRadius: R.pill, padding: 8 }}>
          <Icon name="edit" color={C.void} />
        </Pressable>
      } />
      <Row style={{ backgroundColor: C.deep, borderColor: C.border, borderWidth: 1, borderRadius: R.md, paddingHorizontal: 12, marginBottom: S.sm }}>
        <Icon name="search" size={16} color={C.muted} />
        <TextInput value={q} onChangeText={setQ} onEndEditing={load} placeholder="Search chats" placeholderTextColor={C.muted}
          selectionColor={C.gold} style={{ flex: 1, color: C.ivory, fontFamily: F.sans, fontSize: 15, paddingVertical: 11, marginLeft: 8 }} />
      </Row>
      <FlatList
        data={items}
        keyExtractor={c => c.id}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListEmptyComponent={<Empty icon="message-square" title="No chats yet" body="Pick an agent and start talking. Everything stays on this phone."
          action={<Btn title="Browse agents" icon="cpu" onPress={() => router.push('/agents')} />} />}
        renderItem={({ item: c }) => (
          <Pressable onPress={() => router.push({ pathname: '/chat/[id]', params: { id: c.id } })} onLongPress={() => menu(c)}
            style={({ pressed }) => ({ paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.border, opacity: pressed ? 0.7 : 1 })}>
            <Row>
              {c.pinned ? <Icon name="bookmark" size={13} color={C.gold} /> : null}
              <Text style={{ color: C.ivory, fontFamily: F.sansMedium, fontSize: 15, flex: 1, marginLeft: c.pinned ? 6 : 0 }} numberOfLines={1}>{c.title}</Text>
              <T muted style={{ fontSize: 12 }}>{ago(c.updated_at)}</T>
            </Row>
            <Text style={{ color: C.gold, fontFamily: F.mono, fontSize: 11, marginTop: 2 }}>{c.agent_name}</Text>
            {c.last ? <T muted numberOfLines={1} style={{ fontSize: 13 }}>{c.last.replace(/[#*`>\n]+/g, ' ')}</T> : null}
          </Pressable>
        )}
      />
      <View />
    </Screen>
  )
}

import { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../lib/supabase'
import ConversationCard from '../components/ConversationCard'

const GOLD = '#C9A84C'
const BG = '#070707'
const SURFACE = '#141414'
const BORDER = '#2a2a2a'
const IVORY = '#F0EBE1'
const MUTED = '#6b6b6b'

interface Convo { id: string; contact_identifier: string; channel: string; status: string; created_at: string; metadata: Record<string, unknown> }

export default function ConversationsScreen() {
  const [convos, setConvos] = useState<Convo[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function loadConvos() {
    const { data } = await supabase
      .from('conversations')
      .select('id, contact_identifier, channel, status, created_at, metadata')
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) setConvos(data as Convo[])
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { loadConvos() }, [])

  const filtered = convos.filter(c =>
    c.contact_identifier.toLowerCase().includes(search.toLowerCase()) ||
    c.channel.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <View style={styles.container}><Text style={styles.loading}>Loading...</Text></View>

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CONVERSATIONS</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search conversations..."
        placeholderTextColor={MUTED}
        value={search}
        onChangeText={setSearch}
      />
      {filtered.length === 0 ? (
        <Text style={styles.empty}>No conversations found</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={c => c.id}
          contentContainerStyle={{ padding: 20 }}
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); loadConvos() }}
          renderItem={({ item: c }) => (
            <TouchableOpacity onPress={() => router.push(`/conversations/${c.id}` as never)}>
              <ConversationCard
                contactName={c.contact_identifier}
                agentName=""
                lastMessage=""
                status={(c.status as 'open' | 'resolved' | 'escalated') || 'open'}
                channel={c.channel}
                timeAgo={new Date(c.created_at).toLocaleDateString()}
              />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, paddingTop: 56 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', color: MUTED },
  title: { color: GOLD, fontSize: 28, fontWeight: '700', letterSpacing: 4, paddingHorizontal: 20, marginBottom: 16 },
  searchInput: { marginHorizontal: 20, marginBottom: 16, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, borderRadius: 8, padding: 12, color: IVORY, fontSize: 14 },
  empty: { color: MUTED, textAlign: 'center', marginTop: 40, fontSize: 14 },
})

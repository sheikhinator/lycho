import { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../lib/supabase'

const GOLD = '#C9A84C'
const BG = '#070707'
const SURFACE = '#141414'
const BORDER = '#2a2a2a'
const IVORY = '#F0EBE1'
const MUTED = '#6b6b6b'

interface Convo { id: string; contact_identifier: string; channel: string; status: string; created_at: string; metadata: Record<string, unknown> }

export default function ConversationsScreen() {
  const [convos, setConvos] = useState<Convo[]>([])
  const [refreshing, setRefreshing] = useState(false)

  async function loadConvos() {
    setRefreshing(true)
    const { data } = await supabase
      .from('conversations')
      .select('id, contact_identifier, channel, status, created_at, metadata')
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) setConvos(data as Convo[])
    setRefreshing(false)
  }

  useEffect(() => { loadConvos() }, [])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CONVERSATIONS</Text>
      <FlatList
        data={convos}
        keyExtractor={c => c.id}
        contentContainerStyle={{ padding: 20 }}
        refreshing={refreshing}
        onRefresh={loadConvos}
        ListEmptyComponent={<Text style={styles.empty}>No conversations yet</Text>}
        renderItem={({ item: c }) => {
          const score = (c.metadata?.lead_score as number) ?? 0
          return (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`/conversations/${c.id}` as never)}>
              <View style={styles.row}>
                <Text style={styles.contact}>{c.contact_identifier}</Text>
                {score >= 85 && <Text style={styles.hot}>🔥 Hot</Text>}
              </View>
              <Text style={styles.meta}>{c.channel} · {c.status} · {new Date(c.created_at).toLocaleDateString()}</Text>
              <Text style={styles.score}>Lead score: {score}/100</Text>
            </TouchableOpacity>
          )
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, paddingTop: 56 },
  title: { color: GOLD, fontSize: 28, fontWeight: '700', letterSpacing: 4, paddingHorizontal: 20, marginBottom: 16 },
  card: { backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 14, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  contact: { color: IVORY, fontSize: 14, fontWeight: '600' },
  hot: { fontSize: 12 },
  meta: { color: MUTED, fontSize: 12, textTransform: 'capitalize', marginBottom: 2 },
  score: { color: MUTED, fontSize: 11 },
  empty: { color: MUTED, textAlign: 'center', marginTop: 40 },
})

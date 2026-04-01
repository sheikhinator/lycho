import { useEffect, useState } from 'react'
import { View, Text, FlatList, StyleSheet } from 'react-native'
import { supabase } from '../lib/supabase'

const GOLD = '#C9A84C'
const BG = '#070707'
const SURFACE = '#141414'
const BORDER = '#2a2a2a'
const IVORY = '#F0EBE1'
const MUTED = '#6b6b6b'

interface Agent { id: string; display_name: string; agent_type: string; status: string; interactions_count: number }

export default function AgentsScreen() {
  const [agents, setAgents] = useState<Agent[]>([])

  useEffect(() => {
    supabase.from('agents').select('id, display_name, agent_type, status, interactions_count').then(({ data }) => {
      if (data) setAgents(data)
    })
  }, [])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AGENTS</Text>
      <FlatList
        data={agents}
        keyExtractor={a => a.id}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={<Text style={styles.empty}>No agents deployed yet</Text>}
        renderItem={({ item: a }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.name}>{a.display_name}</Text>
              <View style={[styles.badge, a.status === 'active' && styles.badgeActive]}>
                <Text style={[styles.badgeText, a.status === 'active' && styles.badgeTextActive]}>{a.status}</Text>
              </View>
            </View>
            <Text style={styles.type}>{a.agent_type.replace(/_/g, ' ')}</Text>
            <Text style={styles.meta}>{a.interactions_count ?? 0} interactions</Text>
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, paddingTop: 56 },
  title: { color: GOLD, fontSize: 28, fontWeight: '700', letterSpacing: 4, paddingHorizontal: 20, marginBottom: 16 },
  card: { backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 16, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  name: { color: IVORY, fontSize: 15, fontWeight: '600' },
  type: { color: MUTED, fontSize: 12, textTransform: 'capitalize', marginBottom: 4 },
  meta: { color: MUTED, fontSize: 12 },
  badge: { backgroundColor: '#1c1c1c', borderWidth: 1, borderColor: BORDER, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeActive: { backgroundColor: 'rgba(74,222,128,0.1)', borderColor: 'rgba(74,222,128,0.3)' },
  badgeText: { color: MUTED, fontSize: 11 },
  badgeTextActive: { color: '#4ade80' },
  empty: { color: MUTED, textAlign: 'center', marginTop: 40 },
})

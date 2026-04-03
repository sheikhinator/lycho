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

interface Agent { id: string; display_name: string; agent_type: string; status: string; interactions_count: number }

export default function AgentsScreen() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [refreshing, setRefreshing] = useState(false)

  async function loadAgents() {
    setRefreshing(true)
    const { data } = await supabase.from('agents').select('id, display_name, agent_type, status, interactions_count')
    if (data) setAgents(data)
    setRefreshing(false)
  }

  useEffect(() => { loadAgents() }, [])

  async function toggleAgentStatus(agent: Agent) {
    const newStatus = agent.status === 'active' ? 'paused' : 'active'
    const { error } = await supabase.from('agents').update({ status: newStatus }).eq('id', agent.id)
    if (error) return
    setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, status: newStatus } : a))
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>AGENTS</Text>
        <TouchableOpacity style={styles.deployBtn} onPress={() => router.push('/agents/new' as never)}>
          <Text style={styles.deployBtnText}>+ Deploy</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={agents}
        keyExtractor={a => a.id}
        contentContainerStyle={{ padding: 20 }}
        refreshing={refreshing}
        onRefresh={loadAgents}
        ListEmptyComponent={<Text style={styles.empty}>No agents deployed yet. Tap Deploy to create one.</Text>}
        renderItem={({ item: a }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/agents/${a.id}` as never)}>
            <View style={styles.row}>
              <Text style={styles.name}>{a.display_name}</Text>
              <View style={[styles.badge, a.status === 'active' && styles.badgeActive]}>
                <Text style={[styles.badgeText, a.status === 'active' && styles.badgeTextActive]}>{a.status}</Text>
              </View>
            </View>
            <Text style={styles.type}>{a.agent_type.replace(/_/g, ' ')}</Text>
            <Text style={styles.meta}>{a.interactions_count ?? 0} interactions</Text>
            <TouchableOpacity
              style={[styles.toggleBtn, a.status === 'active' ? styles.pauseBtn : styles.deployBtnSmall]}
              onPress={(e) => { e.stopPropagation(); toggleAgentStatus(a) }}
            >
              <Text style={styles.toggleBtnText}>
                {a.status === 'active' ? 'Pause' : 'Deploy'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, paddingTop: 56 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  title: { color: GOLD, fontSize: 28, fontWeight: '700', letterSpacing: 4 },
  deployBtn: { backgroundColor: 'rgba(201,168,76,0.15)', borderWidth: 1, borderColor: GOLD, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  deployBtnText: { color: GOLD, fontSize: 13, fontWeight: '600' },
  card: { backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 16, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  name: { color: IVORY, fontSize: 15, fontWeight: '600' },
  type: { color: MUTED, fontSize: 12, textTransform: 'capitalize', marginBottom: 4 },
  meta: { color: MUTED, fontSize: 12, marginBottom: 10 },
  badge: { backgroundColor: '#1c1c1c', borderWidth: 1, borderColor: BORDER, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeActive: { backgroundColor: 'rgba(74,222,128,0.1)', borderColor: 'rgba(74,222,128,0.3)' },
  badgeText: { color: MUTED, fontSize: 11 },
  badgeTextActive: { color: '#4ade80' },
  toggleBtn: { borderRadius: 6, paddingVertical: 8, alignItems: 'center' },
  pauseBtn: { backgroundColor: 'rgba(251,191,36,0.1)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)' },
  deployBtnSmall: { backgroundColor: 'rgba(74,222,128,0.1)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)' },
  toggleBtnText: { fontSize: 12, fontWeight: '600' },
  empty: { color: MUTED, textAlign: 'center', marginTop: 40 },
})

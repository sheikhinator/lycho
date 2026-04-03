import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { supabase } from '../../lib/supabase'

const GOLD = '#C9A84C'
const BG = '#070707'
const SURFACE = '#141414'
const BORDER = '#2a2a2a'
const IVORY = '#F0EBE1'
const MUTED = '#6b6b6b'

export default function AgentDetailScreen() {
  const { id } = useLocalSearchParams()
  const [agent, setAgent] = useState<{ display_name: string; agent_type: string; status: string; interactions_count: number; channels: string[] } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAgent()
  }, [id])

  async function loadAgent() {
    if (!id) return
    const { data } = await supabase
      .from('agents')
      .select('display_name, agent_type, status, interactions_count, channels')
      .eq('id', id)
      .single()
    if (data) setAgent(data)
    setLoading(false)
  }

  async function toggleStatus() {
    if (!agent || !id) return
    const newStatus = agent.status === 'active' ? 'paused' : 'active'
    const { error } = await supabase.from('agents').update({ status: newStatus }).eq('id', id)
    if (error) { Alert.alert('Failed', error.message); return }
    setAgent(prev => prev ? { ...prev, status: newStatus } : null)
    Alert.alert('Success', `Agent ${newStatus === 'active' ? 'deployed' : 'paused'}`)
  }

  if (loading || !agent) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading…</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{agent.display_name}</Text>
        <Text style={styles.type}>{agent.agent_type.replace(/_/g, ' ')}</Text>
        <View style={[styles.badge, agent.status === 'active' && styles.badgeActive]}>
          <Text style={[styles.badgeText, agent.status === 'active' && styles.badgeTextActive]}>{agent.status}</Text>
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{agent.interactions_count ?? 0}</Text>
          <Text style={styles.statLabel}>Interactions</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{agent.channels?.length ?? 0}</Text>
          <Text style={styles.statLabel}>Channels</Text>
        </View>
      </View>

      <View style={styles.channels}>
        <Text style={styles.sectionTitle}>CHANNELS</Text>
        {(agent.channels ?? []).map((ch: string) => (
          <Text key={ch} style={styles.channelItem}>{ch}</Text>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.actionBtn, agent.status === 'active' ? styles.pauseBtn : styles.deployBtn]}
        onPress={toggleStatus}
      >
        <Text style={styles.actionBtnText}>
          {agent.status === 'active' ? 'Pause Agent' : 'Deploy Agent'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()}>
        <Text style={styles.secondaryBtnText}>Back</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, paddingTop: 56, padding: 20 },
  loading: { color: MUTED, textAlign: 'center', marginTop: 40 },
  header: { marginBottom: 24 },
  name: { color: IVORY, fontSize: 22, fontWeight: '700', marginBottom: 4 },
  type: { color: MUTED, fontSize: 14, textTransform: 'capitalize', marginBottom: 8 },
  badge: { backgroundColor: '#1c1c1c', borderWidth: 1, borderColor: BORDER, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  badgeActive: { backgroundColor: 'rgba(74,222,128,0.1)', borderColor: 'rgba(74,222,128,0.3)' },
  badgeText: { color: MUTED, fontSize: 12 },
  badgeTextActive: { color: '#4ade80' },
  stats: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 16, alignItems: 'center' },
  statValue: { color: GOLD, fontSize: 28, fontWeight: '700' },
  statLabel: { color: MUTED, fontSize: 12, marginTop: 4 },
  channels: { marginBottom: 24 },
  sectionTitle: { color: GOLD, fontSize: 11, letterSpacing: 3, marginBottom: 8 },
  channelItem: { color: IVORY, fontSize: 14, paddingVertical: 6, textTransform: 'capitalize', borderBottomWidth: 1, borderBottomColor: BORDER },
  actionBtn: { borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  deployBtn: { backgroundColor: GOLD },
  pauseBtn: { backgroundColor: 'rgba(251,191,36,0.15)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)' },
  actionBtnText: { fontWeight: '700', fontSize: 15 },
  secondaryBtn: { borderRadius: 10, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: BORDER },
  secondaryBtnText: { color: IVORY, fontSize: 14 },
})

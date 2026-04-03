import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Constants from 'expo-constants'

const API_URL = (Constants.expoConfig?.extra?.apiUrl as string) || 'https://lycho.vercel.app'
const GOLD = '#C9A84C'
const BG = '#070707'
const CARD = '#141414'
const BORDER = '#2a2a2a'
const IVORY = '#F0EBE1'
const MUTED = '#6b6b6b'

export default function AnalyticsScreen() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAnalytics() }, [])

  async function loadAnalytics() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
      if (!userData?.tenant_id) return

      const { data: agents } = await supabase.from('agents').select('id, display_name, interactions_count, status').eq('tenant_id', userData.tenant_id)
      const { data: convos } = await supabase.from('conversations').select('id, status, channel, created_at, metadata').eq('tenant_id', userData.tenant_id).order('created_at', { ascending: false }).limit(100)

      const totalConvos = convos?.length || 0
      const hotLeads = convos?.filter(c => (c.metadata as any)?.lead_score >= 85).length || 0
      const escalated = convos?.filter(c => c.status === 'escalated').length || 0
      const resolved = convos?.filter(c => c.status === 'resolved').length || 0
      const activeAgents = agents?.filter(a => a.status === 'active').length || 0

      // Channel breakdown
      const channels: Record<string, number> = {}
      convos?.forEach(c => { channels[c.channel] = (channels[c.channel] || 0) + 1 })

      setStats({
        totalConvos, hotLeads, escalated, resolved, activeAgents,
        totalInteractions: agents?.reduce((s, a) => s + (a.interactions_count || 0), 0) || 0,
        channels,
        topAgents: agents?.sort((a, b) => (b.interactions_count || 0) - (a.interactions_count || 0)).slice(0, 5) || [],
      })
    } catch {} finally { setLoading(false) }
  }

  if (loading) return <View style={styles.center}><Text style={{ color: GOLD }}>Loading...</Text></View>

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <Text style={styles.title}>ANALYTICS</Text>

      {/* KPI Row */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{stats?.totalConvos}</Text>
          <Text style={styles.kpiLabel}>Conversations</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{stats?.hotLeads}</Text>
          <Text style={styles.kpiLabel}>Hot Leads</Text>
        </View>
      </View>
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{stats?.activeAgents}</Text>
          <Text style={styles.kpiLabel}>Active Agents</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{stats?.totalInteractions}</Text>
          <Text style={styles.kpiLabel}>Interactions</Text>
        </View>
      </View>

      {/* Channel Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CHANNELS</Text>
        {stats?.channels && Object.entries(stats.channels).map(([ch, count]) => (
          <View key={ch} style={styles.row}>
            <Text style={styles.rowLabel}>{ch}</Text>
            <Text style={styles.rowValue}>{count as number}</Text>
          </View>
        ))}
      </View>

      {/* Top Agents */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TOP AGENTS</Text>
        {stats?.topAgents.map((a: any, i: number) => (
          <View key={a.id} style={styles.row}>
            <Text style={styles.rowLabel}>{i + 1}. {a.display_name}</Text>
            <Text style={styles.rowValue}>{a.interactions_count || 0}</Text>
          </View>
        ))}
      </View>

      {/* Status Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>STATUS</Text>
        <View style={styles.row}><Text style={styles.rowLabel}>Resolved</Text><Text style={[styles.rowValue, { color: '#4ade80' }]}>{stats?.resolved}</Text></View>
        <View style={styles.row}><Text style={styles.rowLabel}>Escalated</Text><Text style={[styles.rowValue, { color: '#ef4444' }]}>{stats?.escalated}</Text></View>
        <View style={styles.row}><Text style={styles.rowLabel}>Open</Text><Text style={[styles.rowValue, { color: GOLD }]}>{(stats?.totalConvos || 0) - (stats?.resolved || 0) - (stats?.escalated || 0)}</Text></View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, paddingTop: 56, paddingHorizontal: 20 },
  center: { flex: 1, backgroundColor: BG, justifyContent: 'center', alignItems: 'center' },
  title: { color: GOLD, fontSize: 24, fontWeight: '900', letterSpacing: 2, marginBottom: 20 },
  kpiRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  kpiCard: { flex: 1, backgroundColor: CARD, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: BORDER, alignItems: 'center' },
  kpiValue: { color: GOLD, fontSize: 28, fontWeight: '900' },
  kpiLabel: { color: MUTED, fontSize: 12, marginTop: 4 },
  section: { backgroundColor: CARD, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: BORDER },
  sectionTitle: { color: IVORY, fontSize: 14, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: BORDER },
  rowLabel: { color: IVORY, fontSize: 14 },
  rowValue: { color: GOLD, fontSize: 14, fontWeight: '600' },
})

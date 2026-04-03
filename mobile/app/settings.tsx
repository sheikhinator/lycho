import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native'
import { router } from 'expo-router'
import { signOut } from '../lib/auth'
import { supabase } from '../lib/supabase'

const GOLD = '#C9A84C'
const BG = '#070707'
const SURFACE = '#141414'
const BORDER = '#2a2a2a'
const IVORY = '#F0EBE1'
const MUTED = '#6b6b6b'

export default function SettingsScreen() {
  const [businessName, setBusinessName] = useState('')
  const [plan, setPlan] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return
    const { data: u } = await supabase.from('users').select('tenant_id').eq('id', user.user.id).single()
    if (u?.tenant_id) {
      const { data: t } = await supabase.from('tenants').select('business_name, plan_status').eq('id', u.tenant_id).single()
      if (t) {
        setBusinessName(t.business_name)
        setPlan(t.plan_status ?? 'trialing')
      }
    }
  }

  async function handleSignOut() {
    await signOut()
    router.replace('/login')
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>SETTINGS</Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>PROFILE</Text>
        <View style={styles.item}>
          <Text style={styles.itemLabel}>Business</Text>
          <Text style={styles.itemValue}>{businessName || '—'}</Text>
        </View>
        <View style={[styles.item, { borderBottomWidth: 0 }]}>
          <Text style={styles.itemLabel}>Plan</Text>
          <Text style={[styles.itemValue, { color: plan === 'trialing' ? '#fbbf24' : '#4ade80' }]}>{plan}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>QUICK LINKS</Text>
        <TouchableOpacity style={styles.item} onPress={() => Alert.alert('Coming Soon', 'Profile editing coming soon.')}>
          <Text style={styles.itemText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.item, { borderBottomWidth: 0 }]} onPress={() => Alert.alert('Coming Soon', 'Notification settings coming soon.')}>
          <Text style={styles.itemText}>Notifications</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <TouchableOpacity style={styles.item} onPress={handleSignOut}>
          <Text style={[styles.itemText, { color: '#f87171' }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ABOUT</Text>
        <View style={[styles.item, { borderBottomWidth: 0 }]}>
          <Text style={styles.itemText}>LYCHO Mobile</Text>
          <Text style={styles.itemSub}>v1.0.0 · Beta</Text>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, paddingTop: 56 },
  title: { color: GOLD, fontSize: 28, fontWeight: '700', letterSpacing: 4, paddingHorizontal: 20, marginBottom: 24 },
  section: { marginBottom: 24, paddingHorizontal: 20 },
  sectionLabel: { color: MUTED, fontSize: 10, letterSpacing: 3, marginBottom: 8 },
  item: { backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: BORDER },
  itemLabel: { color: MUTED, fontSize: 12 },
  itemValue: { color: IVORY, fontSize: 14, fontWeight: '600' },
  itemText: { color: IVORY, fontSize: 14 },
  itemSub: { color: MUTED, fontSize: 12 },
})

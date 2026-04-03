import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Alert } from 'react-native'
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
  const [editingName, setEditingName] = useState('')
  const [editing, setEditing] = useState(false)
  const [plan, setPlan] = useState('')
  const [tenantId, setTenantId] = useState('')

  useEffect(() => { loadProfile() }, [])

  async function loadProfile() {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return
    const { data: u } = await supabase.from('users').select('tenant_id').eq('id', user.user.id).single()
    if (u?.tenant_id) {
      setTenantId(u.tenant_id)
      const { data: t } = await supabase.from('tenants').select('business_name, plan_status, plan').eq('id', u.tenant_id).single()
      if (t) {
        setBusinessName(t.business_name)
        setEditingName(t.business_name)
        setPlan(`${t.plan} (${t.plan_status})`)
      }
    }
  }

  async function saveProfile() {
    if (!tenantId) return
    const { error } = await supabase.from('tenants').update({ business_name: editingName }).eq('id', tenantId)
    if (error) { Alert.alert('Error', error.message); return }
    setBusinessName(editingName)
    setEditing(false)
    Alert.alert('Saved', 'Profile updated')
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
          {editing ? (
            <TextInput style={styles.editInput} value={editingName} onChangeText={setEditingName} placeholderTextColor={MUTED} placeholder="Business name" />
          ) : (
            <Text style={styles.itemValue}>{businessName || '—'}</Text>
          )}
        </View>
        <View style={[styles.item, { borderBottomWidth: 0 }]}>
          <Text style={styles.itemLabel}>Plan</Text>
          <Text style={[styles.itemValue, { color: plan.includes('trial') ? '#fbbf24' : '#4ade80' }]}>{plan}</Text>
        </View>
        {editing ? (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}><Text style={styles.saveBtnText}>Save</Text></TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setEditing(false); setEditingName(businessName) }}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.editLink} onPress={() => setEditing(true)}><Text style={styles.editLinkText}>Edit Profile</Text></TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>QUICK LINKS</Text>
        <TouchableOpacity style={styles.item} onPress={() => router.push('/billing' as never)}>
          <Text style={styles.itemText}>💳 Billing</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.item} onPress={() => router.push('/analytics' as never)}>
          <Text style={styles.itemText}>📊 Analytics</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.item, { borderBottomWidth: 0 }]} onPress={() => router.push('/settings/notifications' as never)}>
          <Text style={styles.itemText}>🔔 Notifications</Text>
          <Text style={styles.arrow}>→</Text>
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
  arrow: { color: MUTED, fontSize: 16 },
  editInput: { color: IVORY, fontSize: 14, fontWeight: '600', borderBottomWidth: 1, borderBottomColor: GOLD, flex: 1, textAlign: 'right' },
  editLink: { marginTop: 8, alignSelf: 'flex-end' },
  editLinkText: { color: GOLD, fontSize: 13 },
  saveBtn: { flex: 1, backgroundColor: GOLD, borderRadius: 8, padding: 10, alignItems: 'center' },
  saveBtnText: { color: BG, fontWeight: '700', fontSize: 13 },
  cancelBtn: { flex: 1, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, borderRadius: 8, padding: 10, alignItems: 'center' },
  cancelBtnText: { color: MUTED, fontSize: 13 },
})

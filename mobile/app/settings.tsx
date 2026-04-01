import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { signOut } from '../lib/auth'

const GOLD = '#C9A84C'
const BG = '#070707'
const SURFACE = '#141414'
const BORDER = '#2a2a2a'
const IVORY = '#F0EBE1'
const MUTED = '#6b6b6b'

export default function SettingsScreen() {
  async function handleSignOut() {
    await signOut()
    router.replace('/login')
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SETTINGS</Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <TouchableOpacity style={styles.item} onPress={handleSignOut}>
          <Text style={[styles.itemText, { color: '#f87171' }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ABOUT</Text>
        <View style={styles.item}>
          <Text style={styles.itemText}>LYCHO Mobile</Text>
          <Text style={styles.itemSub}>v1.0.0 · Beta</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, paddingTop: 56, padding: 20 },
  title: { color: GOLD, fontSize: 28, fontWeight: '700', letterSpacing: 4, marginBottom: 32 },
  section: { marginBottom: 24 },
  sectionLabel: { color: MUTED, fontSize: 10, letterSpacing: 3, marginBottom: 8 },
  item: { backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, borderRadius: 10, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemText: { color: IVORY, fontSize: 14 },
  itemSub: { color: MUTED, fontSize: 12 },
})

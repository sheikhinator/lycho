import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native'
import { router } from 'expo-router'
import { signUp } from '../lib/auth'

const GOLD = '#C9A84C'
const BG = '#070707'
const SURFACE = '#141414'
const BORDER = '#2a2a2a'
const IVORY = '#F0EBE1'
const MUTED = '#6b6b6b'

export default function SignupScreen() {
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignUp() {
    if (!businessName || !email || !password) return
    if (password.length < 8) { Alert.alert('Weak Password', 'Password must be at least 8 characters'); return }
    setLoading(true)
    const { error } = await signUp(email, password, businessName)
    setLoading(false)
    if (error) {
      Alert.alert('Sign Up Failed', error.message)
    } else {
      Alert.alert('Account Created', 'Check your email to verify your account.', [{ text: 'OK', onPress: () => router.replace('/login') }])
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
        <View style={styles.logoArea}>
          <Text style={styles.logoText}>LYCHO</Text>
          <Text style={styles.tagline}>Intelligence. Transmitted.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.heading}>Create Account</Text>

          <TextInput
            style={styles.input}
            placeholder="Business name"
            placeholderTextColor={MUTED}
            value={businessName}
            onChangeText={setBusinessName}
          />

          <TextInput
            style={styles.input}
            placeholder="Business email"
            placeholderTextColor={MUTED}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Password (min 8 characters)"
            placeholderTextColor={MUTED}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSignUp} disabled={loading}>
            <Text style={styles.btnText}>{loading ? 'Creating Account…' : 'Sign Up'}</Text>
          </TouchableOpacity>

          <Text style={styles.footer}>
            Already have an account?{' '}
            <Text style={{ color: GOLD }} onPress={() => router.push('/login' as never)}>Sign in</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  logoArea: { alignItems: 'center', marginBottom: 40 },
  logoText: { color: GOLD, fontSize: 40, fontWeight: '700', letterSpacing: 8 },
  tagline: { color: MUTED, fontSize: 12, letterSpacing: 4, marginTop: 4 },
  card: { backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, borderRadius: 16, padding: 24 },
  heading: { color: IVORY, fontSize: 20, fontWeight: '600', marginBottom: 20 },
  input: { backgroundColor: '#1c1c1c', borderWidth: 1, borderColor: BORDER, borderRadius: 8, color: IVORY, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 12 },
  btn: { backgroundColor: GOLD, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: BG, fontWeight: '700', fontSize: 15 },
  footer: { color: MUTED, textAlign: 'center', fontSize: 13, marginTop: 20 },
})

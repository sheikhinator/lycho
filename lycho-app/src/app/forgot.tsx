import React, { useState } from 'react'
import { KeyboardAvoidingView } from 'react-native'
import { router } from 'expo-router'
import { Btn, Card, Field, Header, Screen, T } from '@/components/ui'
import { resetWithRecovery } from '@/lib/auth'
import { C, S } from '@/theme'

export default function ForgotScreen() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const submit = async () => {
    setBusy(true); setError(null)
    try { await resetWithRecovery(email, code, password); setDone(true) } catch (e: any) { setError(e.message) } finally { setBusy(false) }
  }

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior="padding">
        <Header back backTo="/sign-in" kicker="Account" title="Reset password" />
        {done ? (
          <Card gold>
            <T>Password updated. A new recovery code was created — you can see it in Settings → Security after signing in.</T>
            <Btn title="Back to sign in" style={{ marginTop: S.lg }} onPress={() => router.replace('/sign-in')} />
          </Card>
        ) : (
          <>
            <T muted style={{ marginBottom: S.lg }}>Use the recovery code you saved when the account was created.</T>
            <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            <Field label="Recovery code" value={code} onChangeText={setCode} autoCapitalize="characters" placeholder="XXXX-XXXX-XXXX-XXXX" />
            <Field label="New password" value={password} onChangeText={setPassword} secureTextEntry />
            {error ? <T style={{ color: C.red, marginBottom: S.md }}>{error}</T> : null}
            <Btn title="Reset password" onPress={submit} loading={busy} disabled={!email || !code || !password} />
            <Btn title="Back to sign in" variant="ghost" style={{ marginTop: S.md }} onPress={() => router.replace('/sign-in')} />
          </>
        )}
      </KeyboardAvoidingView>
    </Screen>
  )
}

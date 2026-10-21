import React, { useEffect, useState } from 'react'
import { KeyboardAvoidingView, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { Btn, Card, Field, Header, Label, Screen, T } from '@/components/ui'
import { signUp, userCount } from '@/lib/auth'
import { useSession } from '@/lib/session'
import { C, F, S } from '@/theme'

export default function SignUpScreen() {
  const { signIn } = useSession()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [first, setFirst] = useState(false)
  const [code, setCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => { void userCount().then(n => setFirst(n === 0)) }, [])

  const submit = async () => {
    setError(null)
    if (password !== confirm) return setError('Passwords do not match.')
    setBusy(true)
    try {
      const r = await signUp(name, email, password)
      setCode(r.recoveryCode)
    } catch (e: any) { setError(e.message) } finally { setBusy(false) }
  }

  if (code) {
    return (
      <Screen scroll edges={['top', 'bottom']}>
        <Header kicker="Account created" title="Save your recovery code" />
        <T serif style={{ marginBottom: S.lg }}>
          There is no server to reset your password. This code is the only way back in if you forget it. Write it down or store it somewhere safe.
        </T>
        <Card gold style={{ alignItems: 'center', paddingVertical: S.xl }}>
          <Label>Recovery code</Label>
          <T selectable style={{ fontFamily: F.mono, fontSize: 22, letterSpacing: 2, color: C.gold, marginTop: S.sm }}>{code}</T>
        </Card>
        <Btn title={copied ? 'Copied' : 'Copy code'} variant="ghost" icon="copy" style={{ marginTop: S.md }}
          onPress={async () => { await Clipboard.setStringAsync(code); setCopied(true) }} />
        <Btn title="I've saved it — continue" style={{ marginTop: S.md }} loading={busy}
          onPress={async () => { setBusy(true); try { await signIn(email, password) } catch (e: any) { setError(e.message) } finally { setBusy(false) } }} />
        {error ? <T style={{ color: C.red, marginTop: S.md }}>{error}</T> : null}
      </Screen>
    )
  }

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior="padding">
        <Header back backTo="/sign-in" kicker={first ? 'Owner' : 'New account'} title={first ? 'Master account' : 'Create account'} />
        {first ? (
          <Card gold style={{ marginBottom: S.lg }}>
            <T>The first account on this phone is the master account. Only it can open the Master Panel and manage other accounts.</T>
          </Card>
        ) : null}
        <Field label="Name" value={name} onChangeText={setName} placeholder="Your name" autoComplete="name" />
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="At least 8 characters" hint="Mix letters and numbers." />
        <Field label="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry placeholder="Repeat password" onSubmitEditing={submit} />
        {error ? <T style={{ color: C.red, marginBottom: S.md }}>{error}</T> : null}
        <View style={{ marginTop: S.sm }}>
          <Btn title="Create account" onPress={submit} loading={busy} disabled={!name || !email || !password} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}

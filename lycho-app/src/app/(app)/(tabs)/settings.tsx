import React, { useCallback, useState } from 'react'
import { Alert, Switch, Text, View } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import Constants from 'expo-constants'
import { Logo } from '@/components/Logo'
import { Badge, Card, Divider, Header, Label, ListItem, Row, Screen, T } from '@/components/ui'
import { biometricAvailable, biometricEnabled, biometricPrompt, setBiometric } from '@/lib/auth'
import { exportBackup, importBackup } from '@/lib/backup'
import { configuredProviders } from '@/lib/vault'
import { getPrefs } from '@/lib/ai/router'
import { useSession } from '@/lib/session'
import { C, F, S } from '@/theme'

export default function Settings() {
  const { user, signOut } = useSession()
  const [bioOk, setBioOk] = useState(false)
  const [bioOn, setBioOn] = useState(false)
  const [keyCount, setKeyCount] = useState(0)
  const [mode, setMode] = useState('auto')

  useFocusEffect(useCallback(() => {
    if (!user) return
    void biometricAvailable().then(setBioOk)
    void biometricEnabled(user.id).then(setBioOn)
    void configuredProviders().then(k => setKeyCount(k.length))
    void getPrefs().then(p => setMode(p.mode))
  }, [user]))

  const toggleBio = async (on: boolean) => {
    if (on && !(await biometricPrompt('Confirm to enable fingerprint lock'))) return
    await setBiometric(user!.id, on)
    setBioOn(on)
  }

  return (
    <Screen scroll>
      <Header kicker="Preferences" title="Settings" />
      <Card gold>
        <Row>
          <Logo size={44} />
          <View style={{ marginLeft: S.md, flex: 1 }}>
            <Text style={{ color: C.ivory, fontFamily: F.sansBold, fontSize: 16 }}>{user?.name}</Text>
            <T muted style={{ fontSize: 13 }}>{user?.email}</T>
          </View>
          <Badge label={user?.role ?? ''} tone={user?.role === 'master' ? 'gold' : 'muted'} />
        </Row>
      </Card>

      <Label style={{ marginTop: S.xl }}>Intelligence</Label>
      <ListItem icon="key" title="AI Keys" subtitle={`${keyCount} of 3 providers connected`} onPress={() => router.push('/keys')} />
      <ListItem icon="shuffle" title="Model Router" subtitle={mode === 'auto' ? 'Auto — picks and switches models for you' : 'Manual — one fixed model'} onPress={() => router.push('/router')} />
      <ListItem icon="edit-3" title="Agent Studio" subtitle="Create a custom agent" onPress={() => router.push('/agent/edit')} />

      <Divider />
      <Label style={{ marginTop: S.md }}>Security</Label>
      <ListItem icon="smartphone" title="Fingerprint lock" subtitle={bioOk ? 'Ask for fingerprint when opening LYCHO' : 'No fingerprint or face unlock set up on this phone'}
        right={<Switch value={bioOn} onValueChange={toggleBio} disabled={!bioOk} trackColor={{ true: C.gold, false: C.border }} thumbColor={C.ivory} />} />
      <ListItem icon="lock" title="Password & recovery" subtitle="Change password, new recovery code" onPress={() => router.push('/security')} />

      <Divider />
      <Label style={{ marginTop: S.md }}>Your data</Label>
      <ListItem icon="download" title="Export backup" subtitle="All chats, agents and settings as one file (keys excluded)"
        onPress={async () => { try { await exportBackup() } catch (e: any) { Alert.alert('Export failed', e.message) } }} />
      <ListItem icon="upload" title="Restore backup" subtitle="Replace everything on this phone with a backup file"
        onPress={() => Alert.alert('Restore backup?', 'This replaces all current data on this phone.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Restore', style: 'destructive', onPress: async () => {
            try {
              const r = await importBackup()
              if (r) { Alert.alert('Restored', 'Sign in again with an account from the backup.'); await signOut() }
            } catch (e: any) { Alert.alert('Restore failed', e.message) }
          } },
        ])} />

      {user?.role === 'master' ? (
        <>
          <Divider />
          <Label style={{ marginTop: S.md }}>Owner</Label>
          <ListItem icon="shield" title="Master Panel" subtitle="System control room — PIN protected" onPress={() => router.push('/master')} />
        </>
      ) : null}

      <Divider />
      <ListItem icon="log-out" title="Sign out" danger onPress={signOut} />
      <T muted style={{ textAlign: 'center', marginTop: S.xl, fontSize: 12, fontFamily: F.mono }}>
        LYCHO {Constants.expoConfig?.version ?? ''} · on-device edition
      </T>
    </Screen>
  )
}

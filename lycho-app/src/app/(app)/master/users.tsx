import React, { useCallback, useState } from 'react'
import { Alert, Text, View } from 'react-native'
import { useFocusEffect } from 'expo-router'
import * as Clipboard from 'expo-clipboard'
import { Badge, Btn, Card, Header, Row, Screen, T } from '@/components/ui'
import { listUsers, randomHex, setPassword, type User } from '@/lib/auth'
import { audit, db } from '@/lib/db'
import { useMasterGuard } from '@/lib/master'
import { useSession } from '@/lib/session'
import { C, F, S } from '@/theme'

export default function Users() {
  const ok = useMasterGuard()
  const { user: me } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const load = useCallback(() => { void listUsers().then(setUsers) }, [])
  useFocusEffect(load)
  if (!ok) return null

  const act = (u: User) => {
    const self = u.id === me?.id
    Alert.alert(u.name, u.email, [
      ...(!self ? [{
        text: u.status === 'active' ? 'Disable' : 'Enable',
        onPress: async () => { await db().runAsync('UPDATE users SET status = ? WHERE id = ?', u.status === 'active' ? 'disabled' : 'active', u.id); await audit('user_status', u.email); load() },
      }] : []),
      {
        text: 'Reset password',
        onPress: async () => {
          const temp = `Ly${randomHex(4)}9`
          const code = await setPassword(u.id, temp)
          await audit('user_password_reset', u.email)
          Alert.alert('Password reset', `Temporary password:\n${temp}\n\nNew recovery code:\n${code}`, [
            { text: 'Copy password', onPress: () => Clipboard.setStringAsync(temp) }, { text: 'Done' },
          ])
        },
      },
      ...(!self && u.role !== 'master' ? [{
        text: 'Delete account', style: 'destructive' as const,
        onPress: () => Alert.alert(`Delete ${u.name}?`, 'Their chats and memories are removed too.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: async () => {
            await db().withTransactionAsync(async () => {
              await db().runAsync('DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE user_id = ?)', u.id)
              await db().runAsync('DELETE FROM conversations WHERE user_id = ?', u.id)
              await db().runAsync('DELETE FROM memories WHERE user_id = ?', u.id)
              await db().runAsync('DELETE FROM users WHERE id = ?', u.id)
            })
            await audit('user_deleted', u.email)
            load()
          } },
        ]),
      }] : []),
      { text: 'Close', style: 'cancel' },
    ])
  }

  return (
    <Screen scroll>
      <Header back kicker="Master Panel" title="Accounts" />
      <T muted style={{ marginBottom: S.lg }}>Accounts live only on this phone. New accounts can be created from the sign-in screen.</T>
      {users.map(u => (
        <Card key={u.id} onPress={() => act(u)} style={{ marginBottom: S.sm }}>
          <Row>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.ivory, fontFamily: F.sansBold, fontSize: 15 }}>{u.name}{u.id === me?.id ? ' (you)' : ''}</Text>
              <T muted style={{ fontSize: 13 }}>{u.email}</T>
              <T muted style={{ fontSize: 11.5, marginTop: 2 }}>Last sign-in {u.last_login ? new Date(u.last_login).toLocaleString() : 'never'}</T>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Badge label={u.role} tone={u.role === 'master' ? 'gold' : 'muted'} />
              <Badge label={u.status} tone={u.status === 'active' ? 'green' : 'red'} />
            </View>
          </Row>
        </Card>
      ))}
      <View style={{ height: S.lg }} />
      <Btn title="Refresh" variant="subtle" icon="refresh-cw" onPress={load} />
    </Screen>
  )
}

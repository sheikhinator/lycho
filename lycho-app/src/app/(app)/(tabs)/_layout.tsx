import { Tabs } from 'expo-router'
import Feather from '@expo/vector-icons/Feather'
import { C, F } from '@/theme'

const icon = (name: React.ComponentProps<typeof Feather>['name']) =>
  ({ color }: { color: any }) => <Feather name={name} size={21} color={color} />

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: C.void },
        tabBarStyle: { backgroundColor: C.deep, borderTopColor: C.border, height: 64, paddingTop: 6 },
        tabBarActiveTintColor: C.gold,
        tabBarInactiveTintColor: C.muted,
        tabBarLabelStyle: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Command', tabBarIcon: icon('hexagon') }} />
      <Tabs.Screen name="agents" options={{ title: 'Agents', tabBarIcon: icon('cpu') }} />
      <Tabs.Screen name="chats" options={{ title: 'Chats', tabBarIcon: icon('message-square') }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: icon('sliders') }} />
    </Tabs>
  )
}

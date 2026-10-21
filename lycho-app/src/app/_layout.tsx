import React, { useEffect } from 'react'
import { Text, View } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import * as SystemUI from 'expo-system-ui'
import { useFonts } from 'expo-font'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue/400Regular'
import { CormorantGaramond_500Medium } from '@expo-google-fonts/cormorant-garamond/500Medium'
import { CormorantGaramond_400Regular_Italic } from '@expo-google-fonts/cormorant-garamond/400Regular_Italic'
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular'
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium'
import { DMSans_700Bold } from '@expo-google-fonts/dm-sans/700Bold'
import { DMMono_400Regular } from '@expo-google-fonts/dm-mono/400Regular'
import Feather from '@expo/vector-icons/Feather'
import { SessionProvider, useSession } from '@/lib/session'
import { C, F } from '@/theme'

void SplashScreen.preventAutoHideAsync().catch(() => {})
void SystemUI.setBackgroundColorAsync(C.void).catch(() => {})

function Gate() {
  const { ready, user, locked, error } = useSession()
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync().catch(() => {})
  }, [ready])
  if (!ready) return null
  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: C.void, justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: C.red, fontFamily: F.display, fontSize: 28 }}>STARTUP ERROR</Text>
        <Text selectable style={{ color: C.ivory, fontFamily: F.mono, marginTop: 8 }}>{error}</Text>
      </View>
    )
  }
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.void }, animation: 'fade_from_bottom' }}>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="forgot" />
      </Stack.Protected>
      <Stack.Protected guard={!!user && locked}>
        <Stack.Screen name="lock" />
      </Stack.Protected>
      <Stack.Protected guard={!!user && !locked}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  )
}

export default function RootLayout() {
  const [loaded] = useFonts({
    BebasNeue_400Regular, CormorantGaramond_500Medium, CormorantGaramond_400Regular_Italic,
    DMSans_400Regular, DMSans_500Medium, DMSans_700Bold, DMMono_400Regular, ...Feather.font,
  })
  if (!loaded) return null
  return (
    <SafeAreaProvider style={{ backgroundColor: C.void }}>
      <StatusBar style="light" />
      <SessionProvider>
        <Gate />
      </SessionProvider>
    </SafeAreaProvider>
  )
}

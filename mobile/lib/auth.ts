import { supabase } from './supabase'
import * as SecureStore from 'expo-secure-store'

const SESSION_KEY = 'lycho_session'

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (data.session) {
    await SecureStore.setItemAsync(SESSION_KEY, data.session.refresh_token)
  }
  return { data, error }
}

export async function signUp(email: string, password: string, businessName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { business_name: businessName } },
  })
  return { data, error }
}

export async function resetPassword(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'lycho://reset-password',
  })
}

export async function signOut() {
  await SecureStore.deleteItemAsync(SESSION_KEY).catch(() => null)
  return supabase.auth.signOut()
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

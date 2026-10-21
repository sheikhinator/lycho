import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'
import { initDb } from '@/lib/db'
import { biometricEnabled, getUser, sessionUserId, signIn as doSignIn, signOut as doSignOut, type User } from '@/lib/auth'

type Ctx = {
  ready: boolean
  error: string | null
  user: User | null
  locked: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  unlock: () => void
  refresh: () => Promise<void>
}
const SessionCtx = createContext<Ctx>(null as unknown as Ctx)
export const useSession = () => useContext(SessionCtx)

const RELOCK_AFTER_MS = 2 * 60_000

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [locked, setLocked] = useState(false)
  const leftAt = useRef<number | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        await initDb()
        const id = await sessionUserId()
        const u = id ? await getUser(id) : null
        if (u && u.status === 'active') {
          setUser(u)
          setLocked(await biometricEnabled(u.id))
        }
      } catch (e: any) {
        setError(String(e?.message ?? e))
      } finally {
        setReady(true)
      }
    })()
  }, [])

  // Re-lock with biometrics when the app comes back after a while.
  useEffect(() => {
    const sub = AppState.addEventListener('change', async state => {
      if (state === 'background') leftAt.current = Date.now()
      if (state === 'active' && user && leftAt.current && Date.now() - leftAt.current > RELOCK_AFTER_MS) {
        if (await biometricEnabled(user.id)) setLocked(true)
      }
    })
    return () => sub.remove()
  }, [user])

  const signIn = useCallback(async (email: string, password: string) => {
    const u = await doSignIn(email, password)
    setLocked(false)
    setUser(u)
  }, [])
  const signOut = useCallback(async () => {
    await doSignOut(user?.id)
    setUser(null)
    setLocked(false)
  }, [user])
  const refresh = useCallback(async () => {
    if (user) setUser(await getUser(user.id))
  }, [user])

  return (
    <SessionCtx.Provider value={{ ready, error, user, locked, signIn, signOut, unlock: () => setLocked(false), refresh }}>
      {children}
    </SessionCtx.Provider>
  )
}

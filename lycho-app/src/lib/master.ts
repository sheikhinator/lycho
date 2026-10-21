import { useEffect } from 'react'
import { router } from 'expo-router'
import { useSession } from '@/lib/session'

// Master panel unlock lasts 10 minutes, in memory only.
let unlockedUntil = 0
export const masterUnlocked = () => Date.now() < unlockedUntil
export const markMasterUnlocked = () => { unlockedUntil = Date.now() + 10 * 60_000 }
export const lockMaster = () => { unlockedUntil = 0 }

/** Sends anyone who isn't the master account, or hasn't unlocked the panel, back to the gate. */
export function useMasterGuard() {
  const { user } = useSession()
  useEffect(() => {
    if (user?.role !== 'master') router.replace('/')
    else if (!masterUnlocked()) router.replace('/master')
  }, [user])
  return user?.role === 'master' && masterUnlocked()
}

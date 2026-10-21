import * as Crypto from 'expo-crypto'
import * as SecureStore from 'expo-secure-store'
import * as LocalAuthentication from 'expo-local-authentication'
import { audit, db, getSetting, now, setSetting, uid } from '@/lib/db'

export type User = {
  id: string; name: string; email: string; role: 'master' | 'user'; status: 'active' | 'disabled'
  created_at: number; last_login: number | null
}

const SESSION_KEY = 'lycho_session'
const ROUNDS = 1500

function hex(bytes: Uint8Array) {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}
export function randomHex(n = 16) {
  return hex(Crypto.getRandomBytes(n))
}

/** Salted, iterated SHA-256 — slow enough to resist guessing if the database file is ever copied. */
export async function hashSecret(secret: string, salt: string): Promise<string> {
  let h = `${salt}:${secret}`
  for (let i = 0; i < ROUNDS; i++) h = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, h + salt)
  return h
}

function recoveryCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const b = Crypto.getRandomBytes(16)
  const chars = Array.from(b, x => alphabet[x % alphabet.length]).join('')
  return chars.match(/.{4}/g)!.join('-')
}

const USER_COLS = 'id,name,email,role,status,created_at,last_login'

export async function userCount() {
  return (await db().getFirstAsync<{ n: number }>('SELECT COUNT(*) n FROM users'))?.n ?? 0
}
export async function getUser(id: string) {
  return db().getFirstAsync<User>(`SELECT ${USER_COLS} FROM users WHERE id = ?`, id)
}
export async function listUsers() {
  return db().getAllAsync<User>(`SELECT ${USER_COLS} FROM users ORDER BY created_at`)
}

export function validatePassword(p: string) {
  if (p.length < 8) return 'Use at least 8 characters.'
  if (!/[0-9]/.test(p) || !/[a-zA-Z]/.test(p)) return 'Mix letters and numbers.'
  return null
}

/** Creates an account. The very first account on the phone becomes the master (owner) account. */
export async function signUp(name: string, email: string, password: string) {
  const e = email.trim().toLowerCase()
  if (!name.trim()) throw new Error('Enter your name.')
  if (!/^\S+@\S+\.\S+$/.test(e)) throw new Error('Enter a valid email.')
  const pw = validatePassword(password)
  if (pw) throw new Error(pw)
  if (await db().getFirstAsync('SELECT id FROM users WHERE email = ?', e)) throw new Error('An account with that email already exists on this phone.')
  const salt = randomHex()
  const code = recoveryCode()
  const id = uid()
  const role = (await userCount()) === 0 ? 'master' : 'user'
  await db().runAsync(
    'INSERT INTO users (id,name,email,pass_hash,salt,recovery_hash,role,status,created_at) VALUES (?,?,?,?,?,?,?,?,?)',
    id, name.trim(), e, await hashSecret(password, salt), salt, await hashSecret(code.replace(/-/g, ''), salt), role, 'active', now(),
  )
  await audit('signup', role, id)
  return { id, recoveryCode: code, role }
}

export async function signIn(email: string, password: string): Promise<User> {
  const row = await db().getFirstAsync<User & { pass_hash: string; salt: string }>(
    `SELECT ${USER_COLS},pass_hash,salt FROM users WHERE email = ?`, email.trim().toLowerCase(),
  )
  if (!row || (await hashSecret(password, row.salt)) !== row.pass_hash) {
    await audit('login_failed', email.trim().toLowerCase())
    throw new Error('Email or password is incorrect.')
  }
  if (row.status !== 'active') throw new Error('This account is disabled. Ask the master account to re-enable it.')
  await db().runAsync('UPDATE users SET last_login = ? WHERE id = ?', now(), row.id)
  await SecureStore.setItemAsync(SESSION_KEY, row.id)
  await audit('login', null, row.id)
  return (await getUser(row.id))!
}

export async function resetWithRecovery(email: string, code: string, newPassword: string) {
  const row = await db().getFirstAsync<{ id: string; salt: string; recovery_hash: string }>(
    'SELECT id,salt,recovery_hash FROM users WHERE email = ?', email.trim().toLowerCase(),
  )
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (!row || (await hashSecret(clean, row.salt)) !== row.recovery_hash) throw new Error('Email or recovery code is incorrect.')
  const pw = validatePassword(newPassword)
  if (pw) throw new Error(pw)
  await setPassword(row.id, newPassword)
  await audit('password_reset', 'recovery code', row.id)
}

/** Sets a new password and issues a fresh recovery code (returned). */
export async function setPassword(userId: string, newPassword: string) {
  const salt = randomHex()
  const code = recoveryCode()
  await db().runAsync(
    'UPDATE users SET pass_hash = ?, salt = ?, recovery_hash = ? WHERE id = ?',
    await hashSecret(newPassword, salt), salt, await hashSecret(code.replace(/-/g, ''), salt), userId,
  )
  return code
}

export async function changePassword(userId: string, current: string, next: string) {
  const row = await db().getFirstAsync<{ pass_hash: string; salt: string }>('SELECT pass_hash,salt FROM users WHERE id = ?', userId)
  if (!row || (await hashSecret(current, row.salt)) !== row.pass_hash) throw new Error('Current password is incorrect.')
  const pw = validatePassword(next)
  if (pw) throw new Error(pw)
  const code = await setPassword(userId, next)
  await audit('password_change', null, userId)
  return code
}

export async function sessionUserId() {
  return SecureStore.getItemAsync(SESSION_KEY)
}
export async function signOut(userId?: string) {
  await SecureStore.deleteItemAsync(SESSION_KEY)
  await audit('logout', null, userId)
}

// ---------- biometrics ----------
export async function biometricAvailable() {
  return (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync())
}
export async function biometricEnabled(userId: string) {
  return (await getSetting(`bio_${userId}`)) === '1'
}
export async function setBiometric(userId: string, on: boolean) {
  await setSetting(`bio_${userId}`, on ? '1' : '0')
}
export async function biometricPrompt(reason = 'Unlock LYCHO') {
  const r = await LocalAuthentication.authenticateAsync({ promptMessage: reason, cancelLabel: 'Use password', disableDeviceFallback: false })
  return r.success
}

// ---------- master panel PIN ----------
export async function masterPinSet() {
  return !!(await getSetting('master_pin'))
}
export async function setMasterPin(pin: string) {
  if (!/^\d{4,8}$/.test(pin)) throw new Error('PIN must be 4–8 digits.')
  const salt = randomHex()
  await setSetting('master_pin', JSON.stringify({ salt, hash: await hashSecret(pin, salt) }))
  await audit('master_pin_set')
}
export async function checkMasterPin(pin: string) {
  const v = await getSetting('master_pin')
  if (!v) return false
  const { salt, hash } = JSON.parse(v)
  const ok = (await hashSecret(pin, salt)) === hash
  await audit(ok ? 'master_unlock' : 'master_pin_failed')
  return ok
}

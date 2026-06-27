import type { Role } from '../types'

export const AUTH_SESSION_STORAGE_KEY = 'rubber-shop-auth-session'
export const AUTH_SESSION_TTL_MS = 24 * 60 * 60 * 1000

export type StoredAuthSession = {
  role: Role
  user: any
  selectedCustomerId: string
  activeTab: string
  theme: 'light' | 'dark'
  expiresAt: number
}

export const saveAuthSession = (session: StoredAuthSession) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session))
}

export const readAuthSession = (): StoredAuthSession | null => {
  if (typeof window === 'undefined') return null

  try {
    const storedValue = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY)
    if (!storedValue) return null

    const parsed = JSON.parse(storedValue) as StoredAuthSession
    if (!parsed || parsed.expiresAt <= Date.now()) {
      window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY)
      return null
    }

    return parsed
  } catch (error) {
    console.error('Failed to read auth session:', error)
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY)
    return null
  }
}

export const clearAuthSession = () => {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY)
}

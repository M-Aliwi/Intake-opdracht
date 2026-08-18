import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { fetchMe, login as apiLogin, signup as apiSignup } from '../api/client'
import {
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from '../utils/helpers'
import type { AuthUser } from '../types'

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(() => getStoredToken())
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const t = getStoredToken()
    if (!t) {
      setUser(null)
      setToken(null)
      return
    }
    const me = await fetchMe<AuthUser>()
    setUser(me)
    setToken(t)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        if (getStoredToken()) {
          await refreshUser()
        }
      } catch {
        clearStoredToken()
        if (!cancelled) {
          setUser(null)
          setToken(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [refreshUser])

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password)
    setStoredToken(res.authToken)
    setToken(res.authToken)
    await refreshUser()
  }, [refreshUser])

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const res = await apiSignup(name, email, password)
      setStoredToken(res.authToken)
      setToken(res.authToken)
      await refreshUser()
    },
    [refreshUser],
  )

  const logout = useCallback(() => {
    clearStoredToken()
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, refreshUser }),
    [user, token, loading, login, register, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

import { useCallback, useMemo, useState } from 'react'

import { adminLogin } from '@/lib/api'
import { STORAGE_KEY } from '@/lib/axios'

import { AuthContext, type AuthContextValue } from './auth-context'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY) || null)
  const [isLoading, setIsLoading] = useState(false)

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await adminLogin({ username, password })
      setToken(response.access_token)
      localStorage.setItem(STORAGE_KEY, response.access_token)
    } catch (error) {
      console.error('Login failed', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    localStorage.removeItem(STORAGE_KEY)
    window.location.href = '/login'
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      isAuthenticated: Boolean(token),
      isLoading,
      login,
      logout,
    }),
    [token, isLoading, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

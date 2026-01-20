import { useCallback, useEffect, useMemo, useState } from 'react'

import { adminLogin, fetchCurrentUser } from '@/lib/api'
import { STORAGE_KEY } from '@/lib/axios'

import { AuthContext, type AuthContextValue, type UserInfo } from './auth-context'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY) || null)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch current user when token exists
  useEffect(() => {
    if (token && !user) {
      fetchCurrentUser()
        .then((data) => {
          setUser({
            id: data.id,
            username: data.username,
            display_name: data.display_name,
            role: data.role,
            permissions: data.permissions,
          })
        })
        .catch(() => {
          // Token might be invalid, clear it
          setToken(null)
          setUser(null)
          localStorage.removeItem(STORAGE_KEY)
        })
    }
  }, [token, user])

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await adminLogin({ username, password })
      setToken(response.access_token)
      localStorage.setItem(STORAGE_KEY, response.access_token)

      // Fetch user info after login
      const userData = await fetchCurrentUser()
      setUser({
        id: userData.id,
        username: userData.username,
        display_name: userData.display_name,
        role: userData.role,
        permissions: userData.permissions,
      })
    } catch (error) {
      console.error('Login failed', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
    window.location.href = '/login'
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      isLoading,
      login,
      logout,
    }),
    [token, user, isLoading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

import { createContext, useContext } from 'react'

export type UserInfo = {
  id?: string
  username: string
  display_name?: string | null
  role: 'admin' | 'moderator'
  permissions: string[]
}

export type AuthContextValue = {
  token: string | null
  user: UserInfo | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

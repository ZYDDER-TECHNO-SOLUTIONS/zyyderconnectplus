import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  full_name: string
  role: 'superadmin' | 'employer' | 'employee'
  status: string
  avatar_url?: string
  company_name?: string
  phone?: string
  is_verified: boolean
  created_at: string
  headline?: string
  bio?: string
  location?: string
  linkedin_url?: string
  github_url?: string
  portfolio_url?: string
  current_experience?: any
  past_experience?: any[]
  education?: any[]
  skills?: string[]
  hobbies?: string[]
  banner_url?: string
  profile_completed?: boolean
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  updateUser: (user: Partial<User>) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken }),
      updateUser: (partial) =>
        set((s) => ({ user: s.user ? { ...s.user, ...partial } : null })),
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
      isAuthenticated: () => !!get().accessToken && !!get().user,
    }),
    { name: 'sparklex-auth' }
  )
)

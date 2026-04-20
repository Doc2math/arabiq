import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '@/lib/api'

interface User {
  id: string
  email: string
  username: string
  native_language: string
  xp: number
  level: number
  streak: number
  is_premium: boolean
  is_admin: boolean
  created_at: string
}

interface AuthState {
  user: User | null
  access_token: string | null
  refresh_token: string | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => void
  fetchMe: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      access_token: null,
      refresh_token: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await authApi.login(email, password)
          localStorage.setItem('access_token', data.tokens.access_token)
          localStorage.setItem('refresh_token', data.tokens.refresh_token)
          set({
            user: data.user,
            access_token: data.tokens.access_token,
            refresh_token: data.tokens.refresh_token,
            isLoading: false,
          })
        } catch (err: any) {
          set({
            error: err.response?.data?.detail || 'Erreur de connexion',
            isLoading: false,
          })
          throw err
        }
      },

      register: async (email, username, password) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await authApi.register({ email, username, password })
          localStorage.setItem('access_token', data.tokens.access_token)
          localStorage.setItem('refresh_token', data.tokens.refresh_token)
          set({
            user: data.user,
            access_token: data.tokens.access_token,
            refresh_token: data.tokens.refresh_token,
            isLoading: false,
          })
        } catch (err: any) {
          set({
            error: err.response?.data?.detail || "Erreur lors de l'inscription",
            isLoading: false,
          })
          throw err
        }
      },

      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        authApi.logout().catch(() => {})
        set({ user: null, access_token: null, refresh_token: null })
      },

      fetchMe: async () => {
        try {
          const { data } = await authApi.me()
          set({ user: data })
        } catch {
          get().logout()
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'langdad-auth',
      partialize: (state) => ({
        user: state.user,
        access_token: state.access_token,
        refresh_token: state.refresh_token,
      }),
    }
  )
)
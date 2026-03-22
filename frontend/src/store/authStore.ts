import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, AuthTokens } from '@/types'

interface AuthState {
  user: User | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  isLoading: boolean
  setAuth: (user: User, tokens: AuthTokens) => void
  updateUser: (partial: Partial<User>) => void
  logout: () => void
  setLoading: (v: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      setAuth: (user, tokens) => set({ user, tokens, isAuthenticated: true, isLoading: false }),
      updateUser: (partial) => set((s) => ({ user: s.user ? { ...s.user, ...partial } : null })),
      logout: () => set({ user: null, tokens: null, isAuthenticated: false }),
      setLoading: (v) => set({ isLoading: v }),
    }),
    {
      name: 'arabiq-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ tokens: s.tokens }),
    }
  )
)
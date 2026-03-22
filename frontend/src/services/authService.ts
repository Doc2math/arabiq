import { api } from '@/lib/apiClient'
import type { User, AuthTokens, LoginPayload, RegisterPayload } from '@/types'

interface RawTokens {
  access_token: string
  refresh_token: string
  token_type: string
}

interface RawUser {
  id: string
  email: string
  username: string
  native_language: string
  avatar_url?: string
  xp: number
  level: number
  streak: number
  is_premium: boolean
  is_admin: boolean
  created_at: string
}

interface RawAuthResponse {
  user: RawUser
  tokens: RawTokens
}

function mapUser(raw: RawUser): User {
  return {
    id:             raw.id,
    email:          raw.email,
    username:       raw.username,
    nativeLanguage: raw.native_language as 'fr' | 'es' | 'en',
    avatarUrl:      raw.avatar_url,
    xp:             raw.xp,
    level:          raw.level,
    streak:         raw.streak,
    isPremium:      raw.is_premium,
    isAdmin:        raw.is_admin ?? false,
    createdAt:      raw.created_at,
  }
}

function mapTokens(raw: RawTokens): AuthTokens {
  return {
    accessToken:  raw.access_token,
    refreshToken: raw.refresh_token,
    tokenType:    raw.token_type as 'bearer',
  }
}

export const authService = {
  login: async (payload: LoginPayload) => {
    const data = await api.post<RawAuthResponse>('/auth/login', payload)
    return {
      user:   mapUser(data.user),
      tokens: mapTokens(data.tokens),
    }
  },

  register: async (payload: RegisterPayload) => {
    const data = await api.post<RawAuthResponse>('/auth/register', {
      email:           payload.email,
      username:        payload.username,
      password:        payload.password,
      native_language: payload.nativeLanguage,
    })
    return {
      user:   mapUser(data.user),
      tokens: mapTokens(data.tokens),
    }
  },

  me: async (): Promise<User> => {
    const raw = await api.get<RawUser>('/auth/me')
    return mapUser(raw)
  },

  logout: () =>
    api.post<void>('/auth/logout'),

  refreshToken: (refreshToken: string) =>
    api.post<RawTokens>('/auth/refresh', { refresh_token: refreshToken }),
}
import axios, { type AxiosInstance, type AxiosError } from 'axios'
import { useAuthStore } from '@/store/authStore'
import type { AuthTokens } from '@/types'

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1'


export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

// Attach token
apiClient.interceptors.request.use((config) => {
  const tokens = useAuthStore.getState().tokens
  if (tokens?.accessToken) config.headers.Authorization = `Bearer ${tokens.accessToken}`
  return config
})

// Auto-refresh on 401
let refreshPromise: Promise<AuthTokens> | null = null

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config!
    const is401 = error.response?.status === 401
    const isRefresh = original.url?.includes('/auth/refresh')

    if (is401 && !isRefresh && !original._retry) {
      original._retry = true
      try {
        if (!refreshPromise) {
          const rt = useAuthStore.getState().tokens?.refreshToken
          refreshPromise = axios
            .post<AuthTokens>(`${BASE_URL}/auth/refresh`, { refresh_token: rt })
            .then((r) => r.data)
            .finally(() => { refreshPromise = null })
        }
        const newTokens = await refreshPromise
        const { user } = useAuthStore.getState()
        if (user) useAuthStore.getState().setAuth(user, newTokens)
        original.headers.Authorization = `Bearer ${newTokens.accessToken}`
        return apiClient(original)
      } catch {
        useAuthStore.getState().logout()
        window.location.replace('/login')
      }
    }
    return Promise.reject(error)
  }
)

export const api = {
  get:    <T>(url: string, params?: object) => apiClient.get<T>(url, { params }).then((r) => r.data),
  post:   <T>(url: string, data?: unknown)  => apiClient.post<T>(url, data).then((r) => r.data),
  put:    <T>(url: string, data?: unknown)  => apiClient.put<T>(url, data).then((r) => r.data),
  patch:  <T>(url: string, data?: unknown)  => apiClient.patch<T>(url, data).then((r) => r.data),
  delete: <T>(url: string)                  => apiClient.delete<T>(url).then((r) => r.data),
}

declare module 'axios' {
  interface InternalAxiosRequestConfig { _retry?: boolean }
}
import axios from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
})

// Intercepteur — ajoute le token automatiquement
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Intercepteur — refresh token si 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        if (!refresh) throw new Error('No refresh token')
        const { data } = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, {
          refresh_token: refresh,
        })
        localStorage.setItem('access_token', data.access_token)
        localStorage.setItem('refresh_token', data.refresh_token)
        original.headers.Authorization = `Bearer ${data.access_token}`
        return api(original)
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Helpers typés
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/api/v1/auth/login', { email, password }),
  register: (data: { email: string; username: string; password: string; role?: string }) =>
  api.post('/api/v1/auth/register', data),
  me: () => api.get('/api/v1/auth/me'),
  logout: () => api.post('/api/v1/auth/logout'),
}

export const curriculumApi = {
  modules: () => api.get('/api/v1/curriculum/modules'),
  lessons: (moduleId: number) =>
    api.get(`/api/v1/curriculum/modules/${moduleId}/lessons`),
  lesson: (id: number) => api.get(`/api/v1/curriculum/lessons/${id}`),
  complete: (id: number, score: number, duration: number) =>
    api.post(`/api/v1/curriculum/lessons/${id}/complete`, {
      score,
      duration_seconds: duration,
    }),
}

export const writingApi = {
  moduleSheets: (moduleId: number) =>
    `${BASE_URL}/api/v1/writing-sheets/module/${moduleId}`,
  letterSheet: (moduleId: number, letter: string) =>
    `${BASE_URL}/api/v1/writing-sheets/module/${moduleId}/letter/${letter}`,
}
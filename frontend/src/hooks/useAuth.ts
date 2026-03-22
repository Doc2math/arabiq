import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/authService'
import type { LoginPayload, RegisterPayload } from '@/types'

export function useAuth() {
  const { user, isAuthenticated, isLoading, setAuth, logout, setLoading } = useAuthStore()
  const qc = useQueryClient()

  useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authService.me,
    enabled: !user && !!useAuthStore.getState().tokens?.accessToken,
    retry: false,
    staleTime: 5 * 60_000,
  })

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onMutate: () => setLoading(true),
    onSuccess: ({ user, tokens }) => {
      setAuth(user, tokens)
      qc.invalidateQueries({ queryKey: ['curriculum'] })
    },
    onError: () => setLoading(false),
  })

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterPayload) => authService.register(payload),
    onMutate: () => setLoading(true),
    onSuccess: ({ user, tokens }) => setAuth(user, tokens),
    onError: () => setLoading(false),
  })

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSettled: () => { logout(); qc.clear(); window.location.replace('/login') },
  })

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutate,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
  }
}
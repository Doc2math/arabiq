import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import '@/i18n'

const LandingPage  = lazy(() => import('@/pages/LandingPage'))
const LoginPage    = lazy(() => import('@/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/RegisterPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const ModulePage   = lazy(() => import('@/pages/ModulePage'))
const LessonPage   = lazy(() => import('@/pages/LessonPage'))

const AdminLayout  = lazy(() => import('@/pages/admin/AdminLayout'))
const AdminStats   = lazy(() => import('@/pages/admin/AdminStats'))
const AdminUsers   = lazy(() => import('@/pages/admin/AdminUsers'))
const AdminContent = lazy(() => import('@/pages/admin/AdminContent'))
const AdminLogs    = lazy(() => import('@/pages/admin/AdminLogs'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 5 * 60_000, refetchOnWindowFocus: false },
  },
})

function RequireAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

function RequireGuest() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />
}

function RequireAdmin() {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  if (!(user as any).isAdmin) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

function PageLoader() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0A0F' }}>
      <div style={{ width: 32, height: 32, border: '2px solid rgba(201,149,58,.3)', borderTopColor: '#C9953A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Landing — publique */}
            <Route path="/" element={<LandingPage />} />

            {/* Auth — invités seulement */}
            <Route element={<RequireGuest />}>
              <Route path="/login"    element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* App — connectés */}
            <Route element={<RequireAuth />}>
              <Route path="/dashboard"  element={<DashboardPage />} />
              <Route path="/module/:id" element={<ModulePage />} />
              <Route path="/lesson/:id" element={<LessonPage />} />
            </Route>

            {/* Admin — admins seulement */}
            <Route element={<RequireAdmin />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index          element={<AdminStats />} />
                <Route path="users"   element={<AdminUsers />} />
                <Route path="content" element={<AdminContent />} />
                <Route path="logs"    element={<AdminLogs />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

const NAV = [
  { path: '/admin',          icon: '📊', label: 'Statistiques'    },
  { path: '/admin/users',    icon: '👥', label: 'Utilisateurs'    },
  { path: '/admin/content',  icon: '📚', label: 'Contenu'         },
  { path: '/admin/logs',     icon: '🔍', label: 'Logs'            },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-56'} bg-gray-900 text-white flex flex-col transition-all duration-200 shrink-0`}>
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700">
          {!collapsed && (
            <span className="font-display font-bold text-brand-gold text-lg">ArabiQ</span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-400 hover:text-white transition-colors ml-auto"
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {/* Admin badge */}
        {!collapsed && (
          <div className="px-4 py-2">
            <span className="text-xs bg-brand-teal/20 text-brand-teal-light px-2 py-0.5 rounded-full font-medium">
              Admin
            </span>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {NAV.map(({ path, icon, label }) => {
            const active = path === '/admin'
              ? location.pathname === '/admin'
              : location.pathname.startsWith(path)
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                  ${active
                    ? 'bg-brand-teal text-white font-medium'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
              >
                <span style={{ fontSize: 16 }}>{icon}</span>
                {!collapsed && <span>{label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User + logout */}
        <div className="px-2 py-4 border-t border-gray-700 space-y-1">
          {!collapsed && (
            <div className="px-3 py-2 text-xs text-gray-500 truncate">
              {user?.email}
            </div>
          )}
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <span style={{ fontSize: 16 }}>🚪</span>
            {!collapsed && <span>Déconnexion</span>}
          </button>
          <Link
            to="/dashboard"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <span style={{ fontSize: 16 }}>🏠</span>
            {!collapsed && <span>App</span>}
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
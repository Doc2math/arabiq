'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'

const C = {
  violet:'#6C3FC5', violetLt:'#EDE8FB',
  orange:'#F07C1E', orangeLt:'#FEF0E3',
  green:'#2BA84A', greenLt:'#E3F7E8',
  bg:'#F8F7FF', white:'#fff',
  text:'#1A1A2E', text2:'#5A5A7A', text3:'#9A9AB0',
  border:'#E8E4F8',
  sidebar:'#1A1A2E', sidebarActive:'#6C3FC5',
}

const SIDEBAR_LINKS = [
  { icon: '📊', label: 'Dashboard',     href: '/admin' },
  { icon: '👥', label: 'Utilisateurs',  href: '/admin/users' },
  { icon: '📚', label: 'Curriculum',    href: '/admin/curriculum' },
  { icon: '📝', label: 'Leçons',        href: '/admin/lessons' },
  { icon: '🎯', label: 'Exercices',     href: '/admin/exercises' },
  { icon: '📈', label: 'Statistiques',  href: '/admin/stats' },
  { icon: '🌍', label: 'Traductions',   href: '/admin/translations' },
  { icon: '⚙️', label: 'Paramètres',   href: '/admin/settings' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const [translating, setTranslating] = useState(false)
  const [translateStatus, setTranslateStatus] = useState<string | null>(null)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    if (!user.is_admin) { router.push('/dashboard'); return }
  }, [user])

  if (!user || !user.is_admin) return null

  const handleTranslate = async (force = false) => {
    setTranslating(true)
    setTranslateStatus(null)
    try {
      const res = await fetch(`/api/v1/admin/translate${force ? '?force=true' : ''}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      })
      const data = await res.json()
      if (res.ok) {
        setTranslateStatus(`✅ ${data.message}`)
      } else {
        setTranslateStatus(`❌ ${data.detail}`)
      }
    } catch {
      setTranslateStatus('❌ Erreur de connexion')
    } finally {
      setTranslating(false)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside style={{
        width: 220, background: C.sidebar,
        display: 'flex', flexDirection: 'column',
        padding: 16, position: 'sticky', top: 0,
        height: '100vh', overflowY: 'auto',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 8px', marginBottom: 12, borderBottom: '1px solid #ffffff20' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: C.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🌙</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>LangDad</span>
          <span style={{ fontSize: 9, background: '#E91E63', color: '#fff', padding: '2px 6px', borderRadius: 6, fontWeight: 700, marginLeft: 'auto' }}>ADMIN</span>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {SIDEBAR_LINKS.map(link => {
            const active = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href))
            return (
              <Link key={link.href} href={link.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10,
                  textDecoration: 'none', transition: 'background .15s',
                  background: active ? C.sidebarActive : 'transparent',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#ffffff15' }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                <span style={{ fontSize: 15 }}>{link.icon}</span>
                <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? '#fff' : '#9A9AB0' }}>
                  {link.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div style={{ borderTop: '1px solid #ffffff20', paddingTop: 12, marginTop: 12 }}>
          <button onClick={() => { logout(); router.push('/login') }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'none', border: 'none', cursor: 'pointer', width: '100%', transition: 'background .15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#ffffff15'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}>
            <span style={{ fontSize: 15 }}>🚪</span>
            <span style={{ fontSize: 13, color: '#9A9AB0' }}>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top bar */}
        <div style={{
          background: C.white, borderBottom: `2px solid ${C.border}`,
          height: 56, display: 'flex', alignItems: 'center',
          padding: '0 24px', gap: 12,
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          {/* Breadcrumb */}
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
              {SIDEBAR_LINKS.find(l => pathname === l.href || pathname.startsWith(l.href + '/'))?.label || 'Admin'}
            </span>
          </div>

          {/* Bouton traduction */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => handleTranslate(false)} disabled={translating}
                style={{
                  padding: '7px 14px', borderRadius: 10,
                  background: C.violetLt, color: C.violet,
                  border: `2px solid ${C.violet}`,
                  cursor: translating ? 'default' : 'pointer',
                  fontSize: 12, fontWeight: 700, opacity: translating ? 0.6 : 1,
                }}>
                {translating ? '⏳ Traduction…' : '🌍 Traduire'}
              </button>
              <button onClick={() => handleTranslate(true)} disabled={translating}
                style={{
                  padding: '7px 14px', borderRadius: 10,
                  background: C.orangeLt, color: C.orange,
                  border: `2px solid ${C.orange}`,
                  cursor: translating ? 'default' : 'pointer',
                  fontSize: 12, fontWeight: 700, opacity: translating ? 0.6 : 1,
                }}>
                🔄 Forcer
              </button>
            </div>
            {translateStatus && (
              <span style={{ fontSize: 11, color: translateStatus.startsWith('✅') ? C.green : '#E24B4A' }}>
                {translateStatus}
              </span>
            )}
          </div>

          {/* Avatar admin */}
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: '#E91E63', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700,
          }}>
            {user.username.slice(0, 2).toUpperCase()}
          </div>
        </div>

        {/* Page content */}
        <main style={{ flex: 1, background: C.bg, overflowY: 'auto', padding: '24px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
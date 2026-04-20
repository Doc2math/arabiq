'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'

const C = {
  violet:'#6C3FC5', violetLt:'#EDE8FB', violetDk:'#4A2A8A',
  orange:'#F07C1E', orangeLt:'#FEF0E3',
  green:'#2BA84A', greenLt:'#E3F7E8',
  bg:'#F8F7FF', white:'#fff',
  text:'#1A1A2E', text2:'#5A5A7A', text3:'#9A9AB0',
  border:'#E8E4F8',
}

const NAV_LINKS = [
  { href: '/dashboard', label: 'Modules' },
  { href: '/progress',  label: 'Progression' },
  { href: '/sheets',    label: 'Fiches' },
  { href: '/ranking',   label: 'Classement' },
]

const AVATAR_MENU = [
  { icon: '👤', label: 'Mon profil',      href: '/profile' },
  { icon: '📊', label: 'Mes statistiques', href: '/stats' },
  { icon: '🏆', label: 'Mes badges',      href: '/badges' },
  { icon: '⚙️', label: 'Paramètres',      href: '/settings' },
  { icon: '🌙', label: 'Langue',          href: '/language' },
]

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
  }, [user])

  // Fermer le menu si clic hors
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!user) return null

  const initials = user.username.slice(0, 2).toUpperCase()

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav style={{
        background: C.white, borderBottom: `2px solid ${C.border}`,
        height: 56, display: 'flex', alignItems: 'center',
        padding: '0 24px', gap: 16,
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        {/* Logo */}
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginRight: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: C.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🌙</div>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>LangDad</span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: 4, flex: 1 }}>
          {NAV_LINKS.map(link => {
            const active = pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link key={link.href} href={link.href}
                style={{
                  padding: '6px 14px', borderRadius: 10, textDecoration: 'none',
                  fontSize: 13, fontWeight: active ? 700 : 600,
                  background: active ? C.violetLt : 'transparent',
                  color: active ? C.violet : C.text2,
                  border: active ? `2px solid ${C.violet}` : '2px solid transparent',
                  transition: 'all .15s',
                }}>
                {link.label}
              </Link>
            )
          })}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ background: C.orangeLt, padding: '4px 12px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 13 }}>⚡</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.orange }}>{user.xp} XP</span>
          </div>
          <div style={{ background: C.greenLt, padding: '4px 12px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 13 }}>🔥</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.green }}>{user.streak}j</span>
          </div>

          {/* Avatar + menu */}
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button onClick={() => setMenuOpen(!menuOpen)}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: C.violet, color: '#fff',
                border: `2px solid ${C.violetDk}`,
                cursor: 'pointer', fontSize: 13, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              {initials}
            </button>

            {menuOpen && (
              <div style={{
                position: 'absolute', right: 0, top: 44,
                width: 210, background: C.white,
                border: `2px solid ${C.border}`, borderRadius: 16,
                padding: 8, zIndex: 200,
                boxShadow: '0 8px 32px rgba(108,63,197,.12)',
              }}>
                {/* Info utilisateur */}
                <div style={{ padding: '10px 12px', borderBottom: `1px solid ${C.border}`, marginBottom: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{user.username}</div>
                  <div style={{ fontSize: 12, color: C.text3 }}>{user.email}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <span style={{ fontSize: 11, background: C.violetLt, color: C.violet, padding: '2px 8px', borderRadius: 8, fontWeight: 600 }}>Niv. {user.level}</span>
                    {user.is_premium && <span style={{ fontSize: 11, background: C.orangeLt, color: C.orange, padding: '2px 8px', borderRadius: 8, fontWeight: 600 }}>Premium</span>}
                  </div>
                </div>

                {/* Links */}
                {AVATAR_MENU.map(item => (
                  <Link key={item.href} href={item.href}
                    onClick={() => setMenuOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, color: C.text2, fontSize: 13, textDecoration: 'none', transition: 'background .1s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f5f5f5'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}>
                    <span style={{ fontSize: 15 }}>{item.icon}</span>
                    {item.label}
                  </Link>
                ))}

                {/* Logout */}
                <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 6, paddingTop: 6 }}>
                  <button onClick={() => { setMenuOpen(false); logout(); router.push('/login') }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, color: '#E24B4A', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', width: '100%', transition: 'background .1s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fff0f0'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}>
                    <span style={{ fontSize: 15 }}>🚪</span>
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── Contenu ─────────────────────────────────────────── */}
      <main>{children}</main>
    </div>
  )
}
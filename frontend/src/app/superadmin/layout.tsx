'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'

const C = {
  violet:'#6C3FC5', violetLt:'#EDE8FB',
  orange:'#F07C1E', orangeLt:'#FEF0E3',
  green:'#2BA84A',
  pink:'#E91E63', pinkLt:'#FCE4EC',
  bg:'#F8F7FF', white:'#fff',
  text:'#1A1A2E', text2:'#5A5A7A', text3:'#9A9AB0',
  border:'#E8E4F8',
  sidebar:'#0F0F1A',
}

const SIDEBAR_LINKS = [
  { icon: '🛡️', label: 'Dashboard',        href: '/superadmin' },
  { icon: '👥', label: 'Admins',            href: '/superadmin/admins' },
  { icon: '📋', label: "Journal d'audit",   href: '/superadmin/audit' },
  { icon: '🔑', label: 'Permissions',       href: '/superadmin/permissions' },
  { icon: '⚙️', label: 'Paramètres',        href: '/superadmin/settings' },
]

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const { user, logout, fetchMe } = useAuthStore()
  const [hydrated, setHydrated]   = useState(false)
  const [translating, setTranslating] = useState(false)
  const [translateMsg, setTranslateMsg] = useState<{ text: string; ok: boolean } | null>(null)

  // Étape 1 — attendre la rehydratation de Zustand
  useEffect(() => { setHydrated(true) }, [])

  // Étape 2 — vérifier l'auth après rehydratation
  useEffect(() => {
    if (!hydrated) return

    const token = localStorage.getItem('access_token')

    // Pas de token → page d'accueil
    if (!token) {
      router.push('/')
      return
    }

    // Token présent mais user pas encore chargé → fetchMe
    if (!user) {
      fetchMe().catch(() => router.push('/'))
      return  // attendre que fetchMe mette à jour user
    }

    // User chargé → vérifier le rôle
    if ((user as any).role !== 'superadmin') {
      router.push(user.is_admin ? '/admin' : '/dashboard')
    }
  }, [hydrated, user])

  const handleTranslate = async (force = false) => {
    setTranslating(true)
    setTranslateMsg(null)
    try {
      const res = await api.post(`/api/v1/admin/translate${force ? '?force=true' : ''}`)
      setTranslateMsg({ text: res.data.message, ok: true })
    } catch (e: any) {
      setTranslateMsg({ text: e.response?.data?.detail || 'Erreur', ok: false })
    }
    setTranslating(false)
  }

  // Écran de chargement pendant rehydratation
  if (!hydrated || !user) return (
    <div style={{ minHeight: '100vh', background: C.sidebar, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: C.pink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🛡️</div>
    </div>
  )

  if ((user as any).role !== 'superadmin') return null

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside style={{
        width: 230, background: C.sidebar,
        display: 'flex', flexDirection: 'column',
        padding: 16, position: 'sticky', top: 0,
        height: '100vh', overflowY: 'auto', flexShrink: 0,
      }}>
        {/* Logo + profil */}
        <div style={{ padding: '12px 8px', marginBottom: 12, borderBottom: '1px solid #ffffff15' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: C.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🌙</div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>LangDad</span>
            <span style={{ fontSize: 9, background: C.pink, color: '#fff', padding: '2px 6px', borderRadius: 6, fontWeight: 700, marginLeft: 'auto' }}>SUPER</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#ffffff08', borderRadius: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.pink, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{user.username}</div>
              <div style={{ fontSize: 10, color: '#ffffff50' }}>Super Admin</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {SIDEBAR_LINKS.map(link => {
            const active = pathname === link.href || (link.href !== '/superadmin' && pathname.startsWith(link.href))
            return (
              <Link key={link.href} href={link.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10,
                  textDecoration: 'none', transition: 'background .15s',
                  background: active ? C.pink : 'transparent',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#ffffff12' }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                <span style={{ fontSize: 15 }}>{link.icon}</span>
                <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? '#fff' : '#9A9AB0' }}>
                  {link.label}
                </span>
              </Link>
            )
          })}

          {/* Accès espace Admin */}
          <div style={{ borderTop: '1px solid #ffffff15', margin: '10px 0' }} />
          <Link href="/admin"
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, textDecoration: 'none', background: 'transparent', transition: 'background .15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#ffffff12'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
            <span style={{ fontSize: 15 }}>🔧</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#9A9AB0' }}>Espace Admin</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#ffffff30' }}>→</span>
          </Link>
        </nav>

        {/* Logout */}
        <div style={{ borderTop: '1px solid #ffffff15', paddingTop: 12 }}>
          <button onClick={() => { logout(); router.push('/') }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#ffffff12'}
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
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text, flex: 1 }}>
            {SIDEBAR_LINKS.find(l => pathname === l.href || pathname.startsWith(l.href + '/'))?.label || 'Super Admin'}
          </span>

          {/* Boutons traduction */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => handleTranslate(false)} disabled={translating}
                style={{ padding: '7px 14px', borderRadius: 10, background: C.violetLt, color: C.violet, border: `2px solid ${C.violet}`, cursor: translating ? 'default' : 'pointer', fontSize: 12, fontWeight: 700, opacity: translating ? 0.6 : 1 }}>
                {translating ? '⏳…' : '🌍 Traduire'}
              </button>
              <button onClick={() => handleTranslate(true)} disabled={translating}
                style={{ padding: '7px 14px', borderRadius: 10, background: C.orangeLt, color: C.orange, border: `2px solid ${C.orange}`, cursor: translating ? 'default' : 'pointer', fontSize: 12, fontWeight: 700, opacity: translating ? 0.6 : 1 }}>
                🔄 Forcer  
              </button>
            </div>
            {translateMsg && (
              <span style={{ fontSize: 11, color: translateMsg.ok ? C.green : '#E24B4A' }}>
                {translateMsg.ok ? '✅' : '❌'} {translateMsg.text}
              </span>
            )}
          </div>

          {/* Avatar superadmin */}
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.pink, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
            {user.username.slice(0, 2).toUpperCase()}
          </div>
        </div>

        {/* Contenu */}
        <main style={{ flex: 1, background: C.bg, overflowY: 'auto', padding: '24px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
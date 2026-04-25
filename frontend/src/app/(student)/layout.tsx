'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { ReferencesPanel } from '@/components/ReferencesPanel'

const C = {
  violet:'#6C3FC5', violetLt:'#EDE8FB', violetDk:'#4A2A8A',
  orange:'#F07C1E', orangeLt:'#FEF0E3',
  green:'#2BA84A', greenLt:'#E3F7E8',
  bg:'#F8F7FF', white:'#fff',
  text:'#1A1A2E', text2:'#5A5A7A', text3:'#9A9AB0',
  border:'#E8E4F8',
}

const NAV_LINKS = [
  { href: '/dashboard', label: 'Modules'    },
  { href: '/progress',  label: 'Progression'},
  { href: '/sheets',    label: 'Fiches'     },
  { href: '/ranking',   label: 'Classement' },
]

const AVATAR_MENU = [
  { icon: '👤', label: 'Mon profil',       href: '/profile'  },
  { icon: '📊', label: 'Mes statistiques', href: '/progress' },
  { icon: '🏅', label: 'Mes badges',       href: '/badges'   },
  { icon: '⚙️', label: 'Paramètres',       href: '/settings' },
]

const LANGUAGES = [
  { code: 'fr', label: 'Français',   flag: '🇫🇷' },
  { code: 'en', label: 'English',    flag: '🇬🇧' },
  { code: 'es', label: 'Español',    flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch',    flag: '🇩🇪' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
]

function LanguageSelector() {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState('fr')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setCurrent(localStorage.getItem('langdad_lang') ?? 'fr')
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const select = (code: string) => {
    setCurrent(code)
    localStorage.setItem('langdad_lang', code)
    setOpen(false)
  }

  const lang = LANGUAGES.find(l => l.code === current) ?? LANGUAGES[0]

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10, border: `2px solid ${C.border}`, background: C.white, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.text }}>
        <span style={{ fontSize: 16 }}>{lang.flag}</span>
        <span>{lang.code.toUpperCase()}</span>
        <span style={{ fontSize: 9, color: C.text3 }}>▼</span>
      </button>

      {open && (
        <div style={{ position: 'absolute', right: 0, top: 44, background: C.white, border: `2px solid ${C.border}`, borderRadius: 14, padding: 6, zIndex: 300, width: 160, boxShadow: '0 8px 24px rgba(108,63,197,.1)' }}>
          {LANGUAGES.map(l => (
            <button key={l.code} onClick={() => select(l.code)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', borderRadius: 8, background: current === l.code ? C.violetLt : 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: current === l.code ? 700 : 500, color: current === l.code ? C.violet : C.text2, textAlign: 'left' as const }}
              onMouseEnter={e => { if (current !== l.code) (e.currentTarget as HTMLElement).style.background = '#F5F5F5' }}
              onMouseLeave={e => { if (current !== l.code) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              <span style={{ fontSize: 18 }}>{l.flag}</span>
              <span>{l.label}</span>
              {current === l.code && <span style={{ marginLeft: 'auto', fontSize: 12 }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const { user, logout, fetchMe } = useAuthStore()
  const [menuOpen, setMenuOpen]   = useState(false)
  const [hydrated, setHydrated]   = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [refOpen, setRefOpen]     = useState(false)
  const [refTab, setRefTab]       = useState<'alphabet'|'rules'>('alphabet')
  const [refMenuOpen, setRefMenu] = useState(false)

  useEffect(() => { setHydrated(true) }, [])

  useEffect(() => {
    if (!hydrated) return
    const token = localStorage.getItem('access_token')
    if (!token) { router.push('/'); return }
    if (!user && token) {
      fetchMe().catch(() => router.push('/'))
    }
  }, [hydrated, user])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!hydrated) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: C.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🌙</div>
    </div>
  )

  if (!user) return null

  const initials = user.username.slice(0, 2).toUpperCase()

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav style={{ background: C.white, borderBottom: `2px solid ${C.border}`, height: 56, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, position: 'sticky', top: 0, zIndex: 100 }}>

        {/* Logo */}
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginRight: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: C.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🌙</div>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>LangDad</span>
        </Link>

        {/* Liens nav */}
        <div style={{ display: 'flex', gap: 4, flex: 1 }}>
          {NAV_LINKS.map(link => {
            const active = pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link key={link.href} href={link.href}
                style={{ padding: '6px 14px', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: active ? 700 : 600, background: active ? C.violetLt : 'transparent', color: active ? C.violet : C.text2, border: active ? `2px solid ${C.violet}` : '2px solid transparent', transition: 'all .15s' }}>
                {link.label}
              </Link>
            )
          })}
          <div style={{ position: 'relative' }}
  onMouseEnter={() => setRefMenu(true)}
  onMouseLeave={() => setRefMenu(false)}>
  
  <button style={{ fontSize: 14, fontWeight: 600, color: C.text2, background: 'none', border: 'none', cursor: 'pointer' }}>
     Références ▾
  </button>

  {refMenuOpen && (
    <div style={{
      position: 'absolute', top: '100%', left: 0, zIndex: 50,
      background: '#fff', border: `2px solid ${C.border}`,
      borderRadius: 14, padding: 6, minWidth: 160,
      boxShadow: '0 8px 24px rgba(108,63,197,.12)',
    }}>
            <button onClick={() => { setRefTab('alphabet'); setRefOpen(true); setRefMenu(false) }}
              style={{ display: 'block', width: '100%', padding: '9px 14px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.text, textAlign: 'left' }}>
              🔤 Alphabet
            </button>
            <button onClick={() => { setRefTab('rules'); setRefOpen(true); setRefMenu(false) }}
              style={{ display: 'block', width: '100%', padding: '9px 14px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.text, textAlign: 'left' }}>
              📋 Règles
            </button>
          </div>
            )}
          </div>
        </div>

        {/* Droite : XP + Série + Langue + Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

          {/* XP */}
          <div style={{ background: C.orangeLt, padding: '4px 12px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 13 }}>⚡</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.orange }}>{user.xp} XP</span>
          </div>

          {/* Série */}
          <div style={{ background: C.greenLt, padding: '4px 12px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 13 }}>🔥</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.green }}>{user.streak}j</span>
          </div>

          {/* ── Sélecteur de langue ── */}
          <LanguageSelector />

          {/* Avatar + menu */}
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button onClick={() => setMenuOpen(!menuOpen)}
              style={{ width: 36, height: 36, borderRadius: '50%', background: C.violet, color: '#fff', border: `2px solid ${C.violetDk}`, cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {initials}
            </button>

            {menuOpen && (
              <div style={{ position: 'absolute', right: 0, top: 44, width: 210, background: C.white, border: `2px solid ${C.border}`, borderRadius: 16, padding: 8, zIndex: 200, boxShadow: '0 8px 32px rgba(108,63,197,.12)' }}>
                <div style={{ padding: '10px 12px', borderBottom: `1px solid ${C.border}`, marginBottom: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{user.username}</div>
                  <div style={{ fontSize: 12, color: C.text3 }}>{user.email}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <span style={{ fontSize: 11, background: C.violetLt, color: C.violet, padding: '2px 8px', borderRadius: 8, fontWeight: 600 }}>Niv. {user.level}</span>
                    {user.is_premium && <span style={{ fontSize: 11, background: C.orangeLt, color: C.orange, padding: '2px 8px', borderRadius: 8, fontWeight: 600 }}>Premium</span>}
                  </div>
                </div>

                {AVATAR_MENU.map(item => (
                  <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, color: C.text2, fontSize: 13, textDecoration: 'none' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f5f5f5'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}>
                    <span style={{ fontSize: 15 }}>{item.icon}</span>
                    {item.label}
                  </Link>
                ))}

                <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 6, paddingTop: 6 }}>
                  <button onClick={() => { setMenuOpen(false); logout(); router.push('/') }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, color: '#E24B4A', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}
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

                <main>{children}</main>
                {refOpen && (
                  <ReferencesPanel
                    initialTab={refTab}
                    onClose={() => setRefOpen(false)}
                  />
                )}
    </div>
  )
}
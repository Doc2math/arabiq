'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
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

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const { user, logout, fetchMe } = useAuthStore()
  const t       = useTranslations('nav')
  const tCommon = useTranslations('common')

  const [menuOpen, setMenuOpen]   = useState(false)
  const [hydrated, setHydrated]   = useState(false)
  const [mobile, setMobile]       = useState(false)
  const [hamburgerOpen, setHamburgerOpen] = useState(false)
  const menuRef      = useRef<HTMLDivElement>(null)
  const hamburgerRef = useRef<HTMLDivElement>(null)
  const [refOpen, setRefOpen]     = useState(false)
  const [refTab, setRefTab]       = useState<'alphabet'|'rules'>('alphabet')
  const [refMenuOpen, setRefMenu] = useState(false)

  useEffect(() => { setHydrated(true) }, [])

  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

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
      if (hamburgerRef.current && !hamburgerRef.current.contains(e.target as Node)) setHamburgerOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => { setHamburgerOpen(false) }, [pathname])

  if (!hydrated) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: C.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🌙</div>
    </div>
  )

  if (!user) return null

  // ── NAV_LINKS dynamique selon rôle + traductions ───────────
  const BASE_NAV_LINKS = [
    { href: '/dashboard', label: t('modules')        },
    { href: '/progress',  label: t('progress')       },
    { href: '/sheets',    label: t('sheets')          },
    { href: '/ranking',   label: t('ranking')         },
    { href: '/outils',    label: `🛠 ${t('tools')}`  },
  ]

 

  const AVATAR_MENU = [
  { icon: '👤', label: tCommon('profile'),  href: '/profile'      },
  { icon: '📊', label: t('progress'),       href: '/progress'     },
  { icon: '🏅', label: t('certificates'),   href: '/certificates' },
  { icon: '⚙️', label: tCommon('settings'), href: '/settings'     },
]

  const NAV_LINKS = [
    ...BASE_NAV_LINKS,
    ...(user.role === 'institution_admin'
      ? [{ href: '/institution', label: `🏫 ${t('mySchool')}` }]
      : []),
  ]

  const initials = user.username.slice(0, 2).toUpperCase()

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui, sans-serif' }}>

      <nav style={{ background: C.white, borderBottom: `2px solid ${C.border}`, height: 56, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 8, position: 'sticky', top: 0, zIndex: 100 }}>

        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginRight: 8, flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: C.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🌙</div>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>LangDad</span>
        </Link>

        {!mobile && (
          <div style={{ display: 'flex', gap: 4, flex: 1, alignItems: 'center' }}>
            {NAV_LINKS.map(link => {
              const active = pathname === link.href || pathname.startsWith(link.href + '/')
              const isOutils = link.href === '/outils'
              const isInstitution = link.href === '/institution'
              return (
                <Link key={link.href} href={link.href}
                  style={{
                    padding: '6px 14px', borderRadius: 10, textDecoration: 'none',
                    fontSize: 13, fontWeight: active ? 700 : 600,
                    background: active ? C.violetLt : isOutils ? C.orangeLt : isInstitution ? C.greenLt : 'transparent',
                    color: active ? C.violet : isOutils ? C.orange : isInstitution ? '#1A6630' : C.text2,
                    border: active ? `2px solid ${C.violet}` : isOutils ? `2px solid ${C.orange}40` : isInstitution ? `2px solid #2BA84A40` : '2px solid transparent',
                    transition: 'all .15s',
                  }}>
                  {link.label}
                </Link>
              )
            })}

            <div style={{ position: 'relative' }}
              onMouseEnter={() => setRefMenu(true)}
              onMouseLeave={() => setRefMenu(false)}>
              <button style={{ padding: '6px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, color: C.text2, background: 'transparent', border: '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, lineHeight: 'normal' }}>
                {t('references')} ▾
              </button>
              {refMenuOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 200, background: C.white, border: `2px solid ${C.border}`, borderRadius: 14, padding: 6, minWidth: 160, boxShadow: '0 8px 24px rgba(108,63,197,.12)' }}>
                  <button onClick={() => { setRefTab('alphabet'); setRefOpen(true); setRefMenu(false) }}
                    style={{ display: 'block', width: '100%', padding: '9px 14px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.text, textAlign: 'left' }}>
                    🔤 {t('alphabet')}
                  </button>
                  <button onClick={() => { setRefTab('rules'); setRefOpen(true); setRefMenu(false) }}
                    style={{ display: 'block', width: '100%', padding: '9px 14px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.text, textAlign: 'left' }}>
                    📋 {t('rules')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {mobile && <div style={{ flex: 1 }} />}

        {!mobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{ background: C.orangeLt, padding: '4px 12px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 13 }}>⚡</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.orange }}>{user.xp} XP</span>
            </div>
            <div style={{ background: C.greenLt, padding: '4px 12px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 13 }}>🔥</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.green }}>{user.streak}j</span>
            </div>
            
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
                      {tCommon('logout')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {mobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ background: C.orangeLt, padding: '4px 10px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 12 }}>⚡</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.orange }}>{user.xp} XP</span>
            </div>
            <div ref={hamburgerRef} style={{ position: 'relative' }}>
              <button onClick={() => setHamburgerOpen(!hamburgerOpen)}
                style={{ width: 36, height: 36, borderRadius: 10, background: hamburgerOpen ? C.violetLt : C.bg, border: `2px solid ${hamburgerOpen ? C.violet : C.border}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <span style={{ display: 'block', width: 16, height: 2, background: hamburgerOpen ? C.violet : C.text2, borderRadius: 2, transition: 'all .2s', transform: hamburgerOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none' }} />
                <span style={{ display: 'block', width: 16, height: 2, background: hamburgerOpen ? C.violet : C.text2, borderRadius: 2, transition: 'all .2s', opacity: hamburgerOpen ? 0 : 1 }} />
                <span style={{ display: 'block', width: 16, height: 2, background: hamburgerOpen ? C.violet : C.text2, borderRadius: 2, transition: 'all .2s', transform: hamburgerOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'none' }} />
              </button>

              {hamburgerOpen && (
                <div style={{ position: 'absolute', right: 0, top: 44, width: 240, background: C.white, border: `2px solid ${C.border}`, borderRadius: 16, padding: 8, zIndex: 200, boxShadow: '0 8px 32px rgba(108,63,197,.15)' }}>
                  <div style={{ padding: '10px 12px', borderBottom: `1px solid ${C.border}`, marginBottom: 6 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{user.username}</div>
                    <div style={{ fontSize: 12, color: C.text3 }}>{user.email}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                      <span style={{ fontSize: 11, background: C.violetLt, color: C.violet, padding: '2px 8px', borderRadius: 8, fontWeight: 600 }}>Niv. {user.level}</span>
                      <span style={{ fontSize: 11, background: C.greenLt, color: C.green, padding: '2px 8px', borderRadius: 8, fontWeight: 600 }}>🔥 {user.streak}j</span>
                      {user.is_premium && <span style={{ fontSize: 11, background: C.orangeLt, color: C.orange, padding: '2px 8px', borderRadius: 8, fontWeight: 600 }}>Premium</span>}
                    </div>
                  </div>

                  {NAV_LINKS.map(link => {
                    const active = pathname === link.href || pathname.startsWith(link.href + '/')
                    const isOutils = link.href === '/outils'
                    const isInstitution = link.href === '/institution'
                    return (
                      <Link key={link.href} href={link.href} onClick={() => setHamburgerOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', padding: '9px 12px', borderRadius: 8, fontSize: 13, fontWeight: active ? 700 : 600, color: active ? C.violet : isOutils ? C.orange : isInstitution ? '#1A6630' : C.text2, background: active ? C.violetLt : isOutils ? C.orangeLt : isInstitution ? C.greenLt : 'transparent', textDecoration: 'none', marginBottom: 2 }}>
                        {link.label}
                      </Link>
                    )
                  })}

                  <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 4, paddingTop: 4 }}>
                    <button onClick={() => { setRefTab('alphabet'); setRefOpen(true); setHamburgerOpen(false) }}
                      style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '9px 12px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.text }}>
                      🔤 {t('alphabet')}
                    </button>
                    <button onClick={() => { setRefTab('rules'); setRefOpen(true); setHamburgerOpen(false) }}
                      style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '9px 12px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.text }}>
                      📋 {t('rules')}
                    </button>
                  </div>

                  

                  <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 4, paddingTop: 4 }}>
                    {AVATAR_MENU.map(item => (
                      <Link key={item.href} href={item.href} onClick={() => setHamburgerOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, color: C.text2, fontSize: 13, textDecoration: 'none' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f5f5f5'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}>
                        <span style={{ fontSize: 15 }}>{item.icon}</span>
                        {item.label}
                      </Link>
                    ))}
                    <button onClick={() => { setHamburgerOpen(false); logout(); router.push('/') }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, color: '#E24B4A', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}>
                      <span style={{ fontSize: 15 }}>🚪</span>
                      {tCommon('logout')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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
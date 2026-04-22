'use client'

import { useEffect, useRef, useState } from 'react'

const LANGUAGES = [
  { code: 'fr', label: 'Français',   flag: '🇫🇷' },
  { code: 'en', label: 'English',    flag: '🇬🇧' },
  { code: 'es', label: 'Español',    flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch',    flag: '🇩🇪' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
]

interface LanguageSelectorProps {
  scrolled?: boolean  // optionnel — pour adapter les couleurs sur fond sombre (landing page)
}

export function LanguageSelector({ scrolled = true }: LanguageSelectorProps) {
  const [open, setOpen]       = useState(false)
  const [current, setCurrent] = useState('fr')
  const [mounted, setMounted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Lire localStorage seulement côté client après hydratation
  useEffect(() => {
    setCurrent(localStorage.getItem('langdad_lang') ?? 'fr')
    setMounted(true)
  }, [])

  // Fermer le menu si clic hors
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

  // Placeholder fixe avant hydratation — évite le mismatch SSR/client
  if (!mounted) {
    return <div style={{ width: 76, height: 34, borderRadius: 10, background: 'transparent' }} />
  }

  // Couleurs adaptées selon le contexte (navbar sombre vs blanche)
  const btnBorder  = scrolled ? '#E8E4F8'               : 'rgba(255,255,255,0.3)'
  const btnColor   = scrolled ? '#1A1A2E'               : '#ffffff'
  const btnBg      = scrolled ? '#ffffff'               : 'transparent'

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 10,
          border: `2px solid ${btnBorder}`,
          background: btnBg, cursor: 'pointer',
          fontSize: 13, fontWeight: 600, color: btnColor,
          transition: 'all .2s',
        }}>
        <span style={{ fontSize: 16 }}>{lang.flag}</span>
        <span>{lang.code.toUpperCase()}</span>
        <span style={{ fontSize: 9, opacity: 0.6 }}>▼</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 44,
          background: '#ffffff',
          border: '2px solid #E8E4F8',
          borderRadius: 14, padding: 6,
          zIndex: 300, width: 165,
          boxShadow: '0 8px 24px rgba(108,63,197,.12)',
        }}>
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => select(l.code)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '9px 12px', borderRadius: 8,
                background: current === l.code ? '#EDE8FB' : 'transparent',
                border: 'none', cursor: 'pointer',
                fontSize: 13,
                fontWeight: current === l.code ? 700 : 500,
                color: current === l.code ? '#6C3FC5' : '#5A5A7A',
                textAlign: 'left' as const,
                transition: 'background .1s',
              }}
              onMouseEnter={e => {
                if (current !== l.code)
                  (e.currentTarget as HTMLElement).style.background = '#F5F5F5'
              }}
              onMouseLeave={e => {
                if (current !== l.code)
                  (e.currentTarget as HTMLElement).style.background = 'transparent'
              }}>
              <span style={{ fontSize: 18 }}>{l.flag}</span>
              <span>{l.label}</span>
              {current === l.code && (
                <span style={{ marginLeft: 'auto', fontSize: 12, color: '#6C3FC5' }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
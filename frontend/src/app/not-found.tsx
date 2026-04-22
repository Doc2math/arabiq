'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const ARABIC_LETTERS = ['ب','م','ك','ت','ا','و','ي','ر','س','ن','ل','ه']

export default function NotFound() {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % ARABIC_LETTERS.length), 900)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #4A2A8A 0%, #6C3FC5 50%, #9B59B6 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif', padding: 20,
      position: 'relative', overflow: 'hidden',
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap" rel="stylesheet" />

      {/* Lettres flottantes */}
      {ARABIC_LETTERS.map((l, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${5 + (i * 8) % 90}%`,
          top: `${8 + (i * 11) % 82}%`,
          fontFamily: "'Noto Naskh Arabic', serif",
          fontSize: `${28 + (i % 4) * 18}px`,
          color: `rgba(255,255,255,${i === idx ? 0.18 : 0.05})`,
          direction: 'rtl',
          transform: `rotate(${(i % 7 - 3) * 6}deg)`,
          transition: 'opacity .4s',
          pointerEvents: 'none',
          userSelect: 'none',
        }}>{l}</div>
      ))}

      {/* Cercles déco */}
      <div style={{ position: 'absolute', right: -80, top: -80, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: -60, bottom: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

      {/* Carte centrale */}
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(20px)',
        borderRadius: 32, padding: '52px 48px',
        border: '2px solid rgba(255,255,255,0.15)',
        textAlign: 'center', maxWidth: 480, width: '100%',
        position: 'relative', zIndex: 1,
      }}>

        {/* Grande lettre arabe animée */}
        <div style={{
          fontFamily: "'Noto Naskh Arabic', serif",
          fontSize: 96, color: 'rgba(255,255,255,0.15)',
          lineHeight: 1, marginBottom: 8, direction: 'rtl',
          transition: 'opacity .4s',
        }}>
          {ARABIC_LETTERS[idx]}
        </div>

        {/* 404 */}
        <div style={{ fontSize: 88, fontWeight: 800, color: '#fff', lineHeight: 1, marginBottom: 16, letterSpacing: '-.04em' }}>
          4<span style={{ color: '#F07C1E' }}>0</span>4
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 10 }}>
          Page introuvable
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: 36 }}>
          Cette page n'existe pas ou a été déplacée.<br />
          Retournez à votre apprentissage !
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/dashboard"
            style={{
              padding: '13px 28px', borderRadius: 14,
              background: '#F07C1E', color: '#fff',
              fontSize: 14, fontWeight: 700, textDecoration: 'none',
              transition: 'transform .15s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'none'}>
            ▶ Continuer à apprendre
          </Link>
          <Link href="/"
            style={{
              padding: '13px 24px', borderRadius: 14,
              background: 'rgba(255,255,255,0.12)',
              border: '2px solid rgba(255,255,255,0.2)',
              color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none',
            }}>
            ← Accueil
          </Link>
        </div>

        {/* Logo bas */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 36, opacity: 0.5 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🌙</div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>LangDad</span>
        </div>
      </div>
    </div>
  )
}
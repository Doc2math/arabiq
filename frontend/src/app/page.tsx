'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LanguageSelector } from '@/components/LanguageSelector'

const C = {
  violet: '#6C3FC5', violetLt: '#EDE8FB', violetDk: '#4A2A8A',
  orange: '#F07C1E', orangeLt: '#FEF0E3',
  green:  '#2BA84A', greenLt:  '#E3F7E8',
  blue:   '#1976D2', blueLt:   '#E6F1FB',
  bg:     '#F8F7FF', white:    '#FFFFFF',
  text:   '#1A1A2E', text2:    '#5A5A7A', text3: '#9A9AB0',
  border: '#E8E4F8',
}

const ARABIC_LETTERS = ['ب','م','ك','ت','ا','و','ي','ر','س','ن','ل','ه','ع','غ','ق']

const FEATURES = [
  { icon: '🎯', title: 'Apprentissage adaptatif', desc: 'Notre moteur BKT analyse votre progression en temps réel et adapte les exercices à votre niveau.', color: C.violet, bg: C.violetLt },
  { icon: '✍️', title: "Fiches d'écriture", desc: 'Imprimez ou tracez les lettres sur écran tactile avec des grilles guidées et des modèles progressifs.', color: C.orange, bg: C.orangeLt },
  { icon: '🎵', title: 'Audio natif', desc: "Chaque lettre, syllabe et mot est prononcé par un locuteur natif.", color: C.green, bg: C.greenLt },
  { icon: '🏆', title: 'Gamification', desc: 'XP, niveaux, séries et classement : restez motivé avec un système de récompenses.', color: C.blue, bg: C.blueLt },
  { icon: '📱', title: 'Multi-plateforme', desc: 'Apprenez sur ordinateur, tablette ou mobile. Votre progression se synchronise partout.', color: '#9C27B0', bg: '#F3E5F5' },
  { icon: '🌍', title: "5 langues d'interface", desc: 'Disponible en français, anglais, espagnol, allemand et néerlandais.', color: '#E91E63', bg: '#FCE4EC' },
]

const MODULES = [
  { num: 1, title: 'Maktab — مَكْتَبٌ', letters: ['م','ك','ت','ب'], desc: 'Les 4 premières lettres et les bases de la lecture arabe', color: C.violet, bg: C.violetLt, available: true },
  { num: 2, title: 'Module 2', letters: ['ا','و','ي'], desc: 'Voyelles longues et nouvelles lettres', color: C.orange, bg: C.orangeLt, available: false },
  { num: 3, title: 'Module 3', letters: ['س','ن','ل'], desc: 'Expansion du vocabulaire', color: C.green, bg: C.greenLt, available: false },
]

const TESTIMONIALS = [
  { name: 'Sarah M.', country: '🇫🇷 France', text: "En 2 semaines j'ai appris à reconnaître toutes les lettres du module 1. Les fiches d'écriture sont vraiment bien faites !", xp: 840 },
  { name: 'Karim B.', country: '🇧🇪 Belgique', text: "Le système de progression s'adapte à mon rythme. Je n'avais jamais réussi à apprendre l'arabe avant.", xp: 1240 },
  { name: 'Emma L.', country: '🇳🇱 Pays-Bas', text: "L'interface est disponible en néerlandais, c'est top ! Les exercices audio m'ont vraiment aidée.", xp: 620 },
]

const STATS = [
  { value: '1000', label: 'Leçons' },
  { value: '6000', label: 'Exercices' },
  { value: '36', label: 'Modules' },
  { value: '6', label: 'Degrés' },
]

const NAV_LINKS = [
  ['#features', 'Fonctionnalités'],
  ['#modules',  'Modules'],
  ['#testimonials', 'Témoignages'],
  ['/blog',     'Blog'],
]

export default function LandingPage() {
  const [scrolled, setScrolled]         = useState(false)
  const [activeLetterIdx, setActiveLetterIdx] = useState(0)
  const [menuOpen, setMenuOpen]         = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setActiveLetterIdx(i => (i + 1) % ARABIC_LETTERS.length), 1200)
    return () => clearInterval(interval)
  }, [])

  const navBg    = scrolled || menuOpen
  const textColor = navBg ? C.text  : '#fff'
  const subColor  = navBg ? C.text2 : 'rgba(255,255,255,0.85)'

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Segoe UI', system-ui, sans-serif", overflowX: 'hidden' }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap" rel="stylesheet" />

      {/* ── NAVBAR ──────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: navBg ? 'rgba(255,255,255,0.97)' : 'transparent',
        backdropFilter: navBg ? 'blur(12px)' : 'none',
        borderBottom: navBg ? `1px solid ${C.border}` : 'none',
        transition: 'all .3s',
      }}>
        {/* Barre principale */}
        <div style={{ padding: '0 20px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: C.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🌙</div>
            <span style={{ fontSize: 20, fontWeight: 800, color: textColor, letterSpacing: '-.02em', transition: 'color .3s' }}>LangDad</span>
          </Link>

          {/* Liens desktop */}
          <div style={{ display: 'flex', gap: 24 }} className="desktop-only">
            {NAV_LINKS.map(([href, label]) => (
              <a key={href} href={href}
                style={{ fontSize: 14, fontWeight: 600, color: subColor, textDecoration: 'none', transition: 'color .2s' }}>
                {label}
              </a>
            ))}
          </div>

          {/* CTA desktop + hamburger */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Desktop CTA */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} className="desktop-only">
              <LanguageSelector scrolled={navBg} />
              <Link href="/login"
                style={{ padding: '8px 16px', borderRadius: 10, border: `2px solid ${navBg ? C.border : 'rgba(255,255,255,0.4)'}`, background: 'transparent', color: textColor, fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'all .2s' }}>
                Connexion
              </Link>
              <Link href="/register"
                style={{ padding: '8px 16px', borderRadius: 10, background: C.orange, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                S&apos;inscrire →
              </Link>
            </div>

            {/* Hamburger mobile */}
            <button
              className="mobile-only"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ width: 22, height: 2, background: textColor, borderRadius: 2, display: 'block', transition: 'all .3s', transform: menuOpen ? 'rotate(45deg) translateY(7px)' : 'none' }} />
              <span style={{ width: 22, height: 2, background: textColor, borderRadius: 2, display: 'block', transition: 'all .3s', opacity: menuOpen ? 0 : 1 }} />
              <span style={{ width: 22, height: 2, background: textColor, borderRadius: 2, display: 'block', transition: 'all .3s', transform: menuOpen ? 'rotate(-45deg) translateY(-7px)' : 'none' }} />
            </button>
          </div>
        </div>

        {/* Menu mobile déroulant */}
        {menuOpen && (
          <div style={{ background: '#fff', borderTop: `1px solid ${C.border}`, padding: '12px 20px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {NAV_LINKS.map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)}
                style={{ padding: '12px 16px', borderRadius: 12, fontSize: 15, fontWeight: 600, color: C.text, textDecoration: 'none', display: 'block' }}>
                {label}
              </a>
            ))}
            <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 8, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <LanguageSelector scrolled={true} />
              <Link href="/login" onClick={() => setMenuOpen(false)}
                style={{ padding: '12px', borderRadius: 12, border: `2px solid ${C.border}`, color: C.text, fontSize: 14, fontWeight: 600, textDecoration: 'none', textAlign: 'center' as const }}>
                Se connecter
              </Link>
              <Link href="/register" onClick={() => setMenuOpen(false)}
                style={{ padding: '12px', borderRadius: 12, background: C.orange, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', textAlign: 'center' as const }}>
                Commencer gratuitement →
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ────────────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${C.violetDk} 0%, ${C.violet} 50%, #9B59B6 100%)`,
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        padding: '100px 20px 60px', position: 'relative', overflow: 'hidden',
      }}>
        {ARABIC_LETTERS.map((letter, i) => (
          <div key={i} style={{
            position: 'absolute', left: `${5 + (i * 7) % 90}%`, top: `${10 + (i * 13) % 80}%`,
            fontFamily: "'Noto Naskh Arabic', serif", fontSize: `${24 + (i % 4) * 16}px`,
            color: `rgba(255,255,255,${i === activeLetterIdx ? 0.15 : 0.05})`,
            direction: 'rtl', transition: 'opacity .5s', pointerEvents: 'none', userSelect: 'none',
          }}>{letter}</div>
        ))}

        <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 48, alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.12)', padding: '6px 14px', borderRadius: 20, marginBottom: 20 }}>
                <span>🌙</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>Plateforme d&apos;apprentissage de l&apos;arabe</span>
              </div>
              <h1 style={{ fontSize: 'clamp(30px, 5vw, 52px)', fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 16, letterSpacing: '-.02em' }}>
                Apprenez l&apos;arabe<br /><span style={{ color: C.orange }}>à votre rythme</span>
              </h1>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', lineHeight: 1.75, marginBottom: 28 }}>
                LangDad vous guide pas à pas dans l&apos;apprentissage de l&apos;alphabet, de la lecture et de l&apos;écriture arabes.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
                <Link href="/register" style={{ padding: '13px 26px', borderRadius: 14, background: C.orange, color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
                  Commencer gratuitement →
                </Link>
                <Link href="/login" style={{ padding: '13px 22px', borderRadius: 14, background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 15, fontWeight: 600, textDecoration: 'none', border: '2px solid rgba(255,255,255,0.2)' }}>
                  Se connecter
                </Link>
              </div>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                {STATS.map((s, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 32, fontWeight: 800, color: '#fff' }}>{s.value}</div>
                    <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.7)' }}>{s.label}</div>
                    
                  </div>
                ))}
              </div>
            </div>

            {/* Cadre Démo */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', borderRadius: 24, padding: 24, border: '2px solid rgba(255,255,255,0.15)', width: '100%', maxWidth: 360 }}>
                <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 16, textAlign: 'center', marginBottom: 14 }}>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 10 }}>Quelle est cette lettre ?</p>
                  <div style={{ fontFamily: "'Noto Naskh Arabic', serif", fontSize: 80, color: '#fff', lineHeight: 1.1, direction: 'rtl' }}>
                    {ARABIC_LETTERS[activeLetterIdx % 4]}
                  </div>
                </div>
                {['Ba ','Mim ','Kaf ','Ta '].map((opt, i) => (
                  <div key={i} style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 8, background: i === 0 ? 'rgba(43,168,74,0.3)' : 'rgba(255,255,255,0.07)', border: `2px solid ${i === 0 ? C.green : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: i === 0 ? C.green : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>{String.fromCharCode(65+i)}</div>
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>{opt}</span>
                    {i === 0 && <span style={{ marginLeft: 'auto' }}>✓</span>}
                  </div>
                ))}
                <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(240,124,30,0.2)', borderRadius: 10, marginTop: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.orange }}>+3 XP ⚡ Excellent !</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FEATURES ──────────────────────────────────────── */}
      <section id="features" style={{ padding: '60px 20px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.violet, background: C.violetLt, padding: '4px 14px', borderRadius: 20, display: 'inline-block', marginBottom: 14 }}>FONCTIONNALITÉS</span>
          <h2 style={{ fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 800, color: C.text, marginBottom: 12 }}>Tout ce dont vous avez besoin</h2>
          <p style={{ fontSize: 15, color: C.text2, maxWidth: 500, margin: '0 auto' }}>Une approche pédagogique complète pour apprendre l&apos;arabe efficacement.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {FEATURES.map((feat, i) => (
            <div key={i} style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 18, padding: '20px', transition: 'all .2s' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = feat.color; el.style.transform = 'translateY(-3px)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.border; el.style.transform = 'none' }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: feat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 12 }}>{feat.icon}</div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 8 }}>{feat.title}</h3>
              <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.7 }}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── MODULES ───────────────────────────────────────── */}
      <section id="modules" style={{ padding: '60px 20px', background: C.violetLt }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.violet, background: C.white, padding: '4px 14px', borderRadius: 20, display: 'inline-block', marginBottom: 14 }}>CURRICULUM</span>
            <h2 style={{ fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 800, color: C.text, marginBottom: 12 }}>Un parcours structuré</h2>
            <p style={{ fontSize: 15, color: C.text2, maxWidth: 460, margin: '0 auto' }}>Chaque module introduit de nouvelles lettres avec des exercices progressifs.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 14 }}>
            {MODULES.map((mod, i) => (
              <div key={i} style={{ background: C.white, border: `2px solid ${mod.available ? mod.color+'40' : C.border}`, borderRadius: 20, padding: '22px', position: 'relative', opacity: mod.available ? 1 : 0.65, transition: 'all .2s' }}
                onMouseEnter={e => { if (mod.available) (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none' }}>
                {mod.available
                  ? <span style={{ position: 'absolute', top: 12, right: 12, fontSize: 10, fontWeight: 700, background: mod.bg, color: mod.color, padding: '2px 8px', borderRadius: 8 }}>DISPONIBLE</span>
                  : <span style={{ position: 'absolute', top: 12, right: 12, fontSize: 10, fontWeight: 700, background: '#F0F0F0', color: C.text3, padding: '2px 8px', borderRadius: 8 }}>BIENTÔT</span>
                }
                <div style={{ fontSize: 11, fontWeight: 700, color: mod.color, marginBottom: 6 }}>MODULE {mod.num}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>{mod.title}</h3>
                <p style={{ fontSize: 12, color: C.text2, marginBottom: 16, lineHeight: 1.6 }}>{mod.desc}</p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  {mod.letters.map((letter, li) => (
                    <div key={li} style={{ width: 40, height: 40, borderRadius: 10, background: mod.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Noto Naskh Arabic', serif", fontSize: 24, color: mod.color, border: `2px solid ${mod.color}30` }}>{letter}</div>
                  ))}
                </div>
                {mod.available
                  ? <Link href="/register" style={{ display: 'block', padding: '10px', borderRadius: 12, background: mod.color, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', textAlign: 'center' as const }}>Commencer →</Link>
                  : <div style={{ padding: '10px', borderRadius: 12, background: '#F0F0F0', color: C.text3, fontSize: 13, fontWeight: 600, textAlign: 'center' as const }}>🔒 En préparation</div>
                }
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────── */}
      <section id="testimonials" style={{ padding: '60px 20px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.orange, background: C.orangeLt, padding: '4px 14px', borderRadius: 20, display: 'inline-block', marginBottom: 14 }}>TÉMOIGNAGES</span>
          <h2 style={{ fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 800, color: C.text, marginBottom: 12 }}>Ils apprennent avec LangDad</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 14 }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 18, padding: '20px' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: C.violetLt, color: C.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>{t.name[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{t.name}</p>
                  <p style={{ fontSize: 12, color: C.text3 }}>{t.country}</p>
                </div>
                <div style={{ background: C.orangeLt, color: C.orange, padding: '3px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{t.xp} XP</div>
              </div>
              <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.7, fontStyle: 'italic' }}>"{t.text}"</p>
              <div style={{ display: 'flex', gap: 2, marginTop: 10 }}>
                {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 14, color: C.orange }}>★</span>)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section style={{ padding: '60px 20px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', background: `linear-gradient(135deg, ${C.violetDk}, ${C.violet})`, borderRadius: 28, padding: '48px 28px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
          <div style={{ fontFamily: "'Noto Naskh Arabic', serif", fontSize: 36, color: 'rgba(255,255,255,0.12)', marginBottom: 12, direction: 'rtl' }}>اقرأ باسم ربك</div>
          <h2 style={{ fontSize: 'clamp(20px, 4vw, 32px)', fontWeight: 800, color: '#fff', marginBottom: 12 }}>Prêt à commencer votre voyage ?</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', marginBottom: 24, maxWidth: 440, margin: '0 auto 24px' }}>Rejoignez des milliers d&apos;apprenants et maîtrisez l&apos;alphabet arabe avec LangDad.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" style={{ padding: '13px 28px', borderRadius: 14, background: C.orange, color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>Créer mon compte gratuit →</Link>
            <Link href="/login" style={{ padding: '13px 22px', borderRadius: 14, background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none', border: '2px solid rgba(255,255,255,0.2)' }}>Se connecter</Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer style={{ background: C.text, padding: '28px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: C.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🌙</div>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>LangDad</span>
          </div>
          <p style={{ fontSize: 12, color: '#6A6A8A' }}>© 2026 LangDad — Plateforme d&apos;apprentissage de l&apos;arabe</p>
          <div style={{ display: 'flex', gap: 16 }}>
            {['Confidentialité','CGU','Contact'].map(link => (
              <a key={link} href="#" style={{ fontSize: 12, color: '#6A6A8A', textDecoration: 'none' }}>{link}</a>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        .desktop-only { display: flex !important; }
        .mobile-only  { display: none  !important; }
        @media (max-width: 768px) {
          .desktop-only { display: none  !important; }
          .mobile-only  { display: flex  !important; }
        }
      `}</style>
    </div>
  )
}
'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { LanguageSelector } from '@/components/LanguageSelector'

// ── Palette LangDad ──────────────────────────────────────────
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
  { icon: '✍️', title: 'Fiches d\'écriture', desc: 'Imprimez ou tracez les lettres sur écran tactile avec des grilles guidées et des modèles progressifs.', color: C.orange, bg: C.orangeLt },
  { icon: '🎵', title: 'Audio natif', desc: 'Chaque lettre, syllabe et mot est prononcé par un locuteur natif. Entraînez votre oreille dès le début.', color: C.green, bg: C.greenLt },
  { icon: '🏆', title: 'Gamification', desc: 'XP, niveaux, séries et classement : restez motivé avec un système de récompenses qui célèbre vos progrès.', color: C.blue, bg: C.blueLt },
  { icon: '📱', title: 'Multi-plateforme', desc: 'Apprenez sur ordinateur, tablette ou mobile. Votre progression se synchronise partout.', color: '#9C27B0', bg: '#F3E5F5' },
  { icon: '🌍', title: '5 langues d\'interface', desc: 'LangDad est disponible en français, anglais, espagnol, allemand et néerlandais.', color: '#E91E63', bg: '#FCE4EC' },
]

const MODULES = [
  { num: 1, title: 'Maktab — مَكْتَبٌ',   letters: ['م','ك','ت','ب'], desc: 'Découvrez les 4 premières lettres et les bases de la lecture arabe', color: C.violet, bg: C.violetLt, available: true },
  { num: 2, title: 'Module 2',            letters: ['ا','و','ي'],     desc: 'Voyelles longues et nouvelles lettres', color: C.orange, bg: C.orangeLt, available: false },
  { num: 3, title: 'Module 3',            letters: ['س','ن','ل'],     desc: 'Expansion du vocabulaire', color: C.green, bg: C.greenLt, available: false },
]

const TESTIMONIALS = [
  { name: 'Sarah M.', country: '🇫🇷 France', text: 'En 2 semaines j\'ai appris à reconnaître toutes les lettres du module 1. Les fiches d\'écriture sont vraiment bien faites !', xp: 840 },
  { name: 'Karim B.', country: '🇧🇪 Belgique', text: 'Le système de progression s\'adapte à mon rythme. Je n\'avais jamais réussi à apprendre l\'arabe avant.', xp: 1240 },
  { name: 'Emma L.',  country: '🇳🇱 Pays-Bas', text: 'L\'interface est disponible en néerlandais, c\'est top ! Les exercices audio m\'ont vraiment aidée.', xp: 620 },
]

const STATS = [
  { value: '11', label: 'leçons', sublabel: 'Module 1' },
  { value: '78', label: 'exercices', sublabel: 'variés' },
  { value: '335', label: 'XP', sublabel: 'à gagner' },
  { value: '5', label: 'langues', sublabel: 'd\'interface' },
]

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [activeLetterIdx, setActiveLetterIdx] = useState(0)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLetterIdx(i => (i + 1) % ARABIC_LETTERS.length)
    }, 1200)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Segoe UI', system-ui, sans-serif", overflowX: 'hidden' }}>

      {/* ── NAVBAR ──────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? `1px solid ${C.border}` : 'none',
        transition: 'all .3s',
        padding: '0 40px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: C.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🌙</div>
          <span style={{ fontSize: 20, fontWeight: 800, color: scrolled ? C.text : C.white, letterSpacing: '-.02em' }}>LangDad</span>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          {[['#features', 'Fonctionnalités'], ['#modules', 'Modules'], ['#testimonials', 'Témoignages']].map(([href, label]) => (
            <a key={href} href={href}
              style={{ fontSize: 14, fontWeight: 600, color: scrolled ? C.text2 : 'rgba(255,255,255,0.85)', textDecoration: 'none', transition: 'color .2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = scrolled ? C.violet : '#fff'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = scrolled ? C.text2 : 'rgba(255,255,255,0.85)'}>
              {label}
            </a>
          ))}
        </div>
         <LanguageSelector scrolled={scrolled} />
        {/* CTA */}
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/login"
            style={{ padding: '9px 20px', borderRadius: 12, border: `2px solid ${scrolled ? C.border : 'rgba(255,255,255,0.4)'}`, background: 'transparent', color: scrolled ? C.text : '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'all .2s' }}>
            Connexion
          </Link>
          <Link href="/register"
            style={{ padding: '9px 20px', borderRadius: 12, background: C.orange, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', border: 'none', transition: 'all .2s' }}>
            Commencer gratuitement →
          </Link>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────── */}
      <div ref={heroRef} style={{
        background: `linear-gradient(135deg, ${C.violetDk} 0%, ${C.violet} 50%, #9B59B6 100%)`,
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        padding: '100px 40px 60px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Décoration lettres arabes flottantes */}
        
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {ARABIC_LETTERS.map((letter, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${5 + (i * 7) % 90}%`,
              top: `${10 + (i * 13) % 80}%`,
              fontFamily: "'Noto Naskh Arabic', serif",
              fontSize: `${24 + (i % 4) * 16}px`,
              color: `rgba(255,255,255,${0.04 + (i % 5) * 0.02})`,
              direction: 'rtl',
              transform: `rotate(${(i % 7 - 3) * 5}deg)`,
              transition: 'opacity .5s',
              opacity: i === activeLetterIdx ? 0.15 : 0.05,
            }}>{letter}</div>
          ))}
        </div>

        {/* Cercles décoratifs */}
        <div style={{ position: 'absolute', right: -100, top: -100, width: 500, height: 500, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 100, bottom: -150, width: 350, height: 350, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>

          {/* Texte gauche */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.12)', padding: '6px 14px', borderRadius: 20, marginBottom: 24 }}>
              <span style={{ fontSize: 14 }}>🌙</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>Plateforme d'apprentissage de l'arabe</span>
            </div>

            <h1 style={{ fontSize: 54, fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 20, letterSpacing: '-.02em' }}>
              Apprenez l'arabe<br />
              <span style={{ color: C.orange }}>à votre rythme</span>
            </h1>

            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.8)', lineHeight: 1.75, marginBottom: 36, maxWidth: 480 }}>
              LangDad est une plateforme pédagogique qui vous guide pas à pas dans l'apprentissage de l'alphabet, de la lecture et de l'écriture arabes.
            </p>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 40 }}>
              <Link href="/register"
                style={{ padding: '15px 32px', borderRadius: 16, background: C.orange, color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'transform .2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'none'}>
                Commencer gratuitement <span>→</span>
              </Link>
              <Link href="/login"
                style={{ padding: '15px 28px', borderRadius: 16, background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 15, fontWeight: 600, textDecoration: 'none', border: '2px solid rgba(255,255,255,0.2)' }}>
                Se connecter
              </Link>
            </div>

            {/* Stats rapides */}
            <div style={{ display: 'flex', gap: 28 }}>
              {STATS.map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{s.sublabel}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Carte démo droite */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(20px)',
              borderRadius: 28, padding: 28,
              border: '2px solid rgba(255,255,255,0.15)',
              width: '100%', maxWidth: 380,
            }}>
              {/* Mini leçon démo */}
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: '16px', marginBottom: 16, textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>Quelle est cette lettre ?</p>
                <div style={{ fontFamily: "'Noto Naskh Arabic', serif", fontSize: 88, color: '#fff', lineHeight: 1.1, direction: 'rtl', marginBottom: 8 }}>
                  {ARABIC_LETTERS[activeLetterIdx % 4]}
                </div>
              </div>

              {/* Options */}
              {['Ba ب', 'Mim م', 'Kaf ك', 'Ta ت'].map((opt, i) => (
                <div key={i} style={{
                  padding: '11px 16px', borderRadius: 12, marginBottom: 8,
                  background: i === 0 ? 'rgba(43,168,74,0.3)' : 'rgba(255,255,255,0.07)',
                  border: `2px solid ${i === 0 ? C.green : 'rgba(255,255,255,0.1)'}`,
                  display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: i === 0 ? C.green : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: i === 0 ? '#fff' : 'rgba(255,255,255,0.8)', fontFamily: i === 0 ? "'Noto Naskh Arabic', serif" : 'inherit' }}>{opt}</span>
                  {i === 0 && <span style={{ marginLeft: 'auto', fontSize: 14 }}>✓</span>}
                </div>
              ))}

              {/* XP badge */}
              <div style={{ textAlign: 'center', marginTop: 12, padding: '10px', background: 'rgba(240,124,30,0.2)', borderRadius: 12, border: '1px solid rgba(240,124,30,0.3)' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.orange }}>+3 XP ⚡ Excellent !</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section id="features" style={{ padding: '80px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.violet, background: C.violetLt, padding: '4px 14px', borderRadius: 20, display: 'inline-block', marginBottom: 16 }}>FONCTIONNALITÉS</span>
          <h2 style={{ fontSize: 40, fontWeight: 800, color: C.text, marginBottom: 14, letterSpacing: '-.02em' }}>Tout ce dont vous avez besoin</h2>
          <p style={{ fontSize: 17, color: C.text2, maxWidth: 540, margin: '0 auto' }}>Une approche pédagogique complète pour apprendre l'arabe efficacement.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {FEATURES.map((feat, i) => (
            <div key={i}
              style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 20, padding: '24px', transition: 'all .2s', cursor: 'default' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = feat.color; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = `0 12px 32px ${feat.color}18` }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.border; el.style.transform = 'none'; el.style.boxShadow = 'none' }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: feat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 16 }}>{feat.icon}</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 8 }}>{feat.title}</h3>
              <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.7 }}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── MODULES ─────────────────────────────────────────── */}
      <section id="modules" style={{ padding: '80px 40px', background: C.violetLt }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.violet, background: C.white, padding: '4px 14px', borderRadius: 20, display: 'inline-block', marginBottom: 16 }}>CURRICULUM</span>
            <h2 style={{ fontSize: 40, fontWeight: 800, color: C.text, marginBottom: 14, letterSpacing: '-.02em' }}>Un parcours structuré</h2>
            <p style={{ fontSize: 17, color: C.text2, maxWidth: 500, margin: '0 auto' }}>Chaque module introduit de nouvelles lettres avec des exercices progressifs.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {MODULES.map((mod, i) => (
              <div key={i}
                style={{ background: C.white, border: `2px solid ${mod.available ? mod.color + '40' : C.border}`, borderRadius: 24, padding: '28px', position: 'relative', opacity: mod.available ? 1 : 0.65, transition: 'all .2s' }}
                onMouseEnter={e => { if (mod.available) { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = `0 12px 32px ${mod.color}20` } }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'none'; el.style.boxShadow = 'none' }}>

                {mod.available
                  ? <span style={{ position: 'absolute', top: 16, right: 16, fontSize: 10, fontWeight: 700, background: mod.bg, color: mod.color, padding: '3px 10px', borderRadius: 10 }}>DISPONIBLE</span>
                  : <span style={{ position: 'absolute', top: 16, right: 16, fontSize: 10, fontWeight: 700, background: '#F0F0F0', color: C.text3, padding: '3px 10px', borderRadius: 10 }}>BIENTÔT</span>
                }

                <div style={{ fontSize: 12, fontWeight: 700, color: mod.color, marginBottom: 8 }}>MODULE {mod.num}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>{mod.title}</h3>
                <p style={{ fontSize: 13, color: C.text2, marginBottom: 20, lineHeight: 1.6 }}>{mod.desc}</p>

                {/* Lettres du module */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                  {mod.letters.map((letter, li) => (
                    <div key={li} style={{ width: 48, height: 48, borderRadius: 12, background: mod.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Noto Naskh Arabic', serif", fontSize: 28, color: mod.color, border: `2px solid ${mod.color}30` }}>
                      {letter}
                    </div>
                  ))}
                </div>

                {mod.available
                  ? <Link href="/register"
                      style={{ display: 'block', padding: '12px', borderRadius: 14, background: mod.color, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>
                      Commencer →
                    </Link>
                  : <div style={{ padding: '12px', borderRadius: 14, background: '#F0F0F0', color: C.text3, fontSize: 14, fontWeight: 600, textAlign: 'center' }}>🔒 En cours de préparation</div>
                }
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────── */}
      <section id="testimonials" style={{ padding: '80px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.orange, background: C.orangeLt, padding: '4px 14px', borderRadius: 20, display: 'inline-block', marginBottom: 16 }}>TÉMOIGNAGES</span>
          <h2 style={{ fontSize: 40, fontWeight: 800, color: C.text, marginBottom: 14, letterSpacing: '-.02em' }}>Ils apprennent avec LangDad</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 20, padding: '24px', transition: 'transform .2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'none'}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: C.violetLt, color: C.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>
                  {t.name[0]}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2 }}>{t.name}</p>
                  <p style={{ fontSize: 12, color: C.text3 }}>{t.country}</p>
                </div>
                <div style={{ marginLeft: 'auto', background: C.orangeLt, color: C.orange, padding: '4px 10px', borderRadius: 10, fontSize: 12, fontWeight: 700 }}>
                  {t.xp} XP ⚡
                </div>
              </div>
              <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.7, fontStyle: 'italic' }}>"{t.text}"</p>
              <div style={{ display: 'flex', gap: 2, marginTop: 14 }}>
                {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 16, color: C.orange }}>★</span>)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────── */}
      <section style={{ padding: '80px 40px' }}>
        <div style={{
          maxWidth: 800, margin: '0 auto',
          background: `linear-gradient(135deg, ${C.violetDk}, ${C.violet})`,
          borderRadius: 32, padding: '60px 40px', textAlign: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Décoration */}
          <div style={{ position: 'absolute', right: -60, top: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: -40, bottom: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

          <div style={{ fontFamily: "'Noto Naskh Arabic', serif", fontSize: 48, color: 'rgba(255,255,255,0.15)', marginBottom: 16, direction: 'rtl' }}>
            اقرأ باسم ربك
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 14, letterSpacing: '-.02em' }}>
            Prêt à commencer votre voyage ?
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.8)', marginBottom: 36, maxWidth: 500, margin: '0 auto 36px' }}>
            Rejoignez des milliers d'apprenants et maîtrisez l'alphabet arabe avec LangDad.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register"
              style={{ padding: '16px 36px', borderRadius: 16, background: C.orange, color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none', transition: 'transform .2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'none'}>
              Créer mon compte gratuit →
            </Link>
            <Link href="/login"
              style={{ padding: '16px 28px', borderRadius: 16, background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 16, fontWeight: 600, textDecoration: 'none', border: '2px solid rgba(255,255,255,0.2)' }}>
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer style={{ background: C.text, padding: '40px', borderTop: `1px solid #2A2A3E` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: C.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🌙</div>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>LangDad</span>
          </div>
          <p style={{ fontSize: 13, color: '#6A6A8A' }}>© 2026 LangDad — Plateforme d'apprentissage de l'arabe</p>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Confidentialité', 'CGU', 'Contact'].map(link => (
              <a key={link} href="#" style={{ fontSize: 13, color: '#6A6A8A', textDecoration: 'none', transition: 'color .2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#fff'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#6A6A8A'}>
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>

      <link href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap" rel="stylesheet" />
    </div>
  )
}
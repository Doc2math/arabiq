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

const CATEGORIES = ['Tous', 'Pédagogie', 'Arabe', 'Conseils', 'Actualités']

const POSTS = [
  {
    id: 1,
    title: "Comment mémoriser l'alphabet arabe en 7 jours",
    excerpt: "Des techniques mnémotechniques éprouvées pour retenir les 28 lettres arabes rapidement et efficacement, même sans expérience préalable.",
    category: "Conseils",
    date: "15 avril 2026",
    readTime: "5 min",
    color: C.violet,
    bg: C.violetLt,
    emoji: "🧠",
    featured: true,
  },
  {
    id: 2,
    title: "La différence entre Ba ب et Ta ت : l'erreur classique des débutants",
    excerpt: "Ces deux lettres partagent la même forme — seuls les points les différencient. Voici comment ne plus jamais les confondre.",
    category: "Arabe",
    date: "8 avril 2026",
    readTime: "3 min",
    color: C.orange,
    bg: C.orangeLt,
    emoji: "✍️",
    featured: false,
  },
  {
    id: 3,
    title: "Pourquoi apprendre l'arabe avec une approche par lettres fonctionne mieux",
    excerpt: "La méthode LangDad repose sur une progression rigoureuse : lettres → syllabes → mots → phrases. Découvrez la science derrière cette approche.",
    category: "Pédagogie",
    date: "1 avril 2026",
    readTime: "7 min",
    color: C.green,
    bg: C.greenLt,
    emoji: "📚",
    featured: false,
  },
  {
    id: 4,
    title: "LangDad Module 1 : ce que vous apprendrez en 11 leçons",
    excerpt: "Un tour complet du Module 1 : les lettres م ك ت ب, les voyelles courtes, les voyelles longues et vos premiers mots arabes.",
    category: "Actualités",
    date: "24 mars 2026",
    readTime: "4 min",
    color: C.blue,
    bg: C.blueLt,
    emoji: "🎯",
    featured: false,
  },
  {
    id: 5,
    title: "Les harakat : le secret d'une lecture arabe correcte",
    excerpt: "Les voyelles courtes (fatha, kasra, damma) sont invisibles dans la plupart des textes arabes. Pourquoi les apprendre dès le début est crucial.",
    category: "Arabe",
    date: "17 mars 2026",
    readTime: "6 min",
    color: C.violet,
    bg: C.violetLt,
    emoji: "🔤",
    featured: false,
  },
  {
    id: 6,
    title: "5 ressources gratuites pour compléter votre apprentissage de l'arabe",
    excerpt: "En complément de LangDad, voici les meilleures ressources en ligne pour progresser : vidéos, podcasts, et applications recommandées.",
    category: "Conseils",
    date: "10 mars 2026",
    readTime: "4 min",
    color: C.orange,
    bg: C.orangeLt,
    emoji: "🔗",
    featured: false,
  },
]

const NAV_LINKS = [
  ['/', 'Accueil'],
  ['/#features', 'Fonctionnalités'],
  ['/#modules', 'Modules'],
  ['/blog', 'Blog'],
]

export default function BlogPage() {
  const [scrolled, setScrolled]       = useState(false)
  const [menuOpen, setMenuOpen]       = useState(false)
  const [activeCategory, setCategory] = useState('Tous')
  const [search, setSearch]           = useState('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const filtered = POSTS.filter(p => {
    const matchCat  = activeCategory === 'Tous' || p.category === activeCategory
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
                        p.excerpt.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const featured = POSTS.find(p => p.featured)
  const navBg = scrolled || menuOpen

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── NAVBAR ────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: navBg ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${C.border}`,
        transition: 'all .3s',
      }}>
        <div style={{ padding: '0 20px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: C.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🌙</div>
            <span style={{ fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: '-.02em' }}>LangDad</span>
          </Link>

          {/* Liens desktop */}
          <div style={{ display: 'flex', gap: 24 }} className="desktop-only">
            {NAV_LINKS.map(([href, label]) => (
              <Link key={href} href={href}
                style={{
                  fontSize: 14, fontWeight: label === 'Blog' ? 700 : 600,
                  color: label === 'Blog' ? C.violet : C.text2,
                  textDecoration: 'none',
                  borderBottom: label === 'Blog' ? `2px solid ${C.violet}` : 'none',
                  paddingBottom: 2,
                }}>
                {label}
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} className="desktop-only">
            <LanguageSelector scrolled={true} />
            <Link href="/login"
              style={{ padding: '8px 16px', borderRadius: 10, border: `2px solid ${C.border}`, color: C.text, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              Connexion
            </Link>
            <Link href="/register"
              style={{ padding: '8px 16px', borderRadius: 10, background: C.orange, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
              S&apos;inscrire →
            </Link>
          </div>

          {/* Hamburger mobile */}
          <button className="mobile-only" onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[0,1,2].map(i => (
              <span key={i} style={{
                width: 22, height: 2, background: C.text, borderRadius: 2, display: 'block', transition: 'all .3s',
                transform: menuOpen ? (i===0 ? 'rotate(45deg) translateY(7px)' : i===2 ? 'rotate(-45deg) translateY(-7px)' : 'none') : 'none',
                opacity: menuOpen && i===1 ? 0 : 1,
              }} />
            ))}
          </button>
        </div>

        {/* Menu mobile */}
        {menuOpen && (
          <div style={{ background: '#fff', borderTop: `1px solid ${C.border}`, padding: '12px 20px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {NAV_LINKS.map(([href, label]) => (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)}
                style={{ padding: '12px 16px', borderRadius: 12, fontSize: 15, fontWeight: 600, color: label === 'Blog' ? C.violet : C.text, textDecoration: 'none', display: 'block' }}>
                {label}
              </Link>
            ))}
            <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 8, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
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

      {/* ── HERO BLOG ─────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${C.violetDk} 0%, ${C.violet} 100%)`,
        padding: '100px 20px 48px', textAlign: 'center',
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.orange, background: 'rgba(240,124,30,0.2)', padding: '4px 14px', borderRadius: 20, display: 'inline-block', marginBottom: 16 }}>
          BLOG LANGDAD
        </span>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 46px)', fontWeight: 800, color: '#fff', marginBottom: 12, letterSpacing: '-.02em' }}>
          Apprendre l&apos;arabe,<br />
          <span style={{ color: C.orange }}>un article à la fois</span>
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', maxWidth: 480, margin: '0 auto 28px' }}>
          Conseils pédagogiques, explications linguistiques et actualités de la plateforme LangDad.
        </p>

        {/* Barre de recherche */}
        <div style={{ maxWidth: 440, margin: '0 auto', position: 'relative' }}>
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un article..."
            style={{
              width: '100%', padding: '13px 16px 13px 44px', borderRadius: 14,
              border: 'none', fontSize: 14, background: 'rgba(255,255,255,0.95)',
              color: C.text, outline: 'none', boxSizing: 'border-box' as const,
            }}
          />
        </div>
      </div>

      <div style={{ maxWidth: 1060, margin: '0 auto', padding: '40px 20px 60px' }}>

        {/* ── ARTICLE À LA UNE ──────────────────────────────── */}
        {!search && activeCategory === 'Tous' && featured && (
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.violet, marginBottom: 16 }}>
              ⭐ À LA UNE
            </div>
            <div style={{
              background: C.white, border: `2px solid ${C.border}`, borderRadius: 24,
              overflow: 'hidden', display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              transition: 'all .2s',
            }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = featured.color; el.style.boxShadow = `0 8px 32px ${featured.color}20` }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.border; el.style.boxShadow = 'none' }}>

              {/* Visuel */}
              <div style={{
                background: `linear-gradient(135deg, ${featured.color}20, ${featured.color}08)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 80, minHeight: 200, padding: 32,
              }}>
                {featured.emoji}
              </div>

              {/* Contenu */}
              <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 10, background: featured.bg, color: featured.color }}>
                    {featured.category}
                  </span>
                  <span style={{ fontSize: 11, color: C.text3 }}>📅 {featured.date}</span>
                  <span style={{ fontSize: 11, color: C.text3 }}>⏱ {featured.readTime} de lecture</span>
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 12, lineHeight: 1.3 }}>
                  {featured.title}
                </h2>
                <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.7, marginBottom: 20 }}>
                  {featured.excerpt}
                </p>
                <Link href={`/blog/${featured.id}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 12, background: featured.color, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', width: 'fit-content' }}>
                  Lire l&apos;article →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── FILTRES CATÉGORIES ─────────────────────────────── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              style={{
                padding: '7px 16px', borderRadius: 20, border: `2px solid ${activeCategory === cat ? C.violet : C.border}`,
                background: activeCategory === cat ? C.violet : C.white,
                color: activeCategory === cat ? '#fff' : C.text2,
                fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
              }}>
              {cat}
            </button>
          ))}

          {/* Compteur */}
          <span style={{ marginLeft: 'auto', fontSize: 13, color: C.text3, alignSelf: 'center' }}>
            {filtered.length} article{filtered.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* ── GRILLE ARTICLES ───────────────────────────────── */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: C.text3 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <p style={{ fontSize: 16 }}>Aucun article trouvé pour &quot;{search}&quot;</p>
            <button onClick={() => { setSearch(''); setCategory('Tous') }}
              style={{ marginTop: 16, padding: '10px 20px', borderRadius: 12, background: C.violet, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
              Réinitialiser
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
            {filtered.filter(p => !p.featured || search || activeCategory !== 'Tous').map(post => (
              <Link key={post.id} href={`/blog/${post.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: C.white, border: `2px solid ${C.border}`, borderRadius: 20,
                  overflow: 'hidden', height: '100%', transition: 'all .2s', cursor: 'pointer',
                }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = post.color; el.style.transform = 'translateY(-3px)'; el.style.boxShadow = `0 8px 24px ${post.color}18` }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.border; el.style.transform = 'none'; el.style.boxShadow = 'none' }}>

                  {/* Visuel */}
                  <div style={{
                    background: `linear-gradient(135deg, ${post.color}18, ${post.color}06)`,
                    height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44,
                    borderBottom: `1px solid ${post.color}20`,
                  }}>
                    {post.emoji}
                  </div>

                  {/* Contenu */}
                  <div style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: post.bg, color: post.color }}>
                        {post.category}
                      </span>
                      <span style={{ fontSize: 10, color: C.text3 }}>{post.readTime}</span>
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 8, lineHeight: 1.4 }}>
                      {post.title}
                    </h3>
                    <p style={{ fontSize: 12, color: C.text2, lineHeight: 1.65, marginBottom: 14,
                      display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>
                      {post.excerpt}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: C.text3 }}>{post.date}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: post.color }}>Lire →</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* ── CTA NEWSLETTER ────────────────────────────────── */}
        <div style={{
          marginTop: 56, background: `linear-gradient(135deg, ${C.violetDk}, ${C.violet})`,
          borderRadius: 24, padding: '36px 28px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📬</div>
          <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
            Restez informé
          </h3>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
            Inscrivez-vous pour recevoir les nouveaux articles et les mises à jour de LangDad.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 420, margin: '0 auto' }}>
            <input type="email" placeholder="votre@email.com"
              style={{ flex: 1, minWidth: 200, padding: '11px 16px', borderRadius: 12, border: 'none', fontSize: 14, outline: 'none' }} />
            <button style={{ padding: '11px 20px', borderRadius: 12, background: C.orange, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap' as const }}>
              S&apos;abonner →
            </button>
          </div>
        </div>
      </div>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer style={{ background: C.text, padding: '24px 20px' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: C.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🌙</div>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>LangDad</span>
          </div>
          <p style={{ fontSize: 12, color: '#6A6A8A' }}>© 2026 LangDad — Plateforme d&apos;apprentissage de l&apos;arabe</p>
          <div style={{ display: 'flex', gap: 16 }}>
            {['Confidentialité', 'CGU', 'Contact'].map(link => (
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
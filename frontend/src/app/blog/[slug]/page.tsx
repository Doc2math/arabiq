'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { LanguageSelector } from '@/components/LanguageSelector'

const C = {
  violet: '#6C3FC5', violetLt: '#EDE8FB', violetDk: '#4A2A8A',
  orange: '#F07C1E', orangeLt: '#FEF0E3',
  green:  '#2BA84A',
  bg:     '#F8F7FF', white:    '#FFFFFF',
  text:   '#1A1A2E', text2:    '#5A5A7A', text3: '#9A9AB0',
  border: '#E8E4F8',
}

interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  category: string
  emoji: string
  color: string
  image_url: string | null
  author_name: string
  created_at: string
  updated_at: string
  read_time: number
}

function getLang(): string {
  if (typeof window === 'undefined') return 'fr'
  return localStorage.getItem('langdad_lang') ??
    document.cookie.split('; ').find(r => r.startsWith('NEXT_LOCALE='))?.split('=')[1] ??
    'fr'
}

function formatDate(dateStr: string, lang: string): string {
  try {
    const locale =
      lang === 'fr' ? 'fr-FR' :
      lang === 'de' ? 'de-DE' :
      lang === 'nl' ? 'nl-NL' :
      lang === 'es' ? 'es-ES' : 'en-GB'
    return new Date(dateStr).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return dateStr }
}

function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 style="font-size:18px;font-weight:700;margin:24px 0 10px;color:#1A1A2E">$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2 style="font-size:22px;font-weight:700;margin:32px 0 12px;color:#1A1A2E">$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1 style="font-size:26px;font-weight:800;margin:36px 0 14px;color:#1A1A2E">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#1A1A2E">$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
    .replace(/`(.+?)`/g,       '<code style="background:#EDE8FB;color:#6C3FC5;padding:2px 8px;border-radius:5px;font-size:13px;font-family:monospace">$1</code>')
    .replace(/^> (.+)$/gm,     '<blockquote style="border-left:4px solid #6C3FC5;padding:12px 18px;margin:16px 0;background:#F8F7FF;color:#5A5A7A;border-radius:0 8px 8px 0;font-style:italic">$1</blockquote>')
    .replace(/^- (.+)$/gm,     '<li style="margin:6px 0;padding-left:4px;color:#1A1A2E">$1</li>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#6C3FC5;text-decoration:underline">$1</a>')
    .replace(/\n\n/g, '</p><p style="margin:14px 0;line-height:1.8;color:#1A1A2E">')
}

export default function BlogPostPage() {
  const t = useTranslations('blog')
  const { slug } = useParams<{ slug: string }>()

  const [post, setPost]         = useState<BlogPost | null>(null)
  const [loading, setLoading]   = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [progress, setProgress] = useState(0)
  const [lang, setLang]         = useState(() => {
    if (typeof window === 'undefined') return 'fr'
    return localStorage.getItem('langdad_lang') ??
      document.cookie.split('; ').find(r => r.startsWith('NEXT_LOCALE='))?.split('=')[1] ??
      'fr'
  })

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

  const NAV_LINKS = [
    ['/', t('nav_home')],
    ['/#features', t('nav_features')],
    ['/#modules', t('nav_modules')],
    ['/blog', t('nav_blog')],
  ]

  useEffect(() => {
    setLang(getLang())
    const handleStorage = () => setLang(getLang())
    window.addEventListener('storage', handleStorage)
    const interval = setInterval(() => setLang(getLang()), 500)
    const onScroll = () => {
      setScrolled(window.scrollY > 40)
      const el = document.documentElement
      const pct = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100
      setProgress(Math.min(100, pct))
    }
    window.addEventListener('scroll', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('storage', handleStorage)
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (!slug) return
    const fetchPost = async () => {
      setLoading(true)
      try {
        const res = await fetch(`${apiBase}/api/v1/blog/posts/${slug}?lang=${lang}`)
        if (!res.ok) throw new Error()
        setPost(await res.json())
      } catch {
        setPost(null)
      } finally {
        setLoading(false)
      }
    }
    fetchPost()
  }, [slug, lang, apiBase])

  const navBg = scrolled || menuOpen

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
      <div style={{ fontSize: 14, color: C.text3 }}>{t('loading')}</div>
    </div>
  )

  if (!post) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: C.bg, gap: 16 }}>
      <div style={{ fontSize: 48 }}>😕</div>
      <p style={{ fontSize: 16, color: C.text2 }}>{t('no_results')}</p>
      <Link href="/blog" style={{ padding: '10px 20px', borderRadius: 12, background: C.violet, color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
        {t('back_to_blog')}
      </Link>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Barre de progression lecture */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, zIndex: 200, background: C.border }}>
        <div style={{ height: '100%', width: `${progress}%`, background: post.color, transition: 'width 0.1s linear' }} />
      </div>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: navBg ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}`, transition: 'all .3s',
      }}>
        <div style={{ padding: '0 20px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: C.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🌙</div>
            <span style={{ fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: '-.02em' }}>LangDad</span>
          </Link>

          <div style={{ display: 'flex', gap: 24 }} className="desktop-only">
            {NAV_LINKS.map(([href, label]) => (
              <Link key={href} href={href} style={{
                fontSize: 14, fontWeight: label === t('nav_blog') ? 700 : 600,
                color: label === t('nav_blog') ? C.violet : C.text2,
                textDecoration: 'none',
                borderBottom: label === t('nav_blog') ? `2px solid ${C.violet}` : 'none',
                paddingBottom: 2,
              }}>
                {label}
              </Link>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} className="desktop-only">
            <LanguageSelector scrolled={true} />
            <Link href="/login" style={{ padding: '8px 16px', borderRadius: 10, border: `2px solid ${C.border}`, color: C.text, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              {t('login')}
            </Link>
            <Link href="/register" style={{ padding: '8px 16px', borderRadius: 10, background: C.orange, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
              {t('register')}
            </Link>
          </div>

          <button className="mobile-only" onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[0,1,2].map(i => (
              <span key={i} style={{ width: 22, height: 2, background: C.text, borderRadius: 2, display: 'block', transition: 'all .3s',
                transform: menuOpen ? (i===0 ? 'rotate(45deg) translateY(7px)' : i===2 ? 'rotate(-45deg) translateY(-7px)' : 'none') : 'none',
                opacity: menuOpen && i===1 ? 0 : 1 }} />
            ))}
          </button>
        </div>

        {menuOpen && (
          <div style={{ background: '#fff', borderTop: `1px solid ${C.border}`, padding: '12px 20px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {NAV_LINKS.map(([href, label]) => (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)}
                style={{ padding: '12px 16px', borderRadius: 12, fontSize: 15, fontWeight: 600, color: label === t('nav_blog') ? C.violet : C.text, textDecoration: 'none', display: 'block' }}>
                {label}
              </Link>
            ))}
            <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 8, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link href="/login" onClick={() => setMenuOpen(false)}
                style={{ padding: '12px', borderRadius: 12, border: `2px solid ${C.border}`, color: C.text, fontSize: 14, fontWeight: 600, textDecoration: 'none', textAlign: 'center' as const }}>
                {t('login')}
              </Link>
              <Link href="/register" onClick={() => setMenuOpen(false)}
                style={{ padding: '12px', borderRadius: 12, background: C.orange, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', textAlign: 'center' as const }}>
                {t('register_free')}
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ARTICLE ── */}
      <div style={{ paddingTop: 64 }}>
        {post.image_url ? (
          <div style={{ height: 'clamp(200px, 40vw, 420px)', position: 'relative', overflow: 'hidden' }}>
            <img src={post.image_url.startsWith('/') ? `${apiBase}${post.image_url}` : post.image_url}
              alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.6))' }} />
          </div>
        ) : (
          <div style={{ background: `linear-gradient(135deg, ${post.color}20, ${post.color}08)`, padding: '48px 20px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 72, marginBottom: 8 }}>{post.emoji}</div>
          </div>
        )}
      </div>

      {/* ── CONTENU ── */}
      <div style={{ maxWidth: 1060, margin: '0 auto', padding: '0 20px 60px' }}>

        {/* Métadonnées */}
        <div style={{ background: C.white, borderRadius: 20, padding: '24px 28px', marginTop: post.image_url ? -40 : 0, position: 'relative', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <Link href="/blog" style={{ fontSize: 12, color: C.text3, textDecoration: 'none' }}>
              {t('back_to_blog')}
            </Link>
            <span style={{ color: C.text3, fontSize: 12 }}>/</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: `${post.color}18`, color: post.color }}>{post.category}</span>
          </div>
          <h1 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: C.text, lineHeight: 1.3, marginBottom: 14 }}>
            {post.title}
          </h1>
          <p style={{ fontSize: 15, color: C.text2, lineHeight: 1.7, marginBottom: 18 }}>
            {post.excerpt}
          </p>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: C.text3, flexWrap: 'wrap', paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
            <span>✍️ {post.author_name}</span>
            <span>📅 {formatDate(post.created_at, lang)}</span>
            <span>⏱ {post.read_time} min</span>
          </div>
        </div>

        {/* Corps de l'article */}
        <div style={{ background: C.white, borderRadius: 20, padding: '32px 36px', fontSize: 16, lineHeight: 1.8, color: C.text }}
          dangerouslySetInnerHTML={{ __html: `<p style="margin:0 0 14px;line-height:1.8;color:#1A1A2E">${renderMarkdown(post.content)}</p>` }} />

        {/* Footer article */}
        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <Link href="/blog"
            style={{ padding: '10px 20px', borderRadius: 12, border: `2px solid ${C.border}`, background: C.white, color: C.text2, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            {t('back_to_blog')}
          </Link>
          <Link href="/register"
            style={{ padding: '10px 20px', borderRadius: 12, background: post.color, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
            {t('start_learning')}
          </Link>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ background: C.text, padding: '24px 20px' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: C.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🌙</div>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>LangDad</span>
          </div>
          <p style={{ fontSize: 12, color: '#6A6A8A' }}>© 2026 LangDad</p>
          <div style={{ display: 'flex', gap: 16 }}>
            {[t('privacy'), t('terms'), t('contact')].map(link => (
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
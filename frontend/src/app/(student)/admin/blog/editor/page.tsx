'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'

const C = {
  violet:'#6C3FC5', violetLt:'#EDE8FB', violetDk:'#4A2A8A',
  orange:'#F07C1E', orangeLt:'#FEF0E3',
  green:'#2BA84A', greenLt:'#E3F7E8',
  red:'#E24B4A', redLt:'#FCEBEB',
  bg:'#F8F7FF', white:'#FFFFFF',
  text:'#1A1A2E', text2:'#5A5A7A', text3:'#9A9AB0',
  border:'#E8E4F8',
}

const LANGS = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English',  flag: '🇬🇧' },
  { code: 'es', label: 'Español',  flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch',  flag: '🇩🇪' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
]

const CATEGORIES = ['Pédagogie', 'Arabe', 'Conseils', 'Actualités']
const EMOJIS     = ['📝','📚','🧠','✍️','🔤','🎯','🔗','🌙','📬','🎤','🏆','💡']
const COLORS     = ['#6C3FC5','#F07C1E','#2BA84A','#1976D2','#E91E63','#0097A7','#9C27B0','#F9A825']

type Tab = 'content' | 'translations' | 'settings' | 'media'

interface FormState {
  title_fr:   string
  excerpt_fr: string
  content_fr: string
  title_all:   Record<string, string>
  excerpt_all: Record<string, string>
  content_all: Record<string, string>
  category:  string
  emoji:     string
  color:     string
  image_url: string
  featured:  boolean
  published: boolean
  translated_langs: string[]
}

const defaultForm: FormState = {
  title_fr: '', excerpt_fr: '', content_fr: '',
  title_all: {}, excerpt_all: {}, content_all: {},
  category: 'Actualités', emoji: '📝', color: '#6C3FC5',
  image_url: '', featured: false, published: false,
  translated_langs: [],
}

function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 style="font-size:15px;font-weight:700;margin:14px 0 6px">$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2 style="font-size:18px;font-weight:700;margin:18px 0 8px">$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1 style="font-size:21px;font-weight:800;margin:22px 0 10px">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
    .replace(/`(.+?)`/g,       '<code style="background:#f0edf8;padding:2px 6px;border-radius:4px;font-size:12px">$1</code>')
    .replace(/^> (.+)$/gm,     '<blockquote style="border-left:4px solid #6C3FC5;padding:8px 14px;margin:10px 0;background:#f8f7ff;color:#5A5A7A">$1</blockquote>')
    .replace(/^- (.+)$/gm,     '<li style="margin:3px 0;padding-left:8px">$1</li>')
    .replace(/\n\n/g, '</p><p style="margin:8px 0">')
}

export default function AdminBlogEditor() {
  const router  = useRouter()
  const params  = useSearchParams()
  const { user } = useAuthStore()
  const postId  = params.get('id')
  const isEdit  = !!postId

  const [form, setForm]           = useState<FormState>(defaultForm)
  const [loading, setLoading]     = useState(isEdit)
  const [saving, setSaving]       = useState(false)
  const [translating, setTranslating] = useState(false)
  const [saved, setSaved]         = useState(false)
  const [error, setError]         = useState('')
  const [preview, setPreview]     = useState(false)
  const [tab, setTab]             = useState<Tab>('content')
  const [activeLang, setActiveLang] = useState('fr')
  const [uploadingImg, setUploadingImg] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const set = (key: keyof FormState, val: any) =>
    setForm(prev => ({ ...prev, [key]: val }))

  // ── Chargement article existant ─────────────────────────────────────────────
  const loadPost = useCallback(async () => {
    if (!postId) return
    try {
      const res = await api.get('/api/v1/admin/blog/posts')
      const post = res.data.find((p: any) => p.id === postId)
      if (post) {
        setForm({
          title_fr:   post.title_all?.fr   ?? '',
          excerpt_fr: post.excerpt_all?.fr ?? '',
          content_fr: post.content_all?.fr ?? '',
          title_all:   post.title_all   ?? {},
          excerpt_all: post.excerpt_all ?? {},
          content_all: post.content_all ?? {},
          category:  post.category,
          emoji:     post.emoji,
          color:     post.color,
          image_url: post.image_url ?? '',
          featured:  post.featured,
          published: post.published,
          translated_langs: post.translated_langs ?? [],
        })
      }
    } catch { setError("Impossible de charger l'article.") }
    finally  { setLoading(false) }
  }, [postId])

  useEffect(() => { if (isEdit) loadPost() }, [isEdit, loadPost])

  // ── Sauvegarde ──────────────────────────────────────────────────────────────
  const handleSave = async (publishNow?: boolean) => {
    if (!form.title_fr.trim() || !form.content_fr.trim()) {
      setError('Le titre et le contenu en français sont obligatoires.')
      return
    }
    setSaving(true); setError('')
    try {
      const payload = {
        title_fr:   form.title_fr,
        excerpt_fr: form.excerpt_fr,
        content_fr: form.content_fr,
        title:      form.title_all,
        excerpt:    form.excerpt_all,
        content:    form.content_all,
        category:   form.category,
        emoji:      form.emoji,
        color:      form.color,
        image_url:  form.image_url || null,
        featured:   form.featured,
        published:  publishNow ?? form.published,
      }
      if (isEdit) {
        await api.put(`/api/v1/admin/blog/posts/${postId}`, payload)
        setSaved(true); setTimeout(() => setSaved(false), 3000)
      } else {
        await api.post('/api/v1/admin/blog/posts', payload)
        router.push('/admin/blog')
      }
    } catch { setError('Erreur lors de la sauvegarde.') }
    finally  { setSaving(false) }
  }

  // ── Traduction GPT ──────────────────────────────────────────────────────────
  const handleTranslate = async (langs: string[]) => {
    if (!postId) {
      setError('Sauvegardez d\'abord l\'article avant de traduire.')
      return
    }
    if (!form.title_fr || !form.content_fr) {
      setError('Le contenu français est requis avant de traduire.')
      return
    }
    setTranslating(true); setError('')
    try {
      const query = langs.map(l => `langs=${l}`).join('&')
      const res = await api.post(`/api/v1/admin/blog/posts/${postId}/translate?${query}`)
      setForm(prev => ({
        ...prev,
        title_all:        res.data.title_all   ?? {},
        excerpt_all:      res.data.excerpt_all ?? {},
        content_all:      res.data.content_all ?? {},
        translated_langs: res.data.translated_langs ?? [],
      }))
      setTab('translations')
    } catch { setError('Erreur lors de la traduction.') }
    finally  { setTranslating(false) }
  }

  // ── Upload image ────────────────────────────────────────────────────────────
  const handleImageUpload = async (file: File) => {
    if (!postId) { setError('Sauvegardez d\'abord l\'article.'); return }
    setUploadingImg(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post(`/api/v1/admin/blog/posts/${postId}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      set('image_url', res.data.image_url)
    } catch { setError('Erreur upload image.') }
    finally  { setUploadingImg(false) }
  }

  // ── Mise à jour traduction manuelle ─────────────────────────────────────────
  const updateTranslation = (field: 'title_all' | 'excerpt_all' | 'content_all', lang: string, val: string) => {
    setForm(prev => ({
      ...prev,
      [field]: { ...prev[field], [lang]: val }
    }))
  }

  if (!user || !['admin', 'superadmin'].includes(user.role)) {
    return <div style={{ padding: 60, textAlign: 'center', color: C.text3 }}>Accès refusé.</div>
  }
  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center', color: C.text3 }}>Chargement…</div>
  }

  const wordCount = form.content_fr.trim().split(/\s+/).filter(Boolean).length
  const readTime  = Math.max(1, Math.round(wordCount / 200))

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px' }}>

      {/* ── En-tête ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={() => router.push('/admin/blog')}
          style={{ width: 36, height: 36, borderRadius: '50%', border: `1.5px solid ${C.border}`, background: C.white, cursor: 'pointer', fontSize: 16, color: C.text2 }}>
          ←
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text }}>
            {isEdit ? "Modifier l'article" : 'Nouvel article'}
          </h1>
          <p style={{ fontSize: 12, color: C.text3 }}>
            {wordCount} mots · {readTime} min · {form.translated_langs.length} traduction(s)
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {saved && <span style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>✓ Sauvegardé</span>}
          <button onClick={() => setPreview(!preview)}
            style={{ padding: '8px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: preview ? C.violetLt : C.white, color: preview ? C.violet : C.text2, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {preview ? '✏️ Éditer' : '👁 Preview'}
          </button>
          <button onClick={() => handleSave(false)} disabled={saving}
            style={{ padding: '8px 16px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.white, color: C.text2, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            Brouillon
          </button>
          <button onClick={() => handleSave(true)} disabled={saving}
            style={{ padding: '8px 20px', borderRadius: 10, border: 'none', background: C.violet, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? '…' : form.published ? 'Mettre à jour' : '🚀 Publier'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: C.redLt, border: `1.5px solid ${C.red}`, borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: C.red }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: preview ? '1fr 1fr' : '1fr', gap: 20 }}>

        {/* ── Éditeur ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Onglets */}
          <div style={{ display: 'flex', gap: 4, background: C.bg, borderRadius: 12, padding: 4 }}>
            {([
              { key: 'content',      label: '✏️ Contenu FR' },
              { key: 'translations', label: '🌍 Traductions' },
              { key: 'media',        label: '🖼 Média' },
              { key: 'settings',     label: '⚙️ Paramètres' },
            ] as { key: Tab; label: string }[]).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ flex: 1, padding: '7px 6px', borderRadius: 8, border: 'none', background: tab === t.key ? C.white : 'transparent', color: tab === t.key ? C.violet : C.text2, fontSize: 12, fontWeight: tab === t.key ? 700 : 400, cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap' }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Onglet Contenu FR ── */}
          {tab === 'content' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.text3, display: 'block', marginBottom: 5 }}>TITRE *</label>
                <input value={form.title_fr} onChange={e => set('title_fr', e.target.value)}
                  placeholder="Titre de l'article en français…"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 15, fontWeight: 600, outline: 'none', boxSizing: 'border-box', color: C.text }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.text3, display: 'block', marginBottom: 5 }}>EXTRAIT</label>
                <textarea value={form.excerpt_fr} onChange={e => set('excerpt_fr', e.target.value)}
                  placeholder="Courte description affichée dans la liste…" rows={3}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', color: C.text, fontFamily: 'inherit' }} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: C.text3 }}>CONTENU (Markdown) *</label>
                  <span style={{ fontSize: 10, color: C.text3 }}>**gras** *italique* # titre {'>'} citation</span>
                </div>
                <textarea value={form.content_fr} onChange={e => set('content_fr', e.target.value)}
                  placeholder="Rédigez votre article en Markdown…" rows={22}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', color: C.text, fontFamily: 'monospace', lineHeight: 1.6 }} />
              </div>

              {/* Bouton traduire */}
              <div style={{ background: C.violetLt, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.violet }}>Traduction automatique</div>
                  <div style={{ fontSize: 11, color: C.text2 }}>GPT-4o-mini traduit vers EN, ES, DE, NL en une fois</div>
                </div>
                <button
                  onClick={() => handleTranslate(['en', 'es', 'de', 'nl'])}
                  disabled={translating || !isEdit}
                  style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: translating ? C.border : C.violet, color: '#fff', fontSize: 13, fontWeight: 700, cursor: translating || !isEdit ? 'default' : 'pointer', opacity: !isEdit ? 0.5 : 1 }}>
                  {translating ? '⏳ Traduction…' : '🌍 Traduire maintenant'}
                </button>
              </div>
              {!isEdit && <p style={{ fontSize: 11, color: C.text3, textAlign: 'center' }}>Sauvegardez d'abord l'article pour activer la traduction.</p>}
            </div>
          )}

          {/* ── Onglet Traductions ── */}
          {tab === 'translations' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Sélecteur langue */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {LANGS.filter(l => l.code !== 'fr').map(lang => {
                  const hasTranslation = form.translated_langs.includes(lang.code)
                  const isActive = activeLang === lang.code
                  return (
                    <button key={lang.code} onClick={() => setActiveLang(lang.code)}
                      style={{ padding: '8px 14px', borderRadius: 20, border: `1.5px solid ${isActive ? C.violet : C.border}`, background: isActive ? C.violet : C.white, color: isActive ? '#fff' : C.text2, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {lang.flag} {lang.label}
                      {hasTranslation && <span style={{ fontSize: 10, background: isActive ? 'rgba(255,255,255,0.3)' : C.greenLt, color: isActive ? '#fff' : C.green, padding: '1px 5px', borderRadius: 6 }}>✓</span>}
                    </button>
                  )
                })}
              </div>

              {/* Formulaire langue active */}
              {activeLang !== 'fr' && (() => {
                const lang = LANGS.find(l => l.code === activeLang)!
                const hasT  = form.translated_langs.includes(activeLang)
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {!hasT && (
                      <div style={{ background: C.orangeLt, border: `1.5px solid ${C.orange}`, borderRadius: 10, padding: '10px 14px', fontSize: 12, color: C.orange ?? C.orange }}>
                        Pas encore traduit. Utilisez "Traduire maintenant" dans l'onglet Contenu FR.
                      </div>
                    )}
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: C.text3, display: 'block', marginBottom: 5 }}>TITRE — {lang.flag} {lang.label}</label>
                      <input
                        value={form.title_all[activeLang] ?? ''}
                        onChange={e => updateTranslation('title_all', activeLang, e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, fontWeight: 600, outline: 'none', boxSizing: 'border-box', color: C.text }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: C.text3, display: 'block', marginBottom: 5 }}>EXTRAIT — {lang.flag} {lang.label}</label>
                      <textarea
                        value={form.excerpt_all[activeLang] ?? ''}
                        onChange={e => updateTranslation('excerpt_all', activeLang, e.target.value)}
                        rows={3}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', color: C.text, fontFamily: 'inherit' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: C.text3, display: 'block', marginBottom: 5 }}>CONTENU — {lang.flag} {lang.label}</label>
                      <textarea
                        value={form.content_all[activeLang] ?? ''}
                        onChange={e => updateTranslation('content_all', activeLang, e.target.value)}
                        rows={18}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', color: C.text, fontFamily: 'monospace', lineHeight: 1.6 }} />
                    </div>
                    <button onClick={() => handleSave()} disabled={saving}
                      style={{ padding: '10px', borderRadius: 10, border: 'none', background: C.green, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                      {saving ? '…' : `✓ Sauvegarder corrections ${lang.label}`}
                    </button>
                  </div>
                )
              })()}
            </div>
          )}

          {/* ── Onglet Média ── */}
          {tab === 'media' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.text3, display: 'block', marginBottom: 8 }}>IMAGE DE L'ARTICLE</label>
                <p style={{ fontSize: 12, color: C.text2, marginBottom: 12 }}>Format JPEG, PNG ou WebP · Max 5MB · Ratio 16/9 recommandé</p>

                {form.image_url ? (
                  <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
                    <img src={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}${form.image_url}`}
                      alt="Article" style={{ width: '100%', maxHeight: 240, objectFit: 'cover', display: 'block' }} />
                    <button
                      onClick={() => set('image_url', '')}
                      style={{ position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 16 }}>
                      ✕
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{ border: `2px dashed ${C.border}`, borderRadius: 14, padding: '40px 20px', textAlign: 'center', cursor: 'pointer', background: C.bg, transition: 'all .15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = C.violet}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}
                  >
                    <div style={{ fontSize: 36, marginBottom: 8 }}>🖼</div>
                    <p style={{ fontSize: 14, color: C.text2, marginBottom: 4 }}>{uploadingImg ? 'Upload en cours…' : 'Cliquez pour choisir une image'}</p>
                    <p style={{ fontSize: 11, color: C.text3 }}>ou glissez-déposez ici</p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f) }}
                />

                {!isEdit && (
                  <p style={{ fontSize: 11, color: C.text3, marginTop: 8 }}>
                    Sauvegardez l'article d'abord pour uploader une image.
                  </p>
                )}
              </div>

              {/* URL manuelle */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.text3, display: 'block', marginBottom: 5 }}>OU URL EXTERNE</label>
                <input
                  value={form.image_url}
                  onChange={e => set('image_url', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, outline: 'none', boxSizing: 'border-box', color: C.text }} />
              </div>
            </div>
          )}

          {/* ── Onglet Paramètres ── */}
          {tab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Catégorie */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.text3, display: 'block', marginBottom: 8 }}>CATÉGORIE</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => set('category', cat)}
                      style={{ padding: '7px 16px', borderRadius: 20, border: `1.5px solid ${form.category === cat ? C.violet : C.border}`, background: form.category === cat ? C.violet : C.white, color: form.category === cat ? '#fff' : C.text2, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Emoji */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.text3, display: 'block', marginBottom: 8 }}>EMOJI</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => set('emoji', e)}
                      style={{ width: 40, height: 40, borderRadius: 10, border: `1.5px solid ${form.emoji === e ? C.violet : C.border}`, background: form.emoji === e ? C.violetLt : C.white, fontSize: 20, cursor: 'pointer' }}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Couleur */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.text3, display: 'block', marginBottom: 8 }}>COULEUR</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {COLORS.map(col => (
                    <button key={col} onClick={() => set('color', col)}
                      style={{ width: 32, height: 32, borderRadius: '50%', background: col, border: form.color === col ? `3px solid ${C.text}` : '2px solid transparent', cursor: 'pointer' }} />
                  ))}
                </div>
              </div>

              {/* Switches */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { key: 'featured', label: '⭐ Article à la une', desc: 'Affiché en premier sur le blog' },
                  { key: 'published', label: '✓ Publié', desc: 'Visible par les visiteurs' },
                ].map(opt => (
                  <div key={opt.key}
                    onClick={() => set(opt.key as keyof FormState, !form[opt.key as keyof FormState])}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderRadius: 12, border: `1.5px solid ${form[opt.key as keyof FormState] ? C.violet : C.border}`, background: form[opt.key as keyof FormState] ? C.violetLt : C.white, cursor: 'pointer' }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${form[opt.key as keyof FormState] ? C.violet : C.border}`, background: form[opt.key as keyof FormState] ? C.violet : C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, flexShrink: 0 }}>
                      {form[opt.key as keyof FormState] ? '✓' : ''}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{opt.label}</div>
                      <div style={{ fontSize: 11, color: C.text3 }}>{opt.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Aperçu carte */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.text3, display: 'block', marginBottom: 8 }}>APERÇU CARTE</label>
                <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', maxWidth: 280 }}>
                  {form.image_url ? (
                    <img src={form.image_url.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}${form.image_url}` : form.image_url}
                      alt="" style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ background: `${form.color}18`, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>{form.emoji}</div>
                  )}
                  <div style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 7, background: `${form.color}18`, color: form.color }}>{form.category}</span>
                    <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginTop: 7, marginBottom: 4 }}>{form.title_fr || "Titre de l'article"}</p>
                    <p style={{ fontSize: 11, color: C.text2, lineHeight: 1.5 }}>{form.excerpt_fr || "Extrait…"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Preview ── */}
        {preview && (
          <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 16, padding: '24px 28px', overflowY: 'auto', maxHeight: '85vh' }}>
            {form.image_url && (
              <img
                src={form.image_url.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}${form.image_url}` : form.image_url}
                alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 12, marginBottom: 20, display: 'block' }} />
            )}
            <div style={{ marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {!form.image_url && <span style={{ fontSize: 32 }}>{form.emoji}</span>}
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: `${form.color}18`, color: form.color }}>{form.category}</span>
              <span style={{ fontSize: 11, color: C.text3 }}>{readTime} min · {wordCount} mots</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 10, lineHeight: 1.3 }}>
              {form.title_fr || "Titre de l'article"}
            </h1>
            <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.7, marginBottom: 20, borderBottom: `1px solid ${C.border}`, paddingBottom: 16 }}>
              {form.excerpt_fr}
            </p>
            <div style={{ fontSize: 14, color: C.text, lineHeight: 1.8 }}
              dangerouslySetInnerHTML={{ __html: `<p style="margin:0">${renderMarkdown(form.content_fr)}</p>` }} />
          </div>
        )}
      </div>
    </div>
  )
}
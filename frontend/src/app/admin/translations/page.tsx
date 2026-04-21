'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'

const C = {
  violet:'#6C3FC5', violetLt:'#EDE8FB', violetDk:'#4A2A8A',
  orange:'#F07C1E', orangeLt:'#FEF0E3',
  green:'#2BA84A', greenLt:'#E3F7E8',
  red:'#E24B4A', redLt:'#FCEBEB',
  blue:'#1976D2', blueLt:'#E6F1FB',
  bg:'#F8F7FF', white:'#fff',
  text:'#1A1A2E', text2:'#5A5A7A', text3:'#9A9AB0',
  border:'#E8E4F8',
}

const LANGS = [
  { code: 'fr', flag: '🇫🇷', name: 'Français',     source: true },
  { code: 'en', flag: '🇬🇧', name: 'Anglais',      source: false },
  { code: 'es', flag: '🇪🇸', name: 'Espagnol',     source: false },
  { code: 'de', flag: '🇩🇪', name: 'Allemand',     source: false },
  { code: 'nl', flag: '🇳🇱', name: 'Néerlandais',  source: false },
]

export default function AdminTranslationsPage() {
  const { user } = useAuthStore()
  const [status, setStatus] = useState<Record<string, string | null>>({})
  const [translating, setTranslating] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string; languages?: string[]; duration?: number } | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStatus = async () => {
    try {
      const res = await api.get('/api/v1/admin/translations/status')
      setStatus(res.data.last_updated ?? {})
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchStatus() }, [])

  const handleTranslate = async (force: boolean) => {
    setTranslating(true)
    setResult(null)
    try {
      const res = await api.post(`/api/v1/admin/translate${force ? '?force=true' : ''}`)
      setResult({ ok: true, message: res.data.message, languages: res.data.languages_updated, duration: res.data.duration_seconds })
      await fetchStatus()
    } catch (err: any) {
      setResult({ ok: false, message: err.response?.data?.detail || 'Erreur lors de la traduction' })
    }
    setTranslating(false)
  }

  if (!user) return null

  const allTranslated = LANGS.filter(l => !l.source).every(l => status[l.code])
  const lastUpdate = Object.values(status).filter(Boolean).sort().pop()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 800 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 6 }}>🌍 Traductions</h1>
        <p style={{ fontSize: 13, color: C.text2 }}>
          Gérez les traductions de l'interface LangDad via Claude Haiku.
          Le fichier source est en français — les autres langues sont générées automatiquement.
        </p>
      </div>

      {/* Statut global */}
      <div style={{ background: allTranslated ? C.greenLt : C.orangeLt, border: `2px solid ${allTranslated ? C.green : C.orange}30`, borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontSize: 24 }}>{allTranslated ? '✅' : '⚠️'}</span>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: allTranslated ? C.green : C.orange, marginBottom: 2 }}>
            {allTranslated ? 'Toutes les langues sont à jour' : 'Certaines langues ne sont pas traduites'}
          </p>
          {lastUpdate && (
            <p style={{ fontSize: 12, color: C.text3 }}>
              Dernière mise à jour : {new Date(lastUpdate).toLocaleDateString('fr-FR')} à {new Date(lastUpdate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      </div>

      {/* Statut par langue */}
      <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 20, padding: '20px 24px' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 16 }}>Statut par langue</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {LANGS.map(lang => {
            const updated = status[lang.code]
            const isOk = lang.source || !!updated
            return (
              <div key={lang.code} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 12, background: C.bg, border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>{lang.flag}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{lang.name}</span>
                    {lang.source && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: C.blueLt, color: C.blue }}>SOURCE</span>}
                  </div>
                  {updated && !lang.source && (
                    <p style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>
                      Généré le {new Date(updated).toLocaleDateString('fr-FR')} à {new Date(updated).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                  {!lang.source && !updated && (
                    <p style={{ fontSize: 11, color: C.red, marginTop: 2 }}>Non traduit — cliquez sur "Traduire" pour générer</p>
                  )}
                </div>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: isOk ? C.green : C.red, flexShrink: 0 }} />
              </div>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 20, padding: '20px 24px' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 8 }}>Actions</h3>
        <p style={{ fontSize: 13, color: C.text2, marginBottom: 16, lineHeight: 1.7 }}>
          <strong>Traduire</strong> — génère uniquement les fichiers manquants ou datant de plus de 24h.<br />
          <strong>Forcer</strong> — retraduit toutes les langues même si les fichiers sont récents.
        </p>

        {result && (
          <div style={{ background: result.ok ? C.greenLt : C.redLt, border: `2px solid ${result.ok ? C.green : C.red}30`, borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: result.ok ? C.green : C.red, marginBottom: result.ok ? 6 : 0 }}>
              {result.ok ? '✅' : '❌'} {result.message}
            </p>
            {result.ok && result.languages && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                {result.languages.map(l => (
                  <span key={l} style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: C.green, color: '#fff' }}>
                    {LANGS.find(lg => lg.code === l)?.flag} {l.toUpperCase()} ✓
                  </span>
                ))}
              </div>
            )}
            {result.duration && <p style={{ fontSize: 11, color: C.text3, marginTop: 6 }}>Durée : {result.duration}s</p>}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => handleTranslate(false)} disabled={translating}
            style={{ flex: 1, padding: '14px', borderRadius: 14, background: translating ? C.border : C.violet, color: '#fff', border: 'none', cursor: translating ? 'default' : 'pointer', fontSize: 14, fontWeight: 700, transition: 'background .2s' }}>
            {translating ? '⏳ Traduction en cours…' : '🌍 Traduire (cache 24h)'}
          </button>
          <button onClick={() => handleTranslate(true)} disabled={translating}
            style={{ flex: 1, padding: '14px', borderRadius: 14, background: translating ? C.border : C.orangeLt, color: translating ? '#fff' : C.orange, border: `2px solid ${translating ? 'transparent' : C.orange}`, cursor: translating ? 'default' : 'pointer', fontSize: 14, fontWeight: 700 }}>
            🔄 Forcer la retraduction
          </button>
        </div>
      </div>

      {/* Note technique */}
      <div style={{ background: C.bg, border: `2px solid ${C.border}`, borderRadius: 14, padding: '14px 18px' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: C.text2, marginBottom: 6 }}>ℹ️ Note technique</p>
        <p style={{ fontSize: 12, color: C.text3, lineHeight: 1.7 }}>
          Les traductions sont générées par Claude Haiku via l'API Anthropic. Le fichier source <code>messages/fr.json</code> est traduit section par section.
          Les variables <code>{'{username}'}</code> et les emojis sont préservés automatiquement.
          En développement, utilisez <code>npm run translate</code> depuis le terminal frontend.
        </p>
      </div>
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'

const C = {
  violet:'#6C3FC5', violetLt:'#EDE8FB',
  orange:'#F07C1E', orangeLt:'#FEF0E3',
  green:'#2BA84A', greenLt:'#E3F7E8',
  blue:'#1976D2', blueLt:'#E6F1FB',
  pink:'#E91E63', pinkLt:'#FCE4EC',
  white:'#fff', text:'#1A1A2E', text2:'#5A5A7A', text3:'#9A9AB0',
  border:'#E8E4F8',
}

interface Stats {
  users: number
  lessons_completed: number
  xp_distributed: number
  active_modules: number
}

interface RecentUser {
  id: string
  username: string
  email: string
  xp: number
  level: number
  created_at: string
}

interface TranslationStatus {
  last_updated: Record<string, string>
  languages: string[]
}

const LANGS = [
  { code: 'fr', flag: '🇫🇷', label: 'FR', source: true },
  { code: 'en', flag: '🇬🇧', label: 'EN' },
  { code: 'es', flag: '🇪🇸', label: 'ES' },
  { code: 'de', flag: '🇩🇪', label: 'DE' },
  { code: 'nl', flag: '🇳🇱', label: 'NL' },
]

export default function AdminDashboardPage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [translationStatus, setTranslationStatus] = useState<TranslationStatus | null>(null)
  const [translating, setTranslating] = useState(false)
  const [translateMsg, setTranslateMsg] = useState<{ text: string; ok: boolean } | null>(null)

  useEffect(() => {
    // Charger les stats admin
    api.get('/api/v1/admin/stats').then(r => setStats(r.data)).catch(() => {
      // Fallback pour dev
      setStats({ users: 142, lessons_completed: 1840, xp_distributed: 48200, active_modules: 1 })
    })
    api.get('/api/v1/admin/users?limit=5').then(r => setRecentUsers(r.data)).catch(() => {})
    api.get('/api/v1/admin/translations/status').then(r => setTranslationStatus(r.data)).catch(() => {})
  }, [])

  const handleTranslate = async (force: boolean) => {
    setTranslating(true)
    setTranslateMsg(null)
    try {
      const res = await api.post(`/api/v1/admin/translate${force ? '?force=true' : ''}`)
      setTranslateMsg({ text: res.data.message || 'Traduction terminée', ok: true })
      // Recharger le statut
      api.get('/api/v1/admin/translations/status').then(r => setTranslationStatus(r.data)).catch(() => {})
    } catch (e: any) {
      setTranslateMsg({ text: e.response?.data?.detail || 'Erreur', ok: false })
    } finally {
      setTranslating(false)
    }
  }

  const STAT_CARDS = [
    { label: 'Utilisateurs', value: stats?.users ?? '—', icon: '👥', color: C.violet, bg: C.violetLt },
    { label: 'Leçons complétées', value: stats?.lessons_completed?.toLocaleString() ?? '—', icon: '✓', color: C.green, bg: C.greenLt },
    { label: 'XP distribués', value: stats?.xp_distributed?.toLocaleString() ?? '—', icon: '⚡', color: C.orange, bg: C.orangeLt },
    { label: 'Modules actifs', value: stats?.active_modules ?? '—', icon: '📚', color: C.blue, bg: C.blueLt },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {STAT_CARDS.map((s, i) => (
          <div key={i} style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 10 }}>
              {s.icon}
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: C.text3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Traductions */}
        <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>🌍 Traductions</h3>
              <p style={{ fontSize: 12, color: C.text3 }}>Interface disponible en 5 langues</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => handleTranslate(false)} disabled={translating}
                style={{ padding: '8px 14px', borderRadius: 10, background: C.violetLt, color: C.violet, border: `2px solid ${C.violet}`, cursor: 'pointer', fontSize: 12, fontWeight: 700, opacity: translating ? 0.6 : 1 }}>
                {translating ? '⏳…' : '🌍 Traduire'}
              </button>
              <button onClick={() => handleTranslate(true)} disabled={translating}
                style={{ padding: '8px 14px', borderRadius: 10, background: C.orangeLt, color: C.orange, border: `2px solid ${C.orange}`, cursor: 'pointer', fontSize: 12, fontWeight: 700, opacity: translating ? 0.6 : 1 }}>
                🔄 Forcer
              </button>
            </div>
          </div>

          {translateMsg && (
            <div style={{ padding: '8px 12px', borderRadius: 10, marginBottom: 12, background: translateMsg.ok ? C.greenLt : '#FCEBEB', color: translateMsg.ok ? C.green : '#E24B4A', fontSize: 12, fontWeight: 600 }}>
              {translateMsg.ok ? '✅' : '❌'} {translateMsg.text}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {LANGS.map(lang => {
              const updated = translationStatus?.last_updated?.[lang.code]
              const isSource = lang.source
              return (
                <div key={lang.code} style={{
                  padding: '8px 14px', borderRadius: 10,
                  background: isSource ? C.greenLt : updated ? C.violetLt : '#F5F5F5',
                  border: `2px solid ${isSource ? C.green : updated ? C.violet : '#E0E0E0'}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  minWidth: 64,
                }}>
                  <span style={{ fontSize: 18 }}>{lang.flag}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: isSource ? C.green : updated ? C.violet : C.text3 }}>
                    {lang.label} {isSource ? '(source)' : updated ? '✓' : '—'}
                  </span>
                  {updated && !isSource && (
                    <span style={{ fontSize: 10, color: C.text3 }}>
                      {new Date(updated).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Utilisateurs récents */}
        <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 16 }}>👥 Utilisateurs récents</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {recentUsers.length === 0 ? (
              <p style={{ fontSize: 13, color: C.text3, textAlign: 'center', padding: '20px 0' }}>Aucun utilisateur</p>
            ) : (
              recentUsers.map((u, i) => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < recentUsers.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.violetLt, color: C.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                    {u.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{u.username}</div>
                    <div style={{ fontSize: 11, color: C.text3 }}>{u.email}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.orange }}>{u.xp} XP</div>
                    <div style={{ fontSize: 11, color: C.text3 }}>Niv. {u.level}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
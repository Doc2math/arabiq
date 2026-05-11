'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'

const C = {
  violet:'#6C3FC5', violetLt:'#EDE8FB', violetDk:'#4A2A8A',
  orange:'#F07C1E', orangeLt:'#FEF0E3',
  green:'#2BA84A', greenLt:'#E3F7E8',
  red:'#E24B4A', redLt:'#FCEBEB',
  bg:'#F8F7FF', white:'#fff',
  text:'#1A1A2E', text2:'#5A5A7A', text3:'#9A9AB0',
  border:'#E8E4F8',
}

const LANGUAGES = [
  { code: 'fr', label: 'Français',   flag: '🇫🇷' },
  { code: 'en', label: 'English',    flag: '🇬🇧' },
  { code: 'es', label: 'Español',    flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch',    flag: '🇩🇪' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
]

export default function ProfilePage() {
  const { user, fetchMe } = useAuthStore()
  const t       = useTranslations('profile')
  const tCommon = useTranslations('common')

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    username: user?.username ?? '',
    native_language: user?.native_language ?? 'fr',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState('')

  if (!user) return null

  const initials    = user.username.slice(0, 2).toUpperCase()
  const memberSince = new Date(user.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })

  const handleSave = async () => {
    setSaving(true); setError('')
    try {
      await api.patch('/api/v1/auth/me', form)
      await fetchMe()
      setSaved(true); setEditing(false)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) {
      setError(e.response?.data?.detail || tCommon('error'))
    }
    setSaving(false)
  }

  return (
    <div style={{ maxWidth: 1020, margin: '0 auto', padding: '32px 24px' }}>

      {/* ── Header ── */}
      <div style={{ background: `linear-gradient(135deg, ${C.violetDk}, ${C.violet})`, borderRadius: 24, padding: '32px', marginBottom: 24, color: '#fff', display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, flexShrink: 0 }}>
          {initials}
        </div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{user.username}</h1>
          <p style={{ fontSize: 14, opacity: 0.8, marginBottom: 8 }}>{user.email}</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <span style={{ fontSize: 12, background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: 12 }}>
              {t('memberSince', { date: memberSince })}
            </span>
            {user.is_premium && (
              <span style={{ fontSize: 12, background: C.orange, padding: '4px 12px', borderRadius: 12, fontWeight: 700 }}>⭐ Premium</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { icon: '⚡', value: user.xp,    label: 'XP total',       color: C.orange, bg: C.orangeLt },
          { icon: '🔥', value: user.streak, label: 'Jours de série', color: C.green,  bg: C.greenLt  },
          { icon: '🏆', value: user.level,  label: 'Niveau actuel',  color: C.violet, bg: C.violetLt },
        ].map((s, i) => (
          <div key={i} style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 16, padding: '18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: C.text3 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Informations personnelles ── */}
      <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 20, padding: '24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{t('personalInfo')}</h3>
          {!editing ? (
            <button onClick={() => setEditing(true)}
              style={{ padding: '8px 16px', borderRadius: 10, border: `2px solid ${C.violet}`, background: C.violetLt, color: C.violet, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              ✏️ {t('editBtn')}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setEditing(false)}
                style={{ padding: '8px 16px', borderRadius: 10, border: `2px solid ${C.border}`, background: 'transparent', color: C.text2, fontSize: 13, cursor: 'pointer' }}>
                {tCommon('cancel')}
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: '8px 16px', borderRadius: 10, background: saving ? C.border : C.violet, color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer' }}>
                {saving ? `${tCommon('save')}…` : tCommon('save')}
              </button>
            </div>
          )}
        </div>

        {error && (
          <div style={{ background: C.redLt, border: `2px solid ${C.red}`, borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: C.red }}>
            ✗ {error}
          </div>
        )}
        {saved && (
          <div style={{ background: C.greenLt, border: `2px solid ${C.green}`, borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: C.green }}>
            ✓ {t('saved')}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.text3, display: 'block', marginBottom: 6 }}>{t('username')}</label>
            {editing ? (
              <input type="text" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: `2px solid ${C.violet}`, fontSize: 14, color: C.text, outline: 'none', boxSizing: 'border-box' as const }} />
            ) : (
              <p style={{ fontSize: 15, fontWeight: 600, color: C.text, padding: '11px 0' }}>{user.username}</p>
            )}
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.text3, display: 'block', marginBottom: 6 }}>{t('email')}</label>
            <p style={{ fontSize: 15, color: C.text2, padding: '11px 0' }}>{user.email}</p>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.text3, display: 'block', marginBottom: 6 }}>{t('language')}</label>
            {editing ? (
              <select value={form.native_language} onChange={e => setForm(f => ({ ...f, native_language: e.target.value }))}
                style={{ padding: '11px 14px', borderRadius: 12, border: `2px solid ${C.violet}`, fontSize: 14, color: C.text, outline: 'none', cursor: 'pointer', width: '100%', boxSizing: 'border-box' as const }}>
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}
              </select>
            ) : (
              <p style={{ fontSize: 15, color: C.text2, padding: '11px 0' }}>
                {LANGUAGES.find(l => l.code === user.native_language)?.flag}{' '}
                {LANGUAGES.find(l => l.code === user.native_language)?.label ?? user.native_language}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Certificats ── */}
      <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 20, padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>🏅 Mes certificats</h3>
            <p style={{ fontSize: 13, color: C.text2 }}>Vos certificats de réussite LangDad</p>
          </div>
          <a href="/certificates"
            style={{ padding: '10px 18px', borderRadius: 12, background: C.violetLt, color: C.violet, border: `2px solid ${C.violet}30`, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            Voir mes certificats →
          </a>
        </div>
      </div>

      {/* ── Institution ── */}
      <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 20, padding: '20px 24px', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 12 }}>🏫 {t('institution.title')}</h3>

        {(user.role === 'teacher' || user.role === 'institution') && !user.institution_id && (
          <div>
            <p style={{ fontSize: 13, color: C.text2, marginBottom: 14, lineHeight: 1.6 }}>
              {t('institution.studentDesc')}
            </p>
            <a href="/institution/create"
              style={{ display: 'inline-block', padding: '10px 20px', borderRadius: 12, background: C.violetLt, color: C.violet, border: `2px solid ${C.violet}30`, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
              🏫 {t('institution.createBtn')}
            </a>
          </div>
        )}

        {user.role === 'institution_admin' && (
          <div>
            <p style={{ fontSize: 13, color: C.text2, marginBottom: 14 }}>
              {t('institution.adminDesc')}
            </p>
            <a href="/institution"
              style={{ display: 'inline-block', padding: '10px 20px', borderRadius: 12, background: C.violetLt, color: C.violet, border: `2px solid ${C.violet}30`, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
              🏫 {t('institution.manageBtn')}
            </a>
          </div>
        )}

        {user.role === 'student' && !user.institution_id && (
          <p style={{ fontSize: 13, color: C.text3 }}>
            Vous n'êtes rattaché à aucune institution.
          </p>
        )}
      </div>

      {/* ── Danger zone ── */}
      <div style={{ background: C.redLt, border: `2px solid ${C.red}30`, borderRadius: 16, padding: '18px 20px' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: C.red, marginBottom: 10 }}>
          ⚠️ {t('dangerZone.title')}
        </h3>
        <button style={{ padding: '9px 18px', borderRadius: 10, border: `2px solid ${C.red}`, background: 'transparent', color: C.red, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {t('dangerZone.deleteAccount')}
        </button>
      </div>
    </div>
  )
}
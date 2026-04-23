'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'

const C = {
  violet:'#6C3FC5', violetLt:'#EDE8FB',
  orange:'#F07C1E', orangeLt:'#FEF0E3',
  green:'#2BA84A', greenLt:'#E3F7E8',
  red:'#E24B4A', redLt:'#FCEBEB',
  bg:'#F8F7FF', white:'#fff',
  text:'#1A1A2E', text2:'#5A5A7A', text3:'#9A9AB0',
  border:'#E8E4F8',
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!value)}
      style={{ width: 44, height: 24, borderRadius: 12, background: value ? C.violet : C.border, cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: value ? 23 : 3, transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.2)' }} />
    </div>
  )
}

function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ flex: 1, paddingRight: 20 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 2 }}>{label}</p>
        {desc && <p style={{ fontSize: 12, color: C.text3 }}>{desc}</p>}
      </div>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const { user, logout } = useAuthStore()
  const [settings, setSettings] = useState({
    sound_enabled: true,
    notifications_enabled: true,
    daily_reminder: false,
    dark_mode: false,
    auto_play_audio: true,
    show_transliteration: true,
  })

  if (!user) return null

  const update = (key: string, value: boolean) => setSettings(s => ({ ...s, [key]: value }))

  return (
    <div style={{ maxWidth: 1020, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 28 }}>⚙️ Paramètres</h1>

      {/* Audio */}
      <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 20, padding: '20px 24px', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>🔊 Audio</h3>
        <Row label="Sons activés" desc="Sons de feedback lors des exercices">
          <Toggle value={settings.sound_enabled} onChange={v => update('sound_enabled', v)} />
        </Row>
        <Row label="Lecture audio automatique" desc="Joue automatiquement l'audio des cartes">
          <Toggle value={settings.auto_play_audio} onChange={v => update('auto_play_audio', v)} />
        </Row>
      </div>

      {/* Affichage */}
      <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 20, padding: '20px 24px', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>👁️ Affichage</h3>
        <Row label="Translittération" desc="Afficher la prononciation en lettres latines">
          <Toggle value={settings.show_transliteration} onChange={v => update('show_transliteration', v)} />
        </Row>
        <Row label="Mode sombre" desc="Interface en thème sombre (bientôt disponible)">
          <Toggle value={settings.dark_mode} onChange={v => update('dark_mode', v)} />
        </Row>
      </div>

      {/* Notifications */}
      <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 20, padding: '20px 24px', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>🔔 Notifications</h3>
        <Row label="Notifications activées" desc="Recevoir des rappels et alertes">
          <Toggle value={settings.notifications_enabled} onChange={v => update('notifications_enabled', v)} />
        </Row>
        <Row label="Rappel quotidien" desc="Rappel pour maintenir votre série">
          <Toggle value={settings.daily_reminder} onChange={v => update('daily_reminder', v)} />
        </Row>
      </div>

      {/* Compte */}
      <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 20, padding: '20px 24px', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 16 }}>👤 Compte</h3>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href="/profile" style={{ flex: 1, padding: '11px', borderRadius: 12, border: `2px solid ${C.violet}`, background: C.violetLt, color: C.violet, fontSize: 13, fontWeight: 700, textDecoration: 'none', textAlign: 'center' as const }}>
            Modifier le profil
          </a>
          <button onClick={() => logout()}
            style={{ flex: 1, padding: '11px', borderRadius: 12, border: `2px solid ${C.red}`, background: 'transparent', color: C.red, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            🚪 Déconnexion
          </button>
        </div>
      </div>
    </div>
  )
}
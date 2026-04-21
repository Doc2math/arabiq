'use client'

import { useState } from 'react'
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 20, padding: '22px 24px' }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 18, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>{title}</h3>
      {children}
    </div>
  )
}

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ flex: 1, paddingRight: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>{label}</p>
        {desc && <p style={{ fontSize: 11, color: C.text3 }}>{desc}</p>}
      </div>
      {children}
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!value)}
      style={{ width: 44, height: 24, borderRadius: 12, background: value ? C.violet : C.border, cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: value ? 23 : 3, transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.2)' }} />
    </div>
  )
}

export default function AdminSettingsPage() {
  const { user } = useAuthStore()
  const [settings, setSettings] = useState({
    maintenance_mode: false,
    registration_open: true,
    premium_enabled: true,
    xp_multiplier: 1,
    streak_freeze_days: 1,
    passing_score: 70,
    ai_feedback_enabled: true,
    max_lessons_per_day: 10,
  })
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const update = (key: string, value: any) => {
    setSettings(s => ({ ...s, [key]: value }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.post('/api/v1/admin/settings', settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {}
    setSaving(false)
  }

  if (!user) return null

  const inputStyle = {
    padding: '7px 12px', borderRadius: 8, border: `2px solid ${C.border}`,
    fontSize: 13, color: C.text, width: 90, textAlign: 'center' as const, outline: 'none',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 4 }}>⚙️ Paramètres</h1>
          <p style={{ fontSize: 13, color: C.text2 }}>Configuration générale de la plateforme</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {saved && <span style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>✓ Sauvegardé</span>}
          <button onClick={handleSave} disabled={saving}
            style={{ padding: '10px 22px', borderRadius: 12, background: saving ? C.border : C.violet, color: '#fff', border: 'none', cursor: saving ? 'default' : 'pointer', fontSize: 13, fontWeight: 700 }}>
            {saving ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      <Section title="🔧 Général">
        <SettingRow label="Mode maintenance" desc="Désactive l'accès aux élèves — seuls les admins peuvent se connecter">
          <Toggle value={settings.maintenance_mode} onChange={v => update('maintenance_mode', v)} />
        </SettingRow>
        <SettingRow label="Inscriptions ouvertes" desc="Autoriser les nouvelles inscriptions">
          <Toggle value={settings.registration_open} onChange={v => update('registration_open', v)} />
        </SettingRow>
        <SettingRow label="Leçons maximum par jour" desc="Limite de leçons par élève et par jour (0 = illimité)">
          <input type="number" value={settings.max_lessons_per_day} onChange={e => update('max_lessons_per_day', Number(e.target.value))}
            min={0} max={50} style={inputStyle} />
        </SettingRow>
      </Section>

      <Section title="🎓 Pédagogie">
        <SettingRow label="Score de passage" desc="Score minimum (%) pour valider une leçon">
          <input type="number" value={settings.passing_score} onChange={e => update('passing_score', Number(e.target.value))}
            min={50} max={100} style={inputStyle} />
        </SettingRow>
        <SettingRow label="Multiplicateur XP" desc="Multiplie tous les XP gagnés (1 = normal, 2 = double XP)">
          <input type="number" value={settings.xp_multiplier} onChange={e => update('xp_multiplier', Number(e.target.value))}
            min={1} max={5} step={0.5} style={inputStyle} />
        </SettingRow>
        <SettingRow label="Jours de gel de série" desc="Nombre de jours sans activité avant de perdre sa série">
          <input type="number" value={settings.streak_freeze_days} onChange={e => update('streak_freeze_days', Number(e.target.value))}
            min={0} max={7} style={inputStyle} />
        </SettingRow>
        <SettingRow label="Feedback IA activé" desc="Utilise Claude pour générer des feedbacks personnalisés (premium)">
          <Toggle value={settings.ai_feedback_enabled} onChange={v => update('ai_feedback_enabled', v)} />
        </SettingRow>
      </Section>

      <Section title="💳 Premium">
        <SettingRow label="Fonctionnalités premium activées" desc="Active le système d'abonnement premium">
          <Toggle value={settings.premium_enabled} onChange={v => update('premium_enabled', v)} />
        </SettingRow>
        <SettingRow label="Gestion des abonnements Stripe" desc="Configurer les plans et les paiements">
          <button style={{ padding: '7px 14px', borderRadius: 10, border: `2px solid ${C.violet}`, background: C.violetLt, color: C.violet, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            Configurer →
          </button>
        </SettingRow>
      </Section>

      <Section title="🔑 API & Intégrations">
        <SettingRow label="Anthropic API Key" desc="Clé pour Claude Haiku (traductions + feedback IA)">
          <button style={{ padding: '7px 14px', borderRadius: 10, border: `2px solid ${C.border}`, background: C.bg, color: C.text2, fontSize: 12, cursor: 'pointer' }}>
            Modifier
          </button>
        </SettingRow>
        <SettingRow label="Stripe API Key" desc="Clé pour les paiements premium">
          <button style={{ padding: '7px 14px', borderRadius: 10, border: `2px solid ${C.border}`, background: C.bg, color: C.text2, fontSize: 12, cursor: 'pointer' }}>
            Modifier
          </button>
        </SettingRow>
        <SettingRow label="SMTP Email" desc="Configuration pour les emails (vérification, réinitialisation)">
          <button style={{ padding: '7px 14px', borderRadius: 10, border: `2px solid ${C.border}`, background: C.bg, color: C.text2, fontSize: 12, cursor: 'pointer' }}>
            Configurer
          </button>
        </SettingRow>
      </Section>

      {/* Zone danger */}
      <div style={{ background: C.redLt, border: `2px solid ${C.red}30`, borderRadius: 20, padding: '20px 24px' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: C.red, marginBottom: 16 }}>⚠️ Zone de danger</h3>
        <div style={{ display: 'flex', gap: 12 }}>
          <button style={{ padding: '10px 18px', borderRadius: 12, border: `2px solid ${C.red}`, background: 'transparent', color: C.red, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Vider le cache
          </button>
          <button style={{ padding: '10px 18px', borderRadius: 12, border: `2px solid ${C.red}`, background: 'transparent', color: C.red, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Réinitialiser les progressions
          </button>
        </div>
      </div>
    </div>
  )
}
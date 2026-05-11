'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'

const C = {
  violet:'#6C3FC5', violetLt:'#EDE8FB',
  orange:'#F07C1E', orangeLt:'#FEF0E3',
  green:'#2BA84A', greenLt:'#E3F7E8',
  red:'#E24B4A', redLt:'#FCEBEB',
  pink:'#E91E63', pinkLt:'#FCE4EC',
  blue:'#1976D2', blueLt:'#E6F1FB',
  bg:'#F8F7FF', white:'#fff',
  text:'#1A1A2E', text2:'#5A5A7A', text3:'#9A9AB0',
  border:'#E8E4F8',
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 20, overflow: 'hidden' }}>
      <div style={{ padding: '16px 24px', borderBottom: `2px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{title}</h3>
      </div>
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {children}
      </div>
    </div>
  )
}

function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
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

function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div onClick={() => !disabled && onChange(!value)}
      style={{ width: 44, height: 24, borderRadius: 12, background: value ? C.pink : C.border, cursor: disabled ? 'default' : 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0, opacity: disabled ? 0.5 : 1 }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: value ? 23 : 3, transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.2)' }} />
    </div>
  )
}

interface Settings {
  two_factor_required:    boolean
  session_timeout_hours:  number
  max_failed_logins:      number
  ip_whitelist_enabled:   boolean
  notify_new_admin:       boolean
  notify_blocked_user:    boolean
  notify_payment:         boolean
  alert_email:            string
  auto_backup_enabled:    boolean
  backup_frequency_days:  number
  maintenance_mode:       boolean
  debug_mode:             boolean
}

export default function SuperAdminSettingsPage() {
  const { user } = useAuthStore()
  const [saved, setSaved]   = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [confirmDanger, setConfirmDanger] = useState('')

  const [settings, setSettings] = useState<Settings>({
    two_factor_required:   false,
    session_timeout_hours: 8,
    max_failed_logins:     5,
    ip_whitelist_enabled:  false,
    notify_new_admin:      true,
    notify_blocked_user:   true,
    notify_payment:        true,
    alert_email:           'superadmin@langdad.com',
    auto_backup_enabled:   true,
    backup_frequency_days: 7,
    maintenance_mode:      false,
    debug_mode:            false,
  })

  // Charger les paramètres depuis l'API
  useEffect(() => {
    api.get('/api/v1/admin/settings')
      .then(r => { setSettings(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const update = (key: keyof Settings, value: any) => {
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
    fontSize: 13, color: C.text, outline: 'none', boxSizing: 'border-box' as const,
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60, color: C.text3 }}>Chargement…</div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 760 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 4 }}>⚙️ Paramètres Super Admin</h1>
          <p style={{ fontSize: 13, color: C.text2 }}>Configuration critique de la plateforme — accès restreint</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {saved && <span style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>✓ Sauvegardé</span>}
          <button onClick={handleSave} disabled={saving}
            style={{ padding: '10px 22px', borderRadius: 12, background: saving ? C.border : C.pink, color: '#fff', border: 'none', cursor: saving ? 'default' : 'pointer', fontSize: 13, fontWeight: 700 }}>
            {saving ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {/* Sécurité */}
      <Section title="Sécurité" icon="🔐">
        <Row label="Double authentification requise" desc="Oblige tous les admins à activer le 2FA">
          <Toggle value={settings.two_factor_required} onChange={v => update('two_factor_required', v)} />
        </Row>
        <Row label="Expiration de session" desc="Durée avant déconnexion automatique (heures)">
          <input type="number" value={settings.session_timeout_hours}
            onChange={e => update('session_timeout_hours', Number(e.target.value))}
            min={1} max={72} style={{ ...inputStyle, width: 80, textAlign: 'center' }} />
        </Row>
        <Row label="Tentatives de connexion max" desc="Nombre d'échecs avant blocage du compte">
          <input type="number" value={settings.max_failed_logins}
            onChange={e => update('max_failed_logins', Number(e.target.value))}
            min={3} max={20} style={{ ...inputStyle, width: 80, textAlign: 'center' }} />
        </Row>
        <Row label="Whitelist IP admins" desc="Restreindre l'accès admin à des IPs spécifiques">
          <Toggle value={settings.ip_whitelist_enabled} onChange={v => update('ip_whitelist_enabled', v)} />
        </Row>
      </Section>

      {/* Notifications */}
      <Section title="Notifications" icon="🔔">
        <Row label="Email d'alerte" desc="Reçoit toutes les notifications critiques">
          <input type="email" value={settings.alert_email}
            onChange={e => update('alert_email', e.target.value)}
            style={{ ...inputStyle, width: 240 }}
            onFocus={e => (e.target as HTMLInputElement).style.borderColor = C.pink}
            onBlur={e => (e.target as HTMLInputElement).style.borderColor = C.border} />
        </Row>
        <Row label="Notifier à la création d'admin" desc="Email lors de la création d'un nouvel admin">
          <Toggle value={settings.notify_new_admin} onChange={v => update('notify_new_admin', v)} />
        </Row>
        <Row label="Notifier lors d'un blocage utilisateur" desc="Email quand un admin bloque un élève">
          <Toggle value={settings.notify_blocked_user} onChange={v => update('notify_blocked_user', v)} />
        </Row>
        <Row label="Notifier les nouveaux paiements" desc="Email à chaque nouvel abonnement">
          <Toggle value={settings.notify_payment} onChange={v => update('notify_payment', v)} />
        </Row>
      </Section>

      {/* Sauvegarde */}
      <Section title="Sauvegarde automatique" icon="💾">
        <Row label="Sauvegarde automatique activée" desc="Sauvegarde la base de données régulièrement">
          <Toggle value={settings.auto_backup_enabled} onChange={v => update('auto_backup_enabled', v)} />
        </Row>
        <Row label="Fréquence de sauvegarde" desc="Nombre de jours entre chaque sauvegarde">
          <input type="number" value={settings.backup_frequency_days}
            onChange={e => update('backup_frequency_days', Number(e.target.value))}
            min={1} max={30} disabled={!settings.auto_backup_enabled}
            style={{ ...inputStyle, width: 80, textAlign: 'center', opacity: settings.auto_backup_enabled ? 1 : 0.5 }} />
        </Row>
        <div style={{ padding: '10px 0' }}>
          <button style={{ padding: '9px 18px', borderRadius: 10, border: `2px solid ${C.violet}`, background: C.violetLt, color: C.violet, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            💾 Sauvegarder maintenant
          </button>
        </div>
      </Section>

      {/* Maintenance */}
      <Section title="Maintenance" icon="🔧">
        <Row label="Mode maintenance" desc="Coupe l'accès aux élèves — seuls les admins peuvent se connecter">
          <Toggle value={settings.maintenance_mode} onChange={v => update('maintenance_mode', v)} />
        </Row>
        <Row label="Mode debug" desc="Active les logs détaillés (ne pas utiliser en production)">
          <Toggle value={settings.debug_mode} onChange={v => update('debug_mode', v)} />
        </Row>
      </Section>

      {/* Zone de danger */}
      <div style={{ background: C.redLt, border: `2px solid ${C.red}30`, borderRadius: 20, padding: '24px' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: C.red, marginBottom: 6 }}>⚠️ Zone de danger</h3>
        <p style={{ fontSize: 13, color: C.text2, marginBottom: 20, lineHeight: 1.6 }}>
          Ces actions sont irréversibles. Tapez <strong>CONFIRMER</strong> avant d'exécuter.
        </p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
          <input type="text" value={confirmDanger} onChange={e => setConfirmDanger(e.target.value)}
            placeholder="Tapez CONFIRMER pour activer"
            style={{ ...inputStyle, flex: 1, borderColor: C.red + '40' }} />
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: '🗑 Vider le cache',              action: 'cache'    },
            { label: '🔄 Réinitialiser les sessions',  action: 'sessions' },
            { label: '📧 Tester l\'envoi email',       action: 'email'    },
            { label: '💣 Réinitialiser la BDD',        action: 'db'       },
          ].map(btn => (
            <button key={btn.action}
              disabled={confirmDanger !== 'CONFIRMER'}
              style={{ padding: '9px 16px', borderRadius: 10, border: `2px solid ${C.red}`, background: confirmDanger === 'CONFIRMER' ? C.redLt : '#F5F5F5', color: confirmDanger === 'CONFIRMER' ? C.red : C.text3, fontSize: 12, fontWeight: 700, cursor: confirmDanger === 'CONFIRMER' ? 'pointer' : 'default', transition: 'all .15s' }}>
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
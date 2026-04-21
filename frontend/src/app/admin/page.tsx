'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'

const C = {
  violet:'#6C3FC5', violetLt:'#EDE8FB', violetDk:'#4A2A8A',
  orange:'#F07C1E', orangeLt:'#FEF0E3',
  green:'#2BA84A', greenLt:'#E3F7E8',
  blue:'#1976D2', blueLt:'#E6F1FB',
  red:'#E24B4A', redLt:'#FCEBEB',
  pink:'#E91E63', pinkLt:'#FCE4EC',
  gold:'#F9A825', goldLt:'#FFF8E1',
  bg:'#F8F7FF', white:'#fff',
  text:'#1A1A2E', text2:'#5A5A7A', text3:'#9A9AB0',
  border:'#E8E4F8', sidebar:'#1A1A2E',
}

interface AdminUser {
  id: string
  username: string
  email: string
  role: string
  permissions: string[]
  is_active: boolean
  created_at: string
  last_login: string | null
  total_sessions: number
  total_actions: number
}

interface OnlineAdmin {
  admin_id: string
  username: string
  login_at: string
  ip_address: string | null
  duration_seconds: number
}

interface AuditEntry {
  id: string
  admin_id: string
  admin_username: string
  action: string
  resource_type: string | null
  details: any
  status: string
  ip_address: string | null
  created_at: string
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min`
  return `${Math.floor(seconds / 3600)}h${Math.floor((seconds % 3600) / 60)}min`
}

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'il y a quelques secondes'
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`
  return `il y a ${Math.floor(diff / 86400)}j`
}

const ACTION_COLORS: Record<string, { color: string; bg: string }> = {
  'admin.create':        { color: C.green,  bg: C.greenLt },
  'admin.update':        { color: C.blue,   bg: C.blueLt  },
  'user.block':          { color: C.red,    bg: C.redLt   },
  'translation.trigger': { color: C.violet, bg: C.violetLt},
  'content.create':      { color: C.green,  bg: C.greenLt },
  'content.edit':        { color: C.orange, bg: C.orangeLt},
  'content.delete':      { color: C.red,    bg: C.redLt   },
}

export default function SuperAdminDashboard() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [online, setOnline] = useState<OnlineAdmin[]>([])
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAdmin, setSelectedAdmin] = useState<string | null>(null)
  const [activity, setActivity] = useState<any>(null)
  const [activityLoading, setActivityLoading] = useState(false)

  useEffect(() => {
    if (!user || user.is_admin === false) { router.push('/dashboard'); return }
    Promise.all([
      api.get('/api/v1/superadmin/admins'),
      api.get('/api/v1/superadmin/admins/online'),
      api.get('/api/v1/superadmin/audit-log?days=7&limit=30'),
    ]).then(([adminsRes, onlineRes, auditRes]) => {
      setAdmins(adminsRes.data)
      setOnline(onlineRes.data)
      setAuditLog(auditRes.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const loadActivity = async (adminId: string) => {
    setSelectedAdmin(adminId)
    setActivityLoading(true)
    try {
      const res = await api.get(`/api/v1/superadmin/admins/${adminId}/activity?days=30`)
      setActivity(res.data)
    } catch {}
    setActivityLoading(false)
  }

  const toggleAdmin = async (adminId: string, isActive: boolean) => {
    try {
      await api.patch(`/api/v1/superadmin/admins/${adminId}`, { is_active: !isActive })
      setAdmins(prev => prev.map(a => a.id === adminId ? { ...a, is_active: !isActive } : a))
    } catch {}
  }

  if (!user) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Titre */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 4 }}>
            🛡️ Dashboard Super Admin
          </h1>
          <p style={{ fontSize: 13, color: C.text3 }}>Supervision et gestion des administrateurs</p>
        </div>
        <button onClick={() => router.push('/admin/superadmin/create-admin')}
          style={{ padding: '10px 20px', borderRadius: 12, background: C.violet, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
          + Nouvel admin
        </button>
      </div>

      {/* Admins en ligne */}
      <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 20, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: C.green }} />
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
            Admins connectés ({online.length})
          </h3>
        </div>
        {online.length === 0 ? (
          <p style={{ fontSize: 13, color: C.text3, textAlign: 'center', padding: '12px 0' }}>
            Aucun admin connecté en ce moment
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {online.map(o => (
              <div key={o.admin_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: C.greenLt, borderRadius: 12, border: `1px solid ${C.green}30` }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.green, flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: C.text, flex: 1 }}>{o.username}</span>
                <span style={{ fontSize: 12, color: C.text3 }}>Connecté depuis {formatDuration(o.duration_seconds)}</span>
                {o.ip_address && <span style={{ fontSize: 11, color: C.text3, background: '#F0F0F0', padding: '2px 8px', borderRadius: 6 }}>{o.ip_address}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grille admins + activité */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedAdmin ? '1fr 1fr' : '1fr', gap: 16 }}>

        {/* Liste des admins */}
        <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 20, padding: '20px 24px' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 16 }}>
            👥 Équipe admin ({admins.length})
          </h3>
          {loading ? (
            <p style={{ color: C.text3, fontSize: 13, textAlign: 'center' }}>Chargement…</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {admins.map(admin => (
                <div key={admin.id}
                  style={{ border: `2px solid ${selectedAdmin === admin.id ? C.violet : C.border}`, borderRadius: 14, padding: '14px 16px', background: selectedAdmin === admin.id ? C.violetLt : C.white, transition: 'all .15s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: admin.role === 'superadmin' ? C.pink : C.violet, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                      {admin.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{admin.username}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 6, background: admin.role === 'superadmin' ? C.pinkLt : C.violetLt, color: admin.role === 'superadmin' ? C.pink : C.violet }}>
                          {admin.role}
                        </span>
                        {!admin.is_active && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: C.redLt, color: C.red, fontWeight: 700 }}>SUSPENDU</span>}
                      </div>
                      <p style={{ fontSize: 11, color: C.text3 }}>{admin.email}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                    <span style={{ fontSize: 11, color: C.text3 }}>🔗 {admin.total_sessions} sessions</span>
                    <span style={{ fontSize: 11, color: C.text3 }}>⚡ {admin.total_actions} actions</span>
                    {admin.last_login && <span style={{ fontSize: 11, color: C.text3 }}>🕐 {timeAgo(admin.last_login)}</span>}
                  </div>

                  {/* Permissions */}
                  {admin.permissions.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                      {admin.permissions.slice(0, 4).map(p => (
                        <span key={p} style={{ fontSize: 9, background: C.violetLt, color: C.violet, padding: '2px 6px', borderRadius: 6 }}>{p}</span>
                      ))}
                      {admin.permissions.length > 4 && (
                        <span style={{ fontSize: 9, background: C.bg, color: C.text3, padding: '2px 6px', borderRadius: 6 }}>+{admin.permissions.length - 4}</span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {admin.role !== 'superadmin' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => loadActivity(admin.id)}
                        style={{ flex: 1, padding: '7px', borderRadius: 8, border: `1px solid ${C.violet}`, background: 'transparent', color: C.violet, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                        📊 Rapport
                      </button>
                      <button onClick={() => router.push(`/admin/superadmin/admins/${admin.id}`)}
                        style={{ flex: 1, padding: '7px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.text2, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                        ✏️ Modifier
                      </button>
                      <button onClick={() => toggleAdmin(admin.id, admin.is_active)}
                        style={{ flex: 1, padding: '7px', borderRadius: 8, border: `1px solid ${admin.is_active ? C.red : C.green}`, background: 'transparent', color: admin.is_active ? C.red : C.green, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                        {admin.is_active ? '🚫 Suspendre' : '✓ Réactiver'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rapport d'activité */}
        {selectedAdmin && (
          <div style={{ background: C.white, border: `2px solid ${C.violet}`, borderRadius: 20, padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.violet }}>
                📊 Rapport d'activité
              </h3>
              <button onClick={() => { setSelectedAdmin(null); setActivity(null) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: C.text3 }}>✕</button>
            </div>

            {activityLoading ? (
              <p style={{ color: C.text3, fontSize: 13, textAlign: 'center', padding: 20 }}>Chargement…</p>
            ) : activity ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Stats période */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Sessions', value: activity.total_sessions, color: C.violet },
                    { label: 'Temps total', value: formatDuration(activity.total_time_seconds), color: C.blue },
                    { label: 'Actions', value: activity.total_actions, color: C.orange },
                    { label: 'Période', value: '30 jours', color: C.text3 },
                  ].map((s, i) => (
                    <div key={i} style={{ background: C.bg, borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: C.text3 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Actions par type */}
                {Object.keys(activity.actions_by_type).length > 0 && (
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: C.text2, marginBottom: 8 }}>Actions effectuées</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {Object.entries(activity.actions_by_type).map(([action, count]) => {
                        const cfg = ACTION_COLORS[action] ?? { color: C.text2, bg: C.bg }
                        return (
                          <div key={action} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 8, background: cfg.bg }}>
                            <span style={{ fontSize: 12, color: cfg.color, fontWeight: 600 }}>{action}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{count as number}×</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Sessions récentes */}
                {activity.sessions.length > 0 && (
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: C.text2, marginBottom: 8 }}>Sessions récentes</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                      {activity.sessions.slice(0, 8).map((s: any) => (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, background: C.bg }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.is_active ? C.green : C.text3, flexShrink: 0 }} />
                          <span style={{ fontSize: 11, color: C.text, flex: 1 }}>
                            {new Date(s.login_at).toLocaleDateString('fr-FR')} {new Date(s.login_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {s.duration_seconds && <span style={{ fontSize: 11, color: C.text3 }}>{formatDuration(s.duration_seconds)}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Journal d'audit */}
      <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 20, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text }}>📋 Journal d'audit (7 derniers jours)</h3>
          <button onClick={() => router.push('/admin/superadmin/audit')}
            style={{ fontSize: 12, color: C.violet, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            Voir tout →
          </button>
        </div>

        {auditLog.length === 0 ? (
          <p style={{ fontSize: 13, color: C.text3, textAlign: 'center', padding: '16px 0' }}>Aucune action enregistrée</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {auditLog.slice(0, 10).map(entry => {
              const cfg = ACTION_COLORS[entry.action] ?? { color: C.text2, bg: C.bg }
              return (
                <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, background: C.bg, border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 8, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
                    {entry.action}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text, flex: 1 }}>{entry.admin_username}</span>
                  {entry.resource_type && <span style={{ fontSize: 11, color: C.text3 }}>{entry.resource_type}</span>}
                  <span style={{ fontSize: 11, color: C.text3, whiteSpace: 'nowrap' }}>{timeAgo(entry.created_at)}</span>
                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: entry.status === 'success' ? C.greenLt : C.redLt, color: entry.status === 'success' ? C.green : C.red }}>
                    {entry.status}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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

interface Admin {
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

const ROLE_TEMPLATES: Record<string, string[]> = {
  content_manager: ['content:view','content:create','content:edit','blog:view','blog:create','blog:edit','blog:publish'],
  moderator:       ['users:view','users:block','content:view','reports:view'],
  translator:      ['translations:view','translations:trigger','content:view'],
  admin:           ['users:view','users:edit','users:block','content:view','content:create','content:edit','content:delete','content:publish','blog:view','blog:create','blog:edit','blog:publish','blog:delete','payments:view','translations:view','translations:trigger','settings:view','reports:view'],
}

const ALL_PERMISSIONS = [
  { group: 'Utilisateurs', perms: ['users:view','users:edit','users:block','users:delete'] },
  { group: 'Contenu',      perms: ['content:view','content:create','content:edit','content:delete','content:publish'] },
  { group: 'Blog',         perms: ['blog:view','blog:create','blog:edit','blog:publish','blog:delete'] },
  { group: 'Paiements',    perms: ['payments:view','payments:refund','payments:manage'] },
  { group: 'Traductions',  perms: ['translations:view','translations:trigger'] },
  { group: 'Paramètres',   perms: ['settings:view','settings:edit'] },
  { group: 'Rapports',     perms: ['reports:view'] },
]

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'à l\'instant'
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`
  return `il y a ${Math.floor(diff / 86400)}j`
}

export default function SuperAdminAdminsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null)
  const [editPerms, setEditPerms] = useState<string[]>([])
  const [editRole, setEditRole] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  const fetchAdmins = async () => {
    try {
      const res = await api.get('/api/v1/superadmin/admins')
      setAdmins(res.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchAdmins() }, [])

  const openEdit = (admin: Admin) => {
    setEditingAdmin(admin)
    setEditPerms([...(admin.permissions ?? [])])
    setEditRole(admin.role)
    setMsg(null)
  }

  const togglePerm = (perm: string) => {
    setEditPerms(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm])
  }

  const applyTemplate = (t: string) => {
    setEditPerms(ROLE_TEMPLATES[t] ?? [])
  }

  const saveAdmin = async () => {
    if (!editingAdmin) return
    setSaving(true)
    try {
      await api.patch(`/api/v1/superadmin/admins/${editingAdmin.id}`, {
        permissions: editPerms,
        role: editRole,
      })
      setMsg({ text: 'Modifications sauvegardées', ok: true })
      await fetchAdmins()
      setTimeout(() => setEditingAdmin(null), 1200)
    } catch (e: any) {
      setMsg({ text: e.response?.data?.detail || 'Erreur', ok: false })
    }
    setSaving(false)
  }

  const toggleActive = async (admin: Admin) => {
    try {
      await api.patch(`/api/v1/superadmin/admins/${admin.id}`, { is_active: !admin.is_active })
      setAdmins(prev => prev.map(a => a.id === admin.id ? { ...a, is_active: !a.is_active } : a))
    } catch {}
  }

  if (!user) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 4 }}>👥 Gestion des admins</h1>
          <p style={{ fontSize: 13, color: C.text2 }}>{admins.length} administrateur{admins.length !== 1 ? 's' : ''} enregistré{admins.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => router.push('/superadmin/create-admin')}
          style={{ padding: '10px 20px', borderRadius: 12, background: C.pink, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
          + Nouvel admin
        </button>
      </div>

      {/* Liste */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.text3 }}>Chargement…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {admins.map(admin => (
            <div key={admin.id} style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 18, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>

                {/* Avatar */}
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: admin.role === 'superadmin' ? C.pink : C.violet, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, flexShrink: 0 }}>
                  {admin.username.slice(0, 2).toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{admin.username}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: admin.role === 'superadmin' ? C.pinkLt : C.violetLt, color: admin.role === 'superadmin' ? C.pink : C.violet }}>
                      {admin.role}
                    </span>
                    {!admin.is_active && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: C.redLt, color: C.red }}>SUSPENDU</span>}
                  </div>
                  <p style={{ fontSize: 12, color: C.text3, marginBottom: 6 }}>{admin.email}</p>
                  <div style={{ display: 'flex', gap: 14, fontSize: 11, color: C.text3 }}>
                    <span>🔗 {admin.total_sessions} sessions</span>
                    <span>⚡ {admin.total_actions} actions</span>
                    {admin.last_login && <span>🕐 Dernière connexion {timeAgo(admin.last_login)}</span>}
                    <span>📅 Créé le {new Date(admin.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>

                {/* Actions */}
                {admin.role !== 'superadmin' && (
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => openEdit(admin)}
                      style={{ padding: '8px 14px', borderRadius: 10, border: `2px solid ${C.violet}`, background: C.violetLt, color: C.violet, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      ✏️ Modifier
                    </button>
                    <button onClick={() => router.push(`/superadmin/admins/${admin.id}`)}
                      style={{ padding: '8px 14px', borderRadius: 10, border: `2px solid ${C.border}`, background: 'transparent', color: C.text2, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      📊 Rapport
                    </button>
                    <button onClick={() => toggleActive(admin)}
                      style={{ padding: '8px 14px', borderRadius: 10, border: `2px solid ${admin.is_active ? C.red : C.green}`, background: 'transparent', color: admin.is_active ? C.red : C.green, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      {admin.is_active ? '🚫 Suspendre' : '✓ Réactiver'}
                    </button>
                  </div>
                )}
              </div>

              {/* Permissions */}
              {admin.permissions?.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                  {admin.permissions.map(p => (
                    <span key={p} style={{ fontSize: 10, background: C.violetLt, color: C.violet, padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>{p}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal modification */}
      {editingAdmin && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: C.white, borderRadius: 24, padding: '28px', width: '100%', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Modifier — {editingAdmin.username}</h3>
              <button onClick={() => setEditingAdmin(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: C.text3 }}>✕</button>
            </div>

            {msg && (
              <div style={{ background: msg.ok ? C.greenLt : C.redLt, border: `2px solid ${msg.ok ? C.green : C.red}30`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: msg.ok ? C.green : C.red }}>
                {msg.ok ? '✅' : '❌'} {msg.text}
              </div>
            )}

            {/* Rôle */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.text2, display: 'block', marginBottom: 8 }}>Rôle</label>
              <select value={editRole} onChange={e => setEditRole(e.target.value)}
                style={{ padding: '9px 14px', borderRadius: 10, border: `2px solid ${C.border}`, fontSize: 13, color: C.text, outline: 'none', cursor: 'pointer' }}>
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>

            {/* Templates */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.text2, display: 'block', marginBottom: 8 }}>Modèle de permissions</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Object.keys(ROLE_TEMPLATES).map(t => (
                  <button key={t} type="button" onClick={() => applyTemplate(t)}
                    style={{ padding: '6px 12px', borderRadius: 8, border: `2px solid ${C.border}`, background: C.white, color: C.text2, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                    {t.replace('_', ' ')}
                  </button>
                ))}
                <button type="button" onClick={() => setEditPerms([])}
                  style={{ padding: '6px 12px', borderRadius: 8, border: `2px solid ${C.border}`, background: C.white, color: C.text3, fontSize: 11, cursor: 'pointer' }}>
                  Effacer
                </button>
              </div>
            </div>

            {/* Permissions */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.text2, display: 'block', marginBottom: 10 }}>Permissions ({editPerms.length})</label>
              {ALL_PERMISSIONS.map(group => (
                <div key={group.group} style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: C.text3, marginBottom: 6 }}>{group.group}</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {group.perms.map(perm => {
                      const active = editPerms.includes(perm)
                      return (
                        <button key={perm} type="button" onClick={() => togglePerm(perm)}
                          style={{ padding: '4px 10px', borderRadius: 7, border: `2px solid ${active ? C.violet : C.border}`, background: active ? C.violet : C.white, color: active ? '#fff' : C.text3, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all .1s' }}>
                          {perm.split(':')[1]}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setEditingAdmin(null)}
                style={{ flex: 1, padding: '12px', borderRadius: 12, border: `2px solid ${C.border}`, background: 'transparent', color: C.text2, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                Annuler
              </button>
              <button onClick={saveAdmin} disabled={saving}
                style={{ flex: 2, padding: '12px', borderRadius: 12, background: saving ? C.border : C.pink, color: '#fff', border: 'none', cursor: saving ? 'default' : 'pointer', fontSize: 13, fontWeight: 700 }}>
                {saving ? 'Sauvegarde…' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
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
  bg:'#F8F7FF', white:'#fff',
  text:'#1A1A2E', text2:'#5A5A7A', text3:'#9A9AB0',
  border:'#E8E4F8',
}

interface AdminUser {
  id: string
  username: string
  email: string
  role: string
  is_active: boolean
  created_at: string
}

interface Stats {
  users: number
  lessons_completed: number
  xp_distributed: number
  active_modules: number
}

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'il y a quelques secondes'
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`
  return `il y a ${Math.floor(diff / 86400)}j`
}

export default function SuperAdminDashboard() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentStudents, setRecentStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/v1/admin/admins'),
      api.get('/api/v1/admin/stats'),
      api.get('/api/v1/admin/users?limit=5'),
    ]).then(([adminsRes, statsRes, usersRes]) => {
      setAdmins(adminsRes.data)
      setStats(statsRes.data)
      setRecentStudents(usersRes.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const toggleAdmin = async (adminId: string, isActive: boolean) => {
    try {
      await api.patch(`/api/v1/admin/users/${adminId}`, { is_active: !isActive })
      setAdmins(prev => prev.map(a => a.id === adminId ? { ...a, is_active: !isActive } : a))
    } catch {}
  }

  const demoteAdmin = async (adminId: string) => {
    if (!confirm('Rétrograder cet admin en student ?')) return
    try {
      await api.post(`/api/v1/admin/admins/demote/${adminId}`)
      setAdmins(prev => prev.filter(a => a.id !== adminId))
    } catch {}
  }

  if (!user) return null

  const STAT_CARDS = [
    { label: 'Students',          value: stats?.users ?? '—',                          icon: '👥', color: C.violet, bg: C.violetLt },
    { label: 'Admins',            value: admins.length,                                icon: '🛡️', color: C.pink,   bg: C.pinkLt   },
    { label: 'Leçons complétées', value: stats?.lessons_completed?.toLocaleString() ?? '—', icon: '✓', color: C.green,  bg: C.greenLt  },
    { label: 'XP distribués',     value: stats?.xp_distributed?.toLocaleString() ?? '—',   icon: '⚡', color: C.orange, bg: C.orangeLt },
  ]

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
        <button onClick={() => router.push('/superadmin/create-admin')}
          style={{ padding: '10px 20px', borderRadius: 12, background: C.pink, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
          + Nouvel admin
        </button>
      </div>

      {/* Stats globales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
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

        {/* Liste des admins */}
        <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 20, padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
              👥 Équipe admin ({admins.length})
            </h3>
            <button onClick={() => router.push('/superadmin/admins')}
              style={{ fontSize: 12, color: C.violet, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              Gérer →
            </button>
          </div>

          {loading ? (
            <p style={{ color: C.text3, fontSize: 13, textAlign: 'center', padding: 20 }}>Chargement…</p>
          ) : admins.length === 0 ? (
            <p style={{ color: C.text3, fontSize: 13, textAlign: 'center', padding: 20 }}>Aucun admin enregistré</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {admins.map(admin => (
                <div key={admin.id} style={{ border: `2px solid ${C.border}`, borderRadius: 14, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.violet, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                      {admin.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{admin.username}</span>
                        {!admin.is_active && (
                          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: C.redLt, color: C.red, fontWeight: 700 }}>SUSPENDU</span>
                        )}
                      </div>
                      <p style={{ fontSize: 11, color: C.text3 }}>{admin.email}</p>
                    </div>
                    <span style={{ fontSize: 11, color: C.text3 }}>
                      {new Date(admin.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => toggleAdmin(admin.id, admin.is_active)}
                      style={{ flex: 1, padding: '7px', borderRadius: 8, border: `1px solid ${admin.is_active ? C.red : C.green}`, background: 'transparent', color: admin.is_active ? C.red : C.green, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                      {admin.is_active ? '🚫 Suspendre' : '✓ Réactiver'}
                    </button>
                    <button onClick={() => demoteAdmin(admin.id)}
                      style={{ flex: 1, padding: '7px', borderRadius: 8, border: `1px solid ${C.orange}`, background: 'transparent', color: C.orange, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                      ↓ Rétrograder
                    </button>
                    <button onClick={() => router.push('/superadmin/admins')}
                      style={{ flex: 1, padding: '7px', borderRadius: 8, border: `1px solid ${C.violet}`, background: C.violetLt, color: C.violet, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                      ✏️ Modifier
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Students récents */}
        <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 20, padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text }}>👤 Students récents</h3>
            <button onClick={() => router.push('/admin/users')}
              style={{ fontSize: 12, color: C.violet, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              Voir tous →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {recentStudents.length === 0 ? (
              <p style={{ fontSize: 13, color: C.text3, textAlign: 'center', padding: '20px 0' }}>Aucun étudiant</p>
            ) : (
              recentStudents.map((u, i) => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < recentStudents.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.violetLt, color: C.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
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

      {/* Accès rapides */}
      <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 20, padding: '20px 24px' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 16 }}>⚡ Accès rapides</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {[
            { label: 'Gérer les admins',  href: '/superadmin/admins',      icon: '👥', color: C.pink   },
            { label: 'Créer un admin',    href: '/superadmin/create-admin', icon: '➕', color: C.violet },
            { label: 'Utilisateurs',      href: '/admin/users',             icon: '👤', color: C.blue   },
            { label: 'Paramètres',        href: '/superadmin/settings',     icon: '⚙️', color: C.orange },
          ].map((item, i) => (
            <button key={i} onClick={() => router.push(item.href)}
              style={{ padding: '14px', borderRadius: 14, border: `2px solid ${C.border}`, background: C.bg, cursor: 'pointer', textAlign: 'center', transition: 'all .15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = item.color; (e.currentTarget as HTMLElement).style.background = C.white }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.background = C.bg }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{item.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text2 }}>{item.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
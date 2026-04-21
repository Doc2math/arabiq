'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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

interface UserRow {
  id: string
  username: string
  email: string
  xp: number
  level: number
  is_premium: boolean
  is_active: boolean
  is_admin: boolean
  created_at: string
}

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: bg, color, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

export default function AdminUsersPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'premium' | 'blocked'>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [stats, setStats] = useState({ total: 0, premium: 0, blocked: 0, admins: 0 })

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/v1/admin/users?limit=100')
      const data: UserRow[] = res.data
      setUsers(data)
      setStats({
        total: data.length,
        premium: data.filter(u => u.is_premium).length,
        blocked: data.filter(u => !u.is_active).length,
        admins: data.filter(u => u.is_admin).length,
      })
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const toggleBlock = async (userId: string, isActive: boolean) => {
    setActionLoading(userId)
    try {
      await api.patch(`/api/v1/admin/users/${userId}`, { is_active: !isActive })
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !isActive } : u))
      setStats(prev => ({ ...prev, blocked: isActive ? prev.blocked + 1 : prev.blocked - 1 }))
    } catch {}
    setActionLoading(null)
  }

  const togglePremium = async (userId: string, isPremium: boolean) => {
    setActionLoading(userId)
    try {
      await api.patch(`/api/v1/admin/users/${userId}`, { is_premium: !isPremium })
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_premium: !isPremium } : u))
    } catch {}
    setActionLoading(null)
  }

  const filtered = users.filter(u => {
    const matchSearch = u.username.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' ? true :
                        filter === 'premium' ? u.is_premium :
                        !u.is_active
    return matchSearch && matchFilter
  })

  if (!user) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[
          { label: 'Total', value: stats.total, color: C.violet, bg: C.violetLt, icon: '👥' },
          { label: 'Premium', value: stats.premium, color: C.orange, bg: C.orangeLt, icon: '⭐' },
          { label: 'Bloqués', value: stats.blocked, color: C.red, bg: C.redLt, icon: '🚫' },
          { label: 'Admins', value: stats.admins, color: C.blue, bg: C.blueLt, icon: '🛡️' },
        ].map((s, i) => (
          <div key={i} style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 16, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: C.text3 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres et recherche */}
      <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 16, padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Rechercher par nom ou email…"
          style={{ flex: 1, minWidth: 200, padding: '9px 14px', borderRadius: 10, border: `2px solid ${C.border}`, fontSize: 13, outline: 'none', color: C.text }}
          onFocus={e => e.target.style.borderColor = C.violet}
          onBlur={e => e.target.style.borderColor = C.border}
        />
        {(['all','premium','blocked'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '8px 16px', borderRadius: 10, border: `2px solid ${filter === f ? C.violet : C.border}`, background: filter === f ? C.violetLt : C.white, color: filter === f ? C.violet : C.text2, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {f === 'all' ? 'Tous' : f === 'premium' ? 'Premium' : 'Bloqués'}
          </button>
        ))}
        <button onClick={fetchUsers}
          style={{ padding: '8px 14px', borderRadius: 10, border: `2px solid ${C.border}`, background: C.white, color: C.text2, fontSize: 12, cursor: 'pointer' }}>
          🔄 Actualiser
        </button>
      </div>

      {/* Tableau */}
      <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 20, overflow: 'hidden' }}>
        {/* Header tableau */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr 140px', gap: 0, padding: '12px 20px', background: C.bg, borderBottom: `2px solid ${C.border}` }}>
          {['Utilisateur', 'Email', 'XP', 'Niveau', 'Statut', 'Inscrit', 'Actions'].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: C.text3 }}>Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: C.text3 }}>Aucun utilisateur trouvé</div>
        ) : (
          filtered.map((u, i) => (
            <div key={u.id}
              style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr 140px', gap: 0, padding: '13px 20px', borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none', background: !u.is_active ? '#FAFAFA' : C.white, opacity: !u.is_active ? 0.7 : 1, alignItems: 'center' }}>

              {/* Utilisateur */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: u.is_admin ? C.violetLt : C.bg, color: u.is_admin ? C.violet : C.text3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  {u.username.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{u.username}</div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                    {u.is_premium && <Badge label="PREMIUM" color={C.orange} bg={C.orangeLt} />}
                    {u.is_admin && <Badge label="ADMIN" color={C.violet} bg={C.violetLt} />}
                  </div>
                </div>
              </div>

              {/* Email */}
              <span style={{ fontSize: 12, color: C.text2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</span>

              {/* XP */}
              <span style={{ fontSize: 13, fontWeight: 700, color: C.orange }}>{u.xp}</span>

              {/* Niveau */}
              <span style={{ fontSize: 13, color: C.text2 }}>Niv. {u.level}</span>

              {/* Statut */}
              <Badge
                label={u.is_active ? 'Actif' : 'Bloqué'}
                color={u.is_active ? C.green : C.red}
                bg={u.is_active ? C.greenLt : C.redLt}
              />

              {/* Inscription */}
              <span style={{ fontSize: 11, color: C.text3 }}>
                {new Date(u.created_at).toLocaleDateString('fr-FR')}
              </span>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6 }}>
                {!u.is_admin && (
                  <>
                    <button
                      onClick={() => togglePremium(u.id, u.is_premium)}
                      disabled={actionLoading === u.id}
                      title={u.is_premium ? 'Retirer premium' : 'Activer premium'}
                      style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.orange}`, background: u.is_premium ? C.orange : 'transparent', color: u.is_premium ? '#fff' : C.orange, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      ⭐
                    </button>
                    <button
                      onClick={() => toggleBlock(u.id, u.is_active)}
                      disabled={actionLoading === u.id}
                      title={u.is_active ? 'Bloquer' : 'Débloquer'}
                      style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${u.is_active ? C.red : C.green}`, background: 'transparent', color: u.is_active ? C.red : C.green, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {u.is_active ? '🚫' : '✓'}
                    </button>
                  </>
                )}
                <button
                  onClick={() => router.push(`/admin/users/${u.id}`)}
                  title="Voir le profil"
                  style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.border}`, background: 'transparent', color: C.text2, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  👁
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <p style={{ fontSize: 12, color: C.text3, textAlign: 'center' }}>
        {filtered.length} utilisateur{filtered.length !== 1 ? 's' : ''} affiché{filtered.length !== 1 ? 's' : ''}
        {search && ` pour "${search}"`}
      </p>
    </div>
  )
}
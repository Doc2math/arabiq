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

const USER_TYPES = [
  { key: 'independent', label: '🎓 Élèves indépendants', desc: 'Sans institution'          },
  { key: 'institution', label: '🏫 Élèves institution',  desc: 'Gérés par une institution'  },
  { key: 'teachers',    label: '👨‍🏫 Profs & Institutions', desc: 'institution_admin, teacher' },
]

interface UserRow {
  id: string
  username: string
  email: string
  role: string
  xp: number
  level: number
  is_premium: boolean
  is_active: boolean
  is_verified: boolean
  created_at: string
  last_activity: string | null
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
  const router   = useRouter()

  const [userType, setUserType] = useState<'independent' | 'institution' | 'teachers'>('independent')
  const [users, setUsers]       = useState<UserRow[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState<'all' | 'premium' | 'blocked'>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [counts, setCounts]     = useState({ independent: 0, institution: 0, teachers: 0 })

  const fetchUsers = async (type = userType) => {
    setLoading(true)
    try {
      const res = await api.get(`/api/v1/admin/users?limit=200&user_type=${type}`)
      setUsers(res.data)
    } catch {}
    setLoading(false)
  }

  const fetchCounts = async () => {
    try {
      const [c1, c2, c3] = await Promise.all([
        api.get('/api/v1/admin/users?limit=1000&user_type=independent'),
        api.get('/api/v1/admin/users?limit=1000&user_type=institution'),
        api.get('/api/v1/admin/users?limit=1000&user_type=teachers'),
      ])
      setCounts({ independent: c1.data.length, institution: c2.data.length, teachers: c3.data.length })
    } catch {}
  }

  useEffect(() => { fetchCounts(); fetchUsers('independent') }, [])

  const switchTab = (type: 'independent' | 'institution' | 'teachers') => {
    setUserType(type); setSearch(''); setFilter('all'); fetchUsers(type)
  }

  const toggleBlock = async (userId: string, isActive: boolean) => {
    setActionLoading(userId)
    try {
      await api.patch(`/api/v1/admin/users/${userId}`, { is_active: !isActive })
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !isActive } : u))
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
    const matchFilter = filter === 'all' ? true : filter === 'premium' ? u.is_premium : !u.is_active
    return matchSearch && matchFilter
  })

  const stats = {
    total:   users.length,
    premium: users.filter(u => u.is_premium).length,
    blocked: users.filter(u => !u.is_active).length,
  }

  if (!user) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Onglets type utilisateur ── */}
      <div style={{ display: 'flex', background: C.white, border: `2px solid ${C.border}`, borderRadius: 18, overflow: 'hidden' }}>
        {USER_TYPES.map((t, i) => (
          <button key={t.key} onClick={() => switchTab(t.key as any)}
            style={{
              flex: 1, padding: '16px 12px', border: 'none', cursor: 'pointer',
              borderRight: i < USER_TYPES.length - 1 ? `1px solid ${C.border}` : 'none',
              background: userType === t.key ? C.violetLt : C.white,
              transition: 'all .15s',
            }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: userType === t.key ? C.violet : C.text, marginBottom: 3 }}>
              {t.label}
            </div>
            <div style={{ fontSize: 11, color: C.text3, marginBottom: 6 }}>{t.desc}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: userType === t.key ? C.violet : C.text2 }}>
              {counts[t.key as keyof typeof counts]}
            </div>
          </button>
        ))}
      </div>

      {/* ── Stats onglet courant ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        {[
          { label: 'Total',   value: stats.total,   color: C.violet, bg: C.violetLt, icon: '👥' },
          { label: 'Premium', value: stats.premium,  color: C.orange, bg: C.orangeLt, icon: '⭐' },
          { label: 'Bloqués', value: stats.blocked,  color: C.red,    bg: C.redLt,    icon: '🚫' },
        ].map((s, i) => (
          <div key={i} style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: C.text3 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filtres ── */}
      <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 16, padding: '14px 18px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Rechercher par nom ou email…"
          style={{ flex: 1, minWidth: 200, padding: '9px 14px', borderRadius: 10, border: `2px solid ${C.border}`, fontSize: 13, outline: 'none', color: C.text }}
          onFocus={e => (e.target as HTMLInputElement).style.borderColor = C.violet}
          onBlur={e => (e.target as HTMLInputElement).style.borderColor = C.border} />
        {(['all','premium','blocked'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '8px 14px', borderRadius: 10, border: `2px solid ${filter === f ? C.violet : C.border}`, background: filter === f ? C.violetLt : C.white, color: filter === f ? C.violet : C.text2, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {f === 'all' ? 'Tous' : f === 'premium' ? '⭐ Premium' : '🚫 Bloqués'}
          </button>
        ))}
        <button onClick={() => fetchUsers()}
          style={{ padding: '8px 14px', borderRadius: 10, border: `2px solid ${C.border}`, background: C.white, color: C.text2, fontSize: 12, cursor: 'pointer' }}>
          🔄
        </button>
      </div>

      {/* ── Tableau ── */}
      <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr 120px', padding: '12px 20px', background: C.bg, borderBottom: `2px solid ${C.border}` }}>
          {['Utilisateur', 'Email', 'XP', 'Niveau', 'Statut', 'Inscrit', 'Actions'].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: C.text3 }}>Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: C.text3 }}>
            Aucun utilisateur dans cette catégorie
          </div>
        ) : (
          filtered.map((u, i) => (
            <div key={u.id}
              style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr 120px', padding: '12px 20px', borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none', background: !u.is_active ? '#FAFAFA' : C.white, opacity: !u.is_active ? 0.7 : 1, alignItems: 'center' }}>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: u.role === 'institution_admin' ? C.greenLt : u.role === 'teacher' ? C.orangeLt : C.bg, color: u.role === 'institution_admin' ? C.green : u.role === 'teacher' ? C.orange : C.text3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  {u.username.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{u.username}</div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 2, flexWrap: 'wrap' }}>
                    {u.is_premium && <Badge label="PREMIUM" color={C.orange} bg={C.orangeLt} />}
                    {u.role === 'institution_admin' && <Badge label="INSTITUTION" color={C.green} bg={C.greenLt} />}
                    {u.role === 'teacher' && <Badge label="PROF" color={C.orange} bg={C.orangeLt} />}
                    {u.role === 'admin' && <Badge label="ADMIN" color={C.violet} bg={C.violetLt} />}
                  </div>
                </div>
              </div>

              <span style={{ fontSize: 12, color: C.text2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.orange }}>{u.xp}</span>
              <span style={{ fontSize: 13, color: C.text2 }}>Niv. {u.level}</span>
              <Badge label={u.is_active ? 'Actif' : 'Bloqué'} color={u.is_active ? C.green : C.red} bg={u.is_active ? C.greenLt : C.redLt} />
              <span style={{ fontSize: 11, color: C.text3 }}>{new Date(u.created_at).toLocaleDateString('fr-FR')}</span>

              <div style={{ display: 'flex', gap: 6 }}>
                {u.role === 'student' && (
                  <>
                    <button onClick={() => togglePremium(u.id, u.is_premium)} disabled={actionLoading === u.id}
                      title={u.is_premium ? 'Retirer premium' : 'Activer premium'}
                      style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.orange}`, background: u.is_premium ? C.orange : 'transparent', color: u.is_premium ? '#fff' : C.orange, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      ⭐
                    </button>
                    <button onClick={() => toggleBlock(u.id, u.is_active)} disabled={actionLoading === u.id}
                      title={u.is_active ? 'Bloquer' : 'Débloquer'}
                      style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${u.is_active ? C.red : C.green}`, background: 'transparent', color: u.is_active ? C.red : C.green, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {u.is_active ? '🚫' : '✓'}
                    </button>
                  </>
                )}
                {userType === 'teachers' && (
                  <button onClick={() => router.push('/admin/institutions')}
                    title="Voir institution"
                    style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.green}`, background: 'transparent', color: C.green, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    🏫
                  </button>
                )}
                <button onClick={() => router.push(`/admin/users/${u.id}`)}
                  title="Voir le profil"
                  style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.border}`, background: 'transparent', color: C.text2, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  👁
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <p style={{ fontSize: 12, color: C.text3, textAlign: 'center' }}>
        {filtered.length} utilisateur{filtered.length !== 1 ? 's' : ''} affiché{filtered.length !== 1 ? 's' : ''}
        {search && ` pour "${search}"`}
      </p>
    </div>
  )
}
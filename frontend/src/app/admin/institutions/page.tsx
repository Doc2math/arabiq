'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

const C = {
  violet:  '#6C3FC5', violetLt: '#EDE8FB', violetDk: '#4A2A8A',
  orange:  '#F07C1E', orangeLt: '#FEF0E3', orangeDk: '#B85A0E',
  green:   '#2BA84A', greenLt:  '#E3F7E8', greenDk:  '#1A6630',
  blue:    '#1976D2', blueLt:   '#E6F1FB',
  red:     '#E24B4A', redLt:    '#FCEBEB',
  bg:      '#F8F7FF', white:    '#FFFFFF',
  text:    '#1A1A2E', text2:    '#5A5A7A', text3: '#9A9AB0',
  border:  '#E8E4F8',
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label: 'Actif',     color: C.green,  bg: C.greenLt  },
  trial:     { label: 'Essai',     color: C.orange, bg: C.orangeLt },
  suspended: { label: 'Suspendu',  color: C.red,    bg: C.redLt    },
  cancelled: { label: 'Annulé',    color: C.text3,  bg: C.bg       },
}

const PLAN_CONFIG: Record<string, { color: string; bg: string }> = {
  starter: { color: C.blue,   bg: C.blueLt   },
  medium:  { color: C.violet, bg: C.violetLt },
  school:  { color: C.orange, bg: C.orangeLt },
  premium: { color: C.green,  bg: C.greenLt  },
}

const PLANS = ['starter', 'medium', 'school', 'premium']
const STATUSES = ['active', 'trial', 'suspended', 'cancelled']

interface Institution {
  id: string
  name: string
  slug: string
  institution_type: string
  plan: string
  max_students: number
  student_count: number
  subscription_status: string
  trial_ends_at: string | null
  is_active: boolean
  owner_username: string
  owner_email: string
  country: string | null
  city: string | null
  created_at: string
  notes: string | null
}

interface Stats {
  total: number
  active: number
  trial: number
  suspended: number
  total_members: number
  by_plan: Record<string, number>
}

interface DetailModal {
  inst: Institution
  members: any[]
  owner: any
}

// ── Modal détail ──────────────────────────────────────────────
function DetailModal({ data, onClose, onRefresh }: { data: DetailModal; onClose: () => void; onRefresh: () => void }) {
  const { inst, members, owner } = data
  const [plan, setPlan] = useState(inst.plan)
  const [statusVal, setStatusVal] = useState(inst.subscription_status)
  const [notes, setNotes] = useState(inst.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const save = async () => {
    setSaving(true); setMsg('')
    try {
      await api.patch(`/api/v1/admin/institutions/${inst.id}`, {
        plan, subscription_status: statusVal, notes
      })
      setMsg('✅ Sauvegardé')
      onRefresh()
    } catch { setMsg('❌ Erreur') }
    finally { setSaving(false) }
  }

  const action = async (type: 'suspend' | 'activate') => {
    await api.post(`/api/v1/admin/institutions/${inst.id}/${type}`)
    onRefresh(); onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: C.white, borderRadius: 20, padding: 28, width: 640, maxWidth: '95vw', maxHeight: '85vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4 }}>{inst.name}</h2>
            <div style={{ fontSize: 12, color: C.text3 }}>{inst.slug} · {inst.institution_type}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: C.text3 }}>✕</button>
        </div>

        {/* Owner */}
        <div style={{ background: C.bg, borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text3, marginBottom: 6 }}>PROPRIÉTAIRE</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{owner?.username}</div>
          <div style={{ fontSize: 12, color: C.text2 }}>{owner?.email}</div>
        </div>

        {/* Modifier plan + statut */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.text3, display: 'block', marginBottom: 6 }}>PLAN</label>
            <select value={plan} onChange={e => setPlan(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, color: C.text, background: C.white, cursor: 'pointer' }}>
              {PLANS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.text3, display: 'block', marginBottom: 6 }}>STATUT</label>
            <select value={statusVal} onChange={e => setStatusVal(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, color: C.text, background: C.white, cursor: 'pointer' }}>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</option>)}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: C.text3, display: 'block', marginBottom: 6 }}>NOTES INTERNES</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="Notes visibles uniquement par les superadmins..."
            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.text, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {msg && <p style={{ fontSize: 13, color: msg.startsWith('✅') ? C.green : C.red, marginBottom: 12 }}>{msg}</p>}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button onClick={save} disabled={saving}
            style={{ flex: 1, padding: '10px', borderRadius: 10, background: saving ? C.border : C.violet, color: '#fff', border: 'none', cursor: saving ? 'default' : 'pointer', fontSize: 13, fontWeight: 700 }}>
            {saving ? 'Sauvegarde...' : '💾 Sauvegarder'}
          </button>
          {inst.subscription_status !== 'suspended' ? (
            <button onClick={() => action('suspend')}
              style={{ padding: '10px 16px', borderRadius: 10, background: C.redLt, color: C.red, border: `1.5px solid ${C.red}40`, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
              🔒 Suspendre
            </button>
          ) : (
            <button onClick={() => action('activate')}
              style={{ padding: '10px 16px', borderRadius: 10, background: C.greenLt, color: C.greenDk, border: `1.5px solid ${C.green}40`, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
              ✅ Réactiver
            </button>
          )}
        </div>

        {/* Membres */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text2, marginBottom: 10 }}>
            Élèves ({members.length})
          </div>
          {members.length === 0 ? (
            <p style={{ fontSize: 13, color: C.text3 }}>Aucun élève</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflow: 'auto' }}>
              {members.map((m: any) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: C.bg, borderRadius: 8 }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{m.username}</span>
                    <span style={{ fontSize: 11, color: C.text3, marginLeft: 8 }}>{m.email}</span>
                  </div>
                  {m.group_name && <span style={{ fontSize: 11, color: C.violet, background: C.violetLt, padding: '2px 8px', borderRadius: 6 }}>{m.group_name}</span>}
                  <span style={{ fontSize: 11, color: m.is_active ? C.green : C.red }}>{m.is_active ? 'Actif' : 'Inactif'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────
export default function AdminInstitutionsPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [detail, setDetail] = useState<DetailModal | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [statsRes, instRes] = await Promise.all([
        api.get('/api/v1/admin/institutions-stats'),
        api.get('/api/v1/admin/institutions', { params: { limit: 200 } }),
      ])
      setStats(statsRes.data)
      setInstitutions(instRes.data)
    } catch { router.push('/admin') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openDetail = async (inst: Institution) => {
    const res = await api.get(`/api/v1/admin/institutions/${inst.id}`)
    setDetail({ inst, members: res.data.members, owner: res.data.owner })
  }

  // Filtres
  const filtered = institutions.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) ||
                        i.owner_username?.toLowerCase().includes(search.toLowerCase()) ||
                        i.owner_email?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || i.subscription_status === statusFilter
    const matchPlan   = !planFilter   || i.plan === planFilter
    return matchSearch && matchStatus && matchPlan
  })

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: C.text3 }}>Chargement...</div>

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px 48px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 4 }}>🏫 Institutions</h1>
          <p style={{ fontSize: 13, color: C.text3 }}>Gestion des écoles et professeurs abonnés</p>
        </div>
        <button onClick={() => router.push('/admin')}
          style={{ padding: '9px 18px', borderRadius: 12, border: `2px solid ${C.border}`, background: C.white, cursor: 'pointer', fontSize: 13, color: C.text2 }}>
          ← Admin
        </button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Total',        value: stats.total,         color: C.violet, bg: C.violetLt },
            { label: 'Actifs',       value: stats.active,        color: C.green,  bg: C.greenLt  },
            { label: 'En essai',     value: stats.trial,         color: C.orange, bg: C.orangeLt },
            { label: 'Suspendus',    value: stats.suspended,     color: C.red,    bg: C.redLt    },
            { label: 'Total élèves', value: stats.total_members, color: C.blue,   bg: C.blueLt   },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 16, padding: '16px 18px', border: `2px solid ${s.color}20` }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: 6 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Par plan */}
      {stats && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          {PLANS.map(p => {
            const cfg = PLAN_CONFIG[p]
            return (
              <div key={p} style={{ background: cfg.bg, borderRadius: 12, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, border: `1.5px solid ${cfg.color}30` }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color, textTransform: 'capitalize' }}>{p}</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: cfg.color }}>{stats.by_plan[p] ?? 0}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input type="text" placeholder="Rechercher nom, owner..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${C.border}`, fontSize: 14, outline: 'none' }} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${C.border}`, fontSize: 14, color: C.text, background: C.white, cursor: 'pointer' }}>
          <option value="">Tous les statuts</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</option>)}
        </select>
        <select value={planFilter} onChange={e => setPlanFilter(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${C.border}`, fontSize: 14, color: C.text, background: C.white, cursor: 'pointer' }}>
          <option value="">Tous les plans</option>
          {PLANS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
      </div>

      {/* Tableau */}
      <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 18, overflow: 'hidden' }}>
        {/* Header tableau */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr 80px', gap: 12, padding: '12px 18px', background: C.bg, borderBottom: `1px solid ${C.border}` }}>
          {['Institution', 'Propriétaire', 'Plan', 'Élèves', 'Statut', 'Créé le', ''].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: C.text3 }}>Aucune institution trouvée</div>
        ) : (
          filtered.map((inst, i) => {
            const status = STATUS_CONFIG[inst.subscription_status] ?? STATUS_CONFIG.cancelled
            const plan   = PLAN_CONFIG[inst.plan] ?? PLAN_CONFIG.starter
            const occupancy = Math.round((inst.student_count / inst.max_students) * 100)
            return (
              <div key={inst.id}
                style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr 80px', gap: 12, padding: '14px 18px', alignItems: 'center', borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none', opacity: inst.is_active ? 1 : 0.6 }}>

                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2 }}>{inst.name}</div>
                  <div style={{ fontSize: 11, color: C.text3 }}>{inst.city ?? ''} {inst.country ?? ''}</div>
                </div>

                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text2 }}>{inst.owner_username}</div>
                  <div style={{ fontSize: 11, color: C.text3, overflow: 'hidden', textOverflow: 'ellipsis' }}>{inst.owner_email}</div>
                </div>

                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 8, background: plan.bg, color: plan.color, textTransform: 'capitalize' }}>
                    {inst.plan}
                  </span>
                </div>

                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: occupancy > 80 ? C.red : C.text }}>
                    {inst.student_count}/{inst.max_students}
                  </div>
                  <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
                    <div style={{ height: '100%', width: `${occupancy}%`, background: occupancy > 80 ? C.red : C.violet, borderRadius: 2 }} />
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8, background: status.bg, color: status.color }}>
                    {status.label}
                  </span>
                </div>

                <div style={{ fontSize: 12, color: C.text3 }}>
                  {new Date(inst.created_at).toLocaleDateString('fr-FR')}
                </div>

                <button onClick={() => openDetail(inst)}
                  style={{ padding: '6px 12px', borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.white, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: C.violet }}>
                  Détail
                </button>
              </div>
            )
          })
        )}
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: C.text3, textAlign: 'right' }}>
        {filtered.length} institution{filtered.length > 1 ? 's' : ''}
      </div>

      {/* Modal détail */}
      {detail && (
        <DetailModal
          data={detail}
          onClose={() => setDetail(null)}
          onRefresh={() => { load(); setDetail(null) }}
        />
      )}
    </div>
  )
}
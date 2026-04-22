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

interface AuditEntry {
  id: string
  admin_id: string
  admin_username: string
  action: string
  resource_type: string | null
  resource_id: string | null
  details: any
  status: string
  ip_address: string | null
  created_at: string
}

interface Admin {
  id: string
  username: string
}

const ACTION_COLORS: Record<string, { color: string; bg: string }> = {
  'admin.create':        { color: C.green,  bg: C.greenLt  },
  'admin.update':        { color: C.blue,   bg: C.blueLt   },
  'user.block':          { color: C.red,    bg: C.redLt    },
  'user.update':         { color: C.orange, bg: C.orangeLt },
  'translation.trigger': { color: C.violet, bg: C.violetLt },
  'content.create':      { color: C.green,  bg: C.greenLt  },
  'content.edit':        { color: C.orange, bg: C.orangeLt },
  'content.delete':      { color: C.red,    bg: C.redLt    },
}

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'à l\'instant'
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}j`
}

export default function SuperAdminAuditPage() {
  const { user } = useAuthStore()
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<AuditEntry | null>(null)

  // Filtres
  const [filterAdmin, setFilterAdmin] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [filterDays, setFilterDays] = useState(7)
  const [filterStatus, setFilterStatus] = useState('')

  const fetchLog = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ days: String(filterDays), limit: '100' })
      if (filterAdmin) params.append('admin_id', filterAdmin)
      if (filterAction) params.append('action', filterAction)
      const res = await api.get(`/api/v1/superadmin/audit-log?${params}`)
      setEntries(res.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    api.get('/api/v1/superadmin/admins').then(r => setAdmins(r.data)).catch(() => {})
    fetchLog()
  }, [filterDays, filterAdmin])

  const filtered = entries.filter(e => {
    if (filterAction && !e.action.includes(filterAction)) return false
    if (filterStatus && e.status !== filterStatus) return false
    return true
  })

  if (!user) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 4 }}>📋 Journal d'audit</h1>
        <p style={{ fontSize: 13, color: C.text2 }}>Toutes les actions effectuées par les administrateurs</p>
      </div>

      {/* Filtres */}
      <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 16, padding: '16px 20px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>

        {/* Période */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[1, 7, 30, 90].map(d => (
            <button key={d} onClick={() => setFilterDays(d)}
              style={{ padding: '6px 12px', borderRadius: 8, border: `2px solid ${filterDays === d ? C.pink : C.border}`, background: filterDays === d ? C.pinkLt : C.white, color: filterDays === d ? C.pink : C.text2, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              {d === 1 ? 'Aujourd\'hui' : d === 7 ? '7j' : d === 30 ? '30j' : '90j'}
            </button>
          ))}
        </div>

        {/* Admin */}
        <select value={filterAdmin} onChange={e => setFilterAdmin(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 8, border: `2px solid ${C.border}`, fontSize: 12, color: C.text, outline: 'none', cursor: 'pointer' }}>
          <option value="">Tous les admins</option>
          {admins.map(a => <option key={a.id} value={a.id}>{a.username}</option>)}
        </select>

        {/* Action */}
        <input type="text" value={filterAction} onChange={e => setFilterAction(e.target.value)}
          placeholder="Filtrer par action…"
          style={{ padding: '7px 12px', borderRadius: 8, border: `2px solid ${C.border}`, fontSize: 12, color: C.text, outline: 'none', width: 160 }}
          onFocus={e => e.target.style.borderColor = C.pink}
          onBlur={e => e.target.style.borderColor = C.border} />

        {/* Statut */}
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 8, border: `2px solid ${C.border}`, fontSize: 12, color: C.text, outline: 'none', cursor: 'pointer' }}>
          <option value="">Tous les statuts</option>
          <option value="success">Succès</option>
          <option value="error">Erreur</option>
          <option value="forbidden">Refusé</option>
        </select>

        <button onClick={fetchLog}
          style={{ padding: '7px 14px', borderRadius: 8, border: `2px solid ${C.border}`, background: C.white, color: C.text2, fontSize: 12, cursor: 'pointer' }}>
          🔄 Actualiser
        </button>

        <span style={{ marginLeft: 'auto', fontSize: 12, color: C.text3 }}>{filtered.length} entrée{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Journal */}
      <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 20, overflow: 'hidden' }}>

        {/* Header tableau */}
        <div style={{ display: 'grid', gridTemplateColumns: '140px 120px 120px 100px 80px 80px 50px', padding: '11px 20px', background: C.bg, borderBottom: `2px solid ${C.border}` }}>
          {['Action','Admin','Ressource','IP','Statut','Date',''].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: 700, color: C.text3, textTransform: 'uppercase' }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: C.text3 }}>Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: C.text3 }}>Aucune entrée trouvée</div>
        ) : filtered.map((entry, i) => {
          const cfg = ACTION_COLORS[entry.action] ?? { color: C.text2, bg: C.bg }
          return (
            <div key={entry.id}
              style={{ display: 'grid', gridTemplateColumns: '140px 120px 120px 100px 80px 80px 50px', padding: '11px 20px', borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none', alignItems: 'center', cursor: 'pointer', transition: 'background .1s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.bg}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.white}
              onClick={() => setSelected(entry)}>

              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 8, background: cfg.bg, color: cfg.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: 'fit-content' }}>
                {entry.action}
              </span>

              <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{entry.admin_username}</span>

              <span style={{ fontSize: 11, color: C.text3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {entry.resource_type ?? '—'}{entry.resource_id ? ` #${entry.resource_id.slice(0, 6)}` : ''}
              </span>

              <span style={{ fontSize: 11, color: C.text3 }}>{entry.ip_address ?? '—'}</span>

              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: entry.status === 'success' ? C.greenLt : C.redLt, color: entry.status === 'success' ? C.green : C.red, width: 'fit-content' }}>
                {entry.status}
              </span>

              <span style={{ fontSize: 11, color: C.text3 }}>{timeAgo(entry.created_at)}</span>

              <span style={{ fontSize: 14, color: C.text3 }}>→</span>
            </div>
          )
        })}
      </div>

      {/* Modal détail */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setSelected(null)}>
          <div style={{ background: C.white, borderRadius: 20, padding: '28px', width: '100%', maxWidth: 500 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Détail de l'action</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: C.text3 }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Action',     value: selected.action },
                { label: 'Admin',      value: selected.admin_username },
                { label: 'Ressource',  value: selected.resource_type ? `${selected.resource_type} #${selected.resource_id}` : '—' },
                { label: 'Statut',     value: selected.status },
                { label: 'IP',         value: selected.ip_address ?? '—' },
                { label: 'Date',       value: new Date(selected.created_at).toLocaleString('fr-FR') },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.text3, width: 100, flexShrink: 0 }}>{row.label}</span>
                  <span style={{ fontSize: 13, color: C.text }}>{row.value}</span>
                </div>
              ))}
              {Object.keys(selected.details || {}).length > 0 && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: C.text3, marginBottom: 8 }}>Détails</p>
                  <pre style={{ background: C.bg, borderRadius: 10, padding: '12px', fontSize: 11, color: C.text, overflowX: 'auto' }}>
                    {JSON.stringify(selected.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'

const C = {
  violet:   '#6C3FC5', violetLt: '#EDE8FB', violetDk: '#4A2A8A',
  orange:   '#F07C1E', orangeLt: '#FEF0E3', orangeDk: '#B85A0E',
  green:    '#2BA84A', greenLt:  '#E3F7E8', greenDk: '#1A6630',
  blue:     '#1976D2', blueLt:   '#E6F1FB',
  red:      '#E24B4A', redLt:    '#FCEBEB',
  bg:       '#F8F7FF', white:    '#FFFFFF',
  text:     '#1A1A2E', text2:    '#5A5A7A', text3: '#9A9AB0',
  border:   '#E8E4F8',
}

const PLAN_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  starter: { color: C.blue,   bg: C.blueLt,   label: 'Starter — 100 élèves'  },
  medium:  { color: C.violet, bg: C.violetLt,  label: 'Medium — 200 élèves'   },
  school:  { color: C.orange, bg: C.orangeLt,  label: 'School — 500 élèves'   },
  premium: { color: C.green,  bg: C.greenLt,   label: 'Premium — 1000 élèves' },
}

// ── Types ─────────────────────────────────────────────────────
interface InstitutionStats {
  institution_name: string
  plan: string
  max_students: number
  total_students: number
  active_students: number
  avg_xp: number
  avg_score: number
  subscription_status: string
  trial_ends_at: string | null
}

interface Student {
  id: string
  username: string
  email: string
  xp: number
  level: number
  streak: number
  is_active: boolean
  group_name: string | null
  joined_at: string
  role: string
}

interface StudentProgress {
  user: { id: string; username: string; xp: number; level: number; streak: number }
  lessons_completed: number
  avg_score: number
  total_xp: number
  progressions: any[]
}

// ── Modal Ajouter élève ───────────────────────────────────────
function AddStudentModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ email: '', username: '', password: '', group_name: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!form.email || !form.username || !form.password) { setError('Tous les champs sont requis'); return }
    setLoading(true); setError('')
    try {
      await api.post('/api/v1/institution/students/invite', form)
      onSuccess()
      onClose()
    } catch (e: any) {
      setError(e.response?.data?.detail ?? 'Erreur')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: C.white, borderRadius: 20, padding: 32, width: 480, maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 24 }}>➕ Ajouter un élève</h2>

        {[
          { label: 'Email', key: 'email', type: 'email', placeholder: 'eleve@exemple.com' },
          { label: 'Nom d\'utilisateur', key: 'username', type: 'text', placeholder: 'eleve123' },
          { label: 'Mot de passe', key: 'password', type: 'password', placeholder: '••••••••' },
          { label: 'Groupe (optionnel)', key: 'group_name', type: 'text', placeholder: '6ème A, Débutants...' },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.text2, display: 'block', marginBottom: 6 }}>{f.label}</label>
            <input
              type={f.type}
              placeholder={f.placeholder}
              value={(form as any)[f.key]}
              onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        ))}

        {error && <p style={{ color: C.red, fontSize: 13, marginBottom: 16 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: 12, borderRadius: 12, border: `2px solid ${C.border}`, background: C.white, cursor: 'pointer', fontSize: 14, color: C.text2 }}>
            Annuler
          </button>
          <button onClick={submit} disabled={loading}
            style={{ flex: 2, padding: 12, borderRadius: 12, background: loading ? C.border : C.violet, color: '#fff', border: 'none', cursor: loading ? 'default' : 'pointer', fontSize: 14, fontWeight: 700 }}>
            {loading ? 'Création...' : 'Créer l\'élève'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal Progression élève ───────────────────────────────────


function ProgressModal({ student, onClose }: { student: Student; onClose: () => void }) {
  const [progress, setProgress] = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState<'summary' | 'skills' | 'modules'>('summary')

  useEffect(() => {
    api.get(`/api/v1/institution/students/${student.id}/progress`)
      .then(r => setProgress(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [student.id])

  const C = {
    violet: '#6C3FC5', violetLt: '#EDE8FB', violetDk: '#4A2A8A',
    orange: '#F07C1E', orangeLt: '#FEF0E3',
    green:  '#2BA84A', greenLt:  '#E3F7E8', greenDk: '#1A6630',
    blue:   '#1976D2', blueLt:   '#E6F1FB',
    red:    '#E24B4A', redLt:    '#FCEBEB',
    bg:     '#F8F7FF', white:    '#FFFFFF',
    text:   '#1A1A2E', text2:    '#5A5A7A', text3: '#9A9AB0',
    border: '#E8E4F8',
  }

  const SKILL_STATUS = {
    mastered:    { label: 'Maîtrisé',       color: C.green,  bg: C.greenLt,  icon: '⭐' },
    in_progress: { label: 'En cours',       color: C.orange, bg: C.orangeLt, icon: '↗'  },
    weak:        { label: 'À retravailler', color: C.red,    bg: C.redLt,    icon: '↺'  },
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: C.white, borderRadius: 22, width: 680, maxWidth: '95vw', maxHeight: '88vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 0', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 3 }}>
                📊 {student.username}
              </h2>
              <div style={{ fontSize: 12, color: C.text3 }}>{student.email}</div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: C.text3 }}>✕</button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { key: 'summary', label: '📈 Résumé'     },
              { key: 'skills',  label: '🎯 Compétences' },
              { key: 'modules', label: '📚 Modules'     },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key as any)}
                style={{ padding: '8px 16px', borderRadius: '10px 10px 0 0', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === t.key ? 700 : 500, background: tab === t.key ? C.violetLt : 'transparent', color: tab === t.key ? C.violet : C.text2, borderBottom: tab === t.key ? `2px solid ${C.violet}` : '2px solid transparent' }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: C.text3 }}>Chargement...</div>
          ) : !progress ? (
            <div style={{ textAlign: 'center', padding: 60, color: C.text3 }}>Aucune donnée disponible</div>
          ) : (

            <>
              {/* ── Tab Résumé ── */}
              {tab === 'summary' && (
                <div>
                  {/* Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
                    {[
                      { label: 'Leçons',        value: progress.summary.lessons_completed, color: C.violet, bg: C.violetLt, icon: '📚' },
                      { label: 'Score moyen',   value: `${progress.summary.avg_score}%`,  color: progress.summary.avg_score >= 70 ? C.green : C.orange, bg: progress.summary.avg_score >= 70 ? C.greenLt : C.orangeLt, icon: '📊' },
                      { label: 'XP total',      value: progress.summary.total_xp,          color: C.orange, bg: C.orangeLt, icon: '⚡' },
                      { label: 'Tentatives',    value: progress.summary.total_attempts,    color: C.blue,   bg: C.blueLt,   icon: '🎯' },
                      { label: 'Réussite',      value: `${progress.summary.overall_success}%`, color: progress.summary.overall_success >= 70 ? C.green : C.red, bg: progress.summary.overall_success >= 70 ? C.greenLt : C.redLt, icon: '✓' },
                      { label: 'Niveau',        value: `Niv. ${progress.user.level}`,      color: C.violet, bg: C.violetLt, icon: '🏆' },
                    ].map(s => (
                      <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
                        <div style={{ fontSize: 11, color: C.text2, fontWeight: 600 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Points forts / faibles */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                    <div style={{ background: C.greenLt, borderRadius: 14, padding: '14px 16px', border: `2px solid ${C.green}20` }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.greenDk, marginBottom: 10 }}>💪 Points forts</div>
                      {progress.strengths.length === 0 ? (
                        <p style={{ fontSize: 12, color: C.text3 }}>Pas encore de données</p>
                      ) : progress.strengths.map((s: string) => (
                        <div key={s} style={{ fontSize: 12, color: C.greenDk, padding: '4px 0', borderBottom: `1px solid ${C.green}20`, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>✓</span> {s}
                        </div>
                      ))}
                    </div>
                    <div style={{ background: C.orangeLt, borderRadius: 14, padding: '14px 16px', border: `2px solid ${C.orange}20` }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.orange, marginBottom: 10 }}>⚠️ À renforcer</div>
                      {progress.weaknesses.length === 0 ? (
                        <p style={{ fontSize: 12, color: C.text3 }}>Aucune lacune détectée</p>
                      ) : progress.weaknesses.map((s: string) => (
                        <div key={s} style={{ fontSize: 12, color: C.orange, padding: '4px 0', borderBottom: `1px solid ${C.orange}20`, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>↺</span> {s}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Séries / XP */}
                  <div style={{ background: C.bg, borderRadius: 14, padding: '14px 16px', display: 'flex', gap: 20, alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: C.green }}>🔥 {progress.user.streak}</div>
                      <div style={{ fontSize: 11, color: C.text3 }}>jours de série</div>
                    </div>
                    <div style={{ width: 1, height: 40, background: C.border }} />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: C.orange }}>⚡ {progress.user.xp}</div>
                      <div style={{ fontSize: 11, color: C.text3 }}>XP total</div>
                    </div>
                    <div style={{ width: 1, height: 40, background: C.border }} />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: C.violet }}>🏆 {progress.user.level}</div>
                      <div style={{ fontSize: 11, color: C.text3 }}>niveau</div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Tab Compétences ── */}
              {tab === 'skills' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {(['mastered', 'in_progress', 'weak'] as const).map(group => {
                    const skills = progress.skills[group]
                    if (skills.length === 0) return null
                    const cfg = SKILL_STATUS[group]
                    return (
                      <div key={group}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <span style={{ fontSize: 16 }}>{cfg.icon}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                          <span style={{ fontSize: 12, color: C.text3 }}>({skills.length})</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {skills.map((s: any) => (
                            <div key={s.skill_id} style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 14, padding: '12px 16px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{s.skill_name}</span>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                  <span style={{ fontSize: 11, color: C.text3 }}>{s.attempts} tentatives · {s.success_rate}% réussite</span>
                                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: cfg.bg, color: cfg.color }}>{s.mastery}%</span>
                                </div>
                              </div>
                              <div style={{ height: 6, background: C.bg, borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${s.mastery}%`, background: cfg.color, borderRadius: 3, transition: 'width .8s' }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                  {Object.values(progress.skills).every((g: any) => g.length === 0) && (
                    <p style={{ textAlign: 'center', color: C.text3, padding: 40 }}>Aucun exercice complété encore</p>
                  )}
                </div>
              )}

              {/* ── Tab Modules ── */}
              {tab === 'modules' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {progress.modules.length === 0 ? (
                    <p style={{ textAlign: 'center', color: C.text3, padding: 40 }}>Aucun module commencé</p>
                  ) : progress.modules.map((m: any) => (
                    <div key={m.module_id} style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 16, padding: '16px 18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{m.module_title}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: m.avg_score >= 70 ? C.green : C.orange }}>{m.avg_score}%</span>
                          <span style={{ fontSize: 11, color: C.text3 }}>{m.lessons.length} leçon{m.lessons.length > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <div style={{ height: 6, background: C.bg, borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
                        <div style={{ height: '100%', width: `${m.avg_score}%`, background: m.avg_score >= 70 ? C.green : C.orange, borderRadius: 3 }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {m.lessons.map((l: any) => (
                          <div key={l.lesson_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', background: C.bg, borderRadius: 8 }}>
                            <span style={{ fontSize: 11, color: l.score >= 70 ? C.green : C.orange, fontWeight: 700, width: 36 }}>{l.score}%</span>
                            <span style={{ fontSize: 12, color: C.text2, flex: 1 }}>{l.lesson_title}</span>
                            <span style={{ fontSize: 11, color: C.text3 }}>+{l.xp_earned} XP</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────
export default function InstitutionDashboard() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [stats, setStats] = useState<InstitutionStats | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview' | 'students'>('overview')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState('')

  const loadData = async () => {
    try {
      const [statsRes, studentsRes] = await Promise.all([
        api.get('/api/v1/institution/stats'),
        api.get('/api/v1/institution/students'),
      ])
      setStats(statsRes.data)
      setStudents(studentsRes.data)
    } catch {
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (user) loadData() }, [user])

  const toggleStudent = async (student: Student) => {
    await api.put(`/api/v1/institution/students/${student.id}`, { is_active: !student.is_active })
    loadData()
  }

  const removeStudent = async (student: Student) => {
    if (!confirm(`Retirer ${student.username} de l'institution ?`)) return
    await api.delete(`/api/v1/institution/students/${student.id}`)
    loadData()
  }

  // Filtres
  const groups = [...new Set(students.map(s => s.group_name).filter(Boolean))] as string[]
  const filtered = students.filter(s => {
    const matchSearch = s.username.toLowerCase().includes(search.toLowerCase()) ||
                        s.email.toLowerCase().includes(search.toLowerCase())
    const matchGroup = !groupFilter || s.group_name === groupFilter
    return matchSearch && matchGroup
  })

  if (!user || loading) return (
    <div style={{ padding: 60, textAlign: 'center', color: C.text3 }}>Chargement...</div>
  )

  const plan = stats ? PLAN_COLORS[stats.plan] ?? PLAN_COLORS.starter : PLAN_COLORS.starter
  const occupancy = stats ? Math.round((stats.total_students / stats.max_students) * 100) : 0

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 48px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 4 }}>
            🏫 {stats?.institution_name ?? 'Mon institution'}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 8, background: plan.bg, color: plan.color }}>
              {plan.label}
            </span>
            {stats?.subscription_status === 'trial' && (
              <span style={{ fontSize: 11, color: C.orange, fontWeight: 600 }}>
                ⏳ Essai — {stats.trial_ends_at ? new Date(stats.trial_ends_at).toLocaleDateString('fr-FR') : ''}
              </span>
            )}
          </div>
        </div>
        <button onClick={() => router.push('/dashboard')}
          style={{ padding: '10px 18px', borderRadius: 12, border: `2px solid ${C.border}`, background: C.white, cursor: 'pointer', fontSize: 13, color: C.text2, fontWeight: 600 }}>
          ← Tableau de bord
        </button>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: C.bg, padding: 4, borderRadius: 12, width: 'fit-content' }}>
        {[
          { key: 'overview', label: '📊 Vue d\'ensemble' },
          { key: 'students', label: `👥 Élèves (${stats?.total_students ?? 0})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            style={{
              padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
              background: tab === t.key ? C.white : 'transparent',
              color: tab === t.key ? C.violet : C.text2,
              boxShadow: tab === t.key ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              transition: 'all .15s',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Vue d'ensemble ── */}
      {tab === 'overview' && stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Stats cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            {[
              { label: 'Élèves actifs',   value: stats.active_students,  total: stats.max_students, color: C.violet, icon: '👥' },
              { label: 'Score moyen',     value: `${stats.avg_score}%`,  color: stats.avg_score >= 70 ? C.green : C.orange, icon: '📊' },
              { label: 'XP moyen',        value: stats.avg_xp,           color: C.orange, icon: '⚡' },
              { label: 'Places utilisées',value: `${occupancy}%`,        color: occupancy > 80 ? C.red : C.blue, icon: '📈' },
            ].map(s => (
              <div key={s.label} style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 18, padding: '20px 18px' }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: 6 }}>{s.value}</div>
                {'total' in s && (
                  <>
                    <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
                      <div style={{ height: '100%', width: `${Math.round((stats.active_students / stats.max_students) * 100)}%`, background: s.color, borderRadius: 2 }} />
                    </div>
                    <div style={{ fontSize: 11, color: C.text3 }}>sur {s.total} max</div>
                  </>
                )}
                <div style={{ fontSize: 12, color: C.text2, fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Capacité */}
          <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 18, padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Capacité du plan</span>
              <span style={{ fontSize: 13, color: C.text2 }}>{stats.total_students} / {stats.max_students} élèves</span>
            </div>
            <div style={{ height: 10, background: C.border, borderRadius: 5, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{
                height: '100%',
                width: `${occupancy}%`,
                background: occupancy > 80 ? C.red : occupancy > 60 ? C.orange : C.violet,
                borderRadius: 5,
                transition: 'width 1s',
              }} />
            </div>
            <div style={{ fontSize: 12, color: C.text3 }}>
              {stats.max_students - stats.total_students} places restantes
              {occupancy > 80 && <span style={{ color: C.red, fontWeight: 700, marginLeft: 8 }}>— Pensez à upgrader votre plan !</span>}
            </div>
          </div>

          {/* Groupes */}
          {groups.length > 0 && (
            <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 18, padding: '20px 24px' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16 }}>Groupes</h3>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {groups.map(g => {
                  const count = students.filter(s => s.group_name === g).length
                  return (
                    <div key={g} style={{ background: C.violetLt, borderRadius: 10, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.violet }}>{g}</span>
                      <span style={{ fontSize: 11, color: C.text3 }}>{count} élève{count > 1 ? 's' : ''}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Liste des élèves ── */}
      {tab === 'students' && (
        <div>
          {/* Barre actions */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Rechercher un élève..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${C.border}`, fontSize: 14, outline: 'none' }}
            />
            {groups.length > 0 && (
              <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)}
                style={{ padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${C.border}`, fontSize: 14, color: C.text, background: C.white, cursor: 'pointer' }}>
                <option value="">Tous les groupes</option>
                {groups.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            )}
            <button onClick={() => setShowAddModal(true)}
              style={{ padding: '10px 20px', borderRadius: 12, background: C.violet, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
              ➕ Ajouter
            </button>
          </div>

          {/* Table */}
          <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 18, overflow: 'hidden' }}>
            {/* En-tête */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr 140px', gap: 16, padding: '12px 20px', background: C.bg, borderBottom: `1px solid ${C.border}` }}>
              {['Élève', 'Email', 'Groupe', 'XP', 'Niveau', 'Statut', 'Actions'].map(h => (
                <div key={h} style={{ fontSize: 11, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</div>
              ))}
            </div>

            {/* Lignes */}
            {filtered.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: C.text3 }}>Aucun élève trouvé</div>
            ) : (
              filtered.map((student, i) => (
                <div key={student.id}
                  style={{
                    display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr 140px',
                    gap: 16, padding: '14px 20px', alignItems: 'center',
                    borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none',
                    background: student.is_active ? C.white : '#FAFAFA',
                    opacity: student.is_active ? 1 : 0.6,
                  }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{student.username}</div>
                  <div style={{ fontSize: 12, color: C.text3, overflow: 'hidden', textOverflow: 'ellipsis' }}>{student.email}</div>
                  <div style={{ fontSize: 12, color: C.text2 }}>{student.group_name ?? '—'}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.orange }}>{student.xp}</div>
                  <div style={{ fontSize: 13, color: C.text2 }}>Niv. {student.level}</div>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: student.is_active ? C.greenLt : C.redLt, color: student.is_active ? C.greenDk : C.red }}>
                      {student.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setSelectedStudent(student)} title="Voir progression"
                      style={{ padding: '5px 10px', borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.white, cursor: 'pointer', fontSize: 13 }}>
                      📊
                    </button>
                    <button onClick={() => toggleStudent(student)} title={student.is_active ? 'Désactiver' : 'Activer'}
                      style={{ padding: '5px 10px', borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.white, cursor: 'pointer', fontSize: 13 }}>
                      {student.is_active ? '🔒' : '🔓'}
                    </button>
                    <button onClick={() => removeStudent(student)} title="Retirer"
                      style={{ padding: '5px 10px', borderRadius: 8, border: `1.5px solid ${C.red}40`, background: C.redLt, cursor: 'pointer', fontSize: 13 }}>
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ marginTop: 12, fontSize: 12, color: C.text3, textAlign: 'right' }}>
            {filtered.length} élève{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {showAddModal && (
        <AddStudentModal
          onClose={() => setShowAddModal(false)}
          onSuccess={loadData}
        />
      )}
      {selectedStudent && (
        <ProgressModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  )
}
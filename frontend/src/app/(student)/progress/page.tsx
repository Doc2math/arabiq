'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { api, curriculumApi } from '@/lib/api'

const C = {
  violet:'#6C3FC5', violetLt:'#EDE8FB', violetDk:'#4A2A8A',
  orange:'#F07C1E', orangeLt:'#FEF0E3',
  green:'#2BA84A', greenLt:'#E3F7E8',
  blue:'#1976D2', blueLt:'#E6F1FB',
  red:'#E24B4A', redLt:'#FCEBEB',
  bg:'#F8F7FF', white:'#fff',
  text:'#1A1A2E', text2:'#5A5A7A', text3:'#9A9AB0',
  border:'#E8E4F8',
}

interface ModuleProgress {
  id: number
  title: string
  total: number
  completed: number
  xp: number
}

interface SkillMastery {
  skill_id: string
  skill_name: string
  mastery: number
  status: 'mastered' | 'good' | 'in_progress' | 'weak'
}

const STATUS_CONFIG = {
  mastered:    { label: 'Maîtrisé',       color: C.green,  bg: C.greenLt },
  good:        { label: 'Bien',           color: C.blue,   bg: C.blueLt  },
  in_progress: { label: 'En cours',       color: C.orange, bg: C.orangeLt },
  weak:        { label: 'À retravailler', color: C.red,    bg: C.redLt   },
}

function StatCard({ icon, value, label, color, bg }: {
  icon: string; value: string | number; label: string; color: string; bg: string
}) {
  return (
    <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 18, padding: '20px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
        <div style={{ fontSize: 12, color: C.text3 }}>{label}</div>
      </div>
    </div>
  )
}

function ProgressBar({ value, color, bg }: { value: number; color: string; bg: string }) {
  return (
    <div style={{ height: 10, background: bg, borderRadius: 5, overflow: 'hidden' }}>
      <div style={{ height: '100%', borderRadius: 5, background: color, width: `${Math.min(value, 100)}%`, transition: 'width .8s' }} />
    </div>
  )
}

export default function ProgressPage() {
  const { user } = useAuthStore()
  const [moduleProgress, setModuleProgress] = useState<ModuleProgress[]>([])
  const [skills, setSkills] = useState<SkillMastery[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    Promise.all([
      curriculumApi.modules(),
      // Pour chaque module, récupérer les leçons avec leur statut
    ]).then(async ([modRes]) => {
      const mods = modRes.data
      const progList: ModuleProgress[] = []

      for (const mod of mods) {
        try {
          const lesRes = await curriculumApi.lessons(mod.id)
          const lessons = lesRes.data
          const completed = lessons.filter((l: any) => l.is_completed).length
          const xp = lessons.filter((l: any) => l.is_completed).reduce((s: number, l: any) => s + l.xp_reward, 0)
          progList.push({ id: mod.id, title: mod.title, total: lessons.length, completed, xp })
        } catch {
          progList.push({ id: mod.id, title: mod.title, total: 0, completed: 0, xp: 0 })
        }
      }
      setModuleProgress(progList)

      // Récupérer les compétences BKT du dernier rapport
      const cached = localStorage.getItem('langdad_last_report')
      if (cached) {
        try {
          const report = JSON.parse(cached)
          setSkills(report.skills ?? [])
        } catch {}
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [user])

  if (!user) return null

  const totalCompleted = moduleProgress.reduce((s, m) => s + m.completed, 0)
  const totalLessons   = moduleProgress.reduce((s, m) => s + m.total, 0)
  const globalPct      = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0

  return (
    <div style={{ maxWidth: 1020, margin: '0 auto', padding: '32px 24px' }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap" rel="stylesheet" />

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 6 }}>📈 Ma progression</h1>
        <p style={{ fontSize: 14, color: C.text2 }}>Suivez votre avancement et vos compétences</p>
      </div>

      {/* Stats globales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 28 }}>
        <StatCard icon="⚡" value={user.xp} label="XP total"         color={C.orange} bg={C.orangeLt} />
        <StatCard icon="🏆" value={`Niv. ${user.level}`} label="Niveau actuel" color={C.violet} bg={C.violetLt} />
        <StatCard icon="🔥" value={`${user.streak}j`} label="Série actuelle"  color={C.green}  bg={C.greenLt} />
        <StatCard icon="✓"  value={`${totalCompleted}/${totalLessons}`} label="Leçons complétées" color={C.blue} bg={C.blueLt} />
      </div>

      {/* Progression globale */}
      <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 20, padding: '24px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Progression globale</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.violet }}>{globalPct}%</span>
        </div>
        <ProgressBar value={globalPct} color={`linear-gradient(90deg,${C.violet},${C.orange})`} bg={C.violetLt} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontSize: 12, color: C.text3 }}>{totalCompleted} leçons complétées</span>
          <span style={{ fontSize: 12, color: C.text3 }}>{totalLessons - totalCompleted} restantes</span>
        </div>
      </div>

      {/* Progression par module */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 14 }}>Par module</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: C.text3 }}>Chargement…</div>
        ) : moduleProgress.map((mod, i) => {
          const pct = mod.total > 0 ? Math.round((mod.completed / mod.total) * 100) : 0
          const colors = [C.violet, C.orange, C.green, C.blue]
          const bgs    = [C.violetLt, C.orangeLt, C.greenLt, C.blueLt]
          const color  = colors[i % colors.length]
          const bg     = bgs[i % bgs.length]

          return (
            <div key={mod.id} style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 16, padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{mod.title}</span>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                    <span style={{ fontSize: 12, color: C.text3 }}>{mod.completed}/{mod.total} leçons</span>
                    {mod.xp > 0 && <span style={{ fontSize: 12, color: C.orange, fontWeight: 600 }}>+{mod.xp} XP</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color }}>{pct}%</span>
                </div>
              </div>
              <ProgressBar value={pct} color={color} bg={bg} />
            </div>
          )
        })}
      </div>

      {/* Compétences BKT */}
      {skills.length > 0 && (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 14 }}>Maîtrise par compétence</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12, marginBottom: 28 }}>
            {skills.map(skill => {
              const cfg = STATUS_CONFIG[skill.status]
              const pct = Math.round(skill.mastery * 100)
              return (
                <div key={skill.skill_id} style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 16, padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text, flex: 1 }}>{skill.skill_name}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 8, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap', marginLeft: 8 }}>
                      {cfg.label}
                    </span>
                  </div>
                  <ProgressBar value={pct} color={cfg.color} bg={cfg.bg} />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{pct}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Message si pas encore de données BKT */}
      {skills.length === 0 && !loading && (
        <div style={{ background: C.violetLt, borderRadius: 16, padding: '24px', textAlign: 'center', border: `2px solid ${C.violet}20` }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🎯</div>
          <p style={{ fontSize: 14, fontWeight: 700, color: C.violetDk, marginBottom: 6 }}>
            Complétez l'évaluation du Module 1
          </p>
          <p style={{ fontSize: 13, color: C.text2 }}>
            Votre analyse de compétences BKT apparaîtra ici après la première évaluation.
          </p>
        </div>
      )}
    </div>
  )
}
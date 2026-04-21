'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { api, curriculumApi } from '@/lib/api'

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

interface Module { id: number; title: string; description: string; is_premium: boolean; sort_order: number }
interface Lesson  { id: number; title: string; lesson_type: string; xp_reward: number; duration_minutes: number; sort_order: number }

const LESSON_TYPE_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  identification:   { icon: '🔤', label: 'Identification',  color: C.violet },
  harakat:          { icon: '🎵', label: 'Harakat',         color: C.orange },
  mots:             { icon: '📝', label: 'Vocabulaire',     color: C.green  },
  ecriture_clavier: { icon: '⌨️', label: 'Écriture',        color: C.blue   },
  exercices:        { icon: '🧩', label: 'Exercices',       color: '#9C27B0'},
  lecture_phrase:   { icon: '📖', label: 'Lecture',         color: C.orange },
  evaluation:       { icon: '🏆', label: 'Évaluation',      color: '#E91E63'},
}

export default function AdminContentPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [modules, setModules] = useState<Module[]>([])
  const [selectedModule, setSelectedModule] = useState<number | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [lessonsLoading, setLessonsLoading] = useState(false)
  const [tab, setTab] = useState<'modules'|'lessons'>('modules')

  useEffect(() => {
    curriculumApi.modules()
      .then(res => { setModules(res.data); if (res.data.length > 0) selectModule(res.data[0].id) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const selectModule = async (moduleId: number) => {
    setSelectedModule(moduleId)
    setLessonsLoading(true)
    try {
      const res = await curriculumApi.lessons(moduleId)
      setLessons(res.data)
    } catch {}
    setLessonsLoading(false)
  }

  if (!user) return null

  const selectedMod = modules.find(m => m.id === selectedModule)
  const totalXP = lessons.reduce((s, l) => s + l.xp_reward, 0)
  const totalMin = lessons.reduce((s, l) => s + l.duration_minutes, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8 }}>
        {(['modules', 'lessons'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '9px 20px', borderRadius: 12, border: `2px solid ${tab === t ? C.violet : C.border}`, background: tab === t ? C.violetLt : C.white, color: tab === t ? C.violet : C.text2, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {t === 'modules' ? '📚 Modules' : '📖 Leçons'}
          </button>
        ))}
      </div>

      {/* ── MODULES ──────────────────────────────────────────── */}
      {tab === 'modules' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
              {modules.length} module{modules.length !== 1 ? 's' : ''}
            </h2>
            <button style={{ padding: '9px 18px', borderRadius: 12, background: C.violet, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
              + Nouveau module
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: C.text3 }}>Chargement…</div>
          ) : modules.map((mod, i) => {
            const colors = [C.violet, C.orange, C.green, C.blue]
            const bgs    = [C.violetLt, C.orangeLt, C.greenLt, C.blueLt]
            const color  = colors[i % colors.length]
            const bg     = bgs[i % bgs.length]
            return (
              <div key={mod.id} style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 16, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  📚
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{mod.title}</span>
                    {mod.is_premium && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: C.orangeLt, color: C.orange }}>PREMIUM</span>}
                  </div>
                  <p style={{ fontSize: 12, color: C.text2, marginBottom: 0 }}>{mod.description}</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setSelectedModule(mod.id); selectModule(mod.id); setTab('lessons') }}
                    style={{ padding: '8px 14px', borderRadius: 10, border: `2px solid ${color}`, background: bg, color, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    📖 Leçons
                  </button>
                  <button style={{ padding: '8px 14px', borderRadius: 10, border: `2px solid ${C.border}`, background: 'transparent', color: C.text2, fontSize: 12, cursor: 'pointer' }}>
                    ✏️ Modifier
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── LEÇONS ───────────────────────────────────────────── */}
      {tab === 'lessons' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Sélecteur de module */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text2 }}>Module :</span>
            {modules.map(mod => (
              <button key={mod.id} onClick={() => selectModule(mod.id)}
                style={{ padding: '7px 14px', borderRadius: 10, border: `2px solid ${selectedModule === mod.id ? C.violet : C.border}`, background: selectedModule === mod.id ? C.violetLt : C.white, color: selectedModule === mod.id ? C.violet : C.text2, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {mod.title}
              </button>
            ))}
          </div>

          {/* Stats du module sélectionné */}
          {selectedMod && (
            <div style={{ background: C.violetLt, borderRadius: 14, padding: '14px 18px', display: 'flex', gap: 24, alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.violet, flex: 1 }}>{selectedMod.title}</span>
              <span style={{ fontSize: 13, color: C.violetDk }}>📖 {lessons.length} leçons</span>
              <span style={{ fontSize: 13, color: C.violetDk }}>⚡ {totalXP} XP</span>
              <span style={{ fontSize: 13, color: C.violetDk }}>⏱ {totalMin} min</span>
              <button style={{ padding: '7px 14px', borderRadius: 10, background: C.violet, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                + Nouvelle leçon
              </button>
            </div>
          )}

          {/* Liste des leçons */}
          {lessonsLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: C.text3 }}>Chargement…</div>
          ) : (
            <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 20, overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '40px 2fr 1fr 80px 80px 80px 100px', gap: 0, padding: '11px 20px', background: C.bg, borderBottom: `2px solid ${C.border}` }}>
                {['#', 'Titre', 'Type', 'XP', 'Durée', 'Exercices', 'Actions'].map(h => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 700, color: C.text3, textTransform: 'uppercase' }}>{h}</span>
                ))}
              </div>

              {lessons.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: C.text3 }}>Aucune leçon dans ce module</div>
              ) : lessons.map((lesson, i) => {
                const cfg = LESSON_TYPE_CONFIG[lesson.lesson_type] ?? LESSON_TYPE_CONFIG['exercices']
                const exerciceCount = 0 // À récupérer depuis le content
                return (
                  <div key={lesson.id}
                    style={{ display: 'grid', gridTemplateColumns: '40px 2fr 1fr 80px 80px 80px 100px', gap: 0, padding: '13px 20px', borderBottom: i < lessons.length - 1 ? `1px solid ${C.border}` : 'none', alignItems: 'center' }}>

                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text3 }}>{lesson.sort_order}</span>

                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>
                      {lesson.title}
                    </span>

                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 8, background: `${cfg.color}15`, color: cfg.color, width: 'fit-content' }}>
                      {cfg.icon} {cfg.label}
                    </span>

                    <span style={{ fontSize: 13, fontWeight: 700, color: C.orange }}>{lesson.xp_reward}</span>

                    <span style={{ fontSize: 12, color: C.text2 }}>{lesson.duration_minutes} min</span>

                    <span style={{ fontSize: 12, color: C.text3 }}>—</span>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => router.push(`/lesson/${lesson.id}`)}
                        title="Prévisualiser"
                        style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.violet}`, background: C.violetLt, color: C.violet, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        👁
                      </button>
                      <button
                        title="Modifier"
                        style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.border}`, background: 'transparent', color: C.text2, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        ✏️
                      </button>
                      <button
                        title="Supprimer"
                        style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.red}30`, background: 'transparent', color: C.red, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        🗑
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
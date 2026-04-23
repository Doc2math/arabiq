'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { curriculumApi, writingApi } from '@/lib/api'

interface Lesson {
  id: number
  title: string
  lesson_type: string
  xp_reward: number
  duration_minutes: number
  sort_order: number
  is_completed?: boolean
}

interface Module {
  id: number
  title: string
  description: string
  is_premium: boolean
}

const C = {
  violet:'#6C3FC5', violetLt:'#EDE8FB', violetDk:'#4A2A8A',
  orange:'#F07C1E', orangeLt:'#FEF0E3',
  green:'#2BA84A', greenLt:'#E3F7E8',
  bg:'#F8F7FF', white:'#fff',
  text:'#1A1A2E', text2:'#5A5A7A', text3:'#9A9AB0',
  border:'#E8E4F8',
}

const LESSON_TYPES: Record<string, { icon: string; label: string; color: string }> = {
  identification:   { icon: '🔤', label: 'Identification',  color: '#6C3FC5' },
  harakat:          { icon: '🎵', label: 'Harakat',         color: '#F07C1E' },
  mots:             { icon: '📝', label: 'Vocabulaire',     color: '#2BA84A' },
  ecriture_clavier: { icon: '⌨️', label: 'Écriture',        color: '#1976D2' },
  exercices:        { icon: '🧩', label: 'Exercices',       color: '#9C27B0' },
  lecture_phrase:   { icon: '📖', label: 'Lecture',         color: '#F07C1E' },
  evaluation:       { icon: '🏆', label: 'Évaluation',      color: '#E91E63' },
}

export default function ModulePage() {
  const router   = useRouter()
  const params   = useParams()
  const moduleId = Number(params.id)
  const { user } = useAuthStore()

  const [module, setModule]   = useState<Module | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      curriculumApi.modules(),
      curriculumApi.lessons(moduleId),
    ]).then(([modRes, lesRes]) => {
      const mod = modRes.data.find((m: Module) => m.id === moduleId)
      setModule(mod || null)
      const sorted = (lesRes.data || []).sort((a: Lesson, b: Lesson) => a.sort_order - b.sort_order)
      setLessons(sorted)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [moduleId])

  const completed  = lessons.filter(l => l.is_completed).length
  const pct        = lessons.length > 0 ? Math.round((completed / lessons.length) * 100) : 0
  const nextLesson = lessons.find(l => !l.is_completed)
  const totalXP    = lessons.reduce((s, l) => s + l.xp_reward, 0)
  const totalMin   = lessons.reduce((s, l) => s + l.duration_minutes, 0)

  if (!user) return null

  return (
    <div style={{ maxWidth: 1020, margin: '0 auto', padding: '32px 24px' }}>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.text3 }}>Chargement…</div>
      ) : (
        <>
          {/* En-tête module */}
          <div style={{ marginBottom: 24 }}>
            <button onClick={() => router.push('/dashboard')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.violet, fontSize: 14, fontWeight: 600, padding: 0, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              ← Tous les modules
            </button>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 6 }}>
              {module?.title}
            </h1>
            <p style={{ fontSize: 14, color: C.text2 }}>{module?.description}</p>
          </div>

          {/* Progression */}
          <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 20, padding: '22px 24px', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Progression</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.violet }}>{pct}%</span>
            </div>
            <div style={{ height: 10, background: C.violetLt, borderRadius: 5, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ height: '100%', borderRadius: 5, background: `linear-gradient(90deg, ${C.violet}, ${C.orange})`, width: `${pct}%`, transition: 'width .6s' }} />
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
              {[
                { val: totalXP, label: 'XP total',        color: C.orange },
                { val: `${totalMin} min`, label: 'Durée',  color: C.violet },
                { val: completed, label: 'Complétées',    color: C.green  },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: C.text3 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bouton continuer */}
          {nextLesson && (
            <button onClick={() => router.push(`/lesson/${nextLesson.id}`)}
              style={{
                width: '100%', padding: '16px 20px', borderRadius: 16,
                background: C.violet, color: '#fff', border: 'none',
                cursor: 'pointer', fontSize: 15, fontWeight: 700,
                marginBottom: 20, display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8, transition: 'background .2s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.violetDk}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.violet}>
              ▶ Continuer — {nextLesson.title}
            </button>
          )}

          {/* Fiches écriture */}
          <div style={{
            background: C.orangeLt, border: `2px solid ${C.orange}40`,
            borderRadius: 16, padding: '14px 20px', marginBottom: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.orange, marginBottom: 2 }}>✍️ Fiches d&apos;écriture</p>
              <p style={{ fontSize: 12, color: '#7A3A00' }}>Imprimables ou sur écran tactile</p>
            </div>
            <a href={writingApi.moduleSheets(moduleId)} target="_blank" rel="noopener noreferrer"
              style={{ padding: '10px 18px', borderRadius: 12, background: C.orange, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
              ⬇ PDF
            </a>
          </div>

          {/* Liste des leçons */}
          <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 14 }}>Leçons</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {lessons.map((lesson, i) => {
              const cfg       = LESSON_TYPES[lesson.lesson_type] || LESSON_TYPES['exercices']
              const isCompleted = lesson.is_completed
              const isCurrent   = lesson.id === nextLesson?.id
              const isLocked    = !isCompleted && !isCurrent && i > 0 && !lessons[i - 1]?.is_completed

              return (
                <button key={lesson.id}
                  onClick={() => !isLocked && router.push(`/lesson/${lesson.id}`)}
                  disabled={isLocked}
                  style={{
                    background: isCompleted ? C.greenLt : isCurrent ? C.violetLt : C.white,
                    border: `2px solid ${isCompleted ? C.green : isCurrent ? C.violet : C.border}`,
                    borderRadius: 16, padding: '16px 18px',
                    cursor: isLocked ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 14,
                    textAlign: 'left', width: '100%',
                    opacity: isLocked ? 0.45 : 1, transition: 'all .15s',
                  }}
                  onMouseEnter={e => { if (!isLocked) (e.currentTarget as HTMLElement).style.transform = 'translateX(4px)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none' }}>

                  {/* Badge numéro */}
                  <div style={{
                    width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                    background: isCompleted ? C.green : isCurrent ? C.violet : '#F0EDF8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: isCompleted ? 18 : 14, fontWeight: 700,
                    color: isCompleted || isCurrent ? '#fff' : C.text3,
                  }}>
                    {isLocked ? '🔒' : isCompleted ? '✓' : lesson.sort_order}
                  </div>

                  {/* Infos */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: isCompleted ? C.green : isCurrent ? C.violet : C.text }}>
                        {lesson.title}
                      </span>
                      <span style={{ fontSize: 10, background: `${cfg.color}18`, color: cfg.color, padding: '2px 8px', borderRadius: 8, fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 14, fontSize: 12, color: C.text3 }}>
                      <span>⏱ {lesson.duration_minutes} min</span>
                      <span>⚡ {lesson.xp_reward} XP</span>
                    </div>
                  </div>

                  {/* Flèche */}
                  {!isLocked && (
                    <span style={{ fontSize: 18, color: isCompleted ? C.green : C.violet, flexShrink: 0 }}>→</span>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
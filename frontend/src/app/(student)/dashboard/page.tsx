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
  bg:'#F8F7FF', white:'#fff',
  text:'#1A1A2E', text2:'#5A5A7A', text3:'#9A9AB0',
  border:'#E8E4F8',
}

interface ModuleData {
  id: number
  title: string
  description: string
  sort_order: number
  is_premium: boolean
  part_id: number
  lessons_count: number
  completed_count: number
  total_xp: number
}

interface PartData {
  id: number
  number: number
  title: string
  description: string
  degree: number
  color: string
  icon: string
  is_premium: boolean
  modules: ModuleData[]
  total_lessons: number
  completed_lessons: number
}

function ProgressBar({ value, max, color, bg }: { value: number; max: number; color: string; bg: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div>
      <div style={{ height: 6, background: bg, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 3, background: color, width: `${pct}%`, transition: 'width .6s' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
        <span style={{ fontSize: 11, color: C.text3 }}>{value}/{max} leçons</span>
        <span style={{ fontSize: 11, color, fontWeight: 700 }}>{pct}%</span>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [parts, setParts] = useState<PartData[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedPart, setExpandedPart] = useState<number | null>(1)

  useEffect(() => {
    api.get('/api/v1/curriculum/parts')
      .then(res => {
        setParts(res.data)
        // Auto-expand la première partie avec du contenu
        const firstWithContent = res.data.find((p: PartData) => p.total_lessons > 0)
        if (firstWithContent) setExpandedPart(firstWithContent.id)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (!user) return null

  const totalLessons   = parts.reduce((s, p) => s + p.total_lessons, 0)
  const totalCompleted = parts.reduce((s, p) => s + p.completed_lessons, 0)
  const globalPct      = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0

  return (
    <div style={{ maxWidth: 1020, margin: '0 auto', padding: '32px 24px' }}>

      {/* Bienvenue */}
      <div style={{
        background: `linear-gradient(135deg, ${C.violetDk}, ${C.violet})`,
        borderRadius: 24, padding: '28px 32px', marginBottom: 24, color: '#fff',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <div>
          <p style={{ fontSize: 14, opacity: 0.75, marginBottom: 4 }}>Bon retour,</p>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>{user.username} 👋</h1>
          <p style={{ fontSize: 13, opacity: 0.8 }}>Continuez votre apprentissage de l&apos;arabe</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 48, marginBottom: 4 }}>🌙</div>
          <div style={{ fontSize: 13, opacity: 0.7 }}>Niveau {user.level}</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'XP total',      value: user.xp,            icon: '⚡', color: C.orange, bg: C.orangeLt },
          { label: 'Série',         value: `${user.streak}j`,  icon: '🔥', color: C.green,  bg: C.greenLt  },
          { label: 'Niveau',        value: user.level,         icon: '🏆', color: C.violet, bg: C.violetLt },
          { label: 'Progression',   value: `${globalPct}%`,    icon: '📈', color: C.blue,   bg: C.blueLt   },
        ].map((s, i) => (
          <div key={i} style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 16, padding: '16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: C.text3 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Curriculum — 6 parties */}
      <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 16 }}>
        Curriculum — 6 Parties
      </h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.text3 }}>Chargement…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {parts.map(part => {
            const isExpanded = expandedPart === part.id
            const hasContent = part.total_lessons > 0
            const isLocked   = part.is_premium && !user.is_premium && !hasContent

            return (
              <div key={part.id} style={{
                background: C.white,
                border: `2px solid ${isExpanded && hasContent ? part.color : C.border}`,
                borderRadius: 20, overflow: 'hidden',
                transition: 'border-color .2s',
                opacity: isLocked ? 0.6 : 1,
              }}>
                {/* En-tête partie */}
                <button
                  onClick={() => hasContent && setExpandedPart(isExpanded ? null : part.id)}
                  style={{
                    width: '100%', padding: '18px 20px',
                    background: isExpanded && hasContent ? `${part.color}10` : C.white,
                    border: 'none', cursor: hasContent ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', gap: 14,
                    borderBottom: isExpanded && hasContent ? `1px solid ${part.color}20` : 'none',
                    transition: 'background .2s',
                  }}>

                  {/* Icône partie */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                    background: hasContent ? `${part.color}20` : C.bg,
                    border: `2px solid ${hasContent ? part.color + '40' : C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                  }}>
                    {isLocked ? '🔒' : part.icon}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: hasContent ? C.text : C.text3 }}>
                        Degré {part.degree} — {part.title.split('—')[1]?.trim() ?? part.title}
                      </span>
                      {part.is_premium && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: C.orangeLt, color: C.orange }}>PREMIUM</span>
                      )}
                      {!hasContent && (
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 8, background: C.bg, color: C.text3 }}>Bientôt</span>
                      )}
                    </div>
                    {hasContent && (
                      <ProgressBar
                        value={part.completed_lessons}
                        max={part.total_lessons}
                        color={part.color}
                        bg={`${part.color}15`}
                      />
                    )}
                    {!hasContent && (
                      <p style={{ fontSize: 12, color: C.text3 }}>{part.description}</p>
                    )}
                  </div>

                  {hasContent && (
                    <span style={{ fontSize: 18, color: part.color, flexShrink: 0, transition: 'transform .2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>▾</span>
                  )}
                </button>

                {/* Modules de la partie */}
                {isExpanded && hasContent && (
                  <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {part.modules.map((mod, mi) => {
                      const modPct = mod.lessons_count > 0 ? Math.round((mod.completed_count / mod.lessons_count) * 100) : 0
                      const isCompleted = mod.completed_count === mod.lessons_count && mod.lessons_count > 0

                      return (
                        <button key={mod.id}
                          onClick={() => router.push(`/module/${mod.id}`)}
                          style={{
                            background: C.bg, border: `2px solid ${C.border}`,
                            borderRadius: 14, padding: '14px 16px',
                            cursor: 'pointer', textAlign: 'left',
                            display: 'flex', alignItems: 'center', gap: 14,
                            transition: 'all .15s',
                          }}
                          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = part.color; el.style.background = `${part.color}08` }}
                          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.border; el.style.background = C.bg }}>

                          {/* Numéro module */}
                          <div style={{
                            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                            background: isCompleted ? part.color : `${part.color}20`,
                            color: isCompleted ? '#fff' : part.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, fontWeight: 700,
                          }}>
                            {isCompleted ? '✓' : `M${mod.sort_order}`}
                          </div>

                          {/* Info module */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {mod.title}
                            </p>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                              <div style={{ flex: 1, height: 4, background: `${part.color}20`, borderRadius: 2, overflow: 'hidden' }}>
                                <div style={{ height: '100%', background: part.color, width: `${modPct}%`, borderRadius: 2, transition: 'width .6s' }} />
                              </div>
                              <span style={{ fontSize: 11, color: C.text3, whiteSpace: 'nowrap' }}>{mod.completed_count}/{mod.lessons_count}</span>
                            </div>
                          </div>

                          {/* XP + flèche */}
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: C.orange }}>⚡ {mod.total_xp} XP</div>
                            <div style={{ fontSize: 12, color: part.color, fontWeight: 600, marginTop: 2 }}>
                              {modPct === 100 ? 'Terminé ✓' : modPct > 0 ? 'Continuer →' : 'Commencer →'}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
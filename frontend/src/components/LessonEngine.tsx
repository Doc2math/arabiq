import { useRef, useState, useCallback } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useTranslation } from 'react-i18next'
import type { Exercise, Lesson } from '@/types'
import MultipleChoice from './exercises/MultipleChoice'
import Pronunciation  from './exercises/Pronunciation'
import { animateProgressBar, animateXPBadge, animateParticleBurst, animateScoreReveal, animateStaggerIn } from '@/lib/gsap/animations'

interface Props { lesson: Lesson; onComplete: (score: number) => void }
interface Result { id: string; correct: boolean; xp: number }

export default function LessonEngine({ lesson, onComplete }: Props) {
  const { t } = useTranslation()
  const exercises = (lesson.content.exercises ?? []) as Exercise[]
  const [idx, setIdx]         = useState(0)
  const [results, setResults] = useState<Result[]>([])
  const [done, setDone]       = useState(false)
  const [totalXP, setTotalXP] = useState(0)

  const engineRef   = useRef<HTMLDivElement>(null)
  const cardRef     = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const xpBadgeRef  = useRef<HTMLDivElement>(null)
  const endRef      = useRef<HTMLDivElement>(null)
  const scoreArcRef = useRef<SVGCircleElement>(null)
  const scoreTxtRef = useRef<HTMLSpanElement>(null)
  const burstRef    = useRef<HTMLDivElement>(null)
  const badgesRef   = useRef<HTMLDivElement>(null)

  const current  = exercises[idx]
  const progress = idx / Math.max(exercises.length, 1)

  useGSAP(() => {
    gsap.fromTo(engineRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' })
  }, { scope: engineRef })

  const advance = useCallback((correct: boolean, xp: number) => {
    const newResults = [...results, { id: current.id, correct, xp }]
    setResults(newResults)

    if (correct && xpBadgeRef.current) {
      xpBadgeRef.current.textContent = `+${xp} XP`
      animateXPBadge(xpBadgeRef.current)
    }
    const nextIdx = idx + 1
    const isLast  = nextIdx >= exercises.length
    if (progressRef.current) animateProgressBar(progressRef.current, progress, nextIdx / exercises.length)

    gsap.to(cardRef.current, {
      opacity: 0, x: -30, duration: 0.22, ease: 'power2.in',
      onComplete: () => {
        if (isLast) {
          setTotalXP(newResults.reduce((s, r) => s + (r.correct ? r.xp : 0), 0))
          setDone(true)
        } else {
          setIdx(nextIdx)
          gsap.fromTo(cardRef.current, { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' })
        }
      },
    })
  }, [idx, results, current, exercises.length, progress])

  useGSAP(() => {
    if (!done || !endRef.current) return
    const finalScore = results.filter((r) => r.correct).length / results.length
    gsap.fromTo(endRef.current, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.5)' })
    gsap.delayedCall(0.35, () => { if (scoreArcRef.current && scoreTxtRef.current) animateScoreReveal(scoreArcRef.current, scoreTxtRef.current, finalScore) })
    gsap.delayedCall(0.9,  () => { if (finalScore >= 0.7 && burstRef.current) animateParticleBurst(burstRef.current, finalScore >= 0.9 ? 24 : 14, '#C9953A') })
    gsap.delayedCall(1.0,  () => { if (badgesRef.current) { const items = Array.from(badgesRef.current.querySelectorAll('.badge-item')); if (items.length) animateStaggerIn(items) } })
  }, { dependencies: [done] })

  const finalScore = results.length ? results.filter((r) => r.correct).length / results.length : 0

  if (!exercises.length) return <div className="text-center py-16 text-gray-400 text-sm">Aucun exercice.</div>

  return (
    <div ref={engineRef} className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div ref={xpBadgeRef} className="fixed top-14 right-5 bg-amber-400 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg pointer-events-none z-50 opacity-0" />

      {!done ? (
        <>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div ref={progressRef} className="h-full bg-brand-teal rounded-full" style={{ width: `${progress * 100}%` }} />
            </div>
            <span className="text-xs text-gray-400 shrink-0 tabular-nums">{idx + 1}/{exercises.length}</span>
          </div>
          <div ref={cardRef} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <ExerciseRouter exercise={current} onComplete={advance} />
          </div>
        </>
      ) : (
        <div ref={endRef} className="relative text-center space-y-6">
          <div ref={burstRef} className="absolute inset-0 pointer-events-none overflow-hidden" />
          <h2 className="text-xl font-display font-bold text-gray-900">{t('lesson.complete')}</h2>
          <div className="flex justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
                <circle cx="64" cy="64" r="54" fill="none" stroke="#E5E7EB" strokeWidth="7" />
                <circle ref={scoreArcRef} cx="64" cy="64" r="54" fill="none"
                  stroke={finalScore >= 0.8 ? '#1D9E75' : finalScore >= 0.5 ? '#C9953A' : '#E24B4A'}
                  strokeWidth="7" strokeLinecap="round" />
              </svg>
              <span ref={scoreTxtRef} className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-gray-900">0%</span>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-6 py-3 inline-block">
            <p className="text-amber-700 font-bold text-xl">+{totalXP} XP</p>
          </div>
          <div ref={badgesRef} className="space-y-2">
            {finalScore >= 1   && <div className="badge-item opacity-0 flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-xl px-4 py-2.5 text-sm text-purple-700 font-medium"><span>🏅</span> Score parfait !</div>}
            {finalScore >= 0.7 && <div className="badge-item opacity-0 flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-2.5 text-sm text-green-700 font-medium"><span>✅</span> Leçon validée</div>}
          </div>
          <button
            onClick={() => gsap.to(endRef.current, { opacity: 0, y: 10, duration: 0.2, onComplete: () => onComplete(finalScore) })}
            className="w-full py-3.5 rounded-xl bg-brand-teal text-white font-medium hover:bg-brand-teal-dark transition-colors">
            {finalScore >= 0.7 ? `${t('lesson.continue')} →` : 'Réessayer'}
          </button>
        </div>
      )}
    </div>
  )
}

function ExerciseRouter({ exercise, onComplete }: { exercise: Exercise; onComplete: (c: boolean, xp: number) => void }) {
  const wrap = (c: boolean) => onComplete(c, exercise.xpReward)
  switch (exercise.type) {
    case 'multiple_choice': return <MultipleChoice exercise={exercise} onComplete={wrap} />
    case 'pronunciation':   return <Pronunciation  exercise={exercise} onComplete={wrap} />
    default: return <div className="text-center py-8 text-gray-400 text-sm">Type "{(exercise as Exercise).type}" — à implémenter</div>
  }
}
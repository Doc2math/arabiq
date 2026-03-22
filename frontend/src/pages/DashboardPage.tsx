import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useAuth } from '@/hooks/useAuth'
import { curriculumService } from '@/services/curriculumService'
import { useProgressStore } from '@/store/progressStore'
import { useXPCounter } from '@/hooks/useGSAP'
import { animateStreakFire, animateCards } from '@/lib/gsap/animations'
import type { Module } from '@/types'

export default function DashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { streak } = useProgressStore()

  const { data: modules = [] } = useQuery({ queryKey: ['curriculum', 'modules'], queryFn: curriculumService.getModules, staleTime: 10 * 60_000 })
  const { data: nextLesson } = useQuery({ queryKey: ['curriculum', 'next-lesson'], queryFn: curriculumService.getNextLesson, staleTime: 60_000 })

  const pageRef   = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const xpBarRef  = useRef<HTMLDivElement>(null)
  const ctaRef    = useRef<HTMLDivElement>(null)
  const cardsRef  = useRef<HTMLDivElement>(null)
  const fireRef   = useRef<HTMLSpanElement>(null)

  const xpCounterRef = useXPCounter(0, user?.xp ?? 0, 1.5, true)

  useGSAP(() => {
    const tl = gsap.timeline()
    tl.fromTo(headerRef.current, { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' })
      .call(() => {
        const pct = ((user?.xp ?? 0) % 1000) / 1000
        gsap.fromTo(xpBarRef.current, { width: '0%' }, { width: `${pct * 100}%`, duration: 1, ease: 'power2.out' })
      }, [], '-=0.2')
      .fromTo(ctaRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, '-=0.3')
      .call(() => { if (fireRef.current) animateStreakFire(fireRef.current, streak?.current ?? 0) }, [], '-=0.2')
  }, { scope: pageRef, dependencies: [user?.xp] })

  useGSAP(() => {
    if (!cardsRef.current || !modules.length) return
    animateCards(Array.from(cardsRef.current.querySelectorAll('.module-card')), 'up')
  }, { dependencies: [modules.length] })

  const onCardEnter = (el: EventTarget) => gsap.to(el as Element, { y: -4, duration: 0.2, ease: 'power2.out' })
  const onCardLeave = (el: EventTarget) => gsap.to(el as Element, { y: 0,  duration: 0.3, ease: 'back.out(2)' })

  return (
    <div ref={pageRef} className="max-w-2xl mx-auto px-4 py-8 space-y-7">

      <div ref={headerRef} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">
            {t('dashboard.welcome', { name: user?.username })}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{t('dashboard.level', { level: user?.level ?? 1 })}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 text-sm font-medium px-3 py-1.5 rounded-full border border-amber-200">
            <span ref={fireRef} style={{ fontSize: 16 }}>🔥</span>
            <span>{streak?.current ?? 0}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-brand-teal/10 text-brand-teal text-sm font-medium px-3 py-1.5 rounded-full">
            <span style={{ fontSize: 14 }}>⭐</span>
            <span ref={xpCounterRef}>{user?.xp ?? 0}</span>
          </div>
        </div>
      </div>

      <div className="bg-surface-secondary rounded-xl p-4">
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>Niveau {user?.level ?? 1}</span>
          <span>{(user?.xp ?? 0) % 1000} / 1000 XP</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div ref={xpBarRef} className="h-full bg-brand-teal rounded-full" style={{ width: '0%' }} />
        </div>
      </div>

      {nextLesson && (
        <div ref={ctaRef}>
          <Link to={`/lesson/${nextLesson.id}`}
            className="block w-full rounded-2xl bg-brand-teal text-white p-5 hover:bg-brand-teal-dark transition-colors group"
            onMouseEnter={(e) => gsap.to(e.currentTarget, { scale: 1.01, duration: 0.2 })}
            onMouseLeave={(e) => gsap.to(e.currentTarget, { scale: 1, duration: 0.25, ease: 'back.out(2)' })}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide opacity-70 mb-1">{t('dashboard.continueLesson')}</p>
                <p className="text-lg font-semibold">{nextLesson.title}</p>
                <p className="text-sm opacity-70 mt-0.5">+{nextLesson.xpReward} XP · {nextLesson.durationMinutes} min</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">→</div>
            </div>
          </Link>
        </div>
      )}

      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Curriculum</h2>
        <div ref={cardsRef} className="space-y-3">
          {modules.map((mod) => (
            <ModuleCard key={mod.id} module={mod} onMouseEnter={onCardEnter} onMouseLeave={onCardLeave} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ModuleCard({ module: mod, onMouseEnter, onMouseLeave }: {
  module: Module
  onMouseEnter: (e: EventTarget) => void
  onMouseLeave: (e: EventTarget) => void
}) {
  const { t } = useTranslation()
  return (
    <div
      className={`module-card opacity-0 rounded-xl border p-4 flex items-center gap-4 ${mod.isLocked ? 'border-gray-100 bg-gray-50 pointer-events-none' : mod.completionRate === 1 ? 'border-green-100 bg-green-50' : 'border-white bg-white shadow-sm'}`}
      onMouseEnter={(e) => !mod.isLocked && onMouseEnter(e.currentTarget)}
      onMouseLeave={(e) => !mod.isLocked && onMouseLeave(e.currentTarget)}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${mod.isLocked ? 'bg-gray-200' : 'bg-brand-teal/10'}`}>
        {mod.isLocked ? '🔒' : mod.completionRate === 1 ? '✅' : '📖'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm truncate">Module {mod.id} — {mod.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{t('modules.lessons', { count: mod.lessonsCount })}</p>
        {!mod.isLocked && mod.completionRate > 0 && (
          <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-brand-teal rounded-full" style={{ width: `${mod.completionRate * 100}%` }} />
          </div>
        )}
      </div>
      {!mod.isLocked && (
        <Link to={`/module/${mod.id}`} className="text-brand-teal text-sm font-medium hover:underline shrink-0" onClick={(e) => e.stopPropagation()}>→</Link>
      )}
    </div>
  )
}
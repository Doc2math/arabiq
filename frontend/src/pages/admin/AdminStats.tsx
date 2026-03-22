import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { api } from '@/lib/apiClient'

// ── Types ──────────────────────────────────────────────────────
interface Stats {
  totalUsers: number
  activeToday: number
  activeThisWeek: number
  premiumUsers: number
  totalLessonsCompleted: number
  totalXPAwarded: number
  avgStreakDays: number
  topModules: { title: string; completions: number }[]
}

// ── Fake stats (remplacer par vraie API en Phase 2) ────────────
const MOCK_STATS: Stats = {
  totalUsers: 142,
  activeToday: 23,
  activeThisWeek: 87,
  premiumUsers: 18,
  totalLessonsCompleted: 1247,
  totalXPAwarded: 48920,
  avgStreakDays: 4.2,
  topModules: [
    { title: "L'Alphabet Augmenté", completions: 89 },
    { title: 'Les Premiers Pas',    completions: 34 },
    { title: 'Le Voyageur Temporel', completions: 12 },
  ],
}

const METRICS = [
  { key: 'totalUsers',            label: 'Utilisateurs',        icon: '👥', color: 'bg-blue-50   text-blue-700'   },
  { key: 'activeToday',           label: 'Actifs aujourd\'hui', icon: '⚡', color: 'bg-green-50  text-green-700'  },
  { key: 'activeThisWeek',        label: 'Actifs cette semaine', icon: '📅', color: 'bg-teal-50   text-teal-700'   },
  { key: 'premiumUsers',          label: 'Abonnés premium',     icon: '⭐', color: 'bg-amber-50  text-amber-700'  },
  { key: 'totalLessonsCompleted', label: 'Leçons complétées',   icon: '📖', color: 'bg-purple-50 text-purple-700' },
  { key: 'totalXPAwarded',        label: 'XP distribués',       icon: '🏆', color: 'bg-orange-50 text-orange-700' },
]

export default function AdminStats() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.fromTo(
      containerRef.current?.querySelectorAll('.stat-card') ?? [],
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', stagger: 0.06 }
    )
  }, { scope: containerRef })

  const stats = MOCK_STATS

  return (
    <div ref={containerRef} className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">Statistiques</h1>
        <p className="text-sm text-gray-500 mt-0.5">Vue d'ensemble de la plateforme</p>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {METRICS.map(({ key, label, icon, color }) => (
          <div key={key} className="stat-card opacity-0 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${color} text-xl mb-3`}>
              {icon}
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {(stats[key as keyof Stats] as number).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Métriques secondaires */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Streak moyen */}
        <div className="stat-card opacity-0 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide">
            Streak moyen
          </h2>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-brand-teal">{stats.avgStreakDays}</span>
            <span className="text-gray-500 text-sm mb-1">jours</span>
          </div>
          <div className="mt-3 h-2 bg-gray-100 rounded-full">
            <div
              className="h-full bg-brand-teal rounded-full"
              style={{ width: `${(stats.avgStreakDays / 30) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">sur 30 jours max</p>
        </div>

        {/* Top modules */}
        <div className="stat-card opacity-0 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide">
            Modules les plus suivis
          </h2>
          <div className="space-y-3">
            {stats.topModules.map((mod, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 truncate">{mod.title}</span>
                  <span className="text-gray-400 shrink-0 ml-2">{mod.completions}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full">
                  <div
                    className="h-full bg-brand-teal rounded-full transition-all"
                    style={{ width: `${(mod.completions / stats.topModules[0].completions) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Taux de conversion */}
      <div className="stat-card opacity-0 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide">
          Entonnoir de conversion
        </h2>
        <div className="grid grid-cols-4 gap-4 text-center">
          {[
            { label: 'Inscrits',   value: stats.totalUsers,    pct: 100 },
            { label: 'Actifs/sem', value: stats.activeThisWeek, pct: Math.round((stats.activeThisWeek / stats.totalUsers) * 100) },
            { label: 'Premium',   value: stats.premiumUsers,   pct: Math.round((stats.premiumUsers / stats.totalUsers) * 100) },
            { label: 'Actifs/jour', value: stats.activeToday,  pct: Math.round((stats.activeToday / stats.totalUsers) * 100) },
          ].map(({ label, value, pct }) => (
            <div key={label}>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              <div className="mt-2 h-1.5 bg-gray-100 rounded-full">
                <div className="h-full bg-brand-teal rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <div className="text-xs text-gray-400 mt-0.5">{pct}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
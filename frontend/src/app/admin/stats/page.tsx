'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'

const C = {
  violet:'#6C3FC5', violetLt:'#EDE8FB', violetDk:'#4A2A8A',
  orange:'#F07C1E', orangeLt:'#FEF0E3',
  green:'#2BA84A', greenLt:'#E3F7E8',
  blue:'#1976D2', blueLt:'#E6F1FB',
  red:'#E24B4A', redLt:'#FCEBEB',
  gold:'#F9A825', goldLt:'#FFF8E1',
  bg:'#F8F7FF', white:'#fff',
  text:'#1A1A2E', text2:'#5A5A7A', text3:'#9A9AB0',
  border:'#E8E4F8',
}

interface Stats {
  users: number
  lessons_completed: number
  xp_distributed: number
  active_modules: number
}

interface TopUser {
  username: string
  xp: number
  level: number
  streak: number
}

function StatCard({ icon, value, label, color, bg, sublabel }: {
  icon: string; value: string | number; label: string; color: string; bg: string; sublabel?: string
}) {
  return (
    <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 18, padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
        <div>
          <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
          <div style={{ fontSize: 12, color: C.text3 }}>{label}</div>
        </div>
      </div>
      {sublabel && <p style={{ fontSize: 11, color: C.text3, borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>{sublabel}</p>}
    </div>
  )
}

function ProgressBar({ value, max, color, bg }: { value: number; max: number; color: string; bg: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div>
      <div style={{ height: 8, background: bg, borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 4, background: color, width: `${pct}%`, transition: 'width .8s' }} />
      </div>
    </div>
  )
}

export default function AdminStatsPage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<Stats | null>(null)
  const [topUsers, setTopUsers] = useState<TopUser[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('month')

  useEffect(() => {
    Promise.all([
      api.get('/api/v1/admin/stats'),
      api.get('/api/v1/admin/users?limit=10'),
    ]).then(([statsRes, usersRes]) => {
      setStats(statsRes.data)
      const sorted = [...usersRes.data].sort((a: any, b: any) => b.xp - a.xp)
      setTopUsers(sorted.slice(0, 5))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [period])

  if (!user) return null

  const avgXP = topUsers.length > 0 ? Math.round(topUsers.reduce((s, u) => s + u.xp, 0) / topUsers.length) : 0
  const maxXP = topUsers.length > 0 ? Math.max(...topUsers.map(u => u.xp)) : 1

  const LESSON_TYPES = [
    { label: 'Identification', count: 2, color: C.violet, bg: C.violetLt },
    { label: 'Harakat',        count: 3, color: C.orange, bg: C.orangeLt },
    { label: 'Vocabulaire',    count: 2, color: C.green,  bg: C.greenLt  },
    { label: 'Écriture',       count: 1, color: C.blue,   bg: C.blueLt   },
    { label: 'Exercices',      count: 1, color: '#9C27B0', bg: '#F3E5F5' },
    { label: 'Lecture',        count: 1, color: C.orange, bg: C.orangeLt },
    { label: 'Évaluation',     count: 1, color: '#E91E63', bg: '#FCE4EC' },
  ]
  const totalLessons = LESSON_TYPES.reduce((s, t) => s + t.count, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* Header + filtres */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 4 }}>📈 Statistiques</h1>
          <p style={{ fontSize: 13, color: C.text2 }}>Vue d'ensemble de la plateforme</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['week','month','all'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ padding: '7px 14px', borderRadius: 10, border: `2px solid ${period === p ? C.violet : C.border}`, background: period === p ? C.violetLt : C.white, color: period === p ? C.violet : C.text2, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              {p === 'week' ? '7 jours' : p === 'month' ? '30 jours' : 'Tout'}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs principaux */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.text3 }}>Chargement…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          <StatCard icon="👥" value={stats?.users ?? 0}          label="Utilisateurs"        color={C.violet} bg={C.violetLt} sublabel="inscrits au total" />
          <StatCard icon="✓"  value={stats?.lessons_completed ?? 0} label="Leçons complétées" color={C.green}  bg={C.greenLt}  sublabel="toutes sessions" />
          <StatCard icon="⚡" value={(stats?.xp_distributed ?? 0).toLocaleString()} label="XP distribués" color={C.orange} bg={C.orangeLt} sublabel="au total" />
          <StatCard icon="📚" value={stats?.active_modules ?? 0} label="Modules actifs"      color={C.blue}   bg={C.blueLt}   sublabel="disponibles" />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

        {/* Top utilisateurs */}
        <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 20, padding: '20px 24px' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 16 }}>🏆 Top apprenants</h3>
          {topUsers.length === 0 ? (
            <p style={{ fontSize: 13, color: C.text3, textAlign: 'center', padding: 20 }}>Aucun utilisateur</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topUsers.map((u, i) => (
                <div key={u.username} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16, width: 24, textAlign: 'center', flexShrink: 0 }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                    </span>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: C.violetLt, color: C.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                      {u.username.slice(0, 2).toUpperCase()}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text, flex: 1 }}>{u.username}</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.orange }}>{u.xp} XP</span>
                      <div style={{ fontSize: 10, color: C.text3 }}>Niv. {u.level}</div>
                    </div>
                  </div>
                  <ProgressBar value={u.xp} max={maxXP} color={i === 0 ? C.gold : C.violet} bg={C.violetLt} />
                </div>
              ))}
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, marginTop: 4 }}>
                <p style={{ fontSize: 12, color: C.text3 }}>Moyenne XP : <strong style={{ color: C.orange }}>{avgXP}</strong></p>
              </div>
            </div>
          )}
        </div>

        {/* Répartition des leçons */}
        <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 20, padding: '20px 24px' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 16 }}>📖 Contenu par type</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {LESSON_TYPES.map(lt => (
              <div key={lt.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{lt.label}</span>
                  <span style={{ fontSize: 12, color: lt.color, fontWeight: 700 }}>{lt.count} leçon{lt.count > 1 ? 's' : ''}</span>
                </div>
                <ProgressBar value={lt.count} max={totalLessons} color={lt.color} bg={lt.bg} />
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, marginTop: 12 }}>
            <p style={{ fontSize: 12, color: C.text3 }}>Total : <strong style={{ color: C.text }}>{totalLessons} leçons</strong> — Module 1</p>
          </div>
        </div>
      </div>

      {/* Métriques pédagogiques */}
      <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 20, padding: '20px 24px' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 16 }}>🎯 Métriques pédagogiques</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          {[
            { label: 'Taux de complétion', value: stats?.lessons_completed && stats.users > 0 ? `${Math.round(stats.lessons_completed / stats.users)}` : '0', unit: 'leçons/user', color: C.green },
            { label: 'XP moyen/user', value: stats?.xp_distributed && stats.users > 0 ? Math.round(stats.xp_distributed / stats.users) : 0, unit: 'XP', color: C.orange },
            { label: 'Modules disponibles', value: stats?.active_modules ?? 0, unit: 'modules', color: C.violet },
            { label: 'Exercices total', value: 78, unit: 'exercices', color: C.blue },
          ].map((m, i) => (
            <div key={i} style={{ background: C.bg, borderRadius: 14, padding: '16px' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: m.color, marginBottom: 4 }}>{m.value}</div>
              <div style={{ fontSize: 11, color: C.text3, marginBottom: 2 }}>{m.unit}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text2 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
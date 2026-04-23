'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { curriculumApi } from '@/lib/api'

interface Module {
  id: number
  slug: string
  title: string
  description: string
  sort_order: number
  is_premium: boolean
}

const C = {
  violet:'#6C3FC5', violetLt:'#EDE8FB', violetDk:'#4A2A8A',
  orange:'#F07C1E', orangeLt:'#FEF0E3',
  green:'#2BA84A', greenLt:'#E3F7E8',
  blue:'#1976D2', blueLt:'#E6F1FB',
  bg:'#F8F7FF', white:'#fff',
  text:'#1A1A2E', text2:'#5A5A7A', text3:'#9A9AB0',
  border:'#E8E4F8',
}

const MODULE_COLORS = [
  { bg:'#EDE8FB', border:'#6C3FC5', text:'#4A2A8A', icon:'✏️' },
  { bg:'#FEF0E3', border:'#F07C1E', text:'#7A3A00', icon:'📖' },
  { bg:'#E3F7E8', border:'#2BA84A', text:'#1A6630', icon:'💬' },
  { bg:'#E6F1FB', border:'#1976D2', text:'#0D47A1', icon:'🎯' },
  { bg:'#F3E5F5', border:'#9C27B0', text:'#6A0080', icon:'⭐' },
]

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    curriculumApi.modules()
      .then(res => setModules(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (!user) return null 

  return (
    <div style={{ maxWidth:1020 , margin: '0 auto', padding: '32px 24px' }}>

      {/* Bienvenue */}
      <div style={{
        background: C.violet, borderRadius: 24, padding: '28px 32px',
        marginBottom: 28, color: '#fff',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <p style={{ fontSize: 14, opacity: 0.75, marginBottom: 6 }}>Bon retour,</p>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>
            {user.username} 👋
          </h1>
          <p style={{ fontSize: 14, opacity: 0.8 }}>
            Continuez votre apprentissage de l&apos;arabe
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 48, marginBottom: 4 }}>🌙</div>
          <div style={{ fontSize: 13, opacity: 0.7 }}>Niveau {user.level}</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'XP total', value: user.xp, icon: '⚡', color: C.orange, bg: C.orangeLt },
          { label: 'Série actuelle', value: `${user.streak} jours`, icon: '🔥', color: C.green, bg: C.greenLt },
          { label: 'Niveau', value: user.level, icon: '🏆', color: C.violet, bg: C.violetLt },
        ].map((s, i) => (
          <div key={i} style={{
            background: C.white, border: `2px solid ${C.border}`,
            borderRadius: 18, padding: '18px 20px',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: s.bg, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 22, flexShrink: 0,
            }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: C.text3 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Modules */}
      <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 16 }}>
        Modules d&apos;apprentissage
      </h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.text3 }}>Chargement…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {modules.map((mod, i) => {
            const mc = MODULE_COLORS[i % MODULE_COLORS.length]
            return (
              <button key={mod.id}
                onClick={() => router.push(`/module/${mod.id}`)}
                style={{
                  background: C.white, border: `2px solid ${C.border}`,
                  borderRadius: 20, padding: '20px', cursor: 'pointer',
                  textAlign: 'left', transition: 'all .15s',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = mc.border
                  el.style.transform = 'translateY(-3px)'
                  el.style.boxShadow = `0 8px 24px ${mc.border}25`
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = C.border
                  el.style.transform = 'none'
                  el.style.boxShadow = 'none'
                }}>

                {/* Icône */}
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: mc.bg, border: `2px solid ${mc.border}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, marginBottom: 14,
                }}>
                  {mc.icon}
                </div>

                {/* Titre */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                    {mod.title}
                  </span>
                  {mod.is_premium && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: C.orange,
                      background: C.orangeLt, padding: '2px 8px', borderRadius: 8,
                    }}>PREMIUM</span>
                  )}
                </div>

                <p style={{
                  fontSize: 12, color: C.text2, marginBottom: 14,
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  display: '-webkit-box', WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical' as any,
                }}>
                  {mod.description}
                </p>

                {/* Barre progression placeholder */}
                <div style={{ height: 6, background: mc.bg, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '0%', background: mc.border, borderRadius: 3 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: C.text3 }}>0 leçons complétées</span>
                  <span style={{ fontSize: 11, color: mc.border, fontWeight: 700 }}>Commencer →</span>
                </div>
              </button>
            )
          })}

          {modules.length === 0 && (
            <div style={{
              gridColumn: '1 / -1', textAlign: 'center', padding: 48,
              background: C.white, borderRadius: 20, border: `2px solid ${C.border}`,
              color: C.text3,
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
              <p>Aucun module disponible pour le moment.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
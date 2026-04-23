'use client'

import { useAuthStore } from '@/store/authStore'

const C = {
  violet:'#6C3FC5', violetLt:'#EDE8FB',
  orange:'#F07C1E', orangeLt:'#FEF0E3',
  green:'#2BA84A', greenLt:'#E3F7E8',
  gold:'#F9A825', goldLt:'#FFF8E1',
  bg:'#F8F7FF', white:'#fff',
  text:'#1A1A2E', text2:'#5A5A7A', text3:'#9A9AB0',
  border:'#E8E4F8',
}

const ALL_BADGES = [
  { id: 'first_lesson',   icon: '🌱', name: 'Premier pas',      desc: 'Compléter votre première leçon',        color: C.green,  bg: C.greenLt,  xp: 50,  earned: true  },
  { id: 'streak_3',       icon: '🔥', name: 'Flamme',           desc: 'Maintenir une série de 3 jours',        color: C.orange, bg: C.orangeLt, xp: 100, earned: true  },
  { id: 'module_1',       icon: '🏆', name: 'Module 1 terminé', desc: 'Compléter tout le Module 1',            color: C.gold,   bg: C.goldLt,   xp: 200, earned: false },
  { id: 'perfect_score',  icon: '⭐', name: 'Score parfait',    desc: 'Obtenir 100% à une leçon',             color: C.gold,   bg: C.goldLt,   xp: 150, earned: false },
  { id: 'streak_7',       icon: '💫', name: 'Semaine de feu',   desc: 'Maintenir une série de 7 jours',        color: C.orange, bg: C.orangeLt, xp: 200, earned: false },
  { id: 'writer',         icon: '✍️', name: 'Calligraphe',      desc: 'Compléter toutes les leçons d\'écriture', color: C.violet, bg: C.violetLt, xp: 175, earned: false },
  { id: 'vocabulary_50',  icon: '📚', name: 'Vocabulaire',      desc: 'Apprendre 50 mots arabes',              color: C.violet, bg: C.violetLt, xp: 300, earned: false },
  { id: 'streak_30',      icon: '🌟', name: 'Mois de feu',      desc: 'Maintenir une série de 30 jours',       color: C.gold,   bg: C.goldLt,   xp: 500, earned: false },
]

export default function BadgesPage() {
  const { user } = useAuthStore()
  if (!user) return null

  const earned = ALL_BADGES.filter(b => b.earned)
  const locked = ALL_BADGES.filter(b => !b.earned)

  return (
    <div style={{ maxWidth: 1020, margin: '0 auto', padding: '32px 24px' }}>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 6 }}>🏅 Mes badges</h1>
        <p style={{ fontSize: 14, color: C.text2 }}>{earned.length} badge{earned.length !== 1 ? 's' : ''} obtenu{earned.length !== 1 ? 's' : ''} sur {ALL_BADGES.length}</p>
      </div>

      {/* Progression */}
      <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 16, padding: '16px 20px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Progression</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.violet }}>{Math.round(earned.length / ALL_BADGES.length * 100)}%</span>
        </div>
        <div style={{ height: 8, background: C.violetLt, borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: C.violet, borderRadius: 4, width: `${earned.length / ALL_BADGES.length * 100}%`, transition: 'width .8s' }} />
        </div>
      </div>

      {/* Badges obtenus */}
      {earned.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 14 }}>✅ Obtenus</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {earned.map(badge => (
              <div key={badge.id} style={{ background: C.white, border: `2px solid ${badge.color}40`, borderRadius: 16, padding: '18px', textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: badge.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 10px' }}>{badge.icon}</div>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>{badge.name}</p>
                <p style={{ fontSize: 11, color: C.text3, marginBottom: 8 }}>{badge.desc}</p>
                <span style={{ fontSize: 11, fontWeight: 700, background: badge.bg, color: badge.color, padding: '3px 10px', borderRadius: 10 }}>+{badge.xp} XP</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badges à débloquer */}
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 14 }}>🔒 À débloquer</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {locked.map(badge => (
            <div key={badge.id} style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 16, padding: '18px', textAlign: 'center', opacity: 0.6 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 10px', filter: 'grayscale(1)' }}>{badge.icon}</div>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>{badge.name}</p>
              <p style={{ fontSize: 11, color: C.text3, marginBottom: 8 }}>{badge.desc}</p>
              <span style={{ fontSize: 11, fontWeight: 700, background: C.bg, color: C.text3, padding: '3px 10px', borderRadius: 10 }}>+{badge.xp} XP</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
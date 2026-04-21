'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'

const C = {
  violet:'#6C3FC5', violetLt:'#EDE8FB', violetDk:'#4A2A8A',
  orange:'#F07C1E', orangeLt:'#FEF0E3',
  green:'#2BA84A', greenLt:'#E3F7E8',
  gold:'#F9A825', goldLt:'#FFF8E1',
  silver:'#78909C', silverLt:'#ECEFF1',
  bronze:'#A1887F', bronzeLt:'#EFEBE9',
  bg:'#F8F7FF', white:'#fff',
  text:'#1A1A2E', text2:'#5A5A7A', text3:'#9A9AB0',
  border:'#E8E4F8',
}

interface RankUser {
  rank: number
  id: string
  username: string
  xp: number
  level: number
  streak: number
  is_current_user: boolean
}

const RANK_CONFIG = [
  { color: C.gold,   bg: C.goldLt,   border: C.gold,   medal: '🥇', label: '1er' },
  { color: C.silver, bg: C.silverLt, border: C.silver, medal: '🥈', label: '2ème' },
  { color: C.bronze, bg: C.bronzeLt, border: C.bronze, medal: '🥉', label: '3ème' },
]

export default function RankingPage() {
  const { user } = useAuthStore()
  const [ranking, setRanking] = useState<RankUser[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'all'|'week'|'month'>('all')

  useEffect(() => {
    api.get(`/api/v1/admin/users?limit=20`)
      .then(res => {
        const users = res.data as any[]
        const sorted = [...users].sort((a, b) => b.xp - a.xp)
        setRanking(sorted.map((u, i) => ({
          rank: i + 1,
          id: u.id,
          username: u.username,
          xp: u.xp,
          level: u.level,
          streak: u.streak ?? 0,
          is_current_user: u.id === user?.id,
        })))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [period])

  if (!user) return null

  const myRank = ranking.find(r => r.is_current_user)
  const top3   = ranking.slice(0, 3)
  const rest   = ranking.slice(3)

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 6 }}>🏆 Classement</h1>
        <p style={{ fontSize: 14, color: C.text2 }}>Comparez votre progression avec les autres apprenants</p>
      </div>

      {/* Filtres période */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {([['all','Tout temps'],['week','Cette semaine'],['month','Ce mois']] as const).map(([v, l]) => (
          <button key={v} onClick={() => setPeriod(v)}
            style={{
              padding: '8px 16px', borderRadius: 20, border: `2px solid ${period === v ? C.violet : C.border}`,
              background: period === v ? C.violetLt : C.white,
              color: period === v ? C.violet : C.text2,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
            {l}
          </button>
        ))}
      </div>

      {/* Mon rang */}
      {myRank && (
        <div style={{
          background: `linear-gradient(135deg, ${C.violet}, #9B59B6)`,
          borderRadius: 20, padding: '20px 24px', marginBottom: 24, color: '#fff',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 }}>
            #{myRank.rank}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 2 }}>Votre position</p>
            <p style={{ fontSize: 18, fontWeight: 700 }}>{myRank.username}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 22, fontWeight: 700 }}>{myRank.xp}</p>
            <p style={{ fontSize: 12, opacity: 0.8 }}>XP</p>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.text3 }}>Chargement…</div>
      ) : (
        <>
          {/* Podium top 3 */}
          {top3.length > 0 && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'flex-end' }}>
              {/* 2ème */}
              {top3[1] && (
                <div style={{ flex: 1, background: C.silverLt, border: `2px solid ${C.silver}40`, borderRadius: 16, padding: '16px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>🥈</div>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.silver, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, margin: '0 auto 8px' }}>
                    {top3[1].username.slice(0, 2).toUpperCase()}
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>{top3[1].username}</p>
                  <p style={{ fontSize: 12, color: C.silver, fontWeight: 700 }}>{top3[1].xp} XP</p>
                </div>
              )}

              {/* 1er */}
              {top3[0] && (
                <div style={{ flex: 1, background: C.goldLt, border: `2px solid ${C.gold}40`, borderRadius: 16, padding: '20px 12px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>🥇</div>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: C.gold, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, margin: '0 auto 8px' }}>
                    {top3[0].username.slice(0, 2).toUpperCase()}
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2 }}>{top3[0].username}</p>
                  <p style={{ fontSize: 13, color: C.gold, fontWeight: 700 }}>{top3[0].xp} XP</p>
                </div>
              )}

              {/* 3ème */}
              {top3[2] && (
                <div style={{ flex: 1, background: C.bronzeLt, border: `2px solid ${C.bronze}40`, borderRadius: 16, padding: '16px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>🥉</div>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.bronze, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, margin: '0 auto 8px' }}>
                    {top3[2].username.slice(0, 2).toUpperCase()}
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>{top3[2].username}</p>
                  <p style={{ fontSize: 12, color: C.bronze, fontWeight: 700 }}>{top3[2].xp} XP</p>
                </div>
              )}
            </div>
          )}

          {/* Liste */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rest.map(u => (
              <div key={u.id}
                style={{
                  background: u.is_current_user ? C.violetLt : C.white,
                  border: `2px solid ${u.is_current_user ? C.violet : C.border}`,
                  borderRadius: 14, padding: '14px 18px',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text3, width: 28, textAlign: 'center', flexShrink: 0 }}>
                  #{u.rank}
                </span>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: u.is_current_user ? C.violet : C.violetLt, color: u.is_current_user ? '#fff' : C.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                  {u.username.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: u.is_current_user ? C.violet : C.text }}>
                    {u.username} {u.is_current_user && <span style={{ fontSize: 11, color: C.violet }}>(vous)</span>}
                  </span>
                  <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
                    <span style={{ fontSize: 11, color: C.text3 }}>Niv. {u.level}</span>
                    {u.streak > 0 && <span style={{ fontSize: 11, color: C.orange }}>🔥 {u.streak}j</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: u.is_current_user ? C.violet : C.orange }}>{u.xp}</span>
                  <span style={{ fontSize: 11, color: C.text3, marginLeft: 3 }}>XP</span>
                </div>
              </div>
            ))}
          </div>

          {ranking.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: C.text3 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
              <p>Soyez le premier à rejoindre le classement !</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
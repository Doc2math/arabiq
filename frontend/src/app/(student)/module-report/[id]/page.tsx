'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'

const C = {
  violet:'#6C3FC5', violetLt:'#EDE8FB', violetDk:'#4A2A8A',
  orange:'#F07C1E', orangeLt:'#FEF0E3', orangeDk:'#B85A0E',
  green:'#2BA84A', greenLt:'#E3F7E8', greenDk:'#1A6630',
  blue:'#1976D2', blueLt:'#E6F1FB',
  red:'#E24B4A', redLt:'#FCEBEB',
  bg:'#F8F7FF', white:'#fff',
  text:'#1A1A2E', text2:'#5A5A7A', text3:'#9A9AB0',
  border:'#E8E4F8',
}

interface SkillReport {
  skill_id: string
  skill_name: string
  mastery: number
  attempts: number
  correct: number
  status: 'mastered' | 'good' | 'in_progress' | 'weak'
  recommended_exercises: number
}

interface BKTReport {
  module_id: number
  module_title: string
  tj_score: number
  eg_score: number
  overall_score: number
  passed: boolean
  skills: SkillReport[]
  recommendation: string
  diagnostic: string
  generated_at: string
}

const STATUS_CONFIG = {
  mastered:    { label: 'Maîtrisé',       color: C.green,  bg: C.greenLt,  icon: '⭐' },
  good:        { label: 'Bien',           color: C.blue,   bg: C.blueLt,   icon: '✓'  },
  in_progress: { label: 'En cours',       color: C.orange, bg: C.orangeLt, icon: '↗'  },
  weak:        { label: 'À retravailler', color: C.red,    bg: C.redLt,    icon: '↺'  },
}

function ScoreGauge({ value, color, label }: { value: number; color: string; label: string }) {
  const pct = Math.round(value * 100)
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontSize: 36, fontWeight: 700, color, lineHeight: 1, marginBottom: 4 }}>{pct}%</div>
      <div style={{ height: 8, background: C.border, borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 1s' }} />
      </div>
      <div style={{ fontSize: 12, color: C.text3, fontWeight: 600 }}>{label}</div>
    </div>
  )
}

function DiagnosticBadge({ diagnostic }: { diagnostic: string }) {
  const isGood    = diagnostic.startsWith('✅')
  const isOubli   = diagnostic.includes('Oubli')
  const isCourt   = diagnostic.includes('court terme')
  const isLacune  = diagnostic.startsWith('❌')

  const config = isGood
    ? { bg: C.greenLt, border: C.green, color: C.greenDk, icon: '✅' }
    : isLacune
    ? { bg: C.redLt, border: C.red, color: C.red, icon: '❌' }
    : { bg: C.orangeLt, border: C.orange, color: C.orangeDk, icon: '⚠️' }

  // Retirer l'emoji du début du texte
  const text = diagnostic.replace(/^[✅⚠️❌]\s*/, '')
  const [title, ...rest] = text.split(' — ')

  return (
    <div style={{
      background: config.bg,
      border: `2px solid ${config.border}40`,
      borderLeft: `4px solid ${config.border}`,
      borderRadius: '0 14px 14px 0',
      padding: '16px 18px',
      marginBottom: 20,
    }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: config.color, marginBottom: 6 }}>
        {config.icon} {title}
      </p>
      <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.7 }}>
        {rest.join(' — ')}
      </p>
    </div>
  )
}

export default function ModuleReportPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const { user } = useAuthStore()
  const moduleId = Number(id)

  const [report, setReport]     = useState<BKTReport | null>(null)
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    // Vider le cache pour forcer le recalcul
    const cached = localStorage.getItem('langdad_last_report')
    if (cached) {
      try {
        const r = JSON.parse(cached)
        if (r.module_id === moduleId && r.tj_score !== undefined) {
          setReport(r); setLoading(false); return
        }
      } catch {}
    }
    api.get(`/api/v1/bkt/evaluate/${moduleId}`)
      .then(res => {
        setReport(res.data)
        localStorage.setItem('langdad_last_report', JSON.stringify(res.data))
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [moduleId])

  if (!user) return null
  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: C.text3 }}>Chargement du rapport…</div>
  if (notFound || !report) return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
      <p style={{ fontSize: 15, color: C.text2, marginBottom: 24 }}>Rapport non disponible. Terminez l&apos;évaluation du module.</p>
      <button onClick={() => router.push(`/module/${moduleId}`)}
        style={{ padding: '12px 28px', borderRadius: 14, background: C.violet, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
        ← Retour au module
      </button>
    </div>
  )

  const tj      = report.tj_score  ?? 0
  const eg      = report.eg_score  ?? 0
  const overall = report.overall_score
  const score   = Math.round(overall * 100)
  const scoreColor = score >= 70 ? C.green : score >= 50 ? C.orange : C.red

  return (
    <div style={{ maxWidth: 1020, margin: '0 auto', padding: '24px 20px 48px' }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button onClick={() => router.push(`/module/${moduleId}`)}
          style={{ width: 38, height: 38, borderRadius: '50%', border: `2px solid ${C.violet}`, background: C.violetLt, color: C.violet, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>←</button>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Rapport pédagogique</h1>
          <p style={{ fontSize: 12, color: C.text3 }}>{report.module_title} · {new Date(report.generated_at).toLocaleDateString('fr-FR')}</p>
        </div>
      </div>

      {/* ── Bloc TJ + EG + Moyenne ── */}
      <div style={{
        background: C.white, border: `2px solid ${C.border}`,
        borderRadius: 24, padding: '24px', marginBottom: 20,
      }}>
        {/* Moyenne finale en grand */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 72, fontWeight: 700, color: scoreColor, lineHeight: 1, marginBottom: 8 }}>
            {score}%
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 20, background: report.passed ? C.greenLt : C.orangeLt }}>
            <span style={{ fontSize: 16 }}>{report.passed ? '🏅' : '💪'}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: report.passed ? C.greenDk : C.orange }}>
              {report.passed ? 'Module réussi' : 'Continuez à pratiquer'}
            </span>
          </div>
        </div>

        {/* Séparateur */}
        <div style={{ height: 1, background: C.border, margin: '0 0 20px' }} />

        {/* TJ + EG côte à côte */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>

          {/* TJ */}
          <div style={{
            flex: 1, background: C.violetLt,
            borderRadius: 16, padding: '16px 20px',
            border: `2px solid ${C.violet}20`,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.violet, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>
              Travail journalier
            </div>
            <div style={{ fontSize: 42, fontWeight: 700, color: C.violet, lineHeight: 1, marginBottom: 8 }}>
              {Math.round(tj * 100)}%
            </div>
            <div style={{ height: 6, background: `${C.violet}20`, borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ height: '100%', width: `${Math.round(tj * 100)}%`, background: C.violet, borderRadius: 3, transition: 'width 1s' }} />
            </div>
            <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.5 }}>
              Moyenne des leçons 1 à 10
            </div>
            <div style={{ marginTop: 8, display: 'inline-block', padding: '3px 10px', borderRadius: 8, background: tj >= 0.7 ? C.greenLt : C.orangeLt, fontSize: 11, fontWeight: 700, color: tj >= 0.7 ? C.greenDk : C.orangeDk }}>
              {tj >= 0.7 ? '✓ Satisfaisant' : '↗ À améliorer'}
            </div>
          </div>

          {/* Flèche = */}
          <div style={{ display: 'flex', alignItems: 'center', color: C.text3, fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
            +
          </div>

          {/* EG */}
          <div style={{
            flex: 1, background: C.orangeLt,
            borderRadius: 16, padding: '16px 20px',
            border: `2px solid ${C.orange}20`,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.orange, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>
              Évaluation globale
            </div>
            <div style={{ fontSize: 42, fontWeight: 700, color: C.orange, lineHeight: 1, marginBottom: 8 }}>
              {Math.round(eg * 100)}%
            </div>
            <div style={{ height: 6, background: `${C.orange}20`, borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ height: '100%', width: `${Math.round(eg * 100)}%`, background: C.orange, borderRadius: 3, transition: 'width 1s' }} />
            </div>
            <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.5 }}>
              Score de l&apos;évaluation finale
            </div>
            <div style={{ marginTop: 8, display: 'inline-block', padding: '3px 10px', borderRadius: 8, background: eg >= 0.7 ? C.greenLt : C.redLt, fontSize: 11, fontWeight: 700, color: eg >= 0.7 ? C.greenDk : C.red }}>
              {eg >= 0.7 ? '✓ Satisfaisant' : '✗ Insuffisant'}
            </div>
          </div>

          {/* Flèche = */}
          <div style={{ display: 'flex', alignItems: 'center', color: C.text3, fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
            ÷2
          </div>

          {/* Moyenne */}
          <div style={{
            flex: 1, background: score >= 70 ? C.greenLt : C.redLt,
            borderRadius: 16, padding: '16px 20px',
            border: `2px solid ${scoreColor}20`,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: scoreColor, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>
              Moyenne finale
            </div>
            <div style={{ fontSize: 42, fontWeight: 700, color: scoreColor, lineHeight: 1, marginBottom: 8 }}>
              {score}%
            </div>
            <div style={{ height: 6, background: `${scoreColor}20`, borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ height: '100%', width: `${score}%`, background: scoreColor, borderRadius: 3, transition: 'width 1s' }} />
            </div>
            <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.5 }}>
              (TJ + EG) ÷ 2
            </div>
            <div style={{ marginTop: 8, display: 'inline-block', padding: '3px 10px', borderRadius: 8, background: score >= 70 ? C.greenLt : C.redLt, fontSize: 11, fontWeight: 700, color: score >= 70 ? C.greenDk : C.red, border: `1px solid ${scoreColor}40` }}>
              {score >= 70 ? '🏅 Module réussi' : '✗ Non validé'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Diagnostic pédagogique ── */}
      {report.diagnostic && <DiagnosticBadge diagnostic={report.diagnostic} />}

      {/* ── Recommandation ── */}
      {report.recommendation && (
        <div style={{ background: C.violetLt, borderLeft: `4px solid ${C.violet}`, borderRadius: '0 14px 14px 0', padding: '16px 18px', marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.violet, marginBottom: 6 }}>💡 Recommandation</p>
          <p style={{ fontSize: 13, color: C.violetDk, lineHeight: 1.7 }}>{report.recommendation}</p>
        </div>
      )}

      {/* ── Compétences ── */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 14 }}>Détail par compétence</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {report.skills.map((skill) => {
          const cfg = STATUS_CONFIG[skill.status]
          
          const successRate = Math.round((skill.correct / Math.max(skill.attempts, 1)) * 100)
          const masteryPct  = skill.attempts > 0 ? successRate : Math.round(skill.mastery * 100)
          return (
            <div key={skill.skill_id} style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 16, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                    {cfg.icon}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2 }}>{skill.skill_name}</p>
                    <div style={{ display: 'flex', gap: 10, fontSize: 11, color: C.text3 }}>
                      <span>{skill.attempts} tentatives</span>
                      <span>{Math.round((skill.correct / Math.max(skill.attempts, 1)) * 100)}% de réussite</span>
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 10, background: cfg.bg, color: cfg.color }}>
                  {cfg.label}
                </span>
              </div>
              <div style={{ height: 8, background: C.bg, borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ height: '100%', borderRadius: 4, width: `${masteryPct}%`, background: cfg.color, transition: 'width .8s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: C.text3 }}>Taux de réussite</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color }}>{masteryPct}%</span>
              </div>
              {skill.recommended_exercises > 0 && (
                <p style={{ fontSize: 11, color: C.orange, marginTop: 8 }}>→ {skill.recommended_exercises} exercices recommandés</p>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Certificat ── */}
      {report.passed && (
        <div style={{ background: `linear-gradient(135deg, ${C.violet}, #9B59B6)`, borderRadius: 20, padding: '24px', marginBottom: 20, color: '#fff', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🏅</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Certificat de réussite</h3>
          <p style={{ fontSize: 13, opacity: 0.85 }}>
            Vous avez complété le {report.module_title} avec une moyenne de {score}%.
          </p>
        </div>
      )}

      {/* ── Actions ── */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={() => router.push('/dashboard')}
          style={{ flex: 1, padding: '14px', borderRadius: 14, border: `2px solid ${C.border}`, background: C.white, cursor: 'pointer', fontSize: 13, color: C.text2, fontWeight: 600 }}>
          ↩ Menu principal
        </button>
        <button onClick={() => router.push(`/module/${moduleId + 1}`)}
          style={{ flex: 2, padding: '14px', borderRadius: 14, background: report.passed ? C.violet : C.orange, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
          {report.passed ? `Module ${moduleId + 1} →` : 'Continuer à pratiquer'}
        </button>
      </div>
    </div>
  )
}
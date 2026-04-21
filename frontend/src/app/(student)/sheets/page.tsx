'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { curriculumApi, writingApi } from '@/lib/api'

const C = {
  violet:'#6C3FC5', violetLt:'#EDE8FB', violetDk:'#4A2A8A',
  orange:'#F07C1E', orangeLt:'#FEF0E3',
  green:'#2BA84A', greenLt:'#E3F7E8',
  blue:'#1976D2', blueLt:'#E6F1FB',
  bg:'#F8F7FF', white:'#fff',
  text:'#1A1A2E', text2:'#5A5A7A', text3:'#9A9AB0',
  border:'#E8E4F8',
}

interface Module {
  id: number
  title: string
  description: string
  is_premium: boolean
}

// Lettres par module
const MODULE_LETTERS: Record<number, { name: string; ar: string; phoneme: string }[]> = {
  1: [
    { name: 'Ba',  ar: 'ب', phoneme: 'b' },
    { name: 'Mim', ar: 'م', phoneme: 'm' },
    { name: 'Kaf', ar: 'ك', phoneme: 'k' },
    { name: 'Ta',  ar: 'ت', phoneme: 't' },
  ],
}

const MODULE_COLORS = [
  { bg: '#EDE8FB', border: '#6C3FC5', text: '#4A2A8A', icon: '✏️' },
  { bg: '#FEF0E3', border: '#F07C1E', text: '#7A3A00', icon: '📖' },
  { bg: '#E3F7E8', border: '#2BA84A', text: '#1A6630', icon: '💬' },
  { bg: '#E6F1FB', border: '#1976D2', text: '#0D47A1', icon: '🎯' },
]

const LETTER_COLORS = [
  { bg: '#EDE8FB', border: '#6C3FC5', text: '#4A2A8A' },
  { bg: '#FEF0E3', border: '#F07C1E', text: '#7A3A00' },
  { bg: '#E3F7E8', border: '#2BA84A', text: '#1A6630' },
  { bg: '#E6F1FB', border: '#1976D2', text: '#0D47A1' },
]

export default function SheetsPage() {
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
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 8 }}>
          ✍️ Fiches d&apos;écriture
        </h1>
        <p style={{ fontSize: 15, color: C.text2, lineHeight: 1.7 }}>
          Téléchargez les fiches d&apos;écriture pour pratiquer à la main ou sur écran tactile.
          Chaque fiche contient la lettre en toutes ses positions avec des grilles d&apos;entraînement.
        </p>
      </div>

      {/* Bannière conseil */}
      <div style={{
        background: C.violetLt, border: `2px solid ${C.violet}30`,
        borderLeft: `4px solid ${C.violet}`,
        borderRadius: 16, padding: '16px 20px', marginBottom: 32,
        display: 'flex', alignItems: 'flex-start', gap: 14,
      }}>
        <span style={{ fontSize: 24, flexShrink: 0 }}>💡</span>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: C.violetDk, marginBottom: 4 }}>
            Comment utiliser ces fiches ?
          </p>
          <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.7 }}>
            Imprimez-les sur du papier A4 ou utilisez-les sur une tablette avec un stylet.
            Chaque fiche contient 3 modèles progressifs : noir (à imiter), gris (à suivre), gris (autonome).
            Compatible impression noir et blanc.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.text3 }}>Chargement…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {modules.map((mod, mi) => {
            const mc = MODULE_COLORS[mi % MODULE_COLORS.length]
            const letters = MODULE_LETTERS[mod.id] ?? []

            return (
              <div key={mod.id} style={{
                background: C.white, border: `2px solid ${C.border}`,
                borderRadius: 20, overflow: 'hidden',
              }}>
                {/* En-tête module */}
                <div style={{
                  background: mc.bg, padding: '18px 24px',
                  borderBottom: `2px solid ${mc.border}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: C.white, border: `2px solid ${mc.border}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20,
                    }}>
                      {mc.icon}
                    </div>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 700, color: mc.text }}>{mod.title}</p>
                      <p style={{ fontSize: 12, color: C.text3 }}>
                        {letters.length > 0 ? `${letters.length} fiches disponibles` : 'Bientôt disponible'}
                      </p>
                    </div>
                  </div>

                  {/* Bouton télécharger tout */}
                  {letters.length > 0 && (
                    <a
                      href={writingApi.moduleSheets(mod.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '10px 18px', borderRadius: 12,
                        background: mc.border, color: '#fff',
                        fontSize: 13, fontWeight: 700, textDecoration: 'none',
                        display: 'flex', alignItems: 'center', gap: 6,
                        transition: 'opacity .15s',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.85'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}>
                      ⬇ Tout télécharger ({letters.length} fiches)
                    </a>
                  )}
                </div>

                {/* Grille des lettres */}
                {letters.length > 0 ? (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: 16, padding: '20px 24px',
                  }}>
                    {letters.map((letter, li) => {
                      const lc = LETTER_COLORS[li % LETTER_COLORS.length]
                      return (
                        <div key={letter.name} style={{
                          background: lc.bg, border: `2px solid ${lc.border}30`,
                          borderRadius: 16, padding: '20px 16px',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                        }}>
                          {/* Grande lettre */}
                          <div style={{
                            fontFamily: "'Noto Naskh Arabic', serif",
                            fontSize: 56, color: lc.border, direction: 'rtl',
                            lineHeight: 1.2,
                          }}>
                            {letter.ar}
                          </div>

                          {/* Nom et phonème */}
                          <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 15, fontWeight: 700, color: lc.text, marginBottom: 2 }}>
                              {letter.name}
                            </p>
                            <p style={{ fontSize: 12, color: C.text3, fontStyle: 'italic' }}>
                              /{letter.phoneme}/
                            </p>
                          </div>

                          {/* 4 formes */}
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                            {['isolée', 'début', 'milieu', 'fin'].map(pos => (
                              <span key={pos} style={{
                                fontSize: 10, fontWeight: 600,
                                background: `${lc.border}18`, color: lc.text,
                                padding: '2px 6px', borderRadius: 6,
                              }}>
                                {pos}
                              </span>
                            ))}
                          </div>

                          {/* Bouton télécharger */}
                          <a
                            href={writingApi.letterSheet(mod.id, letter.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              width: '100%', padding: '10px',
                              borderRadius: 12, background: lc.border,
                              color: '#fff', fontSize: 13, fontWeight: 700,
                              textDecoration: 'none', textAlign: 'center',
                              transition: 'opacity .15s',
                            }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.85'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}>
                            ⬇ Fiche {letter.name}
                          </a>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div style={{ padding: '28px 24px', textAlign: 'center', color: C.text3 }}>
                    <p style={{ fontSize: 13 }}>Fiches en cours de préparation pour ce module.</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Section conseils */}
      <div style={{
        background: C.white, border: `2px solid ${C.border}`,
        borderRadius: 20, padding: '24px', marginTop: 32,
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 16 }}>
          📋 Conseils pour bien pratiquer
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {[
            { icon: '🖊️', title: 'Stylo ou stylet', desc: 'Utilisez un stylo à bille ou un stylet sur tablette pour un tracé fluide.' },
            { icon: '🔄', title: 'Répétez 3 fois', desc: 'Suivez le modèle noir, puis les gris, puis écrivez seul sur les lignes vides.' },
            { icon: '👁️', title: 'Observez la direction', desc: 'L\'arabe s\'écrit de droite à gauche. Commencez toujours depuis la droite.' },
            { icon: '🎯', title: 'Une lettre à la fois', desc: 'Maîtrisez chaque position (isolée, début, milieu, fin) avant de passer à la suivante.' },
          ].map((tip, i) => (
            <div key={i} style={{
              background: C.bg, borderRadius: 12, padding: '14px 16px',
              display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{tip.icon}</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>{tip.title}</p>
                <p style={{ fontSize: 12, color: C.text2, lineHeight: 1.6 }}>{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <link href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap" rel="stylesheet" />
    </div>
  )
}
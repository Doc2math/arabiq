'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';

const C = {
  violet:   '#6C3FC5', violetLt: '#EDE8FB', violetDk: '#4A2A8A',
  orange:   '#F07C1E', orangeLt: '#FEF0E3', orangeDk: '#B85A0E',
  green:    '#2BA84A', greenLt:  '#E3F7E8',
  blue:     '#1976D2', blueLt:   '#E6F1FB',
  red:      '#E24B4A',
  bg:       '#F8F7FF', white: '#fff',
  text:     '#1A1A2E', text2: '#5A5A7A', text3: '#9A9AB0',
  border:   '#E8E4F8',
}

const POSITION_COLORS = [
  { bg: '#EDE8FB', border: '#6C3FC5', text: '#4A2A8A', letter: '#6C3FC5' },
  { bg: '#E3F7E8', border: '#2BA84A', text: '#1A6630', letter: '#2BA84A' },
  { bg: '#E6F1FB', border: '#1976D2', text: '#0D47A1', letter: '#1976D2' },
  { bg: '#FEF0E3', border: '#F07C1E', text: '#7A3A00', letter: '#F07C1E' },
  { bg: '#FCE4EC', border: '#E91E63', text: '#880E4F', letter: '#E91E63' },
  { bg: '#F3E5F5', border: '#9C27B0', text: '#6A0080', letter: '#9C27B0' },
]

interface LetterForm {
  position: string;
  ar: string;
  example?: string;
  note?: string;
}

interface Letter {
  letter: string;
  name: string;
  audio?: string;
  forms: LetterForm[];
}

interface PositionsLearningProps {
  letters: Letter[];
  onReady: () => void;
}

function HighlightExample({ example, letterBase }: {
  example: string;
  letterBase: string;
}) {
  if (!example || !letterBase) return (
    <span style={{ fontFamily: '"Noto Naskh Arabic", serif', fontSize: 42, color: C.text, direction: 'rtl' }}>
      {example ?? ''}
    </span>
  )

  const baseCode = letterBase.codePointAt(0)
  const chars    = Array.from(example)
  const result: React.ReactNode[] = []
  let found = false

  chars.forEach((ch, i) => {
    if (ch.codePointAt(0) === baseCode && !found) {
      found = true
      result.push(<span key={i} style={{ color: C.red }}>{ch}</span>)
    } else {
      result.push(ch)
    }
  })

  return (
    <span style={{
      fontFamily: '"Noto Naskh Arabic", serif',
      fontSize: 42,
      direction: 'rtl',
      lineHeight: 1.4,
      verticalAlign: 'middle',
    }}>
      {result}
    </span>
  )
}

export default function PositionsLearning({ letters, onReady }: PositionsLearningProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const titleRef     = useRef<HTMLHeadingElement>(null)
  const buttonRef    = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const tl = gsap.timeline()
    tl.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 })
      .fromTo(titleRef.current,     { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.4 }, '-=0.1')
      .fromTo(buttonRef.current,    { opacity: 0, y: 20  }, { opacity: 1, y: 0, duration: 0.4 }, '-=0.2')
  }, [])

  return (
    <div ref={containerRef} style={{ padding: '28px 20px', maxWidth: 1020, margin: '0 auto' }}>

      {letters.map((letter, idx) => (
        <div key={idx} style={{ marginBottom: 40 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            marginBottom: 16, paddingBottom: 12,
            borderBottom: `2px solid ${C.border}`,
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: C.violetLt, border: `2px solid ${C.violet}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: '"Noto Naskh Arabic", serif', fontSize: 32, color: C.violet,
            }}>
              {letter.letter}
            </div>
            <div>
              <p style={{ fontSize: 17, fontWeight: 700, color: C.text }}>{letter.name}</p>
              <p style={{ fontSize: 12, color: C.text3 }}>{letter.forms.length} formes</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {letter.forms.map((form, fi) => {
              const col = POSITION_COLORS[fi % POSITION_COLORS.length]
              return (
                <div key={fi} style={{
                  background: C.white, border: `2px solid ${col.border}40`,
                  borderRadius: 18, overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  transition: 'transform .2s, box-shadow .2s',
                  display: 'flex', flexDirection: 'column',
                }}
                onMouseEnter={e => {
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${col.border}25`
                }}
                onMouseLeave={e => {
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'
                }}>
                  <div style={{
                    background: col.bg, padding: '20px 12px 16px',
                    textAlign: 'center', borderBottom: `1px solid ${col.border}20`,
                  }}>
                    <span style={{
                      fontFamily: '"Noto Naskh Arabic", serif',
                      fontSize: 72, lineHeight: 1.2, color: col.letter, display: 'block',
                    }}>
                      {form.ar}
                    </span>
                  </div>

                  <div style={{
                    padding: '10px 12px 8px', textAlign: 'center',
                    borderBottom: `1px solid ${C.border}`,
                  }}>
                    <span style={{
                      display: 'inline-block', fontSize: 12, fontWeight: 700,
                      color: col.text, background: col.bg,
                      padding: '4px 12px', borderRadius: 20, letterSpacing: '.3px',
                    }}>
                      {form.position}
                    </span>
                  </div>

                  <div style={{
                    padding: '12px 8px 16px', textAlign: 'center',
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    minHeight: 72,
                  }}>
                    {form.example ? (
                      <HighlightExample
                        example={form.example}
                        letterBase={letter.letter}
                      />
                    ) : (
                      <span style={{ fontSize: 13, color: C.text3, fontStyle: 'italic' }}>
                        {form.note ?? '—'}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

  <div>
        {/* Exceptions */}
        <div style={{ border: `2px solid ${C.violet}`, borderRadius: 16, marginBottom: 32, overflow: 'hidden',
          }}>
            {/* En-tête */}
                <div style={{
                    background: `linear-gradient(135deg, ${C.violetDk}, ${C.violet})`,
                    padding: '12px 20px',
                    display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                    <span style={{ fontSize: 18 }}>📌</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '.3px' }}>
                    Exceptions à retenir
                    </span>
                </div>

        {/* Corps */}
                <div style={{ background: C.white, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Exception Kaf */}
                    <div style={{ background: C.bg, borderRadius: 12, padding: '14px 18px',borderLeft: `4px solid ${C.violet}`,}}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                <span style={{ fontFamily: '"Noto Naskh Arabic", serif', fontSize: 28, color: C.violet }}>ك</span>
                                <span style={{ fontSize: 14, fontWeight: 700, color: C.violet }}>Kaf — Position finale</span>
                            </div>
                            <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.8 }}>
                                En position finale, Kaf peut aussi s&apos;écrire{' '}
                                <span style={{ fontFamily: '"Noto Naskh Arabic", serif', fontSize: 22, color: C.violet }}>ـک</span>
                                {' '}selon le style calligraphique utilisé. Les deux formes sont correctes et acceptées.
                            </p>
                    </div>

                    {/* Exception Ta */}
                    <div style={{
                            background: C.bg, borderRadius: 12, padding: '14px 18px',
                            borderLeft: `4px solid ${C.orange}`,
                            }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                <span style={{ fontFamily: '"Noto Naskh Arabic", serif', fontSize: 28, color: C.orange }}>ت</span>
                                <span style={{ fontSize: 14, fontWeight: 700, color: C.orange }}>Ta — Ta marbuta</span>
                            </div>
                            <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.8 }}>
                                En fin de mot, Ta peut prendre la forme de la <strong>Ta marbuta</strong>{' '}
                                <span style={{ fontFamily: '"Noto Naskh Arabic", serif', fontSize: 22, color: C.orange }}>ة / ـة</span>
                                {' '}— elle se prononce <em>a</em> ou <em>at</em> selon le contexte grammatical.
                            </p>
                    </div>

                </div>
        </div>
  </div>

      <div style={{ textAlign: 'center', marginTop: 48, marginBottom: 24 }}>
        <button
          ref={buttonRef}
          onClick={onReady}
          style={{
            padding: '16px 52px', fontSize: 18, fontWeight: 700, color: '#fff',
            background: `linear-gradient(135deg, ${C.violet}, ${C.violetDk})`,
            border: 'none', borderRadius: 50, cursor: 'pointer',
            boxShadow: '0 8px 28px rgba(108,63,197,0.35)',
            transition: 'transform .2s, box-shadow .2s',
          }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLElement).style.transform = 'scale(1.03)'
            ;(e.currentTarget as HTMLElement).style.boxShadow = '0 12px 36px rgba(108,63,197,0.5)'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLElement).style.transform = 'scale(1)'
            ;(e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(108,63,197,0.35)'
          }}>
          ✅ Je suis prêt(e) à m&apos;exercer
        </button>
        <p style={{ marginTop: 12, fontSize: 13, color: C.text3 }}>
          Vous pourrez revenir à la leçon à tout moment
        </p>
      </div>
    </div>
  )
}
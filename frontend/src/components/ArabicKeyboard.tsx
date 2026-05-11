'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Keyboard } from 'lucide-react';
const C = {
  violet:   '#6C3FC5',
  violetLt: '#EDE8FB',
  violetDk: '#4A2A8A',
  orange:   '#F07C1E',
  orangeLt: '#FEF0E3',
  bg:       '#F8F7FF',
  white:    '#FFFFFF',
  text:     '#1A1A2E',
  text2:    '#5A5A7A',
  text3:    '#9A9AB0',
  border:   '#E8E4F8',
  green:    '#2BA84A',
  greenLt:  '#E3F7E8',
}

const ROWS = [
  ['ض','ص','ث','ق','ف','غ','ع','ه','خ','ح','ج','د'],
  ['ذ','ش','س','ي','ب','ل','ا','ت','ن','م','ك','ط'],
  ['ئ','ء','ؤ','ر','ى','ة','و','ز','ظ','أ','إ','آ'],
]

const HARAKATS = [
  { display: 'َ',  name: 'Fatha',       unicode: '\u064E' },
  { display: 'ِ',  name: 'Kasra',       unicode: '\u0650' },
  { display: 'ُ',  name: 'Damma',       unicode: '\u064F' },
  { display: 'ْ',  name: 'Sukun',       unicode: '\u0652' },
  { display: 'ّ',  name: 'Shadda',      unicode: '\u0651' },
  { display: 'ً',  name: 'Tanwin fath', unicode: '\u064B' },
  { display: 'ٍ',  name: 'Tanwin kasr', unicode: '\u064D' },
  { display: 'ٌ',  name: 'Tanwin damm', unicode: '\u064C' },
]

interface ArabicKeyboardProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  disabled?: boolean
  defaultOpen?: boolean
  onValidate?: () => void
  validateLabel?: string
  answered?: boolean
  isCorrect?: boolean | null
}

export default function ArabicKeyboard({
  value,
  onChange,
  placeholder = 'اكتب هنا…',
  disabled = false,
  defaultOpen = false,
  onValidate,
  validateLabel = 'Valider →',
  answered = false,
  isCorrect = null,
}: ArabicKeyboardProps) {
  const [open, setOpen]           = useState(false)
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [tooltip, setTooltip]     = useState<string | null>(null)

  // Position draggable
  const [pos, setPos]         = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragStart               = useRef({ mx: 0, my: 0, kx: 0, ky: 0 })

  // Taille redimensionnable
  const [kbdWidth, setKbdWidth]   = useState(620)
  const [resizing, setResizing]   = useState(false)
  const resizeStart               = useRef({ mx: 0, w: 620 })

  const inputRef = useRef<HTMLInputElement>(null)

  // ── Drag ──────────────────────────────────────────────────
  const onDragStart = (e: React.MouseEvent) => {
    e.preventDefault()
    setDragging(true)
    dragStart.current = { mx: e.clientX, my: e.clientY, kx: pos.x, ky: pos.y }
  }

  useEffect(() => {
    if (!dragging) return
    const onMove = (e: MouseEvent) => {
      setPos({
        x: dragStart.current.kx + (e.clientX - dragStart.current.mx),
        y: dragStart.current.ky + (e.clientY - dragStart.current.my),
      })
    }
    const onUp = () => setDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [dragging])

  // ── Resize ────────────────────────────────────────────────
  const onResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    setResizing(true)
    resizeStart.current = { mx: e.clientX, w: kbdWidth }
  }

  useEffect(() => {
    if (!resizing) return
    const onMove = (e: MouseEvent) => {
      const delta = e.clientX - resizeStart.current.mx
      // Clavier centré → resize symétrique (drag droite = élargit)
      const newW = Math.max(320, Math.min(window.innerWidth - 32, resizeStart.current.w + delta * 2))
      setKbdWidth(newW)
    }
    const onUp = () => setResizing(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [resizing])

  // ── Insert ────────────────────────────────────────────────
  const insert = useCallback((char: string) => {
    if (disabled || answered) return
    const el = inputRef.current
    if (!el) return
    const s = el.selectionStart ?? value.length
    const e2 = el.selectionEnd ?? value.length
    const next = value.slice(0, s) + char + value.slice(e2)
    onChange(next)
    const newPos = s + char.length
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(newPos, newPos) })
    setActiveKey(char)
    setTimeout(() => setActiveKey(null), 120)
  }, [value, onChange, disabled, answered])

  const backspace = useCallback(() => {
    if (disabled || answered) return
    const el = inputRef.current; if (!el) return
    const s = el.selectionStart ?? value.length
    if (s === 0) return
    onChange(value.slice(0, s - 1) + value.slice(s))
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s - 1, s - 1) })
  }, [value, onChange, disabled, answered])

  const clear = useCallback(() => {
    if (disabled || answered) return
    onChange('')
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [onChange, disabled, answered])

  // ── Styles partagés ───────────────────────────────────────
  const baseKey = (char: string, extra: React.CSSProperties = {}): React.CSSProperties => ({
    height:         40,
    borderRadius:   8,
    border:         `2px solid ${activeKey === char ? C.violet : C.border}`,
    background:     activeKey === char ? C.violet : C.bg,
    cursor:         'pointer',
    fontFamily:     "'Noto Naskh Arabic', serif",
    fontSize:       22,
    fontWeight:     700,
    color:          activeKey === char ? '#fff' : C.text,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    transition:     'all .1s',
    transform:      activeKey === char ? 'scale(0.92)' : 'scale(1)',
    flexShrink:     0,
    userSelect:     'none',
    position:       'relative',
    ...extra,
  })

  const fieldBorder = answered ? (isCorrect ? C.green : '#E24B4A') : open ? C.violet : C.border
  const fieldBg     = answered ? (isCorrect ? C.greenLt : '#FCEBEB') : C.white

  // Calcul bottom en tenant compte du drag vertical
  const bottomVal = pos.y < 0 ? -pos.y : 0

  return (
    <div style={{ position: 'relative', width: '100%' }}>

      {/* ── Champ de saisie ── */}
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          readOnly={disabled || answered}
          dir="rtl"
          placeholder={placeholder}
          onFocus={() => { if (!disabled && !answered) setOpen(true) }}
          onChange={e => { if (!disabled && !answered) onChange(e.target.value) }}
          style={{
            width: '100%', padding: '12px 28px 12px 16px',
            borderRadius: 14, fontFamily: "'Noto Naskh Arabic', serif",
            fontSize: 22, border: `2.5px solid ${fieldBorder}`,
            outline: 'none', color: C.text, background: fieldBg,
            textAlign: 'right', transition: 'all .2s', boxSizing: 'border-box',
            cursor: disabled || answered ? 'default' : 'text',
          }}
        />
        {!disabled && !answered && (
          <button onClick={() => setOpen(o => !o)} title="Clavier arabe"
            style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              width: 32, height: 22, borderRadius: 8,
              background: open ? C.violet : C.violetLt,
              border: `0px solid ${C.violet}`, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, transition: 'all .15s',
            }}>
            <Keyboard size={34}  />
          </button>
        )}
      </div>

      {/* ── Bouton valider ── */}
      {onValidate && (
        <button onClick={onValidate} disabled={answered || !value.trim()}
          style={{
            width: '100%', marginTop: 10, padding: '16px', borderRadius: 14,
            border: 'none', background: answered || !value.trim() ? C.border : C.violet,
            color: '#fff', cursor: answered || !value.trim() ? 'default' : 'pointer',
            fontSize: 15, fontWeight: 700, transition: 'all .2s',  
          }}>
          {validateLabel}
        </button>
      )}

      {/* ── Clavier flottant ── */}
      {open && !disabled && !answered && (
        <div style={{
          position:     'fixed',
          bottom:       bottomVal,
          left:         `calc(50% + ${pos.x}px)`,
          transform:    'translateX(-50%)',
          width:        kbdWidth,
          maxWidth:     '98vw',
          background:   C.white,
          border:       `2px solid ${C.violet}40`,
          borderRadius: pos.y < 0 ? 20 : '20px 20px 0 0',
          padding:      '0 10px 10px',
          boxShadow:    '0 -6px 40px rgba(108,63,197,0.18)',
          zIndex:       9999,
          userSelect:   'none',
        }}>

          {/* ── Poignée drag + resize ── */}
          <div
            onMouseDown={onDragStart}
            style={{
              cursor:   dragging ? 'grabbing' : 'grab',
              padding:  '10px 0 8px',
              display:  'flex', alignItems: 'center', justifyContent: 'center',
              borderBottom: `1px solid ${C.border}`, marginBottom: 10,
              position: 'relative',
            }}>
            {/* Poignée centrale */}
            <div style={{ width: 40, height: 4, borderRadius: 2, background: C.border }} />

            {/* Handle resize gauche */}
            <div
              onMouseDown={e => { e.stopPropagation(); onResizeStart(e) }}
              title="Redimensionner"
              style={{
                position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                cursor: 'ew-resize', padding: '4px 6px', borderRadius: 6,
                background: C.violetLt, border: `1px solid ${C.border}`,
                fontSize: 12, color: C.violet, userSelect: 'none',
              }}>
              ↔
            </div>

            {/* Bouton fermer */}
            <button
              onMouseDown={e => { e.stopPropagation(); setOpen(false); setPos({ x: 0, y: 0 }) }}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                width: 24, height: 24, borderRadius: 6,
                background: C.violetLt, border: `1px solid ${C.border}`,
                cursor: 'pointer', fontSize: 13, color: C.violet,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              ✕
            </button>
          </div>

          {/* ── Harakats ── */}
          <div style={{ marginBottom: 8 }}>
            
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', direction: 'rtl' }}>
              {HARAKATS.map(h => (
                <div key={h.unicode} style={{ position: 'relative',  alignItems: 'center' }}>
                  {/* Tooltip */}
                  {tooltip === h.unicode && (
                    <div style={{
                      position: 'absolute', bottom: '110%', left: '50%',
                      transform: 'translateX(-50%)',
                      background: C.violetDk, color: '#fff',
                      fontSize: 11, fontWeight: 600, padding: '4px 10px',
                      borderRadius: 8, whiteSpace: 'nowrap', zIndex: 10000,
                      pointerEvents: 'none',
                    }}>
                      {h.name}
                      <div style={{
                        position: 'absolute', top: '100%', left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0, height: 0,
                        borderLeft: '5px solid transparent',
                        borderRight: '5px solid transparent',
                        borderTop: `5px solid ${C.violetDk}`,
                      }} />
                    </div>
                  )}
                  <button
                    onMouseDown={e => { e.preventDefault(); insert(h.unicode) }}
                    onMouseEnter={() => setTooltip(h.unicode)}
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      ...baseKey(h.unicode, { width: 44 }),
                      // Afficher la harakat sur un ba pour la rendre visible
                      fontSize: 26,
                    }}>
                    {/* ba + harakat pour rendre visible */}
                    <span style={{
                      fontFamily: "'Noto Naskh Arabic', serif",
                      fontSize: 28,
                      fontWeight: 700,
                      direction: 'rtl',
                      alignItems: 'center',
                      color: activeKey === h.unicode ? '#fff' : C.violetDk,
                    }}>
                      {`ب${h.display}`}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: C.border, margin: '8px 0' }} />

          {/* ── Lettres ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {ROWS.map((row, ri) => (
              <div key={ri} style={{ display: 'flex', gap: 4, justifyContent: 'center', direction: 'rtl' }}>
                {row.map(char => (
                  <button
                    key={char}
                    onMouseDown={e => { e.preventDefault(); insert(char) }}
                    style={baseKey(char, { width: char.length > 1 ? 46 : 38 })}
                    onMouseEnter={e => {
                      if (activeKey !== char) {
                        ;(e.currentTarget as HTMLElement).style.background = C.violetLt
                        ;(e.currentTarget as HTMLElement).style.borderColor = C.violet
                        ;(e.currentTarget as HTMLElement).style.color = C.violet
                      }
                    }}
                    onMouseLeave={e => {
                      if (activeKey !== char) {
                        ;(e.currentTarget as HTMLElement).style.background = C.bg
                        ;(e.currentTarget as HTMLElement).style.borderColor = C.border
                        ;(e.currentTarget as HTMLElement).style.color = C.text
                      }
                    }}>
                    {char}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* ── Barre inférieure ── */}
          <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
            <button onMouseDown={e => { e.preventDefault(); insert(' ') }}
              style={{ flex: 3, height: 38, borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.bg, cursor: 'pointer', fontSize: 12, color: C.text2, fontWeight: 600 }}>
              espace
            </button>
            <button onMouseDown={e => { e.preventDefault(); backspace() }}
              style={{ flex: 1, height: 38, borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.bg, cursor: 'pointer', fontSize: 18, color: C.text2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ⌫
            </button>
            <button onMouseDown={e => { e.preventDefault(); clear() }}
              style={{ flex: 1, height: 38, borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.bg, cursor: 'pointer', fontSize: 11, color: C.text3, fontWeight: 700 }}>
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
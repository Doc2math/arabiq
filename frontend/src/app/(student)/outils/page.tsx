'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslations } from 'next-intl'

const C = {
  violet:   '#6C3FC5', violetLt: '#EDE8FB', violetDk: '#4A2A8A',
  orange:   '#F07C1E', orangeLt: '#FEF0E3', orangeDk: '#B85A0E',
  green:    '#2BA84A', greenLt:  '#E3F7E8',
  blue:     '#1976D2', blueLt:   '#E6F1FB',
  red:      '#E24B4A',
  bg:       '#F8F7FF', white: '#FFFFFF',
  text:     '#1A1A2E', text2: '#5A5A7A', text3: '#9A9AB0',
  border:   '#E8E4F8',
}

const ROW1 = ['ض','ص','ث','ق','ف','غ','ع','ه','خ','ح','ج','د','ذ']
const ROW2 = ['ش','س','ي','ب','ل','ا','ت','ن','م','ك','ط','ظ','لا']
const ROW3 = ['،','ئ','ء','ؤ','ر','ى','ة','و','ز','أ','إ','آ','؟']

const HARAKATS = [
  { ar:'بَ', u:'\u064E', name:'Fatha'       },
  { ar:'بِ', u:'\u0650', name:'Kasra'       },
  { ar:'بُ', u:'\u064F', name:'Damma'       },
  { ar:'بْ', u:'\u0652', name:'Sukun'       },
  { ar:'بّ', u:'\u0651', name:'Shadda'      },
  { ar:'بً', u:'\u064B', name:'Tanwin fath' },
  { ar:'بٍ', u:'\u064D', name:'Tanwin kasr' },
  { ar:'بٌ', u:'\u064C', name:'Tanwin damm' },
]

const COLORS = [
  '#1A1A2E','#E24B4A','#F07C1E','#F9A825','#2BA84A',
  '#1976D2','#6C3FC5','#E91E63','#00897B','#795548',
  '#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#C77DFF',
  '#FF9F1C','#2EC4B6','#E71D36','#5C4033','#FF69B4',
]

// Lettres qui ne se connectent pas à gauche (pas de forme médiane/initiale)
const NO_LEFT_JOIN = new Set(['ا','أ','إ','آ','د','ذ','ر','ز','و','ى','ة','ء','ؤ','ئ'])

// Formes contextuelles : isolée, initiale (مـ), médiane (ـمـ), finale (ـم)
function getForms(letter: string): { label: string; value: string; desc: string }[] {
  // Lettres spéciales sans formes contextuelles
  if (['،','؟','لا'].includes(letter)) {
    return [{ label: letter, value: letter, desc: 'Symbole' }]
  }
  const T = '\u0640' // tatweel
  const noLeft = NO_LEFT_JOIN.has(letter)
  const forms = [
    { label: letter,              value: letter,              desc: 'Isolée'   },
    { label: `${letter}${T}`,    value: `${letter}${T}`,    desc: 'Initiale' },
    { label: `${T}${letter}${T}`,value: `${T}${letter}${T}`,desc: 'Médiane'  },
    { label: `${T}${letter}`,    value: `${T}${letter}`,    desc: 'Finale'   },
  ]
  if (noLeft) {
    // Lettres sans connexion gauche → seulement isolée et finale
    return [forms[0], forms[3]]
  }
  return forms
}

function convertDigits(text: string, toArabic: boolean): string {
  if (toArabic) return text.replace(/[0-9]/g, d => String.fromCharCode(0x0660 + parseInt(d)))
  return text.replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x0660))
}

function colorizeFragment(fragment: DocumentFragment, color: string) {
  const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  let n = walker.nextNode()
  while (n) { nodes.push(n as Text); n = walker.nextNode() }
  nodes.forEach(textNode => {
    if (!textNode.textContent) return
    const span = document.createElement('span')
    span.style.color = color
    const parent = textNode.parentNode
    if (parent) {
      if (parent.nodeType === Node.ELEMENT_NODE && (parent as Element).tagName === 'SPAN' && parent !== fragment) {
        ;(parent as HTMLElement).style.color = color
      } else {
        parent.replaceChild(span, textNode)
        span.appendChild(textNode)
      }
    }
  })
}

export default function OutilsPage() {
  const t = useTranslations('tools.editor')

  const [fontSize, setFontSize]               = useState(24)
  const [rtl, setRtl]                         = useState(true)
  const [copied, setCopied]                   = useState(false)
  const [activeKey, setActiveKey]             = useState<string|null>(null)
  const [tooltip, setTooltip]                 = useState<string|null>(null)
  const [plainText, setPlainText]             = useState('')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [selectedColor, setSelectedColor]     = useState(C.violet)
  const [pickerPos, setPickerPos]             = useState({ top: 0, left: 0 })
  const [isFullscreen, setIsFullscreen]       = useState(false)
  const [savedRange, setSavedRange]           = useState<Range | null>(null)

  // ── Panneau formes contextuelles ─────────────────────────
  const [formPanel, setFormPanel] = useState<{ letter: string; x: number; y: number } | null>(null)

  const editorRef     = useRef<HTMLDivElement>(null)
  const colorBtnRef   = useRef<HTMLButtonElement>(null)
  const colorRangeRef = useRef<Range | null>(null)

  useEffect(() => {
    const onSelectionChange = () => {
      const sel = window.getSelection()
      if (sel && sel.rangeCount > 0 && !sel.isCollapsed && editorRef.current?.contains(sel.anchorNode))
        colorRangeRef.current = sel.getRangeAt(0).cloneRange()
    }
    document.addEventListener('selectionchange', onSelectionChange)
    return () => document.removeEventListener('selectionchange', onSelectionChange)
  }, [])

useEffect(() => {
  const h = (e: MouseEvent) => {
    // Ne ferme pas si on clique sur le panneau lui-même
    const panel = document.getElementById('form-panel')
    if (panel && panel.contains(e.target as Node)) return
    setFormPanel(null)
  }
  document.addEventListener('mousedown', h)
  return () => document.removeEventListener('mousedown', h)
}, [])

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', h)
    return () => document.removeEventListener('fullscreenchange', h)
  }, [])

  // Fermer le panneau formes en cliquant ailleurs
  useEffect(() => {
    const h = () => setFormPanel(null)
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const saveSelection = useCallback(() => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) setSavedRange(sel.getRangeAt(0).cloneRange())
  }, [])

  const restoreSelection = useCallback(() => {
    if (!savedRange) return
    const sel = window.getSelection()
    if (sel) { sel.removeAllRanges(); sel.addRange(savedRange) }
  }, [savedRange])

  const insert = useCallback((char: string) => {
    restoreSelection()
    const sel = window.getSelection()
    if (!sel || !editorRef.current) return
    if (!editorRef.current.contains(sel.anchorNode)) {
      editorRef.current.focus()
      const range = document.createRange()
      range.selectNodeContents(editorRef.current)
      range.collapse(false)
      sel.removeAllRanges(); sel.addRange(range)
    }
    sel.deleteFromDocument()
    const node = document.createTextNode(char)
    const range = sel.getRangeAt(0)
    range.insertNode(node)
    range.setStartAfter(node); range.setEndAfter(node)
    sel.removeAllRanges(); sel.addRange(range)
    setSavedRange(range.cloneRange())
    if (editorRef.current) setPlainText(editorRef.current.innerText || '')
    setActiveKey(char)
    setTimeout(() => setActiveKey(null), 120)
  }, [savedRange, restoreSelection])

  const backspace = useCallback(() => {
    restoreSelection()
    const sel = window.getSelection()
    if (!sel || !editorRef.current) return
    if (!editorRef.current.contains(sel.anchorNode)) editorRef.current.focus()
    if (sel.isCollapsed) {
      try {
        const range = sel.getRangeAt(0)
        range.setStart(range.startContainer, Math.max(0, range.startOffset - 1))
        sel.removeAllRanges(); sel.addRange(range)
      } catch {}
    }
    sel.deleteFromDocument()
    if (editorRef.current) {
      setPlainText(editorRef.current.innerText || '')
      const sel2 = window.getSelection()
      if (sel2 && sel2.rangeCount > 0) setSavedRange(sel2.getRangeAt(0).cloneRange())
    }
  }, [savedRange, restoreSelection])

  const applyColor = useCallback((color: string) => {
    setSelectedColor(color); setShowColorPicker(false)
    const range = colorRangeRef.current
    if (!range || !editorRef.current || range.collapsed) return
    const extracted = range.extractContents()
    colorizeFragment(extracted, color)
    range.insertNode(extracted)
    const sel = window.getSelection()
    if (sel) {
      try {
        const newRange = document.createRange()
        newRange.setStart(range.endContainer, range.endOffset)
        newRange.collapse(true)
        sel.removeAllRanges(); sel.addRange(newRange)
        setSavedRange(newRange.cloneRange())
      } catch {}
    }
    colorRangeRef.current = null
    setPlainText(editorRef.current.innerText || '')
  }, [])

  const selectAll     = () => { editorRef.current?.focus(); document.execCommand('selectAll') }
  const copy          = () => { navigator.clipboard.writeText(editorRef.current?.innerText ?? ''); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  const clear         = () => { if (editorRef.current) { editorRef.current.innerHTML = ''; setPlainText('') }; setSavedRange(null); colorRangeRef.current = null }
  const download      = () => {
    const blob = new Blob([editorRef.current?.innerText ?? ''], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'texte-arabe.txt'; a.click()
    URL.revokeObjectURL(url)
  }
  const normalize     = () => { if (!editorRef.current) return; const tx = (editorRef.current.innerText || '').normalize('NFC'); editorRef.current.innerText = tx; setPlainText(tx) }
  const convertNum    = (toArabic: boolean) => { if (!editorRef.current) return; const tx = convertDigits(editorRef.current.innerText || '', toArabic); editorRef.current.innerText = tx; setPlainText(tx) }
  const toggleFullscreen = () => { if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen() }

  const letters = Array.from(plainText).filter(c => /[\u0600-\u06FF]/.test(c)).length
  const words   = plainText.trim().split(/\s+/).filter(w => /[\u0600-\u06FF]/.test(w)).length

  const keyStyle = (char: string): React.CSSProperties => {
    const on = activeKey === char
    return {
      flex: '1 1 auto', minWidth: 28, maxWidth: 50, height: 44,
      borderRadius: 10, flexShrink: 0,
      border: on ? '1.5px solid rgba(108,63,197,0.9)' : '1.5px solid rgba(108,63,197,0.18)',
      background: on ? 'linear-gradient(145deg,#7B52D4,#5A2BAF)' : 'linear-gradient(145deg,rgba(255,255,255,0.98),rgba(237,232,251,0.65))',
      boxShadow: on ? '0 0 16px rgba(108,63,197,0.5),0 3px 8px rgba(108,63,197,0.25)' : '0 2px 6px rgba(108,63,197,0.08),inset 0 1px 0 rgba(255,255,255,0.85)',
      cursor: 'pointer', fontFamily: "'Noto Naskh Arabic',serif",
      fontSize: 'clamp(14px, 2.5vw, 24px)', fontWeight: 700,
      color: on ? '#fff' : '#2D1B6B', display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all .1s ease', transform: on ? 'translateY(1.5px) scale(0.95)' : 'none',
      userSelect: 'none' as const, position: 'relative' as const,
    }
  }

  const hoverOn  = (e: React.MouseEvent, char: string) => { if (activeKey === char) return; const el = e.currentTarget as HTMLElement; el.style.background = 'linear-gradient(145deg,rgba(108,63,197,0.14),rgba(108,63,197,0.07))'; el.style.borderColor = 'rgba(108,63,197,0.45)'; el.style.color = C.violet }
  const hoverOff = (e: React.MouseEvent, char: string) => { if (activeKey === char) return; const el = e.currentTarget as HTMLElement; el.style.background = 'linear-gradient(145deg,rgba(255,255,255,0.98),rgba(237,232,251,0.65))'; el.style.borderColor = 'rgba(108,63,197,0.18)'; el.style.color = '#2D1B6B' }
  const btn = (active = false, color = C.violet): React.CSSProperties => ({ padding: '6px 12px', borderRadius: 8, border: `1.5px solid ${active ? color : C.border}`, background: active ? color : C.white, color: active ? '#fff' : C.text2, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s' })

  // ── Gestion clic lettre : simple = insert, long = formes ─
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pressedRef    = useRef(false)

  const onKeyPress = (e: React.MouseEvent, char: string) => {
    e.preventDefault()
    saveSelection()
    const forms = getForms(char)
    // Si une seule forme ou symbole → insertion directe
    if (forms.length === 1) {
      insert(char)
      return
    }
    // Afficher le panneau de formes
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setFormPanel({ letter: char, x: rect.left + rect.width / 2, y: rect.top })
  }

  const Row = ({ chars }: { chars: string[] }) => (
    <div style={{ display: 'flex', gap: 3, justifyContent: 'center', direction: 'rtl', flexWrap: 'nowrap' }}>
      {chars.map(c => (
        <button key={c}
          onClick={e => onKeyPress(e, c)}
          onMouseEnter={e => hoverOn(e, c)}
          onMouseLeave={e => hoverOff(e, c)}
          style={keyStyle(c)}
          title="Cliquer pour insérer — les formes s'affichent automatiquement">
          {c}
        </button>
      ))}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)', background: 'linear-gradient(160deg,#F8F6FF 0%,#EEE8FF 50%,#F2F6FF 100%)', fontFamily: 'system-ui,sans-serif', overflow: 'hidden' }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap" rel="stylesheet" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '10px 14px 8px' }}>

        {/* ── Barre d'outils ── */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', padding: '8px 12px', background: 'rgba(255,255,255,0.88)', border: '1.5px solid rgba(108,63,197,0.12)', borderRadius: '12px 12px 0 0', boxShadow: '0 2px 8px rgba(108,63,197,0.05)', backdropFilter: 'blur(8px)' }}>
          <select value={rtl ? 'rtl' : 'ltr'} onChange={e => setRtl(e.target.value === 'rtl')} style={{ padding: '5px 8px', borderRadius: 7, border: `1.5px solid ${C.border}`, fontSize: 12, fontWeight: 700, color: C.text, background: C.white, cursor: 'pointer' }}>
            <option value="rtl">{t('direction.rtl')}</option>
            <option value="ltr">{t('direction.ltr')}</option>
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.text3 }}>{t('fontSize')}</span>
            <input type="range" min={18} max={72} value={fontSize} onChange={e => setFontSize(Number(e.target.value))} style={{ width: 80, accentColor: C.violet }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: C.violet, minWidth: 26 }}>{fontSize}</span>
          </div>
          <div style={{ width: 1, height: 20, background: C.border }} />
          <button ref={colorBtnRef} onMouseDown={e => { e.preventDefault(); e.stopPropagation(); if (!showColorPicker) { const rect = e.currentTarget.getBoundingClientRect(); setPickerPos({ top: rect.bottom + 8, left: rect.left }) }; setShowColorPicker(v => !v) }} title={t('colorPalette')} style={{ ...btn(showColorPicker), display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>🎨</span>
            <div style={{ width: 16, height: 4, borderRadius: 2, background: selectedColor }} />
          </button>
          <div style={{ width: 1, height: 20, background: C.border }} />
          <button onClick={() => convertNum(true)}  style={btn()} title="123 → ١٢٣">١٢٣</button>
          <button onClick={() => convertNum(false)} style={btn()} title="١٢٣ → 123">123</button>
          <button onClick={normalize} style={btn()}>{t('normalize')}</button>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 11, background: C.violetLt, color: C.violet, padding: '4px 10px', borderRadius: 8, fontWeight: 700 }}>{letters} lettres</span>
            <span style={{ fontSize: 11, background: C.blueLt, color: C.blue, padding: '4px 10px', borderRadius: 8, fontWeight: 700 }}>{words} mots</span>
            <div style={{ width: 1, height: 20, background: C.border }} />
            <button onClick={selectAll} style={btn()}>Tout sél.</button>
            <button onClick={copy} style={{ ...btn(copied, C.green), background: copied ? C.greenLt : C.white, color: copied ? C.green : C.text2, border: `1.5px solid ${copied ? C.green : C.border}` }}>
              {copied ? '✓ Copié !' : `📋 ${t('copy')}`}
            </button>
            <button onClick={download} style={btn()}>⬇ .txt</button>
            <button onClick={clear} style={{ ...btn(), color: C.red, borderColor: `${C.red}40` }}>✕ Vider</button>
            <button onClick={toggleFullscreen} style={btn(isFullscreen)} title={t('fullscreen')}>{isFullscreen ? '⊡' : '⛶'}</button>
          </div>
        </div>

        {/* ── Zone d'édition ── */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <div ref={editorRef} contentEditable suppressContentEditableWarning dir={rtl ? 'rtl' : 'ltr'}
            onInput={() => { if (editorRef.current) setPlainText(editorRef.current.innerText || '') }}
            onMouseUp={saveSelection} onKeyUp={saveSelection}
            style={{ width: '100%', height: '100%', padding: '20px 24px', borderRadius: '0 0 16px 16px', border: '1.5px solid rgba(108,63,197,0.15)', borderTop: 'none', outline: 'none', fontFamily: "'Noto Naskh Arabic',serif", fontSize: fontSize, lineHeight: 1.9, color: C.text, textAlign: rtl ? 'right' : 'left', background: 'linear-gradient(160deg,#FDFCFF,#F6F2FF)', boxShadow: 'inset 0 2px 16px rgba(108,63,197,0.05)', boxSizing: 'border-box', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          />
          {!plainText && (
            <div style={{ position: 'absolute', top: 20, right: rtl ? 24 : 'auto', left: rtl ? 'auto' : 24, fontFamily: "'Noto Naskh Arabic',serif", fontSize: fontSize, color: 'rgba(108,63,197,0.3)', pointerEvents: 'none', lineHeight: 1.9 }}>
              {rtl ? 'ابدأ الكتابة…' : 'Start typing...'}
            </div>
          )}
        </div>
      </div>

      {/* ── Clavier ── */}
      <div style={{ flexShrink: 0, background: 'linear-gradient(170deg,#F0ECFF,#EAE4FF 50%,#E8F0FF)', border: '1.5px solid rgba(108,63,197,0.2)', borderRadius: '20px 20px 0 0', padding: '10px 10px 12px', boxShadow: '0 -6px 32px rgba(108,63,197,0.12), inset 0 1px 0 rgba(255,255,255,0.7)' }}>

        {/* Harakats */}
        <div style={{ marginBottom: 6 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(108,63,197,0.45)', letterSpacing: '.1em', marginBottom: 5, textTransform: 'uppercase', textAlign: 'center' }}>Harakats</p>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', direction: 'rtl', justifyContent: 'center' }}>
            {HARAKATS.map(h => (
              <div key={h.u} style={{ position: 'relative' }}>
                {tooltip === h.u && (
                  <div style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', background: C.violetDk, color: '#fff', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 8, whiteSpace: 'nowrap', zIndex: 100, pointerEvents: 'none' }}>
                    {h.name}
                    <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: `5px solid ${C.violetDk}` }} />
                  </div>
                )}
                <button onMouseDown={e => { e.preventDefault(); saveSelection(); insert(h.u) }} onMouseEnter={() => setTooltip(h.u)} onMouseLeave={() => setTooltip(null)} style={{ ...keyStyle(h.u), minWidth: 44, maxWidth: 54 }}>
                  <span style={{ fontFamily: "'Noto Naskh Arabic',serif", fontSize: 22, fontWeight: 700, color: activeKey === h.u ? '#fff' : '#3D1F8A' }}>{h.ar}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(108,63,197,0.1)', margin: '5px 0' }} />

        {/* Lettres */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Row chars={ROW1} />
          <Row chars={ROW2} />
          <Row chars={ROW3} />
        </div>

        {/* Barre inférieure */}
        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
          <button onMouseDown={e => { e.preventDefault(); saveSelection(); insert(' ') }}  style={{ flex: 3, height: 42, borderRadius: 10, border: '1.5px solid rgba(108,63,197,0.18)', background: 'linear-gradient(145deg,rgba(255,255,255,0.98),rgba(237,232,251,0.65))', cursor: 'pointer', fontSize: 14, color: '#5A4A8A', fontWeight: 700 }}>espace</button>
          <button onMouseDown={e => { e.preventDefault(); backspace() }}                   style={{ flex: 1, height: 42, borderRadius: 10, border: '1.5px solid rgba(108,63,197,0.18)', background: 'linear-gradient(145deg,rgba(255,255,255,0.98),rgba(237,232,251,0.65))', cursor: 'pointer', fontSize: 18, color: '#5A4A8A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⌫</button>
          <button onMouseDown={e => { e.preventDefault(); saveSelection(); insert('\n') }} style={{ flex: 1, height: 42, borderRadius: 10, border: '1.5px solid rgba(108,63,197,0.18)', background: 'linear-gradient(145deg,rgba(255,255,255,0.98),rgba(237,232,251,0.65))', cursor: 'pointer', fontSize: 14, color: '#5A4A8A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↵</button>
        </div>
      </div>

      {/* ── Panneau formes contextuelles ── */}
      {formPanel && (
        <div
          onMouseDown={e => e.stopPropagation()}
          style={{
            position:     'fixed',
            left:         Math.min(formPanel.x - 80, window.innerWidth - 200),
            top:          Math.max(formPanel.y - 130, 10),
            background:   C.white,
            border:       `2px solid ${C.violet}40`,
            borderRadius: 16,
            padding:      '10px 12px',
            zIndex:       99999,
            boxShadow:    '0 8px 32px rgba(108,63,197,0.25)',
            minWidth:     160,
          }}>
          {/* En-tête */}
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <span style={{ fontFamily: "'Noto Naskh Arabic',serif", fontSize: 32, color: C.violet, direction: 'rtl' }}>
              {formPanel.letter}
            </span>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '.08em', marginTop: 2 }}>
              Choisir la forme
            </div>
          </div>

          {/* Formes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
            {getForms(formPanel.letter).map(form => (
              <button
                key={form.desc}
                onMouseDown={e => {
                  e.preventDefault()
                  e.stopPropagation()
                  insert(form.value)
                  setFormPanel(null)
                }}
                style={{
                  padding:    '8px 6px',
                  borderRadius: 10,
                  border:     `1.5px solid ${C.border}`,
                  background: C.bg,
                  cursor:     'pointer',
                  textAlign:  'center' as const,
                  transition: 'all .1s',
                  display:    'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap:        4,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.violetLt; (e.currentTarget as HTMLElement).style.borderColor = C.violet }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.bg; (e.currentTarget as HTMLElement).style.borderColor = C.border }}
              >
                <span style={{ fontFamily: "'Noto Naskh Arabic',serif", fontSize: 26, fontWeight: 700, color: C.violet, direction: 'rtl' }}>
                  {form.label}
                </span>
                <span style={{ fontSize: 10, color: C.text3, fontWeight: 600 }}>
                  {form.desc}
                </span>
              </button>
            ))}
          </div>

          {/* Fermer */}
          <button
            onMouseDown={e => { e.stopPropagation(); setFormPanel(null) }}
            style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 6, background: C.violetLt, border: 'none', cursor: 'pointer', fontSize: 11, color: C.violet, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ✕
          </button>
        </div>
      )}

      {/* ── Palette couleur ── */}
      {showColorPicker && (
        <div style={{ position: 'fixed', top: pickerPos.top, left: pickerPos.left, background: C.white, border: `2px solid ${C.border}`, borderRadius: 14, padding: 12, zIndex: 99999, boxShadow: '0 8px 32px rgba(108,63,197,0.2)', display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6, minWidth: 170 }}>
          <div style={{ gridColumn: '1/-1', fontSize: 10, fontWeight: 700, color: C.text3, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.08em' }}>{t('colorPalette')}</div>
          {COLORS.map(col => (
            <button key={col} onMouseDown={e => { e.preventDefault(); applyColor(col) }} title={col} style={{ width: 26, height: 26, borderRadius: 6, background: col, border: selectedColor === col ? '2px solid #1A1A2E' : '1.5px solid rgba(0,0,0,0.1)', cursor: 'pointer', boxShadow: selectedColor === col ? '0 0 0 2px rgba(255,255,255,0.8)' : 'none', transform: selectedColor === col ? 'scale(1.15)' : 'scale(1)', transition: 'all .1s' }} />
          ))}
          <div style={{ gridColumn: '1/-1', marginTop: 4 }}>
            <input type="color" value={selectedColor} onChange={e => setSelectedColor(e.target.value)} onBlur={e => { e.preventDefault(); applyColor(e.target.value) }} style={{ width: '100%', height: 28, borderRadius: 6, border: `1.5px solid ${C.border}`, cursor: 'pointer', padding: 0 }} />
          </div>
        </div>
      )}
    </div>
  )
}
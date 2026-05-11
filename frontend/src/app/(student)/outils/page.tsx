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
const ROW3 = ['،','ئ','ء','ؤ','ر','ى','ة','و','ز','أ','إ','آ', '؟']

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

const TR: Record<string,string> = {
  'ا':'a','أ':'a','إ':'i','آ':'aa','ب':'b','ت':'t','ث':'th','ج':'j',
  'ح':'h','خ':'kh','د':'d','ذ':'dh','ر':'r','ز':'z','س':'s','ش':'sh',
  'ص':'s','ض':'d','ط':'t','ظ':'z','ع':"'",'غ':'gh','ف':'f','ق':'q',
  'ك':'k','ل':'l','م':'m','ن':'n','ه':'h','و':'w','ي':'y','ى':'a',
  'ة':'a','ء':"'",'لا':'la',
  '\u064E':'a','\u0650':'i','\u064F':'u','\u064B':'an',
  '\u064D':'in','\u064C':'un','\u0652':'','\u0651':'(sh)',
}

function translit(text: string): string {
  let r = ''; let i = 0; const c = Array.from(text)
  while (i < c.length) {
    const two = c[i] + (c[i+1] ?? '')
    if (TR[two]) { r += TR[two]; i += 2; continue }
    r += TR[c[i]] ?? c[i]; i++
  }
  return r
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

  const [fontSize, setFontSize]               = useState(36)
  const [rtl, setRtl]                         = useState(true)
  const [copied, setCopied]                   = useState(false)
  const [showTranslit, setShowTranslit]       = useState(true)
  const [activeKey, setActiveKey]             = useState<string|null>(null)
  const [tooltip, setTooltip]                 = useState<string|null>(null)
  const [plainText, setPlainText]             = useState('')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [selectedColor, setSelectedColor]     = useState(C.violet)
  const [pickerPos, setPickerPos]             = useState({ top: 0, left: 0 })
  const [isFullscreen, setIsFullscreen]       = useState(false)
  const [savedRange, setSavedRange]           = useState<Range | null>(null)

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
      if (colorBtnRef.current && !colorBtnRef.current.contains(e.target as Node)) setShowColorPicker(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', h)
    return () => document.removeEventListener('fullscreenchange', h)
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

  const selectAll = () => { editorRef.current?.focus(); document.execCommand('selectAll') }
  const copy = () => { navigator.clipboard.writeText(editorRef.current?.innerText ?? ''); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  const clear = () => { if (editorRef.current) { editorRef.current.innerHTML = ''; setPlainText('') }; setSavedRange(null); colorRangeRef.current = null }
  const download = () => {
    const blob = new Blob([editorRef.current?.innerText ?? ''], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'texte-arabe.txt'; a.click()
    URL.revokeObjectURL(url)
  }
  const normalize = () => { if (!editorRef.current) return; const tx = (editorRef.current.innerText || '').normalize('NFC'); editorRef.current.innerText = tx; setPlainText(tx) }
  const convertNum = (toArabic: boolean) => { if (!editorRef.current) return; const tx = convertDigits(editorRef.current.innerText || '', toArabic); editorRef.current.innerText = tx; setPlainText(tx) }
  const toggleFullscreen = () => { if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen() }

  const letters = Array.from(plainText).filter(c => /[\u0600-\u06FF]/.test(c)).length
  const words   = plainText.trim().split(/\s+/).filter(w => /[\u0600-\u06FF]/.test(w)).length

  const keyStyle = (char: string, w: number | string): React.CSSProperties => {
    const on = activeKey === char
    return { width: w, height: 46, borderRadius: 10, flexShrink: 0, border: on ? '1.5px solid rgba(108,63,197,0.9)' : '1.5px solid rgba(108,63,197,0.18)', background: on ? 'linear-gradient(145deg,#7B52D4,#5A2BAF)' : 'linear-gradient(145deg,rgba(255,255,255,0.98),rgba(237,232,251,0.65))', boxShadow: on ? '0 0 16px rgba(108,63,197,0.5),0 3px 8px rgba(108,63,197,0.25)' : '0 2px 6px rgba(108,63,197,0.08),inset 0 1px 0 rgba(255,255,255,0.85)', cursor: 'pointer', fontFamily: "'Noto Naskh Arabic',serif", fontSize: 26, fontWeight: 700, color: on ? '#fff' : '#2D1B6B', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .1s ease', transform: on ? 'translateY(1.5px) scale(0.95)' : 'none', userSelect: 'none' }
  }

  const hoverOn = (e: React.MouseEvent, char: string) => { if (activeKey === char) return; const el = e.currentTarget as HTMLElement; el.style.background = 'linear-gradient(145deg,rgba(108,63,197,0.14),rgba(108,63,197,0.07))'; el.style.borderColor = 'rgba(108,63,197,0.45)'; el.style.color = C.violet }
  const hoverOff = (e: React.MouseEvent, char: string) => { if (activeKey === char) return; const el = e.currentTarget as HTMLElement; el.style.background = 'linear-gradient(145deg,rgba(255,255,255,0.98),rgba(237,232,251,0.65))'; el.style.borderColor = 'rgba(108,63,197,0.18)'; el.style.color = '#2D1B6B' }

  const btn = (active = false, color = C.violet): React.CSSProperties => ({ padding: '6px 12px', borderRadius: 8, border: `1.5px solid ${active ? color : C.border}`, background: active ? color : C.white, color: active ? '#fff' : C.text2, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s' })

  const Row = ({ chars }: { chars: string[] }) => (
    <div style={{ display:'flex', gap:5, justifyContent:'center', direction:'rtl' }}>
      {chars.map(c => (
        <button key={c} onMouseDown={e => { e.preventDefault(); saveSelection(); insert(c) }} onMouseEnter={e => hoverOn(e, c)} onMouseLeave={e => hoverOff(e, c)} style={keyStyle(c, c.length > 1 ? 52 : 42)}>
          {c}
        </button>
      ))}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)', background: 'linear-gradient(160deg,#F8F6FF 0%,#EEE8FF 50%,#F2F6FF 100%)', fontFamily: 'system-ui,sans-serif', overflow: 'hidden' }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap" rel="stylesheet" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '10px 14px 8px' }}>
        {/* Barre d'outils */}
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
          <button onClick={() => setShowTranslit(v => !v)} style={btn(showTranslit, C.orange)}>🔄 Prononciation</button>
          <button onClick={() => convertNum(true)} style={btn()} title="123 → ١٢٣">١٢٣</button>
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

        {/* Zone d'édition */}
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
          {showTranslit && plainText && (
            <div style={{ position: 'absolute', bottom: 12, left: 16, right: 16, background: 'rgba(254,240,227,0.96)', border: '1px solid rgba(240,124,30,0.2)', borderRadius: 10, padding: '8px 14px', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: C.orangeDk, textTransform: 'uppercase', letterSpacing: '.08em', flexShrink: 0 }}>Prononciation</span>
              <span style={{ fontSize: 13, color: C.orangeDk, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{translit(plainText)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Clavier */}
      <div style={{ flexShrink: 0, background: 'linear-gradient(170deg,#F0ECFF,#EAE4FF 50%,#E8F0FF)', border: '1.5px solid rgba(108,63,197,0.2)', borderRadius: '20px 20px 0 0', padding: '12px 12px 14px', boxShadow: '0 -6px 32px rgba(108,63,197,0.12), inset 0 1px 0 rgba(255,255,255,0.7)' }}>
        <div style={{ marginBottom: 8 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'rgba(108,63,197,0.45)', letterSpacing: '.1em', marginBottom: 6, textTransform: 'uppercase', textAlign: 'center' }}>Harakats</p>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', direction: 'rtl', justifyContent: 'center' }}>
            {HARAKATS.map(h => (
              <div key={h.u} style={{ position: 'relative' }}>
                {tooltip === h.u && (
                  <div style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', background: C.violetDk, color: '#fff', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 8, whiteSpace: 'nowrap', zIndex: 100, pointerEvents: 'none', boxShadow: '0 4px 12px rgba(74,42,138,0.3)' }}>
                    {h.name}
                    <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: `5px solid ${C.violetDk}` }} />
                  </div>
                )}
                <button onMouseDown={e => { e.preventDefault(); saveSelection(); insert(h.u) }} onMouseEnter={() => setTooltip(h.u)} onMouseLeave={() => setTooltip(null)} style={keyStyle(h.u, 52)}>
                  <span style={{ fontFamily: "'Noto Naskh Arabic',serif", fontSize: 28, fontWeight: 700, direction: 'rtl', color: activeKey === h.u ? '#fff' : '#3D1F8A' }}>{h.ar}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
        <div style={{ height: 1, background: 'rgba(108,63,197,0.1)', margin: '6px 0' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <Row chars={ROW1} />
          <Row chars={ROW2} />
          <Row chars={ROW3} />
        </div>
        <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
          <button onMouseDown={e => { e.preventDefault(); saveSelection(); insert(' ') }} style={{ flex: 3, height: 46, borderRadius: 10, border: '1.5px solid rgba(108,63,197,0.18)', background: 'linear-gradient(145deg,rgba(255,255,255,0.98),rgba(237,232,251,0.65))', cursor: 'pointer', fontSize: 16, color: '#5A4A8A', fontWeight: 700 }}>espace</button>
          <button onMouseDown={e => { e.preventDefault(); backspace() }} style={{ flex: 1, height: 46, borderRadius: 10, border: '1.5px solid rgba(108,63,197,0.18)', background: 'linear-gradient(145deg,rgba(255,255,255,0.98),rgba(237,232,251,0.65))', cursor: 'pointer', fontSize: 20, color: '#5A4A8A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⌫</button>
          <button onMouseDown={e => { e.preventDefault(); saveSelection(); insert('\n') }} style={{ flex: 1, height: 46, borderRadius: 10, border: '1.5px solid rgba(108,63,197,0.18)', background: 'linear-gradient(145deg,rgba(255,255,255,0.98),rgba(237,232,251,0.65))', cursor: 'pointer', fontSize: 16, color: '#5A4A8A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↵</button>
        </div>
      </div>

      {/* Palette couleur */}
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
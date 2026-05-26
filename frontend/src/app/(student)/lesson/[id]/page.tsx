'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { curriculumApi, api } from '@/lib/api'
import { resolveExercises } from '@/lib/useVariantSelector'
import PositionsLearning from '@/components/PositionsLearning'
import ArabicKeyboard from '@/components/ArabicKeyboard'
import OralExercise from "@/components/exercises/OralExercise"
import OralPracticeExercise from "@/components/exercises/OralPracticeExercise"

const C = {
  violet:'#6C3FC5', violetLt:'#EDE8FB', violetDk:'#4A2A8A',
  orange:'#F07C1E', orangeLt:'#FEF0E3', orangeDk:'#B85A0E',
  green:'#2BA84A', greenLt:'#E3F7E8', greenDk:'#1A6630',
  red:'#E24B4A', redLt:'#FCEBEB',
  bg:'#F8F7FF', white:'#FFFFFF',
  text:'#1A1A2E', text2:'#5A5A7A', text3:'#9A9AB0',
  border:'#E8E4F8',
}

const MODULE_LETTERS: Record<number, { name: string; ar: string; color: string; bg: string }[]> = {
  1: [
    { name:'Ba',  ar:'ب', color:'#6C3FC5', bg:'#EDE8FB' },
    { name:'Mim', ar:'م', color:'#F07C1E', bg:'#FEF0E3' },
    { name:'Kaf', ar:'ك', color:'#2BA84A', bg:'#E3F7E8' },
    { name:'Ta',  ar:'ت', color:'#1976D2', bg:'#E6F1FB' },
  ],
  2: [
    { name:'Tha', ar:'ث', color:'#6C3FC5', bg:'#EDE8FB' },
    { name:'Lam', ar:'ل', color:'#F07C1E', bg:'#FEF0E3' },
    { name:'Jim', ar:'ج', color:'#2BA84A', bg:'#E3F7E8' },
  ],
}

const ENCOURAGEMENTS = ['Excellent !','Parfait !','Bravo !','Super !','Très bien !']

const playAudio = (src?: string) => { if (src) new Audio(src).play().catch(() => {}) }
const speakAr = (text?: string) => {
  if (!text) return
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ar-SA'; u.rate = 0.75
  speechSynthesis.speak(u)
}
const playSound = (url?: string, ar?: string) => { if (url) playAudio(url); else if (ar) speakAr(ar) }
const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
const stripConn = (s: string) => s.replace(/\u0640/g, '').replace(/[\u064B-\u065F]/g, '').trim()
const isAr = (s: string) => /[\u0600-\u06FF]/.test(s)

// ── Option MCQ ──────────────────────────────────────────────
function OptionBtn({ label, text, state, onClick }: {
  label: string; text: string; state: 'idle'|'correct'|'wrong'|'show'; onClick: () => void
}) {
  const colors = {
    idle:    { bg: C.white,   border: C.border,  text: C.text,    lbl: '#F0EDF8', lblT: C.violet },
    correct: { bg: C.greenLt, border: C.green,   text: C.greenDk, lbl: C.green,   lblT: '#fff' },
    wrong:   { bg: C.redLt,   border: C.red,     text: C.red,     lbl: C.red,     lblT: '#fff' },
    show:    { bg: C.greenLt, border: C.green,   text: C.greenDk, lbl: C.green,   lblT: '#fff' },
  }[state]
  return (
    <button onClick={onClick} disabled={state !== 'idle'}
      style={{ padding: '14px 16px', borderRadius: 14, border: `2.5px solid ${colors.border}`, background: colors.bg, cursor: state === 'idle' ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 12, width: '100%', transition: 'all .15s', textAlign: 'left' }}
      onMouseEnter={e => { if (state === 'idle') { (e.currentTarget as HTMLElement).style.borderColor = C.violet; (e.currentTarget as HTMLElement).style.background = C.violetLt } }}
      onMouseLeave={e => { if (state === 'idle') { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.background = C.white } }}>
      <span style={{ width: 28, height: 28, borderRadius: 8, background: colors.lbl, color: colors.lblT, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{label}</span>
      <span style={{ fontFamily: isAr(text) ? "'Noto Naskh Arabic',serif" : 'inherit', fontSize: isAr(text) ? 30 : 15, fontWeight: isAr(text) ? 400 : 600, color: colors.text, direction: isAr(text) ? 'rtl' : 'ltr', flex: 1 }}>{text}</span>
    </button>
  )
}

// ── MCQ / Audio Choice ──────────────────────────────────────
function MCQExercise({ ex, onAnswer }: { ex: any; onAnswer: (c: boolean, l: number) => void }) {
  const correctOpt = ex.options?.[ex.correctIndex ?? 0] ?? ''
  const [opts] = useState<string[]>(() => shuffle(ex.options ?? []))
  const correctIdx = opts.indexOf(correctOpt)
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const startTime = useRef(Date.now())

  const handle = (i: number) => {
    if (answered) return
    setSelected(i); setAnswered(true)
    const ok = i === correctIdx
    if (ok) playSound(ex.audioUrl, ex.silent ? undefined : ex.promptAr)
    onAnswer(ok, Date.now() - startTime.current)
  }

  return (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
    {ex.type === 'audio_choice' && (
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <button onClick={() => playSound(ex.audioUrl, ex.promptAr)}
          style={{ width: 72, height: 72, borderRadius: '50%', background: C.orange, border: 'none', cursor: 'pointer', fontSize: 28, color: '#fff' }}>▶</button>
      </div>
    )}
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(2, 1fr)', 
      gap: 10 
    }}>
      {(opts as string[]).map((opt: string, i: number) => {
        const state = !answered ? 'idle' : i === selected && i === correctIdx ? 'correct' : i === selected ? 'wrong' : i === correctIdx ? 'show' : 'idle'
        return <OptionBtn key={i} label={String.fromCharCode(65 + i)} text={opt} state={state} onClick={() => handle(i)} />
      })}
    </div>
  </div>
)
}

// ── Input texte ─────────────────────────────────────────────
function InputExercise({ ex, onAnswer }: { ex: any; onAnswer: (c: boolean, l: number) => void }) {
  const [val, setVal] = useState('')
  const [answered, setAnswered] = useState(false)
  const [correct, setCorrect] = useState<boolean | null>(null)
  const startTime = useRef(Date.now())

  const handle = () => {
    if (answered || !val.trim()) return
    const ok = (ex.acceptedAnswers ?? []).some((a: string) => stripConn(a) === stripConn(val.trim()))
    setAnswered(true); setCorrect(ok)
    if (ok) playSound(ex.audioUrl, ex.promptAr)
    onAnswer(ok, Date.now() - startTime.current)
  }

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
      <div style={{ flex: 1 }}>
        <ArabicKeyboard value={val} onChange={setVal} answered={answered} isCorrect={correct} />
      </div>
      <button onClick={handle} disabled={answered || !val.trim()}
        style={{ padding: '0 20px', borderRadius: 14, border: 'none', background: answered || !val.trim() ? C.border : C.violet, color: '#fff', cursor: answered || !val.trim() ? 'default' : 'pointer', fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0, alignSelf: 'flex-start', height: 58 }}>
        Valider →
      </button>
    </div>
  )
}

// ── Canvas drawing ──────────────────────────────────────────
function DrawingExercise({ ex, onAnswer }: { ex: any; onAnswer: (c: boolean, l: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [done, setDone] = useState(false)
  const startTime = useRef(Date.now())

  const initCanvas = () => {
    const c = canvasRef.current; if (!c) return
    const ctx = c.getContext('2d')!
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.width, c.height)
    ctx.font = "130px 'Noto Naskh Arabic',serif"
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillStyle = `${C.violet}18`
    ctx.fillText(ex.letter ?? ex.promptAr ?? '', c.width / 2, c.height / 2)
  }
  useEffect(() => { initCanvas() }, [ex.id])

  const getPos = (e: React.MouseEvent | React.TouchEvent, c: HTMLCanvasElement) => {
    const r = c.getBoundingClientRect(); const sx = c.width / r.width, sy = c.height / r.height
    if ('touches' in e) return { x: (e.touches[0].clientX - r.left) * sx, y: (e.touches[0].clientY - r.top) * sy }
    return { x: ((e as React.MouseEvent).clientX - r.left) * sx, y: ((e as React.MouseEvent).clientY - r.top) * sy }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const c = canvasRef.current; if (!c) return
    const ctx = c.getContext('2d')!; const p = getPos(e, c)
    ctx.beginPath(); ctx.moveTo(p.x, p.y)
    ctx.strokeStyle = C.violet; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    setDrawing(true); setHasDrawn(true)
  }
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return
    const c = canvasRef.current; if (!c) return
    const ctx = c.getContext('2d')!; const p = getPos(e, c)
    ctx.lineTo(p.x, p.y); ctx.stroke()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <canvas ref={canvasRef} width={320} height={260}
        style={{ width: '100%', maxWidth: 340, borderRadius: 16, border: `2.5px solid ${done ? C.green : C.border}`, cursor: 'crosshair', touchAction: 'none', background: C.bg }}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={() => setDrawing(false)} onMouseLeave={() => setDrawing(false)}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={() => setDrawing(false)} />
      {ex.hint && <p style={{ fontSize: 12, color: C.text2, fontStyle: 'italic', textAlign: 'center' }}>{ex.hint}</p>}
      <div style={{ display: 'flex', gap: 10, width: '100%' }}>
        <button onClick={() => { initCanvas(); setHasDrawn(false); setDone(false) }}
          style={{ flex: 1, padding: '12px', borderRadius: 12, border: `2px solid ${C.border}`, background: C.white, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.text2 }}>↺ Effacer</button>
        <button onClick={() => { setDone(true); setTimeout(() => onAnswer(true, Date.now() - startTime.current), 600) }}
          disabled={!hasDrawn || done}
          style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', background: hasDrawn && !done ? C.violet : C.border, color: '#fff', cursor: hasDrawn && !done ? 'pointer' : 'default', fontSize: 13, fontWeight: 700 }}>
          {done ? 'Validé ✓' : 'Valider mon tracé'}
        </button>
      </div>
    </div>
  )
}

// ── Drag & Drop ─────────────────────────────────────────────
function DragDropExercise({ ex, onAnswer }: { ex: any; onAnswer: (c: boolean, l: number) => void }) {
  const total = ex.targetLength ?? ex.letters?.length ?? 4
  const [slots, setSlots] = useState<(string | null)[]>(Array(total).fill(null))
  const [available, setAvailable] = useState<string[]>(() => shuffle(ex.letters ?? []))
  const [answered, setAnswered] = useState(false)
  const [correct, setCorrect] = useState<boolean | null>(null)
  const startTime = useRef(Date.now())

  const addLetter = (letter: string, idx: number) => {
    if (answered) return
    const first = slots.indexOf(null); if (first === -1) return
    const ns = [...slots]; ns[first] = letter
    const na = [...available]; na.splice(idx, 1)
    setSlots(ns); setAvailable(na)
    if (ns.every(s => s !== null)) {
      const built = stripConn(ns.filter(Boolean).join(''))
      const target = stripConn(ex.correctWord ?? '')
      const ok = built === target && built.length > 0
      setAnswered(true); setCorrect(ok)
      if (ok) playSound(ex.audioUrl, ex.correctWord)
      onAnswer(ok, Date.now() - startTime.current)
    }
  }
  const removeSlot = (i: number) => {
    if (answered || slots[i] === null) return
    const letter = slots[i]!
    const ns = [...slots]; ns[i] = null
    setSlots(ns); setAvailable([...available, letter])
  }

  const bc = answered ? (correct ? C.green : C.red) : C.violet
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <div style={{ display: 'flex', gap: 8, direction: 'rtl', flexWrap: 'wrap', justifyContent: 'center' }}>
        {slots.map((s, i) => (
          <div key={i} onClick={() => removeSlot(i)}
            style={{ width: 56, height: 62, border: `2.5px ${s ? 'solid' : 'dashed'} ${bc}`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Noto Naskh Arabic',serif", fontSize: 26, color: answered ? (correct ? C.green : C.red) : C.violet, background: s ? (answered ? (correct ? C.greenLt : C.redLt) : C.violetLt) : C.bg, cursor: s && !answered ? 'pointer' : 'default', transition: 'all .2s' }}>
            {s ?? ''}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        {available.map((l, i) => (
          <button key={i} onClick={() => addLetter(l, i)} disabled={answered}
            style={{ width: 56, height: 56, borderRadius: 12, border: `2px solid ${C.violet}`, background: C.violetLt, cursor: answered ? 'default' : 'pointer', fontFamily: "'Noto Naskh Arabic',serif", fontSize: 24, color: C.violet, fontWeight: 700 }}
            onMouseEnter={e => { if (!answered) { (e.currentTarget as HTMLElement).style.background = C.violet; (e.currentTarget as HTMLElement).style.color = '#fff' } }}
            onMouseLeave={e => { if (!answered) { (e.currentTarget as HTMLElement).style.background = C.violetLt; (e.currentTarget as HTMLElement).style.color = C.violet } }}>
            {l}
          </button>
        ))}
      </div>
      {!answered && <button onClick={() => { setSlots(Array(total).fill(null)); setAvailable(shuffle(ex.letters ?? [])) }} style={{ fontSize: 12, color: C.text3, background: 'none', border: 'none', cursor: 'pointer' }}>↺ Réinitialiser</button>}
    </div>
  )
}                                                                        
// ── Word Order ──────────────────────────────────────────────
function WordOrderExercise({ ex, onAnswer }: { ex: any; onAnswer: (c: boolean, l: number) => void }) {
  const [chosen, setChosen]       = useState<string[]>([])
  const [available, setAvailable] = useState<string[]>(() => shuffle(ex.words ?? []))
  const [answered, setAnswered]   = useState(false)
  const [correct, setCorrect]     = useState<boolean | null>(null)
  const [playing, setPlaying]     = useState(false)
  const startTime = useRef(Date.now())

  const playTarget = () => {
    if (ex.audioUrl) {
      setPlaying(true)
      const a = new Audio(ex.audioUrl)
      a.play().catch(() => {})
      a.onended = () => setPlaying(false)
    } else { speakAr(ex.correctSentence) }
  }

  const playWord = (word: string) => {
    const clean = word.replace(/[\u064B-\u065F\u0670]/g, '').trim()
    const src = ex.wordAudio?.[word] ?? ex.wordAudio?.[clean]
    if (src) new Audio(src).play().catch(() => {})
    else speakAr(word)
  }

  const add = (w: string, i: number) => {
    if (answered) return
    playWord(w)
    setChosen([...chosen, w])
    const a = [...available]; a.splice(i, 1); setAvailable(a)
  }

  const remove = (i: number) => {
    if (answered) return
    const w = chosen[i]
    playWord(w)
    setAvailable([...available, w])
    setChosen(chosen.filter((_, idx) => idx !== i))
  }

  const validate = () => {
    if (answered || chosen.length !== (ex.words ?? []).length) return
    const ok = chosen.join(' ') === ex.correctSentence
    setAnswered(true); setCorrect(ok)
    if (ok) playSound(ex.audioUrl, ex.correctSentence)
    onAnswer(ok, Date.now() - startTime.current)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ width: '100%', background: C.orangeLt, border: `2px solid ${C.orange}40`, borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={playTarget}
          style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0, background: playing ? C.orangeDk : C.orange, border: 'none', cursor: 'pointer', fontSize: 20, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s', boxShadow: playing ? `0 0 0 4px ${C.orange}40` : 'none' }}>
          {playing ? '◼' : '▶'}
        </button>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.orangeDk, marginBottom: 2 }}>Écoute la phrase à composer</p>
          <p style={{ fontSize: 11, color: C.orange, opacity: 0.8 }}>Tu peux l&apos;écouter autant de fois que tu veux</p>
        </div>
      </div>
      <div style={{ minHeight: 58, width: '100%', border: `2.5px dashed ${answered ? (correct ? C.green : C.red) : C.border}`, borderRadius: 14, padding: '10px 14px', display: 'flex', gap: 8, flexWrap: 'wrap', direction: 'rtl', justifyContent: 'center', alignItems: 'center', background: C.bg }}>
        {chosen.length === 0
          ? <span style={{ color: C.text3, fontSize: 13 }}>Clique sur les mots pour les ordonner</span>
          : chosen.map((w, i) => (
            <button key={i} onClick={() => remove(i)} disabled={answered}
              style={{ padding: '7px 14px', borderRadius: 10, background: answered ? (correct ? C.green : C.red) : C.violet, color: '#fff', border: 'none', cursor: answered ? 'default' : 'pointer', fontFamily: "'Noto Naskh Arabic',serif", fontSize: 20, fontWeight: 700, transition: 'all .15s' }}>
              {w}
            </button>
          ))}
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', direction: 'rtl' }}>
        {available.map((w, i) => (
          <button key={i} onClick={() => add(w, i)} disabled={answered}
            style={{ padding: '9px 16px', borderRadius: 12, border: `2px solid ${C.violet}`, background: C.violetLt, cursor: answered ? 'default' : 'pointer', fontFamily: "'Noto Naskh Arabic',serif", fontSize: 20, color: C.violet, fontWeight: 700, transition: 'all .15s' }}
            onMouseEnter={e => { if (!answered) { (e.currentTarget as HTMLElement).style.background = C.violet; (e.currentTarget as HTMLElement).style.color = '#fff' } }}
            onMouseLeave={e => { if (!answered) { (e.currentTarget as HTMLElement).style.background = C.violetLt; (e.currentTarget as HTMLElement).style.color = C.violet } }}>
            {w}
          </button>
        ))}
      </div>
      <button onClick={validate} disabled={chosen.length !== (ex.words ?? []).length || answered}
        style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: chosen.length === (ex.words ?? []).length && !answered ? C.violet : C.border, color: '#fff', cursor: chosen.length === (ex.words ?? []).length && !answered ? 'pointer' : 'default', fontSize: 15, fontWeight: 700 }}>
        Valider →
      </button>
    </div>
  )
}

// ── Matching texte ↔ texte ──────────────────────────────────
function MatchingExercise({ ex, onAnswer }: { ex: any; onAnswer: (c: boolean, l: number) => void }) {
  const PAIR_COLORS = [
  { bg: '#EDE8FB', border: '#6C3FC5', text: '#3D2280' },
  { bg: '#FEF0E3', border: '#F07C1E', text: '#7A3A00' },
  { bg: '#E3F7E8', border: '#2BA84A', text: '#1A6630' },
  { bg: '#E6F1FB', border: '#1976D2', text: '#0D47A1' },
   ]
  const pairs = ex.pairs ?? []
  const [pairColors, setPairColors] = useState<Record<string, number>>({})
  const [shuffledAr] = useState<any[]>(() => shuffle(pairs))
  const [shuffledFr] = useState<string[]>(() => shuffle(pairs.map((p: any) => p.fr as string)))
  const [selectedAr, setSelectedAr] = useState<string | null>(null)
  const [associations, setAssociations] = useState<Record<string, string>>({})
  const [results, setResults] = useState<Record<string, boolean> | null>(null)
  const [validated, setValidated] = useState(false)
  const startTime = useRef(Date.now())

  const allAssociated = Object.keys(associations).length === pairs.length

  const selectAr = (ar: string) => { if (validated) return; setSelectedAr(ar === selectedAr ? null : ar) }
  const selectFr = (fr: string) => {
  if (!selectedAr || validated) return
  const colorIdx = Object.keys(associations).length % PAIR_COLORS.length
  setPairColors(prev => ({ ...prev, [selectedAr]: colorIdx }))
  setAssociations(prev => ({ ...prev, [selectedAr]: fr }))
  setSelectedAr(null)
    }
  const validate = () => {
    if (!allAssociated || validated) return
    const res: Record<string, boolean> = {}
    let correct = 0
    pairs.forEach((p: any) => { const ok = associations[p.ar] === p.fr; res[p.ar] = ok; if (ok) correct++ })
    setResults(res); setValidated(true)
    onAnswer(correct / pairs.length >= 0.75, Date.now() - startTime.current)
  }

  const getFrForAr = (ar: string) => associations[ar] ?? null

  const arColor = (ar: string) => {
  if (validated && results) return results[ar] 
    ? { bg: C.greenLt, border: C.green, text: C.green } 
    : { bg: C.redLt, border: C.red, text: C.red }
  if (selectedAr === ar) return { bg: C.violetLt, border: C.violet, text: C.violet }
  if (associations[ar] !== undefined && pairColors[ar] !== undefined) {
    const col = PAIR_COLORS[pairColors[ar]]
    return { bg: col.bg, border: col.border, text: col.text }
  }
  return { bg: C.white, border: C.border, text: C.text }
}

  const frColor = (fr: string) => {
  if (validated && results) {
    const assocAr = Object.keys(associations).find(a => associations[a] === fr)
    if (assocAr) return results[assocAr] 
      ? { bg: C.greenLt, border: C.green, text: C.green } 
      : { bg: C.redLt, border: C.red, text: C.red }
  }
  const assocAr = Object.keys(associations).find(a => associations[a] === fr)
  if (assocAr && pairColors[assocAr] !== undefined) {
    const col = PAIR_COLORS[pairColors[assocAr]]
    return { bg: col.bg, border: col.border, text: col.text }
  }
  return { bg: C.white, border: C.border, text: C.text }
}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 13, color: C.text2, textAlign: 'center' }}>Sélectionne un mot arabe, puis sa traduction · Valide à la fin</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {shuffledAr.map((p: any) => {
            const c = arColor(p.ar)
            return (
              <div key={p.ar} onClick={() => selectAr(p.ar)}
                style={{ borderRadius: 12, border: `2.5px solid ${c.border}`, background: c.bg, padding: '10px 8px', cursor: validated ? 'default' : 'pointer', transition: 'all .15s', textAlign: 'center' as const }}>
                <div style={{ fontFamily: "'Noto Naskh Arabic',serif", fontSize: 28, color: c.text, direction: 'rtl' }}>{p.ar}</div>
                
                {validated && results && <div style={{ fontSize: 11, marginTop: 4, fontWeight: 700, color: c.text }}>{results[p.ar] ? '✓' : `✗ → ${p.fr}`}</div>}
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {shuffledFr.map((fr: string) => {
            const c = frColor(fr)
            return (
              <div key={fr} onClick={() => selectFr(fr)}
                style={{ borderRadius: 12, border: `2.5px solid ${c.border}`, background: c.bg, padding: '10px 8px', cursor: validated || !selectedAr ? 'default' : 'pointer', transition: 'all .15s', textAlign: 'center' as const, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 56 }}>
                <span style={{ fontSize: 18, fontWeight: 600, color: c.text, padding: '8px 8px' }}>{fr}</span>
              </div>
            )
          })}
        </div>
      </div>
      {!validated && (
        <button onClick={validate} disabled={!allAssociated}
          style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: allAssociated ? C.violet : C.border, color: '#fff', cursor: allAssociated ? 'pointer' : 'default', fontSize: 15, fontWeight: 700, marginTop: 4 }}>
          {allAssociated ? 'Valider mes réponses →' : `Encore ${pairs.length - Object.keys(associations).length} association(s)`}
        </button>
      )}
      {validated && results && (() => {
        const correct = Object.values(results).filter(Boolean).length
        const score   = correct / pairs.length
        const passed  = score >= 0.75
        return (
          <div style={{ padding: '12px 16px', borderRadius: 12, background: passed ? C.greenLt : C.redLt, border: `2px solid ${passed ? C.green : C.red}`, textAlign: 'center' as const }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: passed ? C.green : C.red, marginBottom: 4 }}>{passed ? '✓ Bien joué !' : '✗ Quelques erreurs'}</p>
            <p style={{ fontSize: 13, color: C.text2 }}>{correct} / {pairs.length} paires correctes ({Math.round(score * 100)}%)</p>
          </div>
        )
      })()}
    </div>
  )
}

// ── Matching Image ↔ Mot arabe ──────────────────────────────
function MatchingImageWordExercise({ ex, onAnswer }: { ex: any; onAnswer: (c: boolean, l: number) => void }) {
  const pairs = ex.pairs ?? []
  const [shuffledImages] = useState<any[]>(() => shuffle(pairs))
  const [shuffledWords]  = useState<any[]>(() => shuffle(pairs))
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [associations, setAssociations] = useState<Record<string, string>>({})
  const [results, setResults] = useState<Record<string, boolean> | null>(null)
  const [validated, setValidated] = useState(false)
  const startTime = useRef(Date.now())

  const allAssociated = Object.keys(associations).length === pairs.length
  const selectImage = (image: string) => { if (validated) return; setSelectedImage(image === selectedImage ? null : image) }
  const selectWord  = (ar: string) => { if (!selectedImage || validated) return; setAssociations(prev => ({ ...prev, [selectedImage]: ar })); setSelectedImage(null) }

  const validate = () => {
    if (!allAssociated || validated) return
    const res: Record<string, boolean> = {}
    let correct = 0
    pairs.forEach((p: any) => { const ok = associations[p.image] === p.ar; res[p.image] = ok; if (ok) correct++ })
    setResults(res); setValidated(true)
    onAnswer(correct / pairs.length >= 0.75, Date.now() - startTime.current)
  }

  const imageStyle = (image: string) => {
    if (validated && results) return results[image] ? { border: C.green, bg: C.greenLt } : { border: C.red, bg: C.redLt }
    if (selectedImage === image)   return { border: C.violet, bg: C.violetLt }
    if (associations[image])       return { border: C.violet + '60', bg: '#F0EDF8' }
    return { border: C.border, bg: C.white }
  }

  const wordStyle = (ar: string) => {
    if (validated && results) {
      const assocImage = Object.keys(associations).find(img => associations[img] === ar)
      if (assocImage) return results[assocImage] ? { border: C.green, bg: C.greenLt, text: C.green } : { border: C.red, bg: C.redLt, text: C.red }
    }
    if (Object.values(associations).includes(ar)) return { border: C.violet + '60', bg: '#F0EDF8', text: C.text }
    if (selectedImage) return { border: C.violet + '40', bg: C.violetLt + '60', text: C.text }
    return { border: C.border, bg: C.white, text: C.text }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ fontSize: 13, color: C.text2, textAlign: 'center' }}>Sélectionne une image, puis le mot arabe · Valide à la fin</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {shuffledImages.map((p: any) => {
            const s = imageStyle(p.image)
            return (
              <button key={p.image} onClick={() => selectImage(p.image)} disabled={validated}
                style={{ borderRadius: 14, overflow: 'hidden', cursor: validated ? 'default' : 'pointer', border: `2.5px solid ${s.border}`, background: s.bg, padding: 6, transition: 'all .15s', transform: selectedImage === p.image ? 'scale(1.03)' : 'scale(1)', position: 'relative' as const }}>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <img src={p.image} alt="" style={{ width: '250', height: '220px' }} />
                </div>
                {associations[p.image] && !validated && (
                  <div style={{ position: 'absolute' as const, bottom: 10, left: 0, right: 0, textAlign: 'center' as const, background: 'rgba(108,63,197,0.85)', color: '#fff', fontSize: 16, fontFamily: "'Noto Naskh Arabic',serif", padding: '2px 6px', direction: 'rtl' }}>
                    {associations[p.image]}
                  </div>
                )}
                {validated && results && (
                  <div style={{ position: 'absolute' as const, top: 10, right: 10, width: 26, height: 26, borderRadius: '50%', background: results[p.image] ? C.green : C.red, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>
                    {results[p.image] ? '✓' : '✗'}
                  </div>
                )}
              </button>
            )
          })}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {shuffledWords.map((p: any) => {
            const s = wordStyle(p.ar)
            return (
              <button key={p.ar} onClick={() => selectWord(p.ar)} disabled={validated || !selectedImage}
                style={{ borderRadius: 14, border: `2.5px solid ${s.border}`, background: s.bg, padding: '14px 10px', cursor: validated || !selectedImage ? 'default' : 'pointer', transition: 'all .15s', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 72 }}
                onMouseEnter={e => { if (!validated && selectedImage) (e.currentTarget as HTMLElement).style.background = C.violetLt }}
                onMouseLeave={e => { if (!validated && selectedImage) (e.currentTarget as HTMLElement).style.background = s.bg }}>
                <span style={{ fontFamily: "'Noto Naskh Arabic',serif", fontSize: 46, fontWeight: 700, direction: 'rtl', color: s.text }}>{p.ar}</span>
              </button>
            )
          })}
        </div>
      </div>
      {!validated && (
        <button onClick={validate} disabled={!allAssociated}
          style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: allAssociated ? C.violet : C.border, color: '#fff', cursor: allAssociated ? 'pointer' : 'default', fontSize: 15, fontWeight: 700 }}>
          {allAssociated ? 'Valider mes réponses →' : `Encore ${pairs.length - Object.keys(associations).length} association(s)`}
        </button>
      )}
      {validated && results && (() => {
        const correct = Object.values(results).filter(Boolean).length
        const score   = correct / pairs.length
        const passed  = score >= 0.75
        return (
          <div style={{ padding: '12px 16px', borderRadius: 12, background: passed ? C.greenLt : C.redLt, border: `2px solid ${passed ? C.green : C.red}`, textAlign: 'center' as const }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: passed ? C.green : C.red, marginBottom: 4 }}>{passed ? '✓ Bien joué !' : '✗ Quelques erreurs'}</p>
            <p style={{ fontSize: 13, color: C.text2 }}>{correct} / {pairs.length} paires correctes ({Math.round(score * 100)}%)</p>
          </div>
        )
      })()}
    </div>
  )
}

// ── Matching Texte → Audio ──────────────────────────────────
function MatchingTextAudioExercise({ ex, onAnswer }: { ex: any; onAnswer: (c: boolean, l: number) => void }) {
  const pairs: { text: string; audioUrl: string }[] = ex.pairs ?? []
  const pool: string[] = ex.audioPool ?? pairs.map((p: any) => p.audioUrl)

  const [options] = useState<{ audioUrl: string; isCorrect: boolean }[][]>(() =>
    pairs.map(pair => {
      const distractors = shuffle(pool.filter(url => url !== pair.audioUrl)).slice(0, 3)
      return shuffle([{ audioUrl: pair.audioUrl, isCorrect: true }, ...distractors.map(url => ({ audioUrl: url, isCorrect: false }))])
    })
  )

  const [selections, setSelections] = useState<Record<number, string>>({})
  const [playingKey, setPlayingKey] = useState<string | null>(null)
  const [results, setResults]       = useState<Record<number, boolean> | null>(null)
  const [validated, setValidated]   = useState(false)
  const startTime = useRef(Date.now())
  const audioRef  = useRef<HTMLAudioElement | null>(null)

  const allSelected = Object.keys(selections).length === pairs.length

  const playOption = (audioUrl: string, key: string) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0 }
    setPlayingKey(key)
    const a = new Audio(audioUrl); audioRef.current = a
    a.play().catch(() => {}); a.onended = () => setPlayingKey(null)
  }

  const select = (pairIdx: number, audioUrl: string) => { if (validated) return; setSelections(prev => ({ ...prev, [pairIdx]: audioUrl })) }

  const validate = () => {
    if (!allSelected || validated) return
    const res: Record<number, boolean> = {}
    let correct = 0
    pairs.forEach((pair, i) => { const ok = selections[i] === pair.audioUrl; res[i] = ok; if (ok) correct++ })
    setResults(res); setValidated(true)
    onAnswer(correct / pairs.length >= 0.75, Date.now() - startTime.current)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {pairs.map((pair, pairIdx) => {
        const selected = selections[pairIdx]
        const result   = results?.[pairIdx]
        return (
          <div key={pairIdx} style={{ background: validated ? (result ? C.greenLt : C.redLt) : C.bg, border: `2px solid ${validated ? (result ? C.green : C.red) : C.border}`, borderRadius: 16, padding: '14px 16px' }}>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <span style={{ fontFamily: "'Noto Naskh Arabic',serif", fontSize: 36, fontWeight: 700, direction: 'rtl', color: validated ? (result ? C.green : C.red) : C.violet }}>{pair.text}</span>
              {validated && result !== undefined && <span style={{ marginRight: 10, fontSize: 18 }}>{result ? ' ✓' : ' ✗'}</span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {options[pairIdx].map((opt, optIdx) => {
                const key        = `${pairIdx}-${optIdx}`
                const isPlaying  = playingKey === key
                const isSelected = selected === opt.audioUrl
                const optResult  = validated && isSelected ? (opt.isCorrect ? 'correct' : 'wrong') : validated && opt.isCorrect ? 'show' : null
                const bg     = optResult === 'correct' ? C.green : optResult === 'wrong' ? C.red : optResult === 'show' ? C.green : isSelected ? C.violet : isPlaying ? C.orangeDk : C.white
                const border = optResult === 'correct' ? C.green : optResult === 'wrong' ? C.red : optResult === 'show' ? C.green : isSelected ? C.violet : C.border
                return (
                  <div key={optIdx} style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => playOption(opt.audioUrl, key)}
                      style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: isPlaying ? C.orange : C.orangeLt, border: `2px solid ${isPlaying ? C.orange : C.orange + '60'}`, cursor: 'pointer', fontSize: 14, color: isPlaying ? '#fff' : C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}>
                      {isPlaying ? '◼' : '▶'}
                    </button>
                    <button onClick={() => { playOption(opt.audioUrl, key); select(pairIdx, opt.audioUrl) }} disabled={validated}
                      style={{ flex: 1, borderRadius: 10, border: `2px solid ${border}`, background: bg, color: isSelected || optResult ? '#fff' : C.text2, cursor: validated ? 'default' : 'pointer', fontSize: 11, fontWeight: 600, padding: '6px 8px', transition: 'all .15s', textAlign: 'left' as const }}>
                      {optResult === 'correct' ? '✓ ' : optResult === 'wrong' ? '✗ ' : optResult === 'show' ? '✓ ' : ''}Son {optIdx + 1}
                    </button>
                  </div>
                )
              })}
            </div>
            {validated && !result && selected && <p style={{ fontSize: 11, color: C.red, marginTop: 8, textAlign: 'center' as const }}>Le bon son est le bouton vert ↑</p>}
          </div>
        )
      })}
      {!validated && (
        <button onClick={validate} disabled={!allSelected}
          style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: allSelected ? C.violet : C.border, color: '#fff', cursor: allSelected ? 'pointer' : 'default', fontSize: 15, fontWeight: 700 }}>
          {allSelected ? 'Valider mes réponses →' : `Encore ${pairs.length - Object.keys(selections).length} réponse(s)`}
        </button>
      )}
      {validated && results && (() => {
        const correct = Object.values(results).filter(Boolean).length
        const score   = correct / pairs.length
        const passed  = score >= 0.75
        return (
          <div style={{ padding: '12px 16px', borderRadius: 12, background: passed ? C.greenLt : C.redLt, border: `2px solid ${passed ? C.green : C.red}`, textAlign: 'center' as const }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: passed ? C.green : C.red, marginBottom: 4 }}>{passed ? '✓ Bien joué !' : '✗ Quelques erreurs'}</p>
            <p style={{ fontSize: 13, color: C.text2 }}>{correct} / {pairs.length} sons corrects ({Math.round(score * 100)}%)</p>
          </div>
        )
      })()}
    </div>
  )
}

// ── Carte d'exercice ────────────────────────────────────────
function ExerciseCard({ ex, index, total, onAnswer, disabled }: {
  
  ex: any; index: number; total: number; onAnswer: (c: boolean, l: number) => void; disabled: boolean
}) {
  
  const [answered, setAnswered] = useState(false)
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null)
  const prompt = ex.prompts?.length ? ex.prompts[Math.floor(Math.random() * ex.prompts.length)] : ex.prompt

  const handleAnswer = (ok: boolean, latency: number) => {
    if (disabled) return
    setAnswered(true); setWasCorrect(ok)
    onAnswer(ok, latency)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text2, whiteSpace: 'nowrap' }}>{index + 1} / {total}</span>
        <div style={{ flex: 1, height: 10, background: C.violetLt, borderRadius: 5, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 5, background: `linear-gradient(90deg,${C.violet},${C.orange})`, width: `${((index + 1) / total) * 100}%`, transition: 'width .5s' }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.orange, whiteSpace: 'nowrap' }}>+{ex.xpReward} XP</span>
      </div>

      {ex.type !== 'audio_choice' && ex.type !== 'oral_reading' && (
        <div style={{ background: C.violetLt, border: `2px solid ${C.violet}30`, borderRadius: 20, padding: '22px 20px', marginBottom: 20, textAlign: 'center' }}>
          {prompt && <p style={{ fontSize: 16, fontWeight: 600, color: C.violetDk, marginBottom: ex.promptAr ? 14 : 0 }}>{prompt}</p>}
          {ex.promptAr && <div style={{ fontFamily: "'Noto Naskh Arabic',serif", fontSize: 76, color: C.violet, direction: 'rtl', lineHeight: 1.3 }}>{ex.promptAr}</div>}
        </div>
      )}

      {ex.type === 'audio_choice' && (
        <div style={{ background: C.orangeLt, border: `2px solid ${C.orange}30`, borderRadius: 20, padding: '22px 20px', marginBottom: 20, textAlign: 'center' }}>
          {prompt && <p style={{ fontSize: 16, fontWeight: 600, color: C.orangeDk, marginBottom: 14 }}>{prompt}</p>}
        </div>
      )}

      {answered && wasCorrect !== null && ex.type !== 'oral_reading' && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 16, marginBottom: 16, background: wasCorrect ? C.greenLt : C.redLt, border: `2px solid ${wasCorrect ? C.green : C.red}` }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: wasCorrect ? C.green : C.red, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
            {wasCorrect ? '✓' : '✗'}
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: wasCorrect ? C.greenDk : C.red, marginBottom: 2 }}>
              {wasCorrect ? ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)] : 'Pas tout à fait…'}
            </p>
            {ex.explanation && <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.6 }}>{ex.explanation}</p>}
          </div>
        </div>
      )}

      {['mcq','audio_choice','audio_mcq'].includes(ex.type) && <MCQExercise ex={ex} onAnswer={handleAnswer} />}
      {ex.type === 'input_text'          && <InputExercise            ex={ex} onAnswer={handleAnswer} />}
      {ex.type === 'drawing'             && <DrawingExercise          ex={ex} onAnswer={handleAnswer} />}
      {ex.type === 'drag_drop'           && <DragDropExercise         ex={ex} onAnswer={handleAnswer} />}
      {ex.type === 'word_order'          && <WordOrderExercise        ex={ex} onAnswer={handleAnswer} />}
      {ex.type === 'matching'            && <MatchingExercise         ex={ex} onAnswer={handleAnswer} />}
      {ex.type === 'matching_image_word' && <MatchingImageWordExercise ex={ex} onAnswer={handleAnswer} />}
      {ex.type === 'matching_text_audio' && <MatchingTextAudioExercise ex={ex} onAnswer={handleAnswer} />}
      {ex.type === 'oral_reading'        && (
        <OralExercise
          words={ex.words ?? []}
          onComplete={(results) => {
            const passed = results.filter(r => r.passed).length / results.length >= 0.7
            handleAnswer(passed, 0)
          }}
        />
      )}
    </div>
  )
}

// ── Intro ───────────────────────────────────────────────────
const CARD_COLORS = [
  {bg:'#EDE8FB',border:'#6C3FC5',text:'#3D2280',ar:'#6C3FC5'},
  {bg:'#FEF0E3',border:'#F07C1E',text:'#7A3A00',ar:'#F07C1E'},
  {bg:'#E3F7E8',border:'#2BA84A',text:'#1A6630',ar:'#2BA84A'},
  {bg:'#E6F1FB',border:'#1976D2',text:'#0D47A1',ar:'#1976D2'},
  {bg:'#F3E5F5',border:'#9C27B0',text:'#6A0080',ar:'#9C27B0'},
  {bg:'#FFF8E1',border:'#F9A825',text:'#E65100',ar:'#F9A825'},
  {bg:'#FCE4EC',border:'#E91E63',text:'#880E4F',ar:'#E91E63'},
  {bg:'#E0F7FA',border:'#0097A7',text:'#006064',ar:'#0097A7'},
]

function IntroCard({ item, index, onClick }: { item: any; index: number; onClick: () => void }) {
  const c = CARD_COLORS[index % CARD_COLORS.length]
  return (
    <button onClick={onClick}
      style={{ background: c.bg, border: `2px solid ${c.border}40`, borderRadius: 16, padding: '16px 12px', cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transition: 'all .15s', width: '100%' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 16px ${c.border}30` }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
      <div style={{ fontFamily: "'Noto Naskh Arabic',serif", fontSize: 50, color: c.ar, direction: 'rtl', lineHeight: 1.2 }}>{item.ar}</div>
      {item.name && <div style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{item.name}</div>}
      {item.phoneme && <div style={{ fontSize: 12, color: c.text, opacity: 0.8, fontStyle: 'italic' }}>{item.phoneme}</div>}
      {item.description && <div style={{ fontSize: 11, color: c.text, opacity: 0.7, lineHeight: 1.4 }}>{item.description}</div>}
      {item.translation && <div style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{item.translation}</div>}
      <span style={{ fontSize: 13, color: c.ar, opacity: 0.6 }}>♪</span>
    </button>
  )
}

function IntroScreen({ lesson, onStart }: { lesson: any; onStart: () => void }) {
  const intro = lesson.content?.introduction
  if (!intro) return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <button onClick={onStart} style={{ padding: '16px 48px', borderRadius: 20, background: C.violet, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>Commencer →</button>
    </div>
  )

  const section = (title: string, children: React.ReactNode) => (
    <div>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text2, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.08em' }}>{title}</h3>
      {children}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {intro.text && (
        <div style={{ background: C.violetLt, borderLeft: `12px solid ${C.orange}30`, borderRadius: 16, padding: '16px 20px', fontSize: 15, color: C.text, lineHeight: 1.7, whiteSpace: 'pre-line' }}>
          {intro.text}
        </div>
      )}
      {intro.letters && section('Les lettres',
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(intro.letters.length, 4)}, 1fr)`, gap: 10, maxWidth: intro.letters.length < 4 ? `${intro.letters.length * 220}px` : '100%', margin: '0 auto' }}>
          {intro.letters.map((l: any, i: number) => <IntroCard key={l.ar} item={l} index={i} onClick={() => playSound(l.audio, l.ar)} />)}
        </div>
      )}
      {intro.signs && section('Signes',
        <div style={{ display: 'grid', gridTemplateColumns: intro.signs.length === 12 ? 'repeat(3, 1fr)' : intro.signs.length === 9 ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)', gap: 10, direction: 'rtl' }}>
          {intro.signs.map((s: any, i: number) => <IntroCard key={s.ar + i} item={s} index={i} onClick={() => playSound(s.audio, s.ar)} />)}
        </div>
      )}
      {intro.examples && section('Exemples',
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {intro.examples.map((e: any, i: number) => (
            <div key={i} onClick={() => playSound(e.audio, e.ar)}
              style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', borderRadius: 12, cursor: 'pointer', background: C.white, border: `2px solid ${C.border}`, transition: 'all .15s' }}
              onMouseEnter={e2 => (e2.currentTarget as HTMLElement).style.borderColor = C.violet}
              onMouseLeave={e2 => (e2.currentTarget as HTMLElement).style.borderColor = C.border}>
              <span style={{ fontFamily: 'Noto Naskh Arabic, serif', fontSize: 28, color: C.violet, direction: 'rtl', minWidth: 80, textAlign: 'right' }}>{e.ar}</span>
              <div style={{ flex: 1 }}>
                {e.phoneme && <div style={{ fontSize: 13, color: C.orange, fontStyle: 'italic' }}>{e.phoneme}</div>}
                {e.description && <div style={{ fontSize: 13, color: C.text2 }}>{e.description}</div>}
              </div>
              <span style={{ fontSize: 20 }}>🔊</span>
            </div>
          ))}
        </div>
      )}
      {intro.words && section('Mots',
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {intro.words.map((w: any, i: number) => <IntroCard key={w.ar} item={w} index={i} onClick={() => playSound(w.audio, w.ar)} />)}
        </div>
      )}
      {intro.positions && <PositionsLearning letters={intro.positions} onReady={onStart} />}
      {!intro.positions && (
        <button onClick={onStart}
          style={{ width: '100%', padding: '17px', borderRadius: 18, background: C.violet, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.violetDk}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.violet}>
          S&apos;entraîner →
        </button>
      )}
    </div>
  )
}
// ── Page principale ─────────────────────────────────────────
export default function LessonPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const { user } = useAuthStore()
  const lessonId = Number(id)

  const [phase, setPhase]               = useState<'intro'|'exercises'>('intro')
  const [lesson, setLesson]             = useState<any>(null)
  const [moduleId, setModuleId]         = useState(1)
  const [oralData, setOralData]         = useState<any>(null)
  const [exercises, setExercises]       = useState<any[]>([])
  const [siblings, setSiblings]         = useState<any[]>([])
  const [currentEx, setCurrentEx]       = useState(0)
  const [xpEarned, setXpEarned]         = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [finished, setFinished]         = useState(false)
  const [processing, setProcessing]     = useState(false)
  const [loading, setLoading]           = useState(true)
  const [certLoading, setCertLoading]   = useState(false)
  const [certData, setCertData]         = useState<any>(null)
  const [evalSummary, setEvalSummary] = useState<any>(null)

useEffect(() => {
  curriculumApi.lesson(lessonId).then(res => {
    const l = res.data
    setLesson(l)
    setModuleId(l.module_id ?? 1)

    if (l.lesson_type === 'evaluation') {
      // Évaluation dynamique selon BKT
      setPhase('exercises')
      api.get(`/api/v1/curriculum/evaluation/module/${l.module_id ?? 1}?degree=1`)
        .then(r => {
          const exs = r.data.exercises ?? []
          setExercises(shuffle(exs))
        })
        .catch(() => {
          // Fallback sur les exercices statiques
          const exs = l.content?.exercises ?? []
          const masteryMap = JSON.parse(localStorage.getItem('langdad_mastery') ?? '{}')
          setExercises(resolveExercises(exs, masteryMap))
        })
    } else if (l.lesson_type === 'oral_practice') {
      setPhase('exercises')
      const exs = l.content?.exercises ?? []
      const masteryMap = JSON.parse(localStorage.getItem('langdad_mastery') ?? '{}')
      setExercises(resolveExercises(exs, masteryMap))
    } else {
      const exs = l.content?.exercises ?? []
      const masteryMap = JSON.parse(localStorage.getItem('langdad_mastery') ?? '{}')
      const resolved = resolveExercises(exs, masteryMap)
      setExercises(shuffle(resolved))
    }

    if (l.module_id) {
      curriculumApi.lessons(l.module_id)
        .then(r => setSiblings([...r.data].sort((a: any, b: any) => a.sort_order - b.sort_order)))
        .catch(() => {})
    }
  }).catch(() => {}).finally(() => setLoading(false))
}, [lessonId])

  useEffect(() => {
    if (lesson?.lesson_type === 'oral_practice') {
      fetch(`/oral/d1/oral_m${moduleId}.json`)
        .then(r => r.json())
        .then(setOralData)
        .catch(() => {})
    }
  }, [lesson, moduleId])

  const curIdx     = siblings.findIndex((l: any) => l.id === lessonId)
  const prevLesson = curIdx > 0 ? siblings[curIdx - 1] : null
  const nextLesson = curIdx < siblings.length - 1 ? siblings[curIdx + 1] : null
  const totalEx    = exercises.length
  



 const handleAnswer = useCallback(async (isCorrect: boolean, latency: number) => {
    if (!lesson) return
    setProcessing(true)
    const ex = exercises[currentEx]
    if (isCorrect) { setCorrectCount(c => c + 1); setXpEarned(x => x + (ex?.xpReward ?? 5)) }

    // Vérifier si la leçon est déjà complétée (ne pas recompter le BKT)
    const alreadyCompleted = siblings.find((s: any) => s.id === lessonId)?.completed_at

    try {
      if (lesson.lesson_type !== 'oral_practice' && !alreadyCompleted) {
        await api.post('/api/v1/bkt/log', {
          lesson_id:        lessonId,
          exercise_id:      ex?.id ?? 'unknown',
          skill_id:         ex?.skill_id ?? 'letter_recognition',
          exercise_type:    ex?.type ?? 'mcq',
          variant:          ex?._level ?? ex?.variant ?? 1,
          correct:          isCorrect,
          response_time_ms: latency,
          hint_used:        false,
          attempt:          1,
        })
        const masteryMap = JSON.parse(localStorage.getItem('langdad_mastery') ?? '{}')
        const current = masteryMap[ex?.skill_id ?? 'letter_recognition'] ?? 0
        masteryMap[ex?.skill_id ?? 'letter_recognition'] = isCorrect
          ? Math.min(1, current + 0.1 * (1 - current))
          : Math.max(0, current - 0.05 * current)
        localStorage.setItem('langdad_mastery', JSON.stringify(masteryMap))
      }
    } catch (err) {
      console.error('BKT log error:', err)
    }

    await new Promise(r => setTimeout(r, 1400))

    if (currentEx + 1 >= totalEx) {
      const score = (correctCount + (isCorrect ? 1 : 0)) / totalEx
      if (lesson.lesson_type !== 'oral_practice') {
        try { await curriculumApi.complete(lessonId, score, totalEx * 15) } catch {}
      }
      if (lesson.lesson_type === 'evaluation') {
        try {
          const r = await api.get(`/api/v1/bkt/evaluate/${moduleId}`)
          localStorage.setItem('langdad_last_report', JSON.stringify(r.data))
        } catch {}
      }
      setFinished(true)
    } else {
      setCurrentEx(i => i + 1)
    }
    setProcessing(false)
  }, [lesson, currentEx, totalEx, correctCount, exercises, lessonId, moduleId, siblings])

  const handleGetCert = async () => {
    setCertLoading(true)
    try {
      const lang = localStorage.getItem('langdad_lang') ??
        document.cookie.split('; ').find(r => r.startsWith('NEXT_LOCALE='))?.split('=')[1] ?? 'fr'
      const res = await api.post('/api/v1/certifications/generate', {
        module_id:     moduleId,
        module_order:  1,
        degree:        1,
        overall_score: finalScore,
        lang,
      })
      setCertData(res.data)
    } catch (err) {
      console.error('Certification error:', err)
    } finally {
      setCertLoading(false)
    }
  }

 const resetLesson = () => {
  const nextPhase = lesson?.lesson_type === 'evaluation' ? 'intro' : 'exercises'
  setPhase(nextPhase); setCurrentEx(0); setCorrectCount(0); setXpEarned(0); setFinished(false)
  if (lesson?.lesson_type === 'evaluation') {
    setEvalSummary(null)
    api.get(`/api/v1/curriculum/evaluation/module/${moduleId}?degree=1`)
      .then(r => { setExercises(shuffle(r.data.exercises ?? [])); setEvalSummary(r.data) })
      .catch(() => {})
  } else {
    const exs = lesson?.content?.exercises ?? []
    const masteryMap = JSON.parse(localStorage.getItem('langdad_mastery') ?? '{}')
    const resolved = shuffle(resolveExercises(exs, masteryMap))
    
    setExercises(resolved)
  }
}
  if (!user || loading) return <div style={{ padding: 60, textAlign: 'center', color: C.text3 }}>Chargement…</div>
  if (!lesson) return <div style={{ padding: 60, textAlign: 'center', color: C.text2 }}>Leçon introuvable.</div>

  const passingScore = lesson.content?.passing_score ?? 0.7
  const finalScore   = totalEx > 0 ? (correctCount / totalEx) : 0
  const passed       = finalScore >= passingScore

  // ── Page de fin ──────────────────────────────────────────
  if (finished) {
    
    if (lesson.lesson_type === 'oral_practice') {
      return (
        <div style={{ maxWidth: 1020, margin: '0 auto', padding: '32px 20px' }}>
          <link href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap" rel="stylesheet" />
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎤</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 6 }}>Entraînement terminé !</h1>
            <p style={{ fontSize: 14, color: C.text2 }}>{lesson.title}</p>
          </div>
          <div style={{ background: C.violetLt, borderRadius: 20, padding: '20px', marginBottom: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: C.violet, marginBottom: 4 }}>{Math.round(finalScore * 100)}%</div>
            <p style={{ fontSize: 14, color: C.text2 }}>{correctCount} / {totalEx} mots réussis</p>
          </div>
          <div style={{ background: C.orangeLt, borderLeft: `4px solid ${C.orange}`, borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
            <p style={{ fontSize: 13, color: C.orangeDk, lineHeight: 1.7 }}>
              Cet exercice de prononciation est facultatif et ne compte pas dans ton évaluation globale. Continue à pratiquer régulièrement !
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={resetLesson}
              style={{ padding: '14px', borderRadius: 14, background: C.violet, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
              🔄 Recommencer
            </button>
            <button onClick={() => router.push(`/module/${moduleId}`)}
              style={{ padding: '14px', borderRadius: 14, border: `2px solid ${C.border}`, background: C.white, cursor: 'pointer', fontSize: 13, color: C.text2 }}>
              ← Retour au module
            </button>
          </div>
        </div>
      )
    }

    return (
      <div style={{ maxWidth: 1020, margin: '0 auto', padding: '32px 20px' }}>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap" rel="stylesheet" />
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 6 }}>{passed ? 'Leçon terminée !' : 'Continuez à pratiquer'}</h1>
          <p style={{ fontSize: 14, color: C.text2 }}>{lesson.title}</p>
        </div>

        <div style={{ background: C.violetLt, borderRadius: 20, padding: 8, marginBottom: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: passed ? C.violet : C.orange, marginBottom: 4 }}>{Math.round(finalScore * 100)}%</div>
          <p style={{ fontSize: 14, color: C.text2, marginBottom: 16 }}>{correctCount} / {totalEx} exercices réussis</p>
        </div>

        {lesson.lesson_type === 'evaluation' && finalScore >= 0.80 && (
          <div style={{ background: C.white, border: `2px solid ${C.violet}`, borderRadius: 16, padding: '20px 24px', marginBottom: 16 }}>
            {!certData ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🏅</div>
                <p style={{ fontSize: 15, fontWeight: 700, color: C.violet, marginBottom: 4 }}>Félicitations ! Vous êtes éligible à un certificat.</p>
                <p style={{ fontSize: 13, color: C.text2, marginBottom: 16 }}>Score ≥ 80% — Module 1 · Degré 1</p>
                <button onClick={handleGetCert} disabled={certLoading}
                  style={{ padding: '14px 32px', borderRadius: 14, border: 'none', background: certLoading ? C.border : C.violet, color: '#fff', cursor: certLoading ? 'default' : 'pointer', fontSize: 15, fontWeight: 700 }}>
                  {certLoading ? 'Génération en cours…' : '🏅 Obtenir mon certificat'}
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                <p style={{ fontSize: 15, fontWeight: 700, color: C.green, marginBottom: 4 }}>Certificat généré !</p>
                <p style={{ fontSize: 12, color: C.text3, marginBottom: 4 }}>N° {certData.certificate_number}</p>
                <p style={{ fontSize: 12, color: C.text2, marginBottom: 16 }}>Score : {Math.round(certData.overall_score * 100)}%</p>
                {certData.pdf_url && (
                  <a href={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}${certData.pdf_url}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-block', padding: '14px 32px', borderRadius: 14, background: C.green, color: '#fff', textDecoration: 'none', fontSize: 15, fontWeight: 700 }}>
                    ⬇ Télécharger le PDF
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {lesson.lesson_type === 'ecriture_clavier' && (
          <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 20, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ background: C.orangeLt, padding: '16px 20px', borderBottom: `2px solid ${C.orange}20`, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>✍️</span>
              <div>
                <p style={{ fontSize: 25, fontWeight: 700, color: C.orangeDk }}>Maintenant, entraîne-toi à la main !</p>
                <p style={{ fontSize: 12, color: C.text2 }}>Télécharge et imprime les fiches pour pratiquer les lettres sur papier.</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, padding: '16px 20px' }}>
              {(MODULE_LETTERS[moduleId] ?? MODULE_LETTERS[1]).map(l => (
                <div key={l.name} style={{ background: l.bg, borderRadius: 14, padding: '14px 10px', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Noto Naskh Arabic',serif", fontSize: 40, color: l.color, direction: 'rtl', marginBottom: 6 }}>{l.ar}</div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: l.color, marginBottom: 8 }}>{l.name}</p>
                  <a href={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/v1/writing-sheets/module/${moduleId}/letter/${l.name}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: 'block', padding: '8px', borderRadius: 10, background: l.color, color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                    ⬇ Fiche {l.name}
                  </a>
                </div>
              ))}
            </div>
            <div style={{ padding: '0 20px 16px' }}>
              <a href={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/v1/writing-sheets/module/${moduleId}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display: 'block', padding: '12px', borderRadius: 14, background: C.orange, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>
                ⬇ Tout télécharger (4 fiches)
              </a>
            </div>
          </div>
        )}

        {lesson.lesson_type === 'evaluation' && passed && finalScore < 0.80 && (
          <div style={{ background: C.orangeLt, borderLeft: `4px solid ${C.orange}`, borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: C.orangeDk, lineHeight: 1.7 }}>
              Score de {Math.round(finalScore * 100)}% — Il vous faut 80% pour obtenir le certificat. Continuez à vous entraîner !
            </p>
          </div>
        )}

        {lesson.lesson_type === 'evaluation' && !passed && (
          <div style={{ background: C.orangeLt, borderLeft: `4px solid ${C.orange}`, borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: C.orangeDk, lineHeight: 1.7 }}>Score requis : {Math.round(passingScore * 100)}%. Révisez les leçons précédentes avant de réessayer.</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {prevLesson
              ? <button onClick={() => router.push(`/lesson/${prevLesson.id}`)} style={{ flex: 1, padding: '12px 10px', borderRadius: 14, border: `2px solid ${C.border}`, background: C.white, cursor: 'pointer', fontSize: 12, color: C.text2 }}>← {prevLesson.title}</button>
              : <button onClick={() => router.push(`/module/${moduleId}`)} style={{ flex: 1, padding: '12px', borderRadius: 14, border: `2px solid ${C.border}`, background: C.white, cursor: 'pointer', fontSize: 13, color: C.text2 }}>← Module</button>
            }
            {lesson.lesson_type === 'evaluation' && (
              <button onClick={() => router.push(`/module-report/${moduleId}`)} style={{ flex: 2, padding: '12px', borderRadius: 14, background: C.orange, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Voir le rapport →</button>
            )}
            {lesson.lesson_type !== 'evaluation' && !passed && (
              <button onClick={resetLesson} style={{ flex: 2, padding: '12px', borderRadius: 14, background: C.orange, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Recommencer</button>
            )}
            {lesson.lesson_type !== 'evaluation' && passed && nextLesson && (
              <button onClick={() => router.push(`/lesson/${nextLesson.id}`)} style={{ flex: 2, padding: '12px 10px', borderRadius: 14, background: C.violet, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>{nextLesson.title} →</button>
            )}
            {lesson.lesson_type !== 'evaluation' && passed && !nextLesson && (
              <button onClick={() => router.push(`/module/${moduleId}`)} style={{ flex: 2, padding: '12px', borderRadius: 14, background: C.green, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>✓ Module terminé</button>
            )}
          </div>
          <button onClick={() => router.push('/dashboard')} style={{ padding: '12px', borderRadius: 14, border: `2px solid ${C.border}`, background: 'transparent', cursor: 'pointer', fontSize: 13, color: C.text3 }}>↩ Menu principal</button>
        </div>
      </div>
    )
  }

  // ── Vue exercices ─────────────────────────────────────────
  return (
    <div style={{ maxWidth: 1020, margin: '0 auto', padding: '20px 20px 40px' }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap" rel="stylesheet" />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 8 }}>
        <button onClick={() => router.push(`/module/${moduleId}`)}
          style={{ width: 38, height: 38, borderRadius: '50%', border: `2px solid ${C.violet}`, background: C.violetLt, color: C.violet, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>←</button>
        <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lesson.title}</p>
          <p style={{ fontSize: 11, color: C.text3 }}>{lesson.duration_minutes} min · {lesson.xp_reward} XP</p>
        </div>
        {xpEarned > 0
          ? <div style={{ background: C.orangeLt, color: C.orange, fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 18, border: `2px solid ${C.orange}`, flexShrink: 0 }}>+{xpEarned} XP</div>
          : <div style={{ width: 38 }} />}
      </div>
      {phase === 'intro' && <IntroScreen lesson={lesson} onStart={() => setPhase('exercises')} />}
      {phase === 'exercises' && lesson.lesson_type === 'oral_practice' && oralData && (
        <OralPracticeExercise
          data={oralData}
          onQuit={() => router.push(`/module/${moduleId}`)}
          onComplete={() => setFinished(true)}
        />
      )}
      {phase === 'exercises' && lesson.lesson_type !== 'oral_practice' && totalEx > 0 && (
        <ExerciseCard key={`${lesson.id}-${currentEx}`} ex={exercises[currentEx]} index={currentEx} total={totalEx} onAnswer={handleAnswer} disabled={processing} />
      )}
      {phase === 'exercises' && totalEx === 0 && lesson.lesson_type !== 'oral_practice' && (
        <div style={{ textAlign: 'center', padding: 40, color: C.text3 }}>
          <p style={{ marginBottom: 16 }}>Cette leçon n&apos;a pas encore d&apos;exercices.</p>
          <button onClick={() => router.push(`/module/${moduleId}`)} style={{ color: C.violet, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>← Retour</button>
        </div>
      )}
    </div>
  )
}
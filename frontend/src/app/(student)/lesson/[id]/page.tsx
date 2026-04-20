'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { curriculumApi, api } from '@/lib/api'

const C = {
  violet:'#6C3FC5', violetLt:'#EDE8FB', violetDk:'#4A2A8A',
  orange:'#F07C1E', orangeLt:'#FEF0E3', orangeDk:'#B85A0E',
  green:'#2BA84A', greenLt:'#E3F7E8', greenDk:'#1A6630',
  red:'#E24B4A', redLt:'#FCEBEB',
  bg:'#F8F7FF', white:'#FFFFFF',
  text:'#1A1A2E', text2:'#5A5A7A', text3:'#9A9AB0',
  border:'#E8E4F8',
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
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] }
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
    if (ok) playSound(ex.audioUrl, ex.promptAr)
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
      {(opts as string[]).map((opt: string, i: number) => {
        const state = !answered ? 'idle' : i === selected && i === correctIdx ? 'correct' : i === selected ? 'wrong' : i === correctIdx ? 'show' : 'idle'
        return <OptionBtn key={i} label={String.fromCharCode(65 + i)} text={opt} state={state} onClick={() => handle(i)} />
      })}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input type="text" value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && handle()}
        disabled={answered} dir="rtl" placeholder="اكتب هنا…"
        style={{ padding: '14px 18px', borderRadius: 14, fontFamily: "'Noto Naskh Arabic',serif", fontSize: 26, border: `2.5px solid ${answered ? (correct ? C.green : C.red) : C.border}`, outline: 'none', color: C.text, background: answered ? (correct ? C.greenLt : C.redLt) : C.white, textAlign: 'right', transition: 'all .2s' }} />
      <button onClick={handle} disabled={answered || !val.trim()}
        style={{ padding: '14px', borderRadius: 14, border: 'none', background: answered || !val.trim() ? C.border : C.violet, color: '#fff', cursor: answered || !val.trim() ? 'default' : 'pointer', fontSize: 15, fontWeight: 700 }}>
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
  const [available, setAvailable] = useState<string[]>(ex.letters ?? [])
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
      {!answered && <button onClick={() => { setSlots(Array(total).fill(null)); setAvailable(ex.letters ?? []) }} style={{ fontSize: 12, color: C.text3, background: 'none', border: 'none', cursor: 'pointer' }}>↺ Réinitialiser</button>}
    </div>
  )
}

// ── Word Order ──────────────────────────────────────────────
function WordOrderExercise({ ex, onAnswer }: { ex: any; onAnswer: (c: boolean, l: number) => void }) {
  const [chosen, setChosen] = useState<string[]>([])
  const [available, setAvailable] = useState<string[]>(() => shuffle(ex.words ?? []))
  const [answered, setAnswered] = useState(false)
  const [correct, setCorrect] = useState<boolean | null>(null)
  const startTime = useRef(Date.now())

  const add = (w: string, i: number) => {
    if (answered) return
    setChosen([...chosen, w])
    const a = [...available]; a.splice(i, 1); setAvailable(a)
  }
  const remove = (i: number) => {
    if (answered) return
    setAvailable([...available, chosen[i]])
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
      {ex.audioUrl && <button onClick={() => playSound(ex.audioUrl, ex.correctSentence)} style={{ width: 52, height: 52, borderRadius: '50%', background: C.orange, border: 'none', cursor: 'pointer', fontSize: 20, color: '#fff' }}>▶</button>}
      <div style={{ minHeight: 58, width: '100%', border: `2.5px dashed ${answered ? (correct ? C.green : C.red) : C.border}`, borderRadius: 14, padding: '10px 14px', display: 'flex', gap: 8, flexWrap: 'wrap', direction: 'rtl', justifyContent: 'center', alignItems: 'center', background: C.bg }}>
        {chosen.length === 0 ? <span style={{ color: C.text3, fontSize: 13 }}>Cliquez sur les mots pour les ordonner</span>
          : chosen.map((w, i) => (
            <button key={i} onClick={() => remove(i)} disabled={answered}
              style={{ padding: '7px 14px', borderRadius: 10, background: answered ? (correct ? C.green : C.red) : C.violet, color: '#fff', border: 'none', cursor: answered ? 'default' : 'pointer', fontFamily: "'Noto Naskh Arabic',serif", fontSize: 20, fontWeight: 700 }}>
              {w}
            </button>
          ))}
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', direction: 'rtl' }}>
        {available.map((w, i) => (
          <button key={i} onClick={() => add(w, i)} disabled={answered}
            style={{ padding: '9px 16px', borderRadius: 12, border: `2px solid ${C.violet}`, background: C.violetLt, cursor: answered ? 'default' : 'pointer', fontFamily: "'Noto Naskh Arabic',serif", fontSize: 20, color: C.violet, fontWeight: 700 }}>
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

// ── Matching ────────────────────────────────────────────────
function MatchingExercise({ ex, onAnswer }: { ex: any; onAnswer: (c: boolean, l: number) => void }) {
  const pairs = ex.pairs ?? []
  const [shuffledAr] = useState<any[]>(() => shuffle(pairs))
  const [shuffledFr] = useState<string[]>(() => shuffle(pairs.map((p: any) => p.fr as string)))
  const [selectedAr, setSelectedAr] = useState<string | null>(null)
  const [matched, setMatched] = useState<Record<string, string>>({})
  const [wrong, setWrong] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const startTime = useRef(Date.now())

  const selectAr = (ar: string) => { if (done || matched[ar]) return; setSelectedAr(ar === selectedAr ? null : ar) }
  const selectFr = (fr: string) => {
    if (!selectedAr || done) return
    const ok = pairs.find((p: any) => p.ar === selectedAr)?.fr === fr
    if (ok) {
      const nm = { ...matched, [selectedAr]: fr }; setMatched(nm); setSelectedAr(null)
      if (Object.keys(nm).length === pairs.length) { setDone(true); onAnswer(true, Date.now() - startTime.current) }
    } else { setWrong(selectedAr); setSelectedAr(null); setTimeout(() => setWrong(null), 700) }
  }

  const cs = (isM: boolean, isW: boolean, isSel: boolean) => ({
    padding: '12px', borderRadius: 12,
    border: `2.5px solid ${isM ? C.green : isW ? C.red : isSel ? C.violet : C.border}`,
    background: isM ? C.greenLt : isW ? C.redLt : isSel ? C.violetLt : C.white,
    cursor: 'pointer', transition: 'all .15s', textAlign: 'center' as const,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 13, color: C.text2, textAlign: 'center' }}>Sélectionnez un mot arabe, puis sa traduction</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {shuffledAr.map((p: any) => (
            <div key={p.ar} onClick={() => selectAr(p.ar)} style={cs(!!matched[p.ar], wrong === p.ar, selectedAr === p.ar)}>
              <span style={{ fontFamily: "'Noto Naskh Arabic',serif", fontSize: 28, color: matched[p.ar] ? C.green : selectedAr === p.ar ? C.violet : C.text, direction: 'rtl' }}>{p.ar}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {shuffledFr.map((fr: string) => {
            const isM = Object.values(matched).includes(fr)
            return (
              <div key={fr} onClick={() => selectFr(fr)} style={cs(isM, false, false)}>
                <span style={{ fontSize: 13, fontWeight: 600, color: isM ? C.green : C.text }}>{fr}</span>
              </div>
            )
          })}
        </div>
      </div>
      {done && <div style={{ textAlign: 'center', padding: 12, background: C.greenLt, borderRadius: 12, color: C.green, fontWeight: 700, fontSize: 14 }}>Toutes les paires trouvées ✓</div>}
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
      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text2, whiteSpace: 'nowrap' }}>{index + 1} / {total}</span>
        <div style={{ flex: 1, height: 10, background: C.violetLt, borderRadius: 5, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 5, background: `linear-gradient(90deg,${C.violet},${C.orange})`, width: `${((index + 1) / total) * 100}%`, transition: 'width .5s' }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.orange, whiteSpace: 'nowrap' }}>+{ex.xpReward} XP</span>
      </div>

      {/* Question */}
      {ex.type !== 'audio_choice' && (
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

      {/* Feedback */}
      {answered && wasCorrect !== null && (
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
      {ex.type === 'input_text'  && <InputExercise   ex={ex} onAnswer={handleAnswer} />}
      {ex.type === 'drawing'     && <DrawingExercise  ex={ex} onAnswer={handleAnswer} />}
      {ex.type === 'drag_drop'   && <DragDropExercise ex={ex} onAnswer={handleAnswer} />}
      {ex.type === 'word_order'  && <WordOrderExercise ex={ex} onAnswer={handleAnswer} />}
      {ex.type === 'matching'    && <MatchingExercise  ex={ex} onAnswer={handleAnswer} />}
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
    <div><h3 style={{ fontSize: 14, fontWeight: 700, color: C.text2, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.08em' }}>{title}</h3>{children}</div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {intro.text && <div style={{ background: C.violetLt, borderRadius: 16, padding: '18px 20px', borderLeft: `4px solid ${C.violet}` }}><p style={{ fontSize: 15, color: C.violetDk, lineHeight: 1.8, whiteSpace: 'pre-line' }}>{intro.text}</p></div>}
      {intro.letters && section('Les lettres', <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>{intro.letters.map((l: any, i: number) => <IntroCard key={l.ar} item={l} index={i} onClick={() => playSound(l.audio, l.ar)} />)}</div>)}
      {intro.signs && section('Signes', <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>{intro.signs.map((s: any, i: number) => <IntroCard key={s.ar} item={s} index={i} onClick={() => playSound(s.audio, s.ar)} />)}</div>)}
      {intro.examples && section('Exemples', <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>{intro.examples.map((e: any, i: number) => <IntroCard key={e.ar} item={e} index={i} onClick={() => playSound(e.audio, e.ar)} />)}</div>)}
      {intro.words && section('Mots', <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>{intro.words.map((w: any, i: number) => <IntroCard key={w.ar} item={w} index={i} onClick={() => playSound(w.audio, w.ar)} />)}</div>)}
      {intro.positions && section('Positions des lettres', <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {intro.positions.map((p: any, pi: number) => {
          const c = CARD_COLORS[pi % CARD_COLORS.length]
          return (
            <div key={p.letter} style={{ background: C.white, border: `2px solid ${c.border}40`, borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ background: c.bg, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${c.border}30` }}>
                <span style={{ fontFamily: "'Noto Naskh Arabic',serif", fontSize: 34, color: c.ar }}>{p.letter}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: c.text }}>{p.name}</span>
              </div>
              {p.forms.map((f: any, fi: number) => (
                <div key={fi} style={{ display: 'grid', gridTemplateColumns: '160px 64px 1fr', alignItems: 'center', padding: '9px 16px', background: fi % 2 === 0 ? C.white : C.bg, borderBottom: fi < p.forms.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                  <span style={{ fontSize: 12, color: C.text2 }}>{f.position}</span>
                  <span style={{ fontFamily: "'Noto Naskh Arabic',serif", fontSize: 28, color: c.ar, textAlign: 'center', direction: 'rtl' }}>{f.ar}</span>
                  <span style={{ fontSize: 11, color: C.text3, fontStyle: 'italic' }}>{f.note ?? f.example ?? ''}</span>
                </div>
              ))}
            </div>
          )
        })}
      </div>)}
      {intro.rules && section('Règles importantes', <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {intro.rules.map((r: any, i: number) => {
          const c = CARD_COLORS[i % CARD_COLORS.length]
          return (
            <div key={i} style={{ background: c.bg, borderLeft: `4px solid ${c.border}`, borderRadius: 12, padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontFamily: "'Noto Naskh Arabic',serif", fontSize: 22, color: c.ar }}>{r.ar}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{r.title}</span>
              </div>
              <p style={{ fontSize: 12, color: c.text, opacity: 0.85, lineHeight: 1.6 }}>{r.description}</p>
            </div>
          )
        })}
      </div>)}
      <button onClick={onStart}
        style={{ width: '100%', padding: '17px', borderRadius: 18, background: C.violet, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.violetDk}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.violet}>
        S&apos;entraîner →
      </button>
    </div>
  )
}

// ── Page principale ─────────────────────────────────────────
export default function LessonPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const { user } = useAuthStore()
  const lessonId = Number(id)

  const [phase, setPhase]       = useState<'intro'|'exercises'>('intro')
  const [lesson, setLesson]     = useState<any>(null)
  const [exercises, setExercises] = useState<any[]>([])
  const [siblings, setSiblings] = useState<any[]>([])
  const [currentEx, setCurrentEx] = useState(0)
  const [xpEarned, setXpEarned] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [finished, setFinished] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    curriculumApi.lesson(lessonId).then(res => {
      const l = res.data
      setLesson(l)
      const exs = l.content?.exercises ?? []
      setExercises(l.lesson_type === 'evaluation' ? exs : shuffle(exs))
      if (l.module_id) {
        curriculumApi.lessons(l.module_id)
          .then(r => setSiblings([...r.data].sort((a: any, b: any) => a.sort_order - b.sort_order)))
          .catch(() => {})
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [lessonId])

  const moduleId   = lesson?.module_id ?? 1
  const curIdx     = siblings.findIndex((l: any) => l.id === lessonId)
  const prevLesson = curIdx > 0 ? siblings[curIdx - 1] : null
  const nextLesson = curIdx < siblings.length - 1 ? siblings[curIdx + 1] : null
  const totalEx    = exercises.length

  const handleAnswer = useCallback(async (isCorrect: boolean, latency: number) => {
    if (!lesson) return
    setProcessing(true)
    const ex = exercises[currentEx]
    if (isCorrect) { setCorrectCount(c => c + 1); setXpEarned(x => x + (ex?.xpReward ?? 5)) }
    try { await api.post('/api/v1/bkt/update', { skill_id: ex?.skill_id ?? 'letter_recognition', correct: isCorrect, latency_ms: latency, module_id: moduleId }) } catch {}
    await new Promise(r => setTimeout(r, 1400))
    if (currentEx + 1 >= totalEx) {
      const score = (correctCount + (isCorrect ? 1 : 0)) / totalEx
      try { await curriculumApi.complete(lessonId, score, totalEx * 15) } catch {}
      if (lesson.lesson_type === 'evaluation') {
        try { const r = await api.get(`/api/v1/bkt/evaluate/${moduleId}`); localStorage.setItem('langdad_last_report', JSON.stringify(r.data)) } catch {}
      }
      setFinished(true)
    } else { setCurrentEx(i => i + 1) }
    setProcessing(false)
  }, [lesson, currentEx, totalEx, correctCount, exercises, lessonId, moduleId])

  const resetLesson = () => {
    setPhase('exercises'); setCurrentEx(0); setCorrectCount(0); setXpEarned(0); setFinished(false)
    const exs = lesson?.content?.exercises ?? []
    setExercises(lesson?.lesson_type === 'evaluation' ? exs : shuffle(exs))
  }

  if (!user || loading) return <div style={{ padding: 60, textAlign: 'center', color: C.text3 }}>Chargement…</div>
  if (!lesson) return <div style={{ padding: 60, textAlign: 'center', color: C.text2 }}>Leçon introuvable.</div>

  const passingScore = lesson.content?.passing_score ?? 0.7
  const finalScore   = totalEx > 0 ? (correctCount / totalEx) : 0
  const passed       = finalScore >= passingScore

  if (finished) return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '32px 20px' }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap" rel="stylesheet" />
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>{passed ? '🎉' : '💪'}</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 6 }}>{passed ? 'Leçon terminée !' : 'Continuez à pratiquer'}</h1>
        <p style={{ fontSize: 14, color: C.text2 }}>{lesson.title}</p>
      </div>
      <div style={{ background: C.violetLt, borderRadius: 20, padding: 24, marginBottom: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 50, fontWeight: 700, color: passed ? C.violet : C.orange, marginBottom: 8 }}>{Math.round(finalScore * 100)}%</div>
        <p style={{ fontSize: 14, color: C.text2, marginBottom: 16 }}>{correctCount} / {totalEx} exercices réussis</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32 }}>
          <div><div style={{ fontSize: 20, fontWeight: 700, color: C.orange }}>+{xpEarned}</div><div style={{ fontSize: 11, color: C.text3 }}>XP gagnés</div></div>
          <div><div style={{ fontSize: 20, fontWeight: 700, color: C.violet }}>{lesson.duration_minutes}</div><div style={{ fontSize: 11, color: C.text3 }}>minutes</div></div>
        </div>
      </div>
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
          {lesson.lesson_type === 'evaluation' && <button onClick={() => router.push(`/module-report/${moduleId}`)} style={{ flex: 2, padding: '12px', borderRadius: 14, background: C.orange, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Voir le rapport →</button>}
          {lesson.lesson_type !== 'evaluation' && !passed && <button onClick={resetLesson} style={{ flex: 2, padding: '12px', borderRadius: 14, background: C.orange, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Recommencer</button>}
          {lesson.lesson_type !== 'evaluation' && passed && nextLesson && <button onClick={() => router.push(`/lesson/${nextLesson.id}`)} style={{ flex: 2, padding: '12px 10px', borderRadius: 14, background: C.violet, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>{nextLesson.title} →</button>}
          {lesson.lesson_type !== 'evaluation' && passed && !nextLesson && <button onClick={() => router.push(`/module/${moduleId}`)} style={{ flex: 2, padding: '12px', borderRadius: 14, background: C.green, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>✓ Module terminé</button>}
        </div>
        <button onClick={() => router.push('/dashboard')} style={{ padding: '12px', borderRadius: 14, border: `2px solid ${C.border}`, background: 'transparent', cursor: 'pointer', fontSize: 13, color: C.text3 }}>↩ Menu principal</button>
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px 20px 40px' }}>
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
      {phase === 'exercises' && totalEx > 0 && (
        <ExerciseCard key={`${lesson.id}-${currentEx}`} ex={exercises[currentEx]} index={currentEx} total={totalEx} onAnswer={handleAnswer} disabled={processing} />
      )}
      {phase === 'exercises' && totalEx === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: C.text3 }}>
          <p style={{ marginBottom: 16 }}>Cette leçon n&apos;a pas encore d&apos;exercices.</p>
          <button onClick={() => router.push(`/module/${moduleId}`)} style={{ color: C.violet, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>← Retour</button>
        </div>
      )}
    </div>
  )
}
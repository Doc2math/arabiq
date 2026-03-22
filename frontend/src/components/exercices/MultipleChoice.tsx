import { useRef, useState, useCallback } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useTranslation } from 'react-i18next'
import type { MultipleChoiceExercise } from '@/types'

interface Props {
  exercise: MultipleChoiceExercise
  onComplete: (correct: boolean) => void
}

export default function MultipleChoice({ exercise, onComplete }: Props) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const optionRefs   = useRef<(HTMLButtonElement | null)[]>([])
  const feedbackRef  = useRef<HTMLDivElement>(null)
  const btnRef       = useRef<HTMLButtonElement>(null)
  const promptRef    = useRef<HTMLDivElement>(null)

  const isCorrect = selected === exercise.correctIndex

  useGSAP(() => {
    const opts = optionRefs.current.filter(Boolean) as HTMLButtonElement[]
    gsap.fromTo(promptRef.current, { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' })
    gsap.fromTo(opts, { opacity: 0, y: 20, scale: 0.93 }, { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(1.4)', stagger: 0.07, delay: 0.1 })
  }, { scope: containerRef, dependencies: [exercise.id] })

  const onOptEnter = (i: number) => {
    if (revealed || selected !== null) return
    gsap.to(optionRefs.current[i], { y: -3, scale: 1.02, duration: 0.2, ease: 'power2.out' })
  }
  const onOptLeave = (i: number) => {
    if (revealed || selected !== null) return
    gsap.to(optionRefs.current[i], { y: 0, scale: 1, duration: 0.25, ease: 'back.out(2)' })
  }

  const handleSelect = useCallback((idx: number) => {
    if (revealed || selected === idx) return
    if (selected !== null && optionRefs.current[selected]) gsap.to(optionRefs.current[selected], { scale: 1, y: 0, duration: 0.2 })
    setSelected(idx)
    gsap.timeline()
      .to(optionRefs.current[idx], { scale: 0.95, duration: 0.08 })
      .to(optionRefs.current[idx], { scale: 1.04, duration: 0.15, ease: 'back.out(3)' })
      .to(optionRefs.current[idx], { scale: 1,    duration: 0.15, ease: 'power2.out' })
  }, [revealed, selected])

  const handleCheck = () => {
    if (selected === null) return
    setRevealed(true)
    const correct = selected === exercise.correctIndex
    if (correct) {
      gsap.timeline()
        .to(optionRefs.current[selected], { backgroundColor: '#DCFCE7', borderColor: '#86EFAC', duration: 0.15 })
        .to(optionRefs.current[selected], { y: -5, duration: 0.2, ease: 'power2.out' })
        .to(optionRefs.current[selected], { y: 0,  duration: 0.4, ease: 'back.out(3)' })
    } else {
      const el = optionRefs.current[selected]
      if (el) {
        gsap.timeline()
          .to(el, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', duration: 0.1 })
          .to(el, { x: -10, duration: 0.06 }).to(el, { x: 10,  duration: 0.06 })
          .to(el, { x: -8,  duration: 0.05 }).to(el, { x: 8,   duration: 0.05 })
          .to(el, { x: 0,   duration: 0.07 })
      }
      setTimeout(() => { gsap.to(optionRefs.current[exercise.correctIndex], { backgroundColor: '#DCFCE7', borderColor: '#86EFAC', duration: 0.3 }) }, 400)
    }
    if (feedbackRef.current) gsap.fromTo(feedbackRef.current, { opacity: 0, y: 10, height: 0 }, { opacity: 1, y: 0, height: 'auto', duration: 0.35, ease: 'power2.out', delay: 0.2 })
    if (btnRef.current) gsap.fromTo(btnRef.current, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2)', delay: 0.4 })
  }

  const handleContinue = () => {
    gsap.to(containerRef.current, { opacity: 0, y: -16, duration: 0.25, ease: 'power2.in', onComplete: () => onComplete(isCorrect) })
  }

  return (
    <div ref={containerRef} className="space-y-5">
      <div ref={promptRef} className="text-center space-y-3">
        <p className="text-base font-medium text-gray-800">{exercise.prompt}</p>
        {exercise.promptAr && (
          <p className="text-6xl leading-loose" dir="rtl" style={{ fontFamily: "'Noto Naskh Arabic', serif", color: '#1A6B6B' }}>
            {exercise.promptAr}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {exercise.options.map((opt, idx) => (
          <button key={idx} ref={(el) => { optionRefs.current[idx] = el }}
            onClick={() => handleSelect(idx)} onMouseEnter={() => onOptEnter(idx)} onMouseLeave={() => onOptLeave(idx)}
            disabled={revealed}
            className={`p-4 rounded-xl border text-sm font-medium text-left cursor-pointer ${revealed ? 'border-gray-200 bg-white' : selected === idx ? 'border-brand-teal bg-brand-teal/5 text-brand-teal' : 'border-gray-200 bg-white'}`}
          >
            <span className="text-xs opacity-40 mr-1.5">{String.fromCharCode(65 + idx)}.</span>
            {opt}
          </button>
        ))}
      </div>

      <div ref={feedbackRef} style={{ overflow: 'hidden', height: 0, opacity: 0 }}>
        <div className={`rounded-xl p-4 border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className={`font-semibold text-sm ${isCorrect ? 'text-green-800' : 'text-red-700'}`}>
            {isCorrect ? t('lesson.correct') : t('lesson.incorrect')}
          </p>
          {exercise.explanation && <p className="text-xs text-gray-600 mt-1">{exercise.explanation}</p>}
        </div>
      </div>

      {!revealed ? (
        <button onClick={handleCheck} disabled={selected === null}
          className="w-full py-3 rounded-xl bg-brand-teal text-white font-medium text-sm hover:bg-brand-teal-dark transition-colors disabled:opacity-30">
          {t('lesson.check')}
        </button>
      ) : (
        <button ref={btnRef} onClick={handleContinue} style={{ opacity: 0 }}
          className="w-full py-3 rounded-xl bg-brand-teal text-white font-medium text-sm hover:bg-brand-teal-dark transition-colors">
          {t('lesson.continue')} →
        </button>
      )}
    </div>
  )
}
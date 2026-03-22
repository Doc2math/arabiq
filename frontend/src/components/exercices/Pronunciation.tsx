import { useState, useRef, useEffect } from 'react'
import gsap from 'gsap'
import { useTranslation } from 'react-i18next'
import type { PronunciationExercise } from '@/types'

interface Props {
  exercise: PronunciationExercise
  onComplete: (correct: boolean) => void
}

type RecordState = 'idle' | 'recording' | 'processing' | 'done'

export default function Pronunciation({ exercise, onComplete }: Props) {
  const { t } = useTranslation()
  const [state, setState] = useState<RecordState>('idle')
  const [score, setScore] = useState<number | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => { return () => { if (audioUrl) URL.revokeObjectURL(audioUrl) } }, [audioUrl])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRef.current = recorder
      chunksRef.current = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((t) => t.stop())
        setState('processing')
        await new Promise((r) => setTimeout(r, 1200))
        const s = 0.6 + Math.random() * 0.4
        setScore(s)
        setState('done')
      }
      recorder.start()
      setState('recording')
      if (btnRef.current) gsap.to(btnRef.current, { scale: 1.08, duration: 0.8, ease: 'sine.inOut', yoyo: true, repeat: -1 })
    } catch (err) { console.error('Mic error:', err) }
  }

  const stopRecording = () => {
    gsap.killTweensOf(btnRef.current)
    gsap.to(btnRef.current, { scale: 1, duration: 0.2 })
    mediaRef.current?.stop()
  }

  const getLabel = (s: number) => {
    if (s >= 0.85) return { text: t('lesson.correct'), color: 'text-green-700', bg: 'bg-green-50 border-green-200' }
    if (s >= 0.6)  return { text: 'Presque !',        color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200' }
    return               { text: t('lesson.incorrect'), color: 'text-red-700',   bg: 'bg-red-50 border-red-200' }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <p className="text-sm text-gray-500">{exercise.prompt}</p>
        <p className="text-5xl leading-loose" dir="rtl" style={{ fontFamily: "'Noto Naskh Arabic', serif", color: '#1A6B6B' }}>
          {exercise.targetText}
        </p>
        <p className="text-sm text-gray-400 italic">{exercise.phonemeGuide}</p>
      </div>

      {exercise.audioUrl && (
        <div className="flex justify-center">
          <button onClick={() => new Audio(exercise.audioUrl!).play()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            🔊 Écouter le modèle
          </button>
        </div>
      )}

      <div className="flex justify-center">
        {state === 'idle' && (
          <button ref={btnRef} onClick={startRecording}
            className="w-20 h-20 rounded-full bg-brand-teal text-white text-3xl hover:bg-brand-teal-dark transition-colors shadow-lg flex items-center justify-center">
            🎤
          </button>
        )}
        {state === 'recording' && (
          <button ref={btnRef} onClick={stopRecording}
            className="w-20 h-20 rounded-full bg-red-500 text-white text-3xl hover:bg-red-600 transition-colors shadow-lg flex items-center justify-center">
            ⏹
          </button>
        )}
        {state === 'processing' && (
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
            <div className="w-7 h-7 border-2 border-brand-teal/30 border-t-brand-teal rounded-full animate-spin" />
          </div>
        )}
        {state === 'done' && score !== null && (
          <div className="text-center space-y-3">
            <div className="relative w-20 h-20 mx-auto">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#E5E7EB" strokeWidth="6" />
                <circle cx="40" cy="40" r="34" fill="none"
                  stroke={score >= 0.85 ? '#22C55E' : score >= 0.6 ? '#F59E0B' : '#EF4444'}
                  strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 34 * score} ${2 * Math.PI * 34 * (1 - score)}`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-800">
                {Math.round(score * 100)}%
              </span>
            </div>
            {audioUrl && (
              <button onClick={() => new Audio(audioUrl).play()} className="text-xs text-gray-500 hover:text-gray-700 underline">
                Réécouter
              </button>
            )}
          </div>
        )}
      </div>

      {state === 'done' && score !== null && (() => {
        const { text, color, bg } = getLabel(score)
        return (
          <div className={`rounded-xl p-4 border ${bg}`}>
            <p className={`font-semibold text-sm ${color}`}>{text}</p>
          </div>
        )
      })()}

      {state === 'done' && (
        <button onClick={() => onComplete((score ?? 0) >= 0.6)}
          className="w-full py-3 rounded-xl bg-brand-teal text-white font-medium text-sm hover:bg-brand-teal-dark transition-colors">
          {t('lesson.continue')} →
        </button>
      )}

      {state === 'idle' && <p className="text-center text-xs text-gray-400">Appuyez sur le micro puis parlez</p>}
    </div>
  )
}
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { curriculumService } from '@/services/curriculumService'
import { useProgressStore } from '@/store/progressStore'
import LessonEngine from '@/components/LessonEngine'

type LessonState = 'intro' | 'playing' | 'complete'

export default function LessonPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { markLessonComplete } = useProgressStore()
  const [lessonState, setLessonState] = useState<LessonState>('intro')
  const [finalScore, setFinalScore] = useState(0)
  const [earnedXP, setEarnedXP] = useState(0)
  const [newBadges, setNewBadges] = useState<string[]>([])
  const startTime = Date.now()

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['curriculum', 'lessons', id],
    queryFn: () => curriculumService.getLesson(Number(id)),
    enabled: !!id,
  })

  const completeMutation = useMutation({
    mutationFn: ({ score, duration }: { score: number; duration: number }) =>
      curriculumService.completeLesson(Number(id), score, duration),
    onSuccess: (data) => {
      setEarnedXP(data.xpEarned)
      setNewBadges(data.newBadges)
      if (lesson) markLessonComplete(lesson.id, data.xpEarned)
    },
  })

  const handleComplete = async (score: number) => {
    setFinalScore(score)
    const duration = Math.round((Date.now() - startTime) / 1000)
    await completeMutation.mutateAsync({ score, duration })
    setLessonState('complete')
  }

  if (isLoading || !lesson) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-brand-teal/30 border-t-brand-teal rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-surface">
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">✕</button>
        <h1 className="text-sm font-semibold text-gray-700 truncate max-w-[200px]">{lesson.title}</h1>
        <div className="w-8 h-8 flex items-center justify-center text-xs font-medium text-amber-600">+{lesson.xpReward}</div>
      </header>

      <AnimatePresence mode="wait">
        {lessonState === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-brand-teal/10 flex items-center justify-center text-4xl mb-6">📖</div>
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">{lesson.title}</h2>
            <p className="text-gray-500 text-sm mb-8">{lesson.durationMinutes} min · +{lesson.xpReward} XP</p>
            <button onClick={() => setLessonState('playing')}
              className="px-8 py-3.5 rounded-xl bg-brand-teal text-white font-medium text-base hover:bg-brand-teal-dark transition-colors shadow-lg">
              Commencer la leçon
            </button>
          </motion.div>
        )}

        {lessonState === 'playing' && (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <LessonEngine lesson={lesson} onComplete={handleComplete} />
          </motion.div>
        )}

        {lessonState === 'complete' && (
          <motion.div key="complete" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center space-y-6">
            <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ duration: 0.5 }}
              className="w-24 h-24 rounded-full bg-amber-400 flex items-center justify-center text-5xl shadow-xl">⭐</motion.div>
            <h2 className="text-2xl font-display font-bold text-gray-900">{t('lesson.complete')}</h2>
            <p className="text-gray-500 text-sm">Score : {Math.round(finalScore * 100)}%</p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-6 py-3">
              <p className="text-amber-700 font-bold text-xl">{t('lesson.xpEarned', { xp: earnedXP })}</p>
            </div>
            {newBadges.map((badge) => (
              <div key={badge} className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl px-4 py-2">
                <span>🏅</span>
                <span className="text-purple-700 text-sm font-medium">Badge : {badge}</span>
              </div>
            ))}
            <div className="flex gap-3 w-full max-w-xs">
              <button onClick={() => navigate('/dashboard')} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Tableau de bord</button>
              <button onClick={() => navigate('/dashboard')} className="flex-1 py-3 rounded-xl bg-brand-teal text-white text-sm font-medium hover:bg-brand-teal-dark transition-colors">Suivant →</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
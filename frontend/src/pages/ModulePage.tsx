import { useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { curriculumService } from '@/services/curriculumService'

export default function ModulePage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const pageRef = useRef<HTMLDivElement>(null)

  const { data: module, isLoading } = useQuery({
    queryKey: ['curriculum', 'modules', id],
    queryFn: () => curriculumService.getModule(Number(id)),
    enabled: !!id,
  })

  useGSAP(() => {
    if (!pageRef.current || !module) return
    gsap.fromTo(pageRef.current.querySelectorAll('.anim-item'),
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', stagger: 0.07 }
    )
  }, { scope: pageRef, dependencies: [module] })

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-7 h-7 border-2 border-brand-teal/30 border-t-brand-teal rounded-full animate-spin" />
    </div>
  )

  if (!module) return null

  return (
    <div ref={pageRef} className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="anim-item text-sm text-gray-500 hover:text-gray-800 mb-6 flex items-center gap-1">
        ← Retour
      </button>

      <div className="anim-item mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-medium uppercase tracking-wide text-brand-teal bg-brand-teal/10 px-2.5 py-1 rounded-full">
            Module {module.id}
          </span>
          <span className="text-xs text-gray-400">{t('modules.lessons', { count: module.lessonsCount })}</span>
        </div>
        <h1 className="text-2xl font-display font-bold text-gray-900">{module.title}</h1>
        <p className="text-gray-500 mt-1.5 text-sm">{module.description}</p>
        <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-brand-teal rounded-full transition-all" style={{ width: `${module.completionRate * 100}%` }} />
        </div>
        <p className="text-xs text-gray-400 mt-1">{Math.round(module.completionRate * 100)}% complété</p>
      </div>

      <div className="space-y-4">
        {module.courses.map((course) => (
          <div key={course.id} className="anim-item">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-gray-800 text-sm">{course.title}</h2>
              <span className="text-xs text-gray-400">{Math.round(course.completionRate * 100)}%</span>
            </div>
            <div className="space-y-2">
              {Array.from({ length: course.lessonsCount }, (_, i) => {
                const lessonId = i + 1
                const isCompleted = i < Math.floor(course.completionRate * course.lessonsCount)
                return (
                  <Link key={i} to={`/lesson/${lessonId}`}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border transition-colors group ${isCompleted ? 'border-green-100 bg-green-50 hover:bg-green-100' : 'border-gray-100 bg-white hover:border-brand-teal/30 hover:bg-brand-teal/5'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm ${isCompleted ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-brand-teal/10'}`}>
                      {isCompleted ? '✓' : '▶'}
                    </div>
                    <p className={`text-sm font-medium truncate flex-1 ${isCompleted ? 'text-green-800' : 'text-gray-800'}`}>
                      Leçon {i + 1}
                    </p>
                    <span className="text-xs font-medium text-amber-600 shrink-0">+15 XP</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
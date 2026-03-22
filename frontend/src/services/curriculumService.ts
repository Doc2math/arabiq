import { api } from '@/lib/apiClient'
import type { Module, Lesson, UserProgress } from '@/types'

export const curriculumService = {
  getModules: () =>
    api.get<Module[]>('/curriculum/modules'),

  getModule: (moduleId: number) =>
    api.get<Module>(`/curriculum/modules/${moduleId}`),

  getLesson: (lessonId: number) =>
    api.get<Lesson>(`/curriculum/lessons/${lessonId}`),

  completeLesson: (lessonId: number, score: number, durationSeconds: number) =>
    api.post<{ xpEarned: number; newBadges: string[]; levelUp: boolean; newLevel: number | null }>(
      `/curriculum/lessons/${lessonId}/complete`,
      { score, duration_seconds: durationSeconds }
    ),

  getProgress: () =>
    api.get<UserProgress>('/curriculum/progress'),

  getNextLesson: () =>
    api.get<Lesson>('/curriculum/next-lesson'),
}
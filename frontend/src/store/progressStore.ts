import { create } from 'zustand'
import type { UserProgress, Badge, StreakInfo } from '@/types'

interface ProgressState {
  progress: UserProgress | null
  badges: Badge[]
  streak: StreakInfo | null
  pendingXP: number
  setProgress: (p: UserProgress) => void
  setBadges: (b: Badge[]) => void
  setStreak: (s: StreakInfo) => void
  addXP: (amount: number) => void
  clearPendingXP: () => void
  markLessonComplete: (lessonId: number, xp: number) => void
}

export const useProgressStore = create<ProgressState>()((set) => ({
  progress: null,
  badges: [],
  streak: null,
  pendingXP: 0,
  setProgress: (p) => set({ progress: p }),
  setBadges: (b) => set({ badges: b }),
  setStreak: (s) => set({ streak: s }),
  addXP: (amount) => set((s) => ({ pendingXP: s.pendingXP + amount })),
  clearPendingXP: () => set({ pendingXP: 0 }),
  markLessonComplete: (lessonId, xp) =>
    set((s) => ({
      pendingXP: s.pendingXP + xp,
      progress: s.progress
        ? { ...s.progress, completedLessons: [...s.progress.completedLessons, lessonId], xpEarned: s.progress.xpEarned + xp }
        : null,
    })),
}))
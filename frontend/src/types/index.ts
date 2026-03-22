// ─── Auth ──────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  username: string
  nativeLanguage: 'fr' | 'es' | 'en'
  avatarUrl?: string
  xp: number
  level: number
  streak: number
  isPremium: boolean
  isAdmin: boolean
  createdAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  tokenType: 'bearer'
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  username: string
  password: string
  nativeLanguage: 'fr' | 'es' | 'en'
}

// ─── Curriculum ────────────────────────────────────────────────
export interface Module {
  id: number
  slug: string
  title: string
  description: string
  lessonsCount: number
  arabicRatio: number
  isLocked: boolean
  completionRate: number
  courses: Course[]
}

export interface Course {
  id: number
  moduleId: number
  title: string
  lessonsCount: number
  completionRate: number
}

export interface Lesson {
  id: number
  courseId: number
  title: string
  type: string
  lessonType: string
  xpReward: number
  durationMinutes: number
  isCompleted: boolean
  content: LessonContent
}

export interface LessonContent {
  exercises: Exercise[]
}

// ─── Exercises ─────────────────────────────────────────────────
export type Exercise =
  | MultipleChoiceExercise
  | PronunciationExercise
  | TranslationExercise

export interface BaseExercise {
  id: string
  type: string
  prompt: string
  promptAr?: string
  xpReward: number
}

export interface MultipleChoiceExercise extends BaseExercise {
  type: 'multiple_choice'
  options: string[]
  correctIndex: number
  explanation?: string
}

export interface PronunciationExercise extends BaseExercise {
  type: 'pronunciation'
  targetText: string
  audioUrl?: string
  phonemeGuide: string
}

export interface TranslationExercise extends BaseExercise {
  type: 'translation'
  sourceText: string
  sourceLang: 'fr' | 'es' | 'en'
  acceptedAnswers: string[]
}

// ─── Progress ──────────────────────────────────────────────────
export interface UserProgress {
  userId: string
  completedLessons: number[]
  xpEarned: number
  lastActivityAt: string | null
}

export interface Badge {
  id: string
  name: string
  description: string
  iconUrl: string
  earnedAt?: string
  isEarned: boolean
  requirement: string
}

export interface StreakInfo {
  current: number
  longest: number
  lastCompletedDate: string
  frozenDaysLeft: number
}

// ─── API ───────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiError {
  detail: string
  code?: string
}
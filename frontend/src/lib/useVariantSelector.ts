/**
 * useVariantSelector
 * ==================
 * Sélectionne intelligemment une variante d'exercice selon la maîtrise BKT
 * de l'élève et l'historique de session.
 *
 * Règles :
 *  - mastery < 0.4  → level 1 (scaffold)
 *  - mastery 0.4–0.7 → level 2 ou 3 aléatoire
 *  - mastery > 0.7  → level 3 ou 4 aléatoire
 *  - Jamais le même level 2 fois de suite
 *  - Toutes les 5 exercices → level surprise (±1 niveau, effet humain)
 *  - Si variante absente pour le level cible → level le plus proche disponible
 *
 * i18n : champ "lang" réservé dans chaque variante pour la traduction future.
 */

import { useRef, useCallback } from 'react'

export type Variant = {
  level: 1 | 2 | 3 | 4
  prompt?: string | null
  promptAr?: string | null
  options?: string[]
  correctIndex?: number
  audioUrl?: string
  words?: string[]
  correctSentence?: string
  pairs?: any[]
  lang?: string          // réservé i18n — ex: 'fr' | 'en' | 'ar' | 'nl'
  [key: string]: any     // champs spécifiques au type d'exercice
}

export type ExerciseWithVariants = {
  id: string
  type: string
  skill_id: string
  xpReward: number
  explanation?: string
  variants: Variant[]
  [key: string]: any
}

// Mastery par skill_id — récupérée depuis le BKT local ou l'API
export type MasteryMap = Record<string, number>

// ── Utilitaires ───────────────────────────────────────────────

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val))
}

// Trouver la variante la plus proche du level cible
function closestVariant(variants: Variant[], targetLevel: number): Variant {
  return variants.reduce((best, v) =>
    Math.abs(v.level - targetLevel) < Math.abs(best.level - targetLevel) ? v : best
  )
}

// Choisir un level selon la mastery
function levelFromMastery(mastery: number): 1 | 2 | 3 | 4 {
  if (mastery < 0.4) return 1
  if (mastery < 0.7) return pickRandom([2, 3]) as 2 | 3
  return pickRandom([3, 4]) as 3 | 4
}

// ── Hook principal ────────────────────────────────────────────

export function useVariantSelector() {
  // Historique de session : exercice_id → level joué
  const sessionHistory = useRef<Record<string, number>>({})
  // Compteur global d'exercices joués
  const exerciseCount  = useRef(0)

  const selectVariant = useCallback((
    exercise: ExerciseWithVariants,
    masteryMap: MasteryMap,
  ): Variant & { _selectedLevel: number } => {

    const variants = exercise.variants ?? []
    if (variants.length === 0) {
      // Pas de variantes → retourner l'exercice tel quel comme variante level 1
      return { ...exercise, level: 1, _selectedLevel: 1 }
    }

    const mastery       = masteryMap[exercise.skill_id] ?? 0
    const lastLevel     = sessionHistory.current[exercise.id] ?? null
    exerciseCount.current += 1

    // ── Effet surprise toutes les 5 exercices ──
    let targetLevel: number
    if (exerciseCount.current % 5 === 0) {
      const baseLevel = levelFromMastery(mastery)
      // ±1 niveau, mais clampé entre 1 et 4
      const delta = pickRandom([-1, 1])
      targetLevel = clamp(baseLevel + delta, 1, 4)
    } else {
      targetLevel = levelFromMastery(mastery)
    }

    // ── Éviter le même level 2 fois de suite ──
    if (lastLevel !== null && targetLevel === lastLevel && variants.length > 1) {
      const otherLevels = variants
        .map(v => v.level)
        .filter(l => l !== lastLevel)
      if (otherLevels.length > 0) {
        targetLevel = pickRandom(otherLevels)
      }
    }

    // ── Trouver la variante ──
    const exact = variants.find(v => v.level === targetLevel)
    const chosen = exact ?? closestVariant(variants, targetLevel)

    // Mémoriser pour éviter répétition
    sessionHistory.current[exercise.id] = chosen.level

    return { ...chosen, _selectedLevel: chosen.level }
  }, [])

  // Réinitialiser l'historique de session (nouvelle leçon)
  const resetSession = useCallback(() => {
    sessionHistory.current = {}
    exerciseCount.current  = 0
  }, [])

  return { selectVariant, resetSession }
}

// ── Fonction utilitaire standalone (sans hook) ─────────────────
// Utile pour préparer tous les exercices d'une leçon d'un coup

export function resolveExercises(
  exercises: ExerciseWithVariants[],
  masteryMap: MasteryMap,
): any[] {
  const history: Record<string, number> = {}
  let count = 0

  return exercises.map(ex => {
    const variants = ex.variants ?? []
    if (variants.length === 0) return ex  // exercice sans variantes → tel quel

    const mastery   = masteryMap[ex.skill_id] ?? 0
    count++

    let targetLevel: number
    if (count % 5 === 0) {
      const base  = levelFromMastery(mastery)
      targetLevel = clamp(base + pickRandom([-1, 1]), 1, 4)
    } else {
      targetLevel = levelFromMastery(mastery)
    }

    const lastLevel = history[ex.id] ?? null
    if (lastLevel !== null && targetLevel === lastLevel && variants.length > 1) {
      const others = variants.map(v => v.level).filter(l => l !== lastLevel)
      if (others.length > 0) targetLevel = pickRandom(others)
    }

    const exact  = variants.find(v => v.level === targetLevel)
    const chosen = exact ?? closestVariant(variants, targetLevel)
    history[ex.id] = chosen.level

    // Fusionner : champs de base (id, skill_id, xpReward, explanation)
    // + champs de la variante choisie
    // Le type de la variante est prioritaire sur celui de l'exercice parent
    return {
      id:          ex.id,
      skill_id:    ex.skill_id,
      xpReward:    ex.xpReward,
      explanation: chosen.explanation ?? ex.explanation,
      _level:      chosen.level,
      ...chosen,
      type:        chosen.type ?? ex.type,  // ← variante peut changer le type
    }
  })
}
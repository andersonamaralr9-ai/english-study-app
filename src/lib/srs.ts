// SM-2 Spaced Repetition Algorithm
// quality: 0-5 (0=complete blackout, 5=perfect response)

export function calculateSRS(
  quality: number,
  repetitions: number,
  easeFactor: number,
  interval: number
): { interval: number; repetitions: number; easeFactor: number; nextReview: string } {
  let newInterval: number
  let newRepetitions: number
  let newEaseFactor: number

  if (quality < 3) {
    newRepetitions = 0
    newInterval = 1
  } else {
    newRepetitions = repetitions + 1
    if (repetitions === 0) {
      newInterval = 1
    } else if (repetitions === 1) {
      newInterval = 6
    } else {
      newInterval = Math.round(interval * easeFactor)
    }
  }

  newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  if (newEaseFactor < 1.3) newEaseFactor = 1.3

  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + newInterval)

  return {
    interval: newInterval,
    repetitions: newRepetitions,
    easeFactor: newEaseFactor,
    nextReview: nextReview.toISOString().split('T')[0],
  }
}

export function isDueForReview(nextReview: string): boolean {
  const today = new Date().toISOString().split('T')[0]
  return nextReview <= today
}

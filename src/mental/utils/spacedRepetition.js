// Algoritmo SM-2 (base do Anki) para afirmações

/**
 * Calcula próxima revisão de uma afirmação.
 * @param {object} card   - { interval, easeFactor, repetitions }
 * @param {number} quality - 1 a 4 (1 = não ressoa, 4 = muito poderoso)
 */
export function calcNextReview(card, quality) {
  // Mapeia 1-4 para 0-5 do SM-2 original
  const q = Math.round((quality / 4) * 5)

  let { interval = 1, easeFactor = 2.5, repetitions = 0 } = card

  if (q < 3) {
    interval    = 1
    repetitions = 0
  } else {
    if (repetitions === 0)      interval = 1
    else if (repetitions === 1) interval = 3
    else interval = Math.round(interval * easeFactor)

    easeFactor = Math.max(
      1.3,
      easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
    )
    repetitions++
  }

  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + interval)

  return { interval, easeFactor, repetitions, nextReview: nextReview.toISOString() }
}

// Cria nova afirmação com defaults
export function createAffirmation(text) {
  return {
    id:          crypto.randomUUID(),
    text,
    interval:    1,
    easeFactor:  2.5,
    repetitions: 0,
    nextReview:  new Date().toISOString(),
    createdAt:   new Date().toISOString(),
  }
}

// Retorna afirmações que devem ser revisadas hoje
export function getDueCards(affirmations) {
  const now = new Date()
  return affirmations.filter(a => new Date(a.nextReview) <= now)
}

// Labels dos botões de avaliação
export const QUALITY_LABELS = [
  { value: 1, label: 'Não ressoa',  emoji: '😐', color: 'text-red-400'    },
  { value: 2, label: 'Neutro',      emoji: '🤔', color: 'text-yellow-400' },
  { value: 3, label: 'Ressoa',      emoji: '✨', color: 'text-green-400'  },
  { value: 4, label: 'Poderoso!',   emoji: '🔥', color: 'text-forja-primary' },
]

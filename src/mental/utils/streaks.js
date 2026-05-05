import { storage } from './storage'

const KEY_STREAK   = 'forja_streak'
const KEY_LAST_USE = 'forja_last_use'

// Retorna o streak atual (dias consecutivos)
export function getStreak() {
  return storage.get(KEY_STREAK, 0)
}

// Chama ao iniciar qualquer sessão — atualiza streak
export function registerUse() {
  const today     = new Date().toDateString()
  const lastUse   = storage.get(KEY_LAST_USE, null)
  const yesterday = new Date(Date.now() - 86400000).toDateString()

  if (lastUse === today) return  // já registrou hoje

  const streak = storage.get(KEY_STREAK, 0)

  if (lastUse === yesterday) {
    storage.set(KEY_STREAK, streak + 1)   // dia seguinte → incrementa
  } else {
    storage.set(KEY_STREAK, 1)            // quebrou streak → recomeça
  }

  storage.set(KEY_LAST_USE, today)
}

// Retorna mensagem motivacional baseada no streak
export function streakMessage(streak) {
  if (streak === 0) return 'Comece hoje sua jornada 🌱'
  if (streak === 1) return 'Primeiro dia — a viagem começa! 🔥'
  if (streak < 7)  return `${streak} dias seguidos — continue! 💪`
  if (streak < 21) return `${streak} dias! Você está forjando hábito! ⚡`
  if (streak < 66) return `${streak} dias — sua mente está mudando! 🧠`
  return `${streak} dias — MESTRE DA FORJA! 🏆`
}

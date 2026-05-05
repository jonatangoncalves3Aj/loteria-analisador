import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { storage } from '../utils/storage'
import { registerUse } from '../utils/streaks'

const CATEGORIES = [
  { key: 'saude',          label: 'Saúde',          emoji: '💪', color: '#48b8a6' },
  { key: 'financas',       label: 'Finanças',        emoji: '💰', color: '#ffd32a' },
  { key: 'relacionamentos',label: 'Relacionamentos', emoji: '❤️', color: '#fd79a8' },
  { key: 'carreira',       label: 'Carreira',        emoji: '🚀', color: '#74b9ff' },
  { key: 'mente',          label: 'Mente',           emoji: '🧠', color: '#a29bfe' },
  { key: 'habitos',        label: 'Hábitos',         emoji: '🌱', color: '#55efc4' },
]

function createGoal({ title, category, targetDays = 66 }) {
  return {
    id:         crypto.randomUUID(),
    title,
    category,
    targetDays,
    createdAt:  new Date().toISOString(),
    checkIns:   [],   // array de dateStrings 'YYYY-MM-DD'
    completed:  false,
  }
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function calcStreak(checkIns) {
  if (!checkIns.length) return 0
  const sorted = [...checkIns].sort().reverse()
  let streak = 0
  let cursor = new Date()
  cursor.setHours(0,0,0,0)
  for (const d of sorted) {
    const day = new Date(d + 'T00:00:00')
    const diff = Math.round((cursor - day) / 86400000)
    if (diff <= 1) { streak++; cursor = day }
    else break
  }
  return streak
}

export default function Goals() {
  const navigate = useNavigate()
  const [goals,  setGoals]  = useState([])
  const [mode,   setMode]   = useState('list')  // list | add
  const [form,   setForm]   = useState({ title: '', category: 'mente', targetDays: 66 })

  useEffect(() => {
    setGoals(storage.get('forja_goals', []))
  }, [])

  function save(updated) {
    setGoals(updated)
    storage.set('forja_goals', updated)
  }

  function addGoal() {
    if (!form.title.trim()) return
    const goal    = createGoal(form)
    save([...goals, goal])
    setForm({ title: '', category: 'mente', targetDays: 66 })
    setMode('list')
  }

  function checkIn(id) {
    const today = todayStr()
    save(goals.map(g => {
      if (g.id !== id) return g
      if (g.checkIns.includes(today)) return g
      const checkIns = [...g.checkIns, today]
      const completed = checkIns.length >= g.targetDays
      return { ...g, checkIns, completed }
    }))
    registerUse()
  }

  function removeGoal(id) {
    save(goals.filter(g => g.id !== id))
  }

  // === ADD ===
  if (mode === 'add') return (
    <div className="flex flex-col min-h-dvh bg-cosmos px-5 pt-10 pb-28">
      <button onClick={() => setMode('list')} className="text-forja-muted text-sm mb-6 self-start">← Voltar</button>
      <h2 className="text-xl font-medium text-forja-text mb-6">Nova Meta</h2>

      <label className="text-forja-muted text-xs uppercase tracking-widest block mb-2">Título da meta</label>
      <input
        type="text"
        placeholder='Ex: "Meditar 10 min todo dia"'
        value={form.title}
        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        className="w-full bg-forja-surface border border-white/10 rounded-xl px-4 py-3
                   text-forja-text placeholder:text-forja-muted text-sm outline-none
                   focus:border-forja-primary/50 transition-colors mb-6"
        autoFocus
      />

      <label className="text-forja-muted text-xs uppercase tracking-widest block mb-3">Categoria</label>
      <div className="grid grid-cols-3 gap-2 mb-6">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setForm(f => ({ ...f, category: cat.key }))}
            className={`py-2.5 px-2 rounded-xl border text-xs flex flex-col items-center gap-1 transition-all ${
              form.category === cat.key
                ? 'border-current'
                : 'border-white/10 text-forja-muted'
            }`}
            style={form.category === cat.key ? { color: cat.color, background: `${cat.color}15`, borderColor: `${cat.color}66` } : {}}
          >
            <span className="text-lg">{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      <label className="text-forja-muted text-xs uppercase tracking-widest block mb-3">
        Prazo de formação de hábito: <span className="text-forja-text font-medium">{form.targetDays} dias</span>
      </label>
      <div className="flex gap-2 mb-8">
        {[21, 30, 66, 90].map(d => (
          <button
            key={d}
            onClick={() => setForm(f => ({ ...f, targetDays: d }))}
            className={`flex-1 py-2 rounded-xl border text-sm transition-all ${
              form.targetDays === d
                ? 'bg-forja-primary/20 border-forja-primary/60 text-forja-primary'
                : 'border-white/10 text-forja-muted'
            }`}
          >
            {d}d
          </button>
        ))}
      </div>
      <p className="text-forja-muted text-xs mb-6 -mt-4">
        💡 Pesquisas mostram que hábitos sólidos levam 66 dias em média (não 21, como se popularizou)
      </p>

      <button
        onClick={addGoal}
        disabled={!form.title.trim()}
        className="btn-primary w-full disabled:opacity-40"
      >
        Criar meta
      </button>
    </div>
  )

  // === LIST ===
  return (
    <div className="flex flex-col min-h-dvh bg-cosmos px-5 pt-10 pb-28">
      <button onClick={() => navigate('/')} className="text-forja-muted text-sm mb-6 self-start">← Voltar</button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-light text-forja-text">
          🎯 <span className="text-[#ffd32a] font-semibold">Metas</span>
        </h1>
        <button onClick={() => setMode('add')} className="btn-ghost text-xs py-2 px-3">+ Nova</button>
      </div>

      {goals.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <span className="text-5xl">🎯</span>
          <p className="text-forja-text font-medium">Nenhuma meta ainda</p>
          <p className="text-forja-muted text-sm max-w-xs">
            Defina metas claras e dê check-in todo dia. O cérebro ama progresso visível.
          </p>
          <button onClick={() => setMode('add')} className="btn-primary mt-2">
            Criar primeira meta
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {goals.map(goal => {
            const cat        = CATEGORIES.find(c => c.key === goal.category)
            const streak     = calcStreak(goal.checkIns)
            const checkedToday = goal.checkIns.includes(todayStr())
            const progress   = Math.min(goal.checkIns.length / goal.targetDays, 1)
            const daysLeft   = Math.max(goal.targetDays - goal.checkIns.length, 0)

            return (
              <div
                key={goal.id}
                className="bg-forja-surface/70 border border-white/5 rounded-3xl p-5"
              >
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: `${cat.color}22`, border: `1px solid ${cat.color}44` }}
                  >
                    {cat.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${goal.completed ? 'line-through text-forja-muted' : 'text-forja-text'}`}>
                      {goal.title}
                    </p>
                    <p className="text-forja-muted text-xs mt-0.5">
                      {cat.label} · {goal.checkIns.length}/{goal.targetDays} dias
                      {streak > 0 ? ` · 🔥 ${streak} seguidos` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => removeGoal(goal.id)}
                    className="text-forja-muted/40 hover:text-red-400 transition-colors text-xl"
                  >×</button>
                </div>

                {/* Barra de progresso */}
                <div className="h-2 bg-forja-bg rounded-full mb-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progress * 100}%`,
                      background: goal.completed
                        ? '#55efc4'
                        : `linear-gradient(90deg, ${cat.color}99, ${cat.color})`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-forja-muted mb-4">
                  <span>{Math.round(progress * 100)}% concluído</span>
                  <span>{goal.completed ? '🏆 Concluída!' : `${daysLeft} dias restantes`}</span>
                </div>

                {/* Check-in */}
                {!goal.completed && (
                  <button
                    onClick={() => checkIn(goal.id)}
                    disabled={checkedToday}
                    className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all ${
                      checkedToday
                        ? 'bg-green-500/15 border border-green-500/30 text-green-400 cursor-default'
                        : 'border border-white/10 text-forja-muted hover:border-white/20 active:scale-95'
                    }`}
                    style={!checkedToday ? { borderColor: `${cat.color}44`, color: cat.color } : {}}
                  >
                    {checkedToday ? '✅ Check-in de hoje feito!' : '☐ Check-in de hoje'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

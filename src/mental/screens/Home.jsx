import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStreak, registerUse, streakMessage } from '../utils/streaks'
import { storage } from '../utils/storage'
import { getDueCards } from '../utils/spacedRepetition'

const MAIN_MODULES = [
  { path: '/binaural',      emoji: '🎵', title: 'Binaural Beats',    desc: 'Induz alfa, theta ou delta',            color: '#48b8a6' },
  { path: '/affirmations',  emoji: '🃏', title: 'Afirmações',         desc: 'Reprogramação com SM-2',                color: '#a29bfe' },
  { path: '/emdr',          emoji: '👁',  title: 'EMDR',               desc: 'Estimulação bilateral',                 color: '#fd79a8' },
  { path: '/visualization', emoji: '🌌', title: 'Visualização',        desc: '10 temas de meditação guiada',         color: '#74b9ff' },
]

const EXTRA_MODULES = [
  { path: '/routine', emoji: '🔄', title: 'Rotina Diária',   desc: 'Sequência automática de técnicas', color: '#55efc4' },
  { path: '/goals',   emoji: '🎯', title: 'Metas',           desc: 'Acompanhe seus objetivos',         color: '#ffd32a' },
  { path: '/journal', emoji: '📊', title: 'Diário de Humor', desc: 'Gráfico de evolução emocional',     color: '#74b9ff' },
]

export default function Home() {
  const navigate   = useNavigate()
  const [streak,   setStreak]   = useState(0)
  const [dueCount, setDueCount] = useState(0)
  const [name,     setName]     = useState('')
  const [goalsToday, setGoalsToday] = useState(0)

  useEffect(() => {
    registerUse()
    setStreak(getStreak())

    const savedAffirmations = storage.get('forja_affirmations', [])
    setDueCount(getDueCards(savedAffirmations).length)

    const savedName = storage.get('forja_name', '')
    setName(savedName)

    // Metas sem check-in hoje
    const today = new Date().toISOString().split('T')[0]
    const goals = storage.get('forja_goals', [])
    const pending = goals.filter(g => !g.completed && !g.checkIns.includes(today))
    setGoalsToday(pending.length)
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="flex flex-col min-h-dvh bg-cosmos px-5 pt-12 pb-28">

      {/* Header */}
      <div className="mb-6 animate-fadeIn">
        <p className="text-forja-muted text-sm">{greeting}{name ? `, ${name}` : ''} 👋</p>
        <h1 className="text-3xl font-light text-forja-text mt-1">
          Forja <span className="text-forja-primary font-semibold">Mental</span>
        </h1>
      </div>

      {/* Streak */}
      <div className="mb-4 flex items-center gap-3 bg-forja-surface/60 rounded-2xl px-4 py-3 border border-white/5">
        <span className="text-2xl">🔥</span>
        <div className="flex-1">
          <p className="text-forja-text font-semibold">{streak} {streak === 1 ? 'dia' : 'dias'} seguidos</p>
          <p className="text-forja-muted text-xs">{streakMessage(streak)}</p>
        </div>
      </div>

      {/* Alertas pendentes */}
      <div className="flex flex-col gap-2 mb-6">
        {dueCount > 0 && (
          <button
            onClick={() => navigate('/affirmations')}
            className="w-full flex items-center gap-3 bg-forja-primary/10 border border-forja-primary/30
                       rounded-2xl px-4 py-3 text-left hover:bg-forja-primary/15 transition-all"
          >
            <span className="text-xl">🃏</span>
            <p className="text-forja-primary text-sm flex-1">
              {dueCount} afirmação{dueCount > 1 ? 'ões' : ''} para revisar hoje
            </p>
            <span className="text-forja-primary text-sm">→</span>
          </button>
        )}
        {goalsToday > 0 && (
          <button
            onClick={() => navigate('/goals')}
            className="w-full flex items-center gap-3 bg-[#ffd32a]/10 border border-[#ffd32a]/30
                       rounded-2xl px-4 py-3 text-left hover:bg-[#ffd32a]/15 transition-all"
          >
            <span className="text-xl">🎯</span>
            <p className="text-[#ffd32a] text-sm flex-1">
              {goalsToday} meta{goalsToday > 1 ? 's' : ''} sem check-in hoje
            </p>
            <span className="text-[#ffd32a] text-sm">→</span>
          </button>
        )}
      </div>

      {/* Módulos principais */}
      <h2 className="text-forja-muted text-xs uppercase tracking-widest mb-3">Técnicas</h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {MAIN_MODULES.map(mod => (
          <button
            key={mod.path}
            onClick={() => navigate(mod.path)}
            className="module-card text-left"
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
              style={{ background: `${mod.color}22`, border: `1px solid ${mod.color}44` }}
            >
              {mod.emoji}
            </div>
            <div>
              <p className="text-forja-text font-medium text-sm">{mod.title}</p>
              <p className="text-forja-muted text-xs leading-relaxed mt-0.5">{mod.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Módulos extras */}
      <h2 className="text-forja-muted text-xs uppercase tracking-widest mb-3">Ferramentas</h2>
      <div className="flex flex-col gap-2 mb-6">
        {EXTRA_MODULES.map(mod => (
          <button
            key={mod.path}
            onClick={() => navigate(mod.path)}
            className="flex items-center gap-3 bg-forja-surface/50 border border-white/5 rounded-2xl px-4 py-3
                       hover:border-white/10 transition-all active:scale-[0.99]"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: `${mod.color}22`, border: `1px solid ${mod.color}44` }}
            >
              {mod.emoji}
            </div>
            <div className="text-left">
              <p className="text-forja-text font-medium text-sm">{mod.title}</p>
              <p className="text-forja-muted text-xs">{mod.desc}</p>
            </div>
            <span className="ml-auto text-forja-muted text-sm">→</span>
          </button>
        ))}
      </div>

      {/* Nome */}
      <div className="mt-2">
        <p className="text-forja-muted text-xs mb-2">Seu nome</p>
        <input
          type="text"
          placeholder="Como quer ser chamado?"
          value={name}
          onChange={e => { setName(e.target.value); storage.set('forja_name', e.target.value) }}
          className="w-full bg-forja-surface border border-white/10 rounded-xl px-4 py-2.5
                     text-forja-text placeholder:text-forja-muted text-sm outline-none
                     focus:border-forja-primary/50 transition-colors"
        />
      </div>

      <p className="mt-6 text-center text-forja-muted text-xs">
        🎧 Use fones de ouvido para binaural beats e EMDR
      </p>

      <button
        onClick={() => navigate('/settings')}
        className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                   border border-white/5 text-forja-muted text-xs hover:border-white/10 transition-all"
      >
        ⚙️ Configurações de voz do narrador
      </button>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { storage } from '../utils/storage'

const MOODS = [
  { value: 1,  emoji: '😞', label: 'Péssimo',  color: '#e17055' },
  { value: 2,  emoji: '😕', label: 'Ruim',      color: '#e17055' },
  { value: 3,  emoji: '😐', label: 'Regular',   color: '#fdcb6e' },
  { value: 4,  emoji: '🙂', label: 'Bom',       color: '#fdcb6e' },
  { value: 5,  emoji: '😊', label: 'Ótimo',     color: '#00b894' },
  { value: 6,  emoji: '😄', label: 'Excelente', color: '#00b894' },
  { value: 7,  emoji: '🤩', label: 'Incrível',  color: '#a29bfe' },
]

const EMOTIONS = [
  '😌 Calmo', '💪 Motivado', '🌟 Inspirado', '❤️ Grato',
  '😔 Triste', '😰 Ansioso', '😤 Frustrado', '😴 Cansado',
  '🎯 Focado', '🌊 Em paz', '🔥 Empolgado', '🤔 Pensativo',
]

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function getMoodInfo(value) {
  if (value <= 2) return MOODS[Math.max(0, value - 1)]
  if (value <= 4) return MOODS[Math.min(3, value - 1)]
  return MOODS[Math.min(6, value - 1)]
}

export default function Journal() {
  const navigate  = useNavigate()
  const [entries, setEntries] = useState([])
  const [mode,    setMode]    = useState('list')   // list | add
  const [form,    setForm]    = useState({
    mood: 5, emotions: [], note: '', session: ''
  })

  useEffect(() => {
    setEntries(storage.get('forja_journal', []))
  }, [])

  function save(updated) {
    setEntries(updated)
    storage.set('forja_journal', updated)
  }

  function addEntry() {
    const entry = {
      id:        crypto.randomUUID(),
      date:      new Date().toISOString(),
      mood:      form.mood,
      emotions:  form.emotions,
      note:      form.note,
      session:   form.session,
    }
    save([entry, ...entries])
    setForm({ mood: 5, emotions: [], note: '', session: '' })
    setMode('list')
  }

  function toggleEmotion(e) {
    setForm(f => ({
      ...f,
      emotions: f.emotions.includes(e)
        ? f.emotions.filter(x => x !== e)
        : [...f.emotions, e]
    }))
  }

  // Dados para o gráfico dos últimos 14 dias
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d   = new Date()
    d.setDate(d.getDate() - (13 - i))
    const key = d.toISOString().split('T')[0]
    const entry = entries.find(e => e.date.startsWith(key))
    return { key, day: d.getDate(), mood: entry?.mood ?? null }
  })

  const avgMood = entries.length
    ? (entries.slice(0, 7).reduce((s, e) => s + e.mood, 0) / Math.min(entries.length, 7)).toFixed(1)
    : null

  // === ADD ===
  if (mode === 'add') return (
    <div className="flex flex-col min-h-dvh bg-cosmos px-5 pt-10 pb-28">
      <button onClick={() => setMode('list')} className="text-forja-muted text-sm mb-6 self-start">← Voltar</button>
      <h2 className="text-xl font-medium text-forja-text mb-6">Como está seu estado? 🌡️</h2>

      {/* Seletor de humor */}
      <label className="text-forja-muted text-xs uppercase tracking-widest block mb-3">Humor agora</label>
      <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
        {MOODS.map(m => (
          <button
            key={m.value}
            onClick={() => setForm(f => ({ ...f, mood: m.value }))}
            className={`flex-shrink-0 flex flex-col items-center p-2 rounded-xl border transition-all ${
              form.mood === m.value ? 'border-current' : 'border-white/10'
            }`}
            style={form.mood === m.value
              ? { color: m.color, background: `${m.color}15`, borderColor: `${m.color}66` }
              : {}}
          >
            <span className="text-2xl">{m.emoji}</span>
            <span className="text-[10px] mt-1 text-forja-muted">{m.label}</span>
          </button>
        ))}
      </div>

      {/* Emoções */}
      <label className="text-forja-muted text-xs uppercase tracking-widest block mb-3 mt-6">
        Emoções presentes (selecione várias)
      </label>
      <div className="flex flex-wrap gap-2 mb-6">
        {EMOTIONS.map(e => (
          <button
            key={e}
            onClick={() => toggleEmotion(e)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
              form.emotions.includes(e)
                ? 'bg-forja-primary/20 border-forja-primary/60 text-forja-primary'
                : 'border-white/10 text-forja-muted hover:border-white/20'
            }`}
          >
            {e}
          </button>
        ))}
      </div>

      {/* Sessão realizada */}
      <label className="text-forja-muted text-xs uppercase tracking-widest block mb-2">
        Sessão realizada (opcional)
      </label>
      <div className="flex gap-2 mb-6 flex-wrap">
        {['Binaural', 'Afirmações', 'EMDR', 'Visualização', 'Rotina', 'Nenhuma'].map(s => (
          <button
            key={s}
            onClick={() => setForm(f => ({ ...f, session: s }))}
            className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
              form.session === s
                ? 'bg-forja-secondary/20 border-forja-secondary/60 text-forja-secondary'
                : 'border-white/10 text-forja-muted hover:border-white/20'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Nota livre */}
      <label className="text-forja-muted text-xs uppercase tracking-widest block mb-2">
        Nota livre (opcional)
      </label>
      <textarea
        value={form.note}
        onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
        placeholder="O que surgiu hoje? Insights, sonhos, percepções..."
        rows={3}
        className="w-full bg-forja-surface border border-white/10 rounded-xl px-4 py-3
                   text-forja-text placeholder:text-forja-muted text-sm outline-none
                   focus:border-forja-primary/50 transition-colors resize-none mb-6"
      />

      <button onClick={addEntry} className="btn-primary w-full">
        Salvar registro
      </button>
    </div>
  )

  // === LIST ===
  return (
    <div className="flex flex-col min-h-dvh bg-cosmos px-5 pt-10 pb-28">
      <button onClick={() => navigate('/')} className="text-forja-muted text-sm mb-6 self-start">← Voltar</button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-light text-forja-text">
          📊 <span className="text-[#74b9ff] font-semibold">Diário</span>
        </h1>
        <button onClick={() => setMode('add')} className="btn-ghost text-xs py-2 px-3">+ Registro</button>
      </div>

      {/* Gráfico de humor (14 dias) */}
      {entries.length > 0 && (
        <div className="bg-forja-surface/60 rounded-2xl p-4 border border-white/5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-forja-text text-sm font-medium">Humor — últimos 14 dias</p>
            {avgMood && (
              <span className="text-forja-muted text-xs">
                Média 7d: <span className="text-forja-primary font-medium">{avgMood}/7</span>
              </span>
            )}
          </div>
          <div className="flex items-end gap-1 h-20">
            {last14.map(({ key, day, mood }) => {
              const moodInfo = mood ? getMoodInfo(mood) : null
              const height   = mood ? `${(mood / 7) * 100}%` : '6px'
              return (
                <div key={key} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-sm transition-all duration-500"
                    style={{
                      height,
                      background: moodInfo?.color ?? '#12183a',
                      minHeight: '6px',
                      opacity: mood ? 1 : 0.3,
                    }}
                  />
                  <span className="text-[9px] text-forja-muted">{day}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <span className="text-5xl">📊</span>
          <p className="text-forja-text font-medium">Diário vazio</p>
          <p className="text-forja-muted text-sm max-w-xs">
            Registre seu estado após cada sessão. Em semanas você verá padrões no seu humor.
          </p>
          <button onClick={() => setMode('add')} className="btn-primary mt-2">
            Primeiro registro
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map(entry => {
            const moodInfo = getMoodInfo(entry.mood)
            return (
              <div
                key={entry.id}
                className="bg-forja-surface/60 border border-white/5 rounded-2xl px-4 py-3"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{moodInfo.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium" style={{ color: moodInfo.color }}>
                        {moodInfo.label} ({entry.mood}/7)
                      </span>
                      {entry.session && (
                        <span className="text-[10px] bg-forja-secondary/15 text-forja-secondary px-2 py-0.5 rounded-full">
                          {entry.session}
                        </span>
                      )}
                    </div>
                    <p className="text-forja-muted text-xs">{formatDate(entry.date)}</p>
                  </div>
                </div>
                {entry.emotions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {entry.emotions.map(e => (
                      <span key={e} className="text-[10px] text-forja-muted bg-white/5 px-2 py-0.5 rounded-full">{e}</span>
                    ))}
                  </div>
                )}
                {entry.note && (
                  <p className="text-forja-muted text-xs italic leading-relaxed">"{entry.note}"</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

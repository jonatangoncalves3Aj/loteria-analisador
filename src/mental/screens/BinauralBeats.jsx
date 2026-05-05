import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { startBinaural, stopBinaural, setBinauralVolume, BRAIN_STATES } from '../audio/binauralEngine'
import Timer from '../components/Timer'
import { registerUse } from '../utils/streaks'

const DURATIONS = [
  { label: '10 min', seconds: 600  },
  { label: '20 min', seconds: 1200 },
  { label: '30 min', seconds: 1800 },
]

export default function BinauralBeats() {
  const navigate   = useNavigate()
  const [state,    setState]    = useState('theta')
  const [duration, setDuration] = useState(1200)
  const [volume,   setVolume]   = useState(60)   // 0-100
  const [running,  setRunning]  = useState(false)
  const [done,     setDone]     = useState(false)

  const brainState = BRAIN_STATES[state]

  // Volume dB: 0-100 → -40dB a -5dB
  const toDB = v => -40 + (v / 100) * 35

  useEffect(() => {
    return () => stopBinaural()
  }, [])

  async function handlePlay() {
    if (running) {
      stopBinaural()
      setRunning(false)
    } else {
      await startBinaural(state, toDB(volume))
      setRunning(true)
      setDone(false)
      registerUse()
    }
  }

  function handleVolumeChange(v) {
    setVolume(v)
    if (running) setBinauralVolume(toDB(v))
  }

  function handleEnd() {
    stopBinaural()
    setRunning(false)
    setDone(true)
  }

  return (
    <div className="flex flex-col min-h-dvh bg-cosmos px-5 pt-10 pb-28">
      {/* Header */}
      <button onClick={() => navigate('/')} className="text-forja-muted text-sm mb-6 self-start">
        ← Voltar
      </button>
      <h1 className="text-2xl font-light text-forja-text">
        🎵 Binaural <span className="text-forja-secondary font-semibold">Beats</span>
      </h1>
      <p className="text-forja-muted text-sm mt-1 mb-8">
        Use fones de ouvido para o efeito completo
      </p>

      {/* Seletor de estado cerebral */}
      <div className="mb-8">
        <p className="text-forja-muted text-xs uppercase tracking-widest mb-3">Estado cerebral</p>
        <div className="flex gap-2">
          {Object.entries(BRAIN_STATES).map(([key, s]) => (
            <button
              key={key}
              onClick={() => { setState(key); if(running){ stopBinaural(); setRunning(false) } }}
              className={`flex-1 py-3 px-2 rounded-2xl border transition-all duration-200 text-center ${
                state === key
                  ? 'border-current'
                  : 'border-white/10 text-forja-muted hover:border-white/20'
              }`}
              style={state === key ? { color: s.color, background: `${s.color}15`, borderColor: `${s.color}66` } : {}}
            >
              <div className="text-xl">{s.emoji}</div>
              <div className="text-xs font-medium mt-0.5">{s.label}</div>
              <div className="text-[10px] mt-0.5 opacity-70">{s.hz}Hz</div>
            </button>
          ))}
        </div>
        <p className="text-forja-muted text-xs mt-2 text-center">{brainState.description}</p>
      </div>

      {/* Duração */}
      <div className="mb-8">
        <p className="text-forja-muted text-xs uppercase tracking-widest mb-3">Duração</p>
        <div className="flex gap-2">
          {DURATIONS.map(d => (
            <button
              key={d.seconds}
              onClick={() => setDuration(d.seconds)}
              className={`flex-1 py-2.5 rounded-xl border text-sm transition-all ${
                duration === d.seconds
                  ? 'bg-forja-primary/20 border-forja-primary/60 text-forja-primary'
                  : 'border-white/10 text-forja-muted hover:border-white/20'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Volume */}
      <div className="mb-10">
        <div className="flex justify-between mb-2">
          <p className="text-forja-muted text-xs uppercase tracking-widest">Volume</p>
          <span className="text-forja-muted text-xs">{volume}%</span>
        </div>
        <input
          type="range" min={10} max={100} value={volume}
          onChange={e => handleVolumeChange(Number(e.target.value))}
          className="slider"
          style={{ '--val': `${volume}%` }}
        />
      </div>

      {/* Timer + Play */}
      <div className="flex flex-col items-center gap-6">
        <Timer totalSeconds={duration} running={running} onEnd={handleEnd} />

        <button
          onClick={handlePlay}
          className="w-20 h-20 rounded-full flex items-center justify-center text-3xl
                     transition-all duration-300 active:scale-90 shadow-2xl"
          style={{
            background: running
              ? `${brainState.color}33`
              : `radial-gradient(circle at 35% 35%, ${brainState.color}, ${brainState.color}88)`,
            border: `2px solid ${brainState.color}66`,
            boxShadow: running ? `0 0 40px ${brainState.color}55` : 'none',
          }}
        >
          {running ? '⏸' : '▶'}
        </button>

        {running && (
          <p className="text-forja-muted text-sm animate-pulse">
            Estado: <span style={{ color: brainState.color }}>{brainState.label} ({brainState.hz}Hz)</span>
          </p>
        )}

        {done && (
          <div className="text-center animate-fadeIn">
            <p className="text-2xl">✅</p>
            <p className="text-forja-text font-medium mt-1">Sessão concluída!</p>
            <p className="text-forja-muted text-sm">Sua mente agradece 🧠</p>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-10 bg-forja-surface/60 rounded-2xl p-4 border border-white/5">
        <p className="text-forja-muted text-xs leading-relaxed">
          💡 <strong className="text-forja-text">Como funciona:</strong> Sons levemente diferentes em cada ouvido criam uma
          "batida" percebida apenas pelo cérebro, sincronizando suas ondas cerebrais com o estado desejado.
        </p>
      </div>
    </div>
  )
}

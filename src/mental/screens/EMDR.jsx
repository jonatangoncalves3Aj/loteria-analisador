import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import EMDRDot from '../components/EMDRDot'
import BreathingCircle from '../components/BreathingCircle'
import Timer from '../components/Timer'
import { startEMDRAudio, stopEMDRAudio } from '../audio/emdrAudio'
import { registerUse } from '../utils/streaks'
import { speak, stopSpeaking, getNarratorSettings } from '../utils/narrator'

// Lembretes periódicos durante sessão EMDR
const EMDR_REMINDERS = [
  'Mantenha o foco na crença. Siga o ponto com os olhos.',
  'Deixe os pensamentos fluírem sem julgamento.',
  'Você está seguro. Continue acompanhando o ponto.',
  'Observe qualquer sensação no corpo sem resistência.',
  'Estamos quase lá. Continue presente.',
]

const SPEEDS = [
  { key: 'slow',   label: 'Lento',  ms: 2500 },
  { key: 'medium', label: 'Médio',  ms: 1500 },
  { key: 'fast',   label: 'Rápido', ms: 800  },
]

const DURATION = 20 * 60  // 20 min

export default function EMDR() {
  const navigate  = useNavigate()
  const [belief,  setBelief]  = useState('')
  const [speed,   setSpeed]   = useState('medium')
  const [phase,   setPhase]   = useState('setup')  // setup | breathing | session | done
  const [running, setRunning] = useState(false)
  const [narratorOn, setNarratorOn] = useState(() => getNarratorSettings().enabled)
  const reminderRef = useRef(null)
  const reminderIdx = useRef(0)

  useEffect(() => {
    return () => {
      stopEMDRAudio()
      stopSpeaking()
      clearInterval(reminderRef.current)
    }
  }, [])

  async function startSession() {
    setPhase('breathing')
    if (narratorOn) speak('Antes de começar, vamos preparar sua mente com dois ciclos de respiração.')
    setTimeout(() => beginEMDR(), 38000)
  }

  async function beginEMDR() {
    await startEMDRAudio(SPEEDS.find(s => s.key === speed).ms)
    setPhase('session')
    setRunning(true)
    registerUse()

    if (narratorOn) {
      setTimeout(() => speak(`Foque na crença: ${belief}. Siga o ponto com os olhos.`), 1000)
      // Lembretes periódicos a cada 4 minutos
      reminderRef.current = setInterval(() => {
        if (getNarratorSettings().enabled) {
          speak(EMDR_REMINDERS[reminderIdx.current % EMDR_REMINDERS.length])
          reminderIdx.current++
        }
      }, 240000)
    }
  }

  function endSession() {
    stopEMDRAudio()
    stopSpeaking()
    clearInterval(reminderRef.current)
    setRunning(false)
    setPhase('done')
    if (narratorOn) setTimeout(() => speak('Sessão concluída. Respire fundo e retorne ao presente.'), 500)
  }

  // === SETUP ===
  if (phase === 'setup') return (
    <div className="flex flex-col min-h-dvh bg-cosmos px-5 pt-10 pb-28">
      <button onClick={() => navigate('/')} className="text-forja-muted text-sm mb-6 self-start">← Voltar</button>

      <h1 className="text-2xl font-light text-forja-text">
        👁 <span className="text-forja-accent font-semibold">EMDR</span>
      </h1>
      <p className="text-forja-muted text-sm mt-1 mb-8">
        Estimulação bilateral para reprocessar crenças limitantes
      </p>

      <div className="bg-forja-surface/60 rounded-2xl p-4 border border-white/5 mb-6">
        <p className="text-forja-text text-sm leading-relaxed">
          💡 Escreva a crença que quer transformar. Durante a sessão, foque nela enquanto
          acompanha o ponto com os olhos.
        </p>
      </div>

      <div className="mb-6">
        <label className="text-forja-muted text-xs uppercase tracking-widest block mb-2">
          Crença a transformar
        </label>
        <textarea
          value={belief}
          onChange={e => setBelief(e.target.value)}
          placeholder='Ex: "Não sou bom o suficiente" / "Não mereço sucesso"'
          rows={3}
          className="w-full bg-forja-surface border border-white/10 rounded-xl px-4 py-3
                     text-forja-text placeholder:text-forja-muted text-sm outline-none
                     focus:border-forja-accent/50 transition-colors resize-none"
        />
      </div>

      <div className="mb-8">
        <p className="text-forja-muted text-xs uppercase tracking-widest mb-3">Velocidade do ponto</p>
        <div className="flex gap-2">
          {SPEEDS.map(s => (
            <button
              key={s.key}
              onClick={() => setSpeed(s.key)}
              className={`flex-1 py-2.5 rounded-xl border text-sm transition-all ${
                speed === s.key
                  ? 'bg-forja-accent/20 border-forja-accent/60 text-forja-accent'
                  : 'border-white/10 text-forja-muted hover:border-white/20'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={startSession}
        disabled={!belief.trim()}
        className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: belief.trim() ? '#fd79a8' : undefined, color: belief.trim() ? '#0a0e27' : undefined }}
      >
        Iniciar sessão (20 min)
      </button>
    </div>
  )

  // === RESPIRAÇÃO PREPARATÓRIA ===
  if (phase === 'breathing') return (
    <div className="flex flex-col min-h-dvh bg-cosmos items-center justify-center px-5 pb-28">
      <h2 className="text-xl font-light text-forja-text mb-2">Preparando a mente</h2>
      <p className="text-forja-muted text-sm mb-10 text-center">
        2 ciclos de respiração 4-7-8 para entrar em estado relaxado
      </p>
      <BreathingCircle running={true} />
      <p className="text-forja-muted text-sm mt-8 animate-pulse">
        A sessão EMDR começará automaticamente...
      </p>
    </div>
  )

  // === SESSÃO EMDR ===
  if (phase === 'session') return (
    <div className="flex flex-col min-h-dvh bg-cosmos items-center justify-center px-5 pb-28 gap-8">
      <div className="text-center">
        <p className="text-forja-muted text-xs uppercase tracking-widest mb-2">Foco</p>
        <p className="text-forja-text font-medium italic text-lg">"{belief}"</p>
      </div>

      <Timer totalSeconds={DURATION} running={running} onEnd={endSession} />

      <div className="w-full max-w-xs">
        <EMDRDot running={running} speed={speed} />
        <p className="text-forja-muted text-xs text-center mt-3">
          Siga o ponto com os olhos · Mantenha a crença em mente
        </p>
      </div>

      <button
        onClick={endSession}
        className="btn-ghost text-sm"
      >
        Encerrar sessão
      </button>
    </div>
  )

  // === CONCLUÍDO ===
  return (
    <div className="flex flex-col min-h-dvh bg-cosmos items-center justify-center px-5 pb-28 gap-6">
      <div className="text-6xl">✨</div>
      <h2 className="text-xl font-medium text-forja-text">Sessão concluída!</h2>
      <p className="text-forja-muted text-sm text-center max-w-xs">
        Seu cérebro processou a crença durante o estado REM simulado.
        Repita por 21 dias para resultados duradouros.
      </p>
      <div className="bg-forja-surface/60 rounded-2xl p-4 border border-white/5 w-full max-w-xs">
        <p className="text-forja-muted text-xs mb-1">Crença trabalhada</p>
        <p className="text-forja-text italic text-sm">"{belief}"</p>
      </div>
      <button onClick={() => { setBelief(''); setPhase('setup') }} className="btn-primary">
        Nova sessão
      </button>
      <button onClick={() => navigate('/')} className="text-forja-muted text-sm">
        Voltar ao início
      </button>
    </div>
  )
}

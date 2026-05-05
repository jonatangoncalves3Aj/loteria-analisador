import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import BreathingCircle from '../components/BreathingCircle'
import EMDRDot from '../components/EMDRDot'
import { startBinaural, stopBinaural, BRAIN_STATES } from '../audio/binauralEngine'
import { startEMDRAudio, stopEMDRAudio } from '../audio/emdrAudio'
import { storage } from '../utils/storage'
import { registerUse } from '../utils/streaks'

const AVAILABLE_STEPS = [
  { id: 'breathing',   label: 'Respiração 4-7-8', emoji: '🌬️', color: '#48b8a6', durationMin: 2,  durationMax: 10 },
  { id: 'binaural',    label: 'Binaural Beats',   emoji: '🎵', color: '#74b9ff', durationMin: 5,  durationMax: 30 },
  { id: 'affirmations',label: 'Afirmações',        emoji: '🃏', color: '#a29bfe', durationMin: 2,  durationMax: 10 },
  { id: 'emdr',        label: 'EMDR',              emoji: '👁',  color: '#fd79a8', durationMin: 5,  durationMax: 20 },
  { id: 'gratitude',   label: 'Gratidão',          emoji: '❤️', color: '#e17055', durationMin: 2,  durationMax: 5  },
]

const PRESETS = [
  {
    label:   'Manhã Poderosa ☀️',
    steps:   [
      { id: 'breathing',    duration: 3  },
      { id: 'binaural',     duration: 10, state: 'alpha' },
      { id: 'affirmations', duration: 5  },
      { id: 'gratitude',    duration: 3  },
    ],
  },
  {
    label:   'Noite de Reprogramação 🌙',
    steps:   [
      { id: 'breathing',    duration: 5  },
      { id: 'binaural',     duration: 15, state: 'theta' },
      { id: 'emdr',         duration: 10 },
      { id: 'binaural',     duration: 10, state: 'delta' },
    ],
  },
  {
    label:   'Foco Profundo 🎯',
    steps:   [
      { id: 'breathing',    duration: 2  },
      { id: 'binaural',     duration: 20, state: 'alpha' },
      { id: 'affirmations', duration: 3  },
    ],
  },
  {
    label:   'Autoconfiança Total 💪',
    steps:   [
      { id: 'breathing',    duration: 3  },
      { id: 'binaural',     duration: 10, state: 'alpha' },
      { id: 'affirmations', duration: 5  },
      { id: 'gratitude',    duration: 5  },
    ],
  },
  {
    label:   'Prosperidade Abundante 💰',
    steps:   [
      { id: 'breathing',    duration: 2  },
      { id: 'binaural',     duration: 15, state: 'theta' },
      { id: 'affirmations', duration: 5  },
      { id: 'gratitude',    duration: 3  },
    ],
  },
  {
    label:   'Magnetismo & Sedução 🔥',
    steps:   [
      { id: 'breathing',    duration: 3  },
      { id: 'binaural',     duration: 12, state: 'alpha' },
      { id: 'affirmations', duration: 7  },
      { id: 'gratitude',    duration: 3  },
    ],
  },
]

const GRATITUDE_PROMPTS = [
  'Nomeie 3 coisas pelas quais você é grato hoje.',
  'Quem na sua vida merece um agradecimento silencioso agora?',
  'Que capacidade sua você não reconhece o suficiente?',
  'Qual pequena coisa hoje te trouxe um sorriso?',
  'O que seu corpo fez por você hoje que você pode agradecer?',
]

export default function Routine() {
  const navigate  = useNavigate()
  const [mode,    setMode]    = useState('select')
  const [routine, setRoutine] = useState(null)
  const [stepIdx, setStepIdx] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [breathRunning, setBreathRunning] = useState(false)
  const [emdrRunning,   setEmdrRunning]   = useState(false)
  const timerRef  = useRef(null)
  const audioOnRef = useRef(false)

  const currentStep = routine ? routine[stepIdx] : null
  const stepDef     = currentStep ? AVAILABLE_STEPS.find(s => s.id === currentStep.id) : null
  const totalSecs   = currentStep ? currentStep.duration * 60 : 0
  const gratitudePrompt = GRATITUDE_PROMPTS[stepIdx % GRATITUDE_PROMPTS.length]

  useEffect(() => {
    return () => {
      stopBinaural()
      stopEMDRAudio()
      clearInterval(timerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!running) return
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        if (prev + 1 >= totalSecs) {
          clearInterval(timerRef.current)
          advanceStep()
          return 0
        }
        return prev + 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [running, stepIdx, totalSecs])

  useEffect(() => {
    if (!running || !currentStep) return
    startStepAudio(currentStep)
  }, [stepIdx, running])

  async function startStepAudio(step) {
    stopBinaural()
    stopEMDRAudio()
    setBreathRunning(false)
    setEmdrRunning(false)
    audioOnRef.current = false

    if (step.id === 'breathing') {
      setBreathRunning(true)
    } else if (step.id === 'binaural') {
      await startBinaural(step.state ?? 'alpha', -22)
      audioOnRef.current = true
    } else if (step.id === 'emdr') {
      await startEMDRAudio(1500)
      setEmdrRunning(true)
      audioOnRef.current = true
    }
  }

  async function beginRoutine(steps) {
    setRoutine(steps)
    setStepIdx(0)
    setElapsed(0)
    setRunning(true)
    setMode('running')
    registerUse()
    await startStepAudio(steps[0])
  }

  async function advanceStep() {
    stopBinaural()
    stopEMDRAudio()
    setBreathRunning(false)
    setEmdrRunning(false)
    setElapsed(0)

    if (stepIdx + 1 >= routine.length) {
      setRunning(false)
      setMode('done')
      return
    }
    const next = stepIdx + 1
    setStepIdx(next)
    await startStepAudio(routine[next])
  }

  function skipStep() { advanceStep() }

  // === SELECT ===
  if (mode === 'select') return (
    <div className="flex flex-col min-h-dvh bg-cosmos px-5 pt-10 pb-28">
      <button onClick={() => navigate('/')} className="text-forja-muted text-sm mb-6 self-start">← Voltar</button>
      <h1 className="text-2xl font-light text-forja-text mb-1">
        🔄 <span className="text-[#55efc4] font-semibold">Rotina Diária</span>
      </h1>
      <p className="text-forja-muted text-sm mb-6">
        Sequência automática de técnicas — execute de uma vez
      </p>

      <p className="text-forja-muted text-xs uppercase tracking-widest mb-3">Rotinas base</p>
      <div className="flex flex-col gap-3 mb-6">
        {PRESETS.slice(0, 3).map((preset, i) => {
          const totalMin = preset.steps.reduce((s, p) => s + p.duration, 0)
          return (
            <button
              key={i}
              onClick={() => beginRoutine(preset.steps)}
              className="bg-forja-surface/60 border border-white/5 rounded-2xl px-4 py-4 text-left
                         hover:border-white/15 transition-all active:scale-98"
            >
              <p className="text-forja-text font-medium">{preset.label}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-forja-muted text-xs">⏱ {totalMin} min</span>
                <span className="text-forja-muted text-xs">·</span>
                <div className="flex gap-1">
                  {preset.steps.map((s, j) => {
                    const def = AVAILABLE_STEPS.find(a => a.id === s.id)
                    return <span key={j} className="text-sm">{def?.emoji}</span>
                  })}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <p className="text-forja-muted text-xs uppercase tracking-widest mb-3">Programas Especiais</p>
      <div className="flex flex-col gap-3 mb-8">
        {PRESETS.slice(3).map((preset, i) => {
          const totalMin = preset.steps.reduce((s, p) => s + p.duration, 0)
          const colors   = ['#74b9ff', '#55efc4', '#fd79a8']
          const color    = colors[i % colors.length]
          return (
            <button
              key={i}
              onClick={() => beginRoutine(preset.steps)}
              className="rounded-2xl px-4 py-4 text-left transition-all active:scale-98"
              style={{
                background: `${color}11`,
                border: `1px solid ${color}33`,
              }}
            >
              <p className="text-forja-text font-medium">{preset.label}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-forja-muted text-xs">⏱ {totalMin} min</span>
                <span className="text-forja-muted text-xs">·</span>
                <div className="flex gap-1">
                  {preset.steps.map((s, j) => {
                    const def = AVAILABLE_STEPS.find(a => a.id === s.id)
                    return <span key={j} className="text-sm">{def?.emoji}</span>
                  })}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <button
        onClick={() => setMode('build')}
        className="btn-ghost w-full"
      >
        🛠 Montar minha própria rotina
      </button>
    </div>
  )

  // === BUILD ===
  if (mode === 'build') {
    const [custom, setCustom] = useState([])

    function addStep(stepId) {
      const def = AVAILABLE_STEPS.find(s => s.id === stepId)
      setCustom(c => [...c, { id: stepId, duration: def.durationMin, state: 'alpha' }])
    }

    function removeStep(i) { setCustom(c => c.filter((_, idx) => idx !== i)) }

    function setDuration(i, dur) {
      setCustom(c => c.map((s, idx) => idx === i ? { ...s, duration: dur } : s))
    }

    const totalMin = custom.reduce((s, p) => s + p.duration, 0)

    return (
      <div className="flex flex-col min-h-dvh bg-cosmos px-5 pt-10 pb-28">
        <button onClick={() => setMode('select')} className="text-forja-muted text-sm mb-6 self-start">← Voltar</button>
        <h2 className="text-xl font-medium text-forja-text mb-6">Montar Rotina</h2>

        <p className="text-forja-muted text-xs uppercase tracking-widest mb-3">Adicionar passos</p>
        <div className="flex gap-2 flex-wrap mb-6">
          {AVAILABLE_STEPS.map(s => (
            <button
              key={s.id}
              onClick={() => addStep(s.id)}
              className="px-3 py-2 rounded-xl border border-white/10 text-sm flex items-center gap-1.5
                         text-forja-muted hover:border-white/20 active:scale-95 transition-all"
            >
              {s.emoji} {s.label}
            </button>
          ))}
        </div>

        {custom.length > 0 ? (
          <>
            <p className="text-forja-muted text-xs uppercase tracking-widest mb-3">
              Sequência · {totalMin} min total
            </p>
            <div className="flex flex-col gap-2 mb-6">
              {custom.map((step, i) => {
                const def = AVAILABLE_STEPS.find(s => s.id === step.id)
                return (
                  <div key={i} className="bg-forja-surface/60 border border-white/5 rounded-xl px-3 py-3 flex items-center gap-3">
                    <span className="text-lg">{def.emoji}</span>
                    <span className="text-forja-text text-sm flex-1">{def.label}</span>
                    <select
                      value={step.duration}
                      onChange={e => setDuration(i, Number(e.target.value))}
                      className="bg-forja-bg border border-white/10 rounded-lg px-2 py-1 text-xs text-forja-text"
                    >
                      {Array.from({ length: def.durationMax - def.durationMin + 1 }, (_, k) => def.durationMin + k).map(d => (
                        <option key={d} value={d}>{d}min</option>
                      ))}
                    </select>
                    <button onClick={() => removeStep(i)} className="text-forja-muted/50 hover:text-red-400 text-lg">×</button>
                  </div>
                )
              })}
            </div>
            <button
              onClick={() => beginRoutine(custom)}
              className="btn-primary w-full"
            >
              Iniciar rotina ({totalMin} min)
            </button>
          </>
        ) : (
          <p className="text-forja-muted text-sm text-center mt-8">
            Adicione passos acima para montar sua sequência
          </p>
        )}
      </div>
    )
  }

  // === RUNNING ===
  if (mode === 'running' && stepDef) {
    const progress   = totalSecs ? elapsed / totalSecs : 0
    const remaining  = totalSecs - elapsed
    const mins = Math.floor(remaining / 60).toString().padStart(2, '0')
    const secs = (remaining % 60).toString().padStart(2, '0')

    return (
      <div className="flex flex-col min-h-dvh items-center justify-center bg-cosmos px-5 pb-28 gap-6">
        <div className="flex gap-1.5 absolute top-10">
          {routine.map((_, i) => (
            <div key={i} className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: i === stepIdx ? 28 : 10,
                background: i < stepIdx ? '#55efc4' : i === stepIdx ? stepDef.color : '#12183a',
              }}
            />
          ))}
        </div>

        <div className="text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3"
            style={{ background: `${stepDef.color}22`, border: `1px solid ${stepDef.color}44` }}
          >
            {stepDef.emoji}
          </div>
          <p className="text-forja-muted text-xs uppercase tracking-widest">
            Passo {stepIdx + 1} de {routine.length}
          </p>
          <h2 className="text-xl font-medium text-forja-text mt-1">{stepDef.label}</h2>
        </div>

        {currentStep.id === 'breathing' && <BreathingCircle running={breathRunning} />}
        {currentStep.id === 'emdr' && <EMDRDot running={emdrRunning} speed="medium" />}
        {currentStep.id === 'gratitude' && (
          <div className="bg-forja-surface/60 rounded-2xl p-5 border border-white/5 max-w-xs text-center">
            <p className="text-forja-text text-lg font-light leading-relaxed">{gratitudePrompt}</p>
          </div>
        )}
        {currentStep.id === 'binaural' && (
          <div className="text-center">
            <p className="text-forja-muted text-sm">Estado: <span style={{ color: stepDef.color }}>
              {BRAIN_STATES[currentStep.state ?? 'alpha']?.label}
            </span></p>
            <p className="text-forja-muted text-xs mt-1 animate-pulse">🎧 Binaural ativo</p>
          </div>
        )}
        {currentStep.id === 'affirmations' && (
          <div className="bg-forja-surface/60 rounded-2xl p-5 border border-forja-primary/20 max-w-xs text-center">
            <p className="text-forja-text font-light leading-relaxed">
              {storage.get('forja_affirmations', []).length > 0
                ? storage.get('forja_affirmations', [])[stepIdx % storage.get('forja_affirmations', []).length]?.text
                : 'Abra o módulo de Afirmações e carregue um programa para que as afirmações apareçam aqui.'}
            </p>
          </div>
        )}

        <div className="text-center">
          <p className="text-4xl font-light text-forja-text tabular-nums">{mins}:{secs}</p>
          <div className="w-48 h-1.5 bg-forja-surface rounded-full mt-3 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${progress * 100}%`, background: stepDef.color }}
            />
          </div>
        </div>

        <button onClick={skipStep} className="text-forja-muted text-sm">
          Pular passo →
        </button>
      </div>
    )
  }

  // === DONE ===
  return (
    <div className="flex flex-col min-h-dvh bg-cosmos items-center justify-center px-5 pb-28 gap-6">
      <div className="text-6xl">🏆</div>
      <h2 className="text-xl font-medium text-forja-text">Rotina Completa!</h2>
      <p className="text-forja-muted text-sm text-center max-w-xs">
        Você completou {routine?.length} técnicas. Sua mente está sendo forjada dia a dia.
      </p>
      <button onClick={() => { setMode('select'); setStepIdx(0); setElapsed(0) }} className="btn-primary">
        Nova rotina
      </button>
      <button onClick={() => navigate('/')} className="text-forja-muted text-sm">
        Voltar ao início
      </button>
    </div>
  )
}

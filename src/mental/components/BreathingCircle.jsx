import { useState, useEffect, useRef } from 'react'
import { speak, stopSpeaking, getNarratorSettings } from '../utils/narrator'

// Padrão 4-7-8: inspira 4s, segura 7s, expira 8s
const PHASES = [
  { label: 'Inspire',  spoken: 'Inspire',            duration: 4, scale: 1.55, color: '#48b8a6' },
  { label: 'Segure',   spoken: 'Segure',              duration: 7, scale: 1.55, color: '#a29bfe' },
  { label: 'Expire',   spoken: 'Expire lentamente',   duration: 8, scale: 1.00, color: '#fd79a8' },
]

export default function BreathingCircle({ running = false, onCycle, narratorEnabled }) {
  // narratorEnabled: se undefined, usa configuração global
  const useNarrator = narratorEnabled !== undefined ? narratorEnabled : getNarratorSettings().enabled
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [scale, setScale]       = useState(1)
  const [progress, setProgress] = useState(0)  // 0-1 dentro da fase
  const timerRef = useRef(null)
  const startRef = useRef(null)

  const phase = PHASES[phaseIdx]

  // Fala o nome da fase quando muda
  useEffect(() => {
    if (!running || !useNarrator) return
    speak(PHASES[phaseIdx].spoken, { rate: 0.75, pitch: 0.85 })
  }, [phaseIdx, running])

  useEffect(() => {
    if (!running) {
      clearInterval(timerRef.current)
      stopSpeaking()
      setPhaseIdx(0)
      setScale(1)
      setProgress(0)
      return
    }

    const advance = () => {
      startRef.current = Date.now()
      const duration = PHASES[phaseIdx].duration * 1000
      const targetScale = PHASES[phaseIdx].scale

      clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startRef.current
        const p = Math.min(elapsed / duration, 1)
        setProgress(p)

        // Interpolação de escala
        const prevScale = phaseIdx === 0 ? 1 : PHASES[phaseIdx - 1]?.scale ?? 1
        const s = prevScale + (targetScale - prevScale) * easeInOut(p)
        setScale(s)

        if (p >= 1) {
          clearInterval(timerRef.current)
          setPhaseIdx(prev => {
            const next = (prev + 1) % PHASES.length
            if (next === 0 && onCycle) onCycle()
            return next
          })
        }
      }, 50)
    }

    advance()
    return () => clearInterval(timerRef.current)
  }, [running, phaseIdx])

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Círculo principal */}
      <div className="relative flex items-center justify-center w-64 h-64">
        {/* Anel pulsante externo */}
        <div
          className="absolute rounded-full opacity-20 transition-all"
          style={{
            width: '100%', height: '100%',
            background: `radial-gradient(circle, ${phase.color}44, transparent)`,
            transform: `scale(${scale * 1.15})`,
            transition: `transform ${phase.duration * 0.95}s cubic-bezier(0.4,0,0.2,1)`,
          }}
        />
        {/* Círculo principal */}
        <div
          className="rounded-full flex items-center justify-center text-center shadow-2xl"
          style={{
            width: 180, height: 180,
            background: `radial-gradient(circle at 35% 35%, ${phase.color}cc, ${phase.color}66)`,
            transform: `scale(${scale})`,
            transition: `transform ${phase.duration * 0.95}s cubic-bezier(0.4,0,0.2,1),
                         background 0.5s ease`,
            boxShadow: `0 0 40px ${phase.color}55, 0 0 80px ${phase.color}22`,
          }}
        >
          <div>
            <div className="text-2xl font-light text-white">{phase.label}</div>
            <div className="text-forja-bg/80 text-sm font-medium mt-1">
              {Math.ceil(phase.duration * (1 - progress))}s
            </div>
          </div>
        </div>
      </div>

      {/* Indicador de fase */}
      <div className="flex gap-2">
        {PHASES.map((p, i) => (
          <div
            key={i}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === phaseIdx ? 32 : 12,
              background: i === phaseIdx ? phase.color : '#636e72',
            }}
          />
        ))}
      </div>

      {/* Legenda dos ciclos */}
      <div className="text-center text-forja-muted text-sm">
        {PHASES.map((p, i) => (
          <span key={i} style={{ color: i === phaseIdx ? p.color : undefined }}>
            {p.label} {p.duration}s{i < PHASES.length - 1 ? ' · ' : ''}
          </span>
        ))}
      </div>
    </div>
  )
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

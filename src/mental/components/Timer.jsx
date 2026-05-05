import { useState, useEffect, useRef } from 'react'

export default function Timer({ totalSeconds, running, onEnd }) {
  const [remaining, setRemaining] = useState(totalSeconds)
  const intervalRef = useRef(null)

  useEffect(() => {
    setRemaining(totalSeconds)
  }, [totalSeconds])

  useEffect(() => {
    if (!running) {
      clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          onEnd?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(intervalRef.current)
  }, [running])

  const mins = Math.floor(remaining / 60).toString().padStart(2, '0')
  const secs = (remaining % 60).toString().padStart(2, '0')
  const progress = 1 - remaining / totalSeconds

  const r = 44
  const circ = 2 * Math.PI * r

  return (
    <div className="relative flex items-center justify-center w-32 h-32">
      <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
        {/* Trilha */}
        <circle cx="50" cy="50" r={r} fill="none" stroke="#12183a" strokeWidth="6" />
        {/* Progresso */}
        <circle
          cx="50" cy="50" r={r}
          fill="none"
          stroke="#a29bfe"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - progress)}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <span className="text-2xl font-light text-forja-text tabular-nums">
        {mins}:{secs}
      </span>
    </div>
  )
}

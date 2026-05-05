import { useEffect, useRef } from 'react'

const SPEED_MAP = { slow: 2500, medium: 1500, fast: 800 }

export default function EMDRDot({ running = false, speed = 'medium' }) {
  const dotRef    = useRef(null)
  const animRef   = useRef(null)
  const posRef    = useRef(-140)  // posição atual em px
  const dirRef    = useRef(1)     // 1 = direita, -1 = esquerda
  const lastRef   = useRef(null)
  const durationMs = SPEED_MAP[speed] ?? 1500

  useEffect(() => {
    if (!running) {
      cancelAnimationFrame(animRef.current)
      posRef.current = -140
      dirRef.current = 1
      if (dotRef.current) dotRef.current.style.transform = 'translateX(-140px)'
      return
    }

    lastRef.current = performance.now()

    const animate = (now) => {
      const dt     = now - lastRef.current
      lastRef.current = now

      // Velocidade em px/ms: percorre 280px em durationMs ms
      const speed  = (280 / durationMs) * dt * dirRef.current
      posRef.current += speed

      // Chega na borda → inverte direção
      if (posRef.current >= 140) {
        posRef.current = 140
        dirRef.current = -1
      } else if (posRef.current <= -140) {
        posRef.current = -140
        dirRef.current = 1
      }

      if (dotRef.current) {
        dotRef.current.style.transform = `translateX(${posRef.current}px)`
      }

      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [running, durationMs])

  return (
    <div className="relative flex items-center justify-center w-full h-24">
      {/* Trilha */}
      <div className="absolute w-72 h-0.5 rounded-full bg-white/10" />

      {/* Marcadores de borda */}
      <div className="absolute left-[calc(50%-140px)] w-2 h-2 rounded-full bg-white/20" />
      <div className="absolute right-[calc(50%-140px)] w-2 h-2 rounded-full bg-white/20" />

      {/* Ponto EMDR */}
      <div
        ref={dotRef}
        className="emdr-dot absolute w-7 h-7 rounded-full"
        style={{
          background:  'radial-gradient(circle at 35% 35%, #c8c0ff, #6c5ce7)',
          transform:   'translateX(-140px)',
          willChange:  'transform',
        }}
      />
    </div>
  )
}

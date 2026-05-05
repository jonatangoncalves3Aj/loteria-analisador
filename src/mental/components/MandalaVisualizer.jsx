// Mandala SVG animada — fundo para módulo de visualização
export default function MandalaVisualizer({ color = '#a29bfe', opacity = 0.12 }) {
  const rings = [
    { r: 60,  petals: 6,  dur: '18s', dir: 'normal'  },
    { r: 100, petals: 8,  dur: '24s', dir: 'reverse' },
    { r: 140, petals: 12, dur: '32s', dir: 'normal'  },
    { r: 180, petals: 16, dur: '44s', dir: 'reverse' },
  ]

  return (
    <svg
      viewBox="-200 -200 400 400"
      className="w-full h-full"
      style={{ opacity }}
    >
      {rings.map((ring, ri) => (
        <g key={ri} style={{ animation: `spin ${ring.dur} linear infinite ${ring.dir}`, transformOrigin: 'center' }}>
          {Array.from({ length: ring.petals }).map((_, pi) => {
            const angle = (360 / ring.petals) * pi
            return (
              <ellipse
                key={pi}
                cx={0}
                cy={-ring.r / 2}
                rx={ring.r * 0.12}
                ry={ring.r * 0.45}
                fill={color}
                opacity={0.6}
                transform={`rotate(${angle})`}
              />
            )
          })}
        </g>
      ))}

      {/* Círculo central */}
      <circle cx={0} cy={0} r={18} fill={color} opacity={0.5} />
      <circle cx={0} cy={0} r={8}  fill="white"  opacity={0.4} />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg);   }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </svg>
  )
}

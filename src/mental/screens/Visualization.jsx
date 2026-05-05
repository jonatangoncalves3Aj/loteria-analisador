import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import BreathingCircle from '../components/BreathingCircle'
import MandalaVisualizer from '../components/MandalaVisualizer'
import { startBinaural, stopBinaural } from '../audio/binauralEngine'
import { registerUse } from '../utils/streaks'
import { speak, stopSpeaking, getNarratorSettings } from '../utils/narrator'

const THEMES = [
  {
    key:   'confidence',
    label: 'Confiança',
    emoji: '⚡',
    color: '#ffd32a',
    script: [
      'Feche os olhos. Respire fundo.',
      'Imagine uma luz dourada no centro do seu peito.',
      'A cada respiração, essa luz cresce.',
      'Você começa a sentir uma calma profunda.',
      'Visualize-se em um momento de total confiança.',
      'Você está presente, seguro, poderoso.',
      'Seu corpo sabe o que fazer. Sua mente está clara.',
      'Cada célula do seu corpo vibra com confiança.',
      'Você é capaz. Você é suficiente.',
      'Carregue essa sensação com você ao abrir os olhos.',
    ],
  },
  {
    key:   'focus',
    label: 'Foco',
    emoji: '🎯',
    color: '#74b9ff',
    script: [
      'Sente-se confortavelmente. Coluna ereta, corpo relaxado.',
      'Imagine um feixe de luz azul entrando pelo topo da cabeça.',
      'Essa luz ilumina seu córtex pré-frontal — o centro do foco.',
      'Seus pensamentos se organizam como estrelas em constelações.',
      'Você tem clareza absoluta sobre o que importa agora.',
      'Distrações perdem o poder. Sua atenção é um laser.',
      'Você entra em estado de flow com facilidade cada vez maior.',
      'Cada tarefa que você toca flui com precisão e eficiência.',
      'Seu cérebro foi projetado para esse nível de foco.',
      'Carregue essa nitidez ao abrir os olhos.',
    ],
  },
  {
    key:   'sleep',
    label: 'Sono Profundo',
    emoji: '🌙',
    color: '#6c5ce7',
    script: [
      'Deite-se. Permita que seu corpo afunde na superfície.',
      'Seus pés ficam pesados, relaxados, quentes.',
      'Esse relaxamento sobe pelas pernas... abdômen... peito.',
      'Seus ombros caem. Seu pescoço se solta completamente.',
      'Sua mente começa a flutuar como uma nuvem suave.',
      'Você está seguro. Protegido. Em paz total.',
      'Cada expiração te leva mais fundo no descanso.',
      'Seu subconsciente já sabe o que processar durante a noite.',
      'Amanhã você vai acordar restaurado, renovado, vivo.',
      'Deixe-se ir... você merece esse descanso.',
    ],
  },
  {
    key:   'anxiety',
    label: 'Calmar Ansiedade',
    emoji: '🌊',
    color: '#00cec9',
    script: [
      'Você está seguro exatamente onde está.',
      'Aqui. Agora. Neste momento, está tudo bem.',
      'Imagine um oceano calmo à sua frente.',
      'As ondas chegam suavemente... e recuam... sempre recuam.',
      'Cada onda que vai leva um pouco da tensão com ela.',
      'Seu sistema nervoso está se regulando agora.',
      'Você não precisa resolver tudo agora. Só estar aqui.',
      'A ansiedade é uma onda — ela sempre passa.',
      'Você é maior do que qualquer sentimento que passa.',
      'Você pode enfrentar o que vier. Um passo de cada vez.',
    ],
  },
  {
    key:   'abundance',
    label: 'Abundância',
    emoji: '🌟',
    color: '#a29bfe',
    script: [
      'Solte toda tensão do corpo.',
      'Você está em total harmonia com o universo.',
      'Visualize fluxos de luz chegando até você.',
      'Oportunidades existem em abundância ao seu redor.',
      'Você merece prosperidade em todas as formas.',
      'O universo conspira ao seu favor.',
      'Deixe a gratidão invadir seu coração.',
      'Você é um ímã para boas coisas.',
      'Abundância é seu estado natural.',
      'Abra-se para receber tudo que é seu por direito.',
    ],
  },
  {
    key:   'healing',
    label: 'Cura',
    emoji: '💚',
    color: '#48b8a6',
    script: [
      'Permita-se descansar completamente.',
      'Uma onda de cura percorre todo o seu corpo.',
      'Cada célula está se regenerando agora.',
      'Você tem uma capacidade infinita de cura.',
      'Qualquer tensão se dissolve com cada expiração.',
      'Seu corpo e mente trabalham em perfeita harmonia.',
      'Você está inteiro. Você está bem.',
      'Cada respiração nutre cada parte de você.',
      'Sinta-se renovado e restaurado.',
      'Você emerge dessa sessão mais saudável e inteiro.',
    ],
  },
  {
    key:   'selflove',
    label: 'Amor-próprio',
    emoji: '💗',
    color: '#fd79a8',
    script: [
      'Coloque uma mão sobre o coração.',
      'Sinta o calor da sua própria presença.',
      'Você é digno de amor — exatamente como é.',
      'Seus imperfeições fazem parte da sua beleza.',
      'Você se perdoa por tudo que precisa ser perdoado.',
      'Você escolhe tratar a si mesmo com gentileza.',
      'Você merece a mesma compaixão que dá aos outros.',
      'Você é seu próprio lar — e que lar amoroso.',
      'Amor-próprio não é egoísmo. É a base de tudo.',
      'Você vai bem. Você está bem. Você é suficiente.',
    ],
  },
  {
    key:   'forgiveness',
    label: 'Perdão',
    emoji: '🕊️',
    color: '#dfe6e9',
    script: [
      'Traga à mente algo que ainda pesa em você.',
      'Observe o peso disso no seu peito.',
      'Você carregou isso por tempo suficiente.',
      'Perdoar não é dizer que estava certo.',
      'Perdoar é soltar o peso que só você carrega.',
      'Imagine esse peso se dissolvendo como névoa ao sol.',
      'Você merece a leveza que vem do perdão.',
      'Escolha a paz sobre a razão.',
      'Você é livre agora para seguir em frente.',
      'Respire. Você se liberou.',
    ],
  },
  {
    key:   'strength',
    label: 'Força Interior',
    emoji: '🏔️',
    color: '#a29bfe',
    script: [
      'Pense em uma vez que você superou algo difícil.',
      'Você sobreviveu a 100% dos seus dias mais difíceis.',
      'Dentro de você existe uma reserva inesgotável de força.',
      'Essa força não depende das circunstâncias.',
      'Ela está lá mesmo quando você não sente.',
      'Imagine-se como uma montanha — os ventos passam, você fica.',
      'Você foi forjado por desafios. Cada um te tornou mais resistente.',
      'Você não quebra. Você dobra e volta.',
      'Essa resiliência é seu superpoder.',
      'Carregue essa certeza: você é mais forte do que parece.',
    ],
  },
]

const SCRIPT_INTERVAL = 18000  // 18s por frase

export default function Visualization() {
  const navigate    = useNavigate()
  const [theme,     setTheme]     = useState(null)
  const [phase,     setPhase]     = useState('select')  // select | breathing | session | done
  const [lineIdx,   setLineIdx]   = useState(0)
  const [breathCycles, setBreathCycles] = useState(0)
  const [narratorOn, setNarratorOn] = useState(() => getNarratorSettings().enabled)
  const scriptRef   = useRef(null)
  const themeRef    = useRef(null)   // ref para acessar theme dentro do interval

  useEffect(() => {
    return () => {
      clearInterval(scriptRef.current)
      stopBinaural()
      stopSpeaking()
    }
  }, [])

  // Fala a frase atual sempre que lineIdx muda (durante sessão)
  useEffect(() => {
    if (phase !== 'session' || !themeRef.current) return
    const line = themeRef.current.script[lineIdx]
    if (line && narratorOn) speak(line)
  }, [lineIdx, phase])

  function selectTheme(t) {
    themeRef.current = t
    setTheme(t)
    setPhase('breathing')
    // Fala instrução de respiração
    if (narratorOn) speak('Vamos preparar sua mente. Siga os ciclos de respiração.')
  }

  function handleBreathCycle() {
    setBreathCycles(prev => {
      if (prev + 1 >= 2) {
        beginSession()
        return prev + 1
      }
      return prev + 1
    })
  }

  async function beginSession() {
    await startBinaural('theta', -25)
    setPhase('session')
    setLineIdx(0)
    registerUse()

    // Fala a primeira frase imediatamente (o useEffect acima cuida das seguintes)
    if (narratorOn && themeRef.current) speak(themeRef.current.script[0])

    scriptRef.current = setInterval(() => {
      setLineIdx(prev => {
        const next = prev + 1
        if (next >= themeRef.current.script.length) {
          clearInterval(scriptRef.current)
          stopBinaural()
          stopSpeaking()
          setPhase('done')
          return prev
        }
        return next
      })
    }, SCRIPT_INTERVAL)
  }

  function handleDone() {
    clearInterval(scriptRef.current)
    stopBinaural()
    stopSpeaking()
    setPhase('done')
    setBreathCycles(0)
  }

  // === SELECT ===
  if (phase === 'select') return (
    <div className="flex flex-col min-h-dvh bg-cosmos px-5 pt-10 pb-28">
      <button onClick={() => navigate('/')} className="text-forja-muted text-sm mb-6 self-start">← Voltar</button>
      <h1 className="text-2xl font-light text-forja-text mb-1">
        🌌 <span className="text-[#74b9ff] font-semibold">Visualização</span>
      </h1>
      <p className="text-forja-muted text-sm mb-8">
        Meditação guiada · Binaural theta automático · ~5 min
      </p>

      <p className="text-forja-muted text-xs uppercase tracking-widest mb-4">Escolha o tema</p>
      <div className="grid grid-cols-2 gap-3">
        {THEMES.map(t => (
          <button
            key={t.key}
            onClick={() => selectTheme(t)}
            className="module-card"
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: `${t.color}22`, border: `1px solid ${t.color}44` }}
            >
              {t.emoji}
            </div>
            <p className="text-forja-text font-medium text-sm">{t.label}</p>
          </button>
        ))}
      </div>

      <div className="mt-8 bg-forja-surface/60 rounded-2xl p-4 border border-white/5 text-xs text-forja-muted leading-relaxed">
        <p>
          💡 Você começará com <strong className="text-forja-text">2 ciclos de respiração 4-7-8</strong> para entrar em
          estado theta, depois a narração guiada começa com binaural beats de fundo.
        </p>
      </div>
    </div>
  )

  // === RESPIRAÇÃO ===
  if (phase === 'breathing') return (
    <div className="flex flex-col min-h-dvh bg-cosmos items-center justify-center px-5 pb-28 gap-6">
      <div style={{ color: theme.color }} className="text-4xl">{theme.emoji}</div>
      <h2 className="text-xl font-light text-forja-text">Preparando para {theme.label}</h2>
      <p className="text-forja-muted text-sm text-center">
        {2 - breathCycles} ciclo{2 - breathCycles !== 1 ? 's' : ''} restante{2 - breathCycles !== 1 ? 's' : ''}
      </p>
      <BreathingCircle running={true} onCycle={handleBreathCycle} />
    </div>
  )

  // === SESSÃO ===
  if (phase === 'session' && theme) return (
    <div className="relative flex flex-col min-h-dvh items-center justify-center px-6 pb-28 overflow-hidden"
         style={{ background: '#0a0e27' }}>
      {/* Mandala de fundo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-80 h-80">
          <MandalaVisualizer color={theme.color} opacity={0.12} />
        </div>
      </div>

      {/* Barra topo: progresso + botões de controle */}
      <div className="absolute top-8 left-0 right-0 flex flex-col items-center gap-3 px-6">
        <div className="flex justify-center gap-1.5">
          {theme.script.map((_, i) => (
            <div
              key={i}
              className="h-1 rounded-full transition-all duration-700"
              style={{
                width: i === lineIdx ? 24 : 8,
                background: i <= lineIdx ? theme.color : '#12183a',
              }}
            />
          ))}
        </div>
        {/* Controles */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              const next = !narratorOn
              setNarratorOn(next)
              if (!next) stopSpeaking()
              else if (theme) speak(theme.script[lineIdx])
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10
                       text-xs text-forja-muted hover:border-white/20 transition-all"
          >
            {narratorOn ? '🔊 Voz' : '🔇 Mudo'}
          </button>
          <button
            onClick={handleDone}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10
                       text-xs text-forja-muted hover:border-white/20 transition-all"
          >
            ✕ Encerrar
          </button>
        </div>
      </div>

      {/* Frase atual */}
      <div
        key={lineIdx}
        className="text-center max-w-xs z-10 text-appear"
        style={{ animationDelay: '0.1s' }}
      >
        <p className="text-forja-text text-xl font-light leading-relaxed">
          {theme.script[lineIdx]}
        </p>
      </div>

      {/* Status inferior */}
      <div className="absolute bottom-32 text-center flex flex-col items-center gap-1">
        <p className="text-forja-muted text-xs animate-pulse">
          🎵 Binaural theta · Fones de ouvido recomendados
        </p>
        {narratorOn && (
          <p className="text-forja-muted text-xs">🎙️ Narrador ativo</p>
        )}
      </div>
    </div>
  )

  // === DONE ===
  return (
    <div className="flex flex-col min-h-dvh bg-cosmos items-center justify-center px-5 pb-28 gap-6">
      <div className="text-6xl">{theme?.emoji}</div>
      <h2 className="text-xl font-medium text-forja-text">Sessão concluída</h2>
      <p className="text-forja-muted text-sm text-center max-w-xs">
        Sua mente absorveu a sessão de {theme?.label}. Permita-se alguns
        instantes antes de retomar as atividades.
      </p>
      <button onClick={() => { setPhase('select'); setBreathCycles(0); setNarratorOn(getNarratorSettings().enabled) }} className="btn-primary">
        Nova sessão
      </button>
      <button onClick={() => navigate('/')} className="text-forja-muted text-sm">
        Voltar ao início
      </button>
    </div>
  )
}

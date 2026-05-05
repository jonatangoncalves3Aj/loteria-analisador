import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { storage } from '../utils/storage'
import {
  createAffirmation, calcNextReview, getDueCards, QUALITY_LABELS
} from '../utils/spacedRepetition'
import { registerUse } from '../utils/streaks'
import { speak, stopSpeaking, getNarratorSettings } from '../utils/narrator'
import { PRESET_PROGRAMS, loadPresetAffirmations } from '../utils/presetPrograms'

export default function Affirmations() {
  const navigate = useNavigate()
  const [affirmations, setAffirmations] = useState([])
  const [dueCards,     setDueCards]     = useState([])
  const [currentIdx,   setCurrentIdx]   = useState(0)
  const [mode,         setMode]         = useState('list')  // list | review | add | done
  const [newText,      setNewText]      = useState('')
  const [flipped,      setFlipped]      = useState(false)
  const [narratorOn,   setNarratorOn]   = useState(() => getNarratorSettings().enabled)
  const [loadedProgram, setLoadedProgram] = useState(null)

  useEffect(() => {
    const saved = storage.get('forja_affirmations', [])
    setAffirmations(saved)
    setDueCards(getDueCards(saved))
    return () => stopSpeaking()
  }, [])

  function save(updated) {
    setAffirmations(updated)
    storage.set('forja_affirmations', updated)
    setDueCards(getDueCards(updated))
  }

  function addAffirmation() {
    if (!newText.trim()) return
    const card    = createAffirmation(newText.trim())
    const updated = [...affirmations, card]
    save(updated)
    setNewText('')
    setMode('list')
  }

  function removeAffirmation(id) {
    save(affirmations.filter(a => a.id !== id))
  }

  function handleLoadProgram(programId) {
    const updated = loadPresetAffirmations(programId, affirmations)
    save(updated)
    setLoadedProgram(programId)
    setTimeout(() => setLoadedProgram(null), 2500)
  }

  function startReview() {
    setCurrentIdx(0)
    setFlipped(false)
    setMode('review')
    registerUse()
    if (narratorOn && dueCards[0]) speak(dueCards[0].text)
  }

  function rate(quality) {
    const card    = dueCards[currentIdx]
    const updated = calcNextReview(card, quality)
    const newList = affirmations.map(a => a.id === card.id ? { ...a, ...updated } : a)
    save(newList)

    if (currentIdx + 1 < dueCards.length) {
      const nextIdx = currentIdx + 1
      setCurrentIdx(nextIdx)
      setFlipped(false)
      if (narratorOn && dueCards[nextIdx]) speak(dueCards[nextIdx].text)
    } else {
      stopSpeaking()
      setMode('done')
    }
  }

  // === TELA LISTA ===
  if (mode === 'list') return (
    <div className="flex flex-col min-h-dvh bg-cosmos px-5 pt-10 pb-28">
      <button onClick={() => navigate('/')} className="text-forja-muted text-sm mb-6 self-start">← Voltar</button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-light text-forja-text">
          🃏 <span className="text-forja-primary font-semibold">Afirmações</span>
        </h1>
        <button onClick={() => setMode('add')} className="btn-ghost text-xs py-2 px-3">+ Adicionar</button>
      </div>

      {/* CTA de revisão */}
      {dueCards.length > 0 && (
        <button
          onClick={startReview}
          className="w-full mb-6 py-4 rounded-2xl font-medium text-forja-bg transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #a29bfe, #6c5ce7)' }}
        >
          Revisar {dueCards.length} afirmação{dueCards.length > 1 ? 'ões' : ''} de hoje
        </button>
      )}

      {/* Programas Prontos */}
      <div className="mb-6">
        <p className="text-forja-muted text-xs uppercase tracking-widest mb-3">Programas Prontos</p>
        <div className="flex flex-col gap-2">
          {PRESET_PROGRAMS.map(prog => (
            <div
              key={prog.id}
              className="bg-forja-surface/60 border border-white/5 rounded-2xl px-4 py-3 flex items-center gap-3"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: `${prog.color}22`, border: `1px solid ${prog.color}44` }}
              >
                {prog.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-forja-text font-medium text-sm">{prog.label}</p>
                <p className="text-forja-muted text-xs leading-relaxed">{prog.description}</p>
              </div>
              <button
                onClick={() => handleLoadProgram(prog.id)}
                className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95"
                style={{
                  background: loadedProgram === prog.id ? '#55efc422' : `${prog.color}22`,
                  border: `1px solid ${loadedProgram === prog.id ? '#55efc4' : prog.color}66`,
                  color: loadedProgram === prog.id ? '#55efc4' : prog.color,
                }}
              >
                {loadedProgram === prog.id ? '✓ Carregado' : 'Carregar'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {affirmations.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <span className="text-5xl">🌱</span>
          <p className="text-forja-text font-medium">Nenhuma afirmação ainda</p>
          <p className="text-forja-muted text-sm max-w-xs">
            Carregue um programa acima ou adicione frases no presente/processo.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-forja-muted text-xs uppercase tracking-widest mb-1">
            Suas afirmações · {affirmations.length} total
          </p>
          {affirmations.map(a => {
            const due = new Date(a.nextReview) <= new Date()
            return (
              <div
                key={a.id}
                className="bg-forja-surface/60 border border-white/5 rounded-2xl px-4 py-3
                           flex items-start gap-3"
              >
                <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${due ? 'bg-forja-primary' : 'bg-forja-muted/40'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-forja-text text-sm leading-relaxed">{a.text}</p>
                  <p className="text-forja-muted text-xs mt-1">
                    {due ? '📬 Revisão pendente' : `📅 Próxima em ${Math.ceil((new Date(a.nextReview) - new Date()) / 86400000)} dia(s)`}
                    {' · '} {a.repetitions}x revisada
                  </p>
                </div>
                <button
                  onClick={() => removeAffirmation(a.id)}
                  className="text-forja-muted/50 hover:text-red-400 transition-colors text-lg flex-shrink-0"
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  // === ADICIONAR ===
  if (mode === 'add') return (
    <div className="flex flex-col min-h-dvh bg-cosmos px-5 pt-10 pb-28">
      <button onClick={() => setMode('list')} className="text-forja-muted text-sm mb-6 self-start">← Voltar</button>
      <h2 className="text-xl font-medium text-forja-text mb-2">Nova Afirmação</h2>
      <p className="text-forja-muted text-sm mb-6">
        Use frases de processo — o cérebro as aceita melhor:
      </p>

      <div className="bg-forja-surface/60 rounded-2xl p-4 border border-white/5 mb-6 text-xs text-forja-muted leading-relaxed">
        <p className="font-medium text-forja-text mb-2">✅ Exemplos eficazes:</p>
        <p>· "Estou me tornando mais confiante a cada dia"</p>
        <p>· "Estou aprendendo a amar e aceitar a mim mesmo"</p>
        <p>· "Cada ação que tomo me aproxima do sucesso"</p>
        <p className="font-medium text-forja-text mt-3 mb-2">❌ Evitar (cria resistência):</p>
        <p>· "Sou milionário" (quando não é verdade)</p>
        <p>· "Sou perfeito" (sem evidência interna)</p>
      </div>

      <textarea
        value={newText}
        onChange={e => setNewText(e.target.value)}
        placeholder="Digite sua afirmação aqui..."
        rows={4}
        className="w-full bg-forja-surface border border-white/10 rounded-xl px-4 py-3
                   text-forja-text placeholder:text-forja-muted text-sm outline-none
                   focus:border-forja-primary/50 transition-colors resize-none mb-4"
        autoFocus
      />

      <button
        onClick={addAffirmation}
        disabled={!newText.trim()}
        className="btn-primary w-full disabled:opacity-40"
      >
        Adicionar à Forja
      </button>
    </div>
  )

  // === REVISÃO ===
  if (mode === 'review') {
    const card = dueCards[currentIdx]
    return (
      <div className="flex flex-col min-h-dvh bg-cosmos px-5 pt-10 pb-28 items-center">
        <div className="flex w-full justify-between items-center mb-6">
          <button onClick={() => { stopSpeaking(); setMode('list') }} className="text-forja-muted text-sm">← Parar</button>
          <button
            onClick={() => {
              const next = !narratorOn
              setNarratorOn(next)
              if (!next) stopSpeaking()
              else speak(card.text)
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10
                       text-xs text-forja-muted hover:border-white/20 transition-all"
          >
            {narratorOn ? '🔊 Voz ativa' : '🔇 Voz muda'}
          </button>
        </div>

        <div className="text-forja-muted text-sm mb-6">
          {currentIdx + 1} / {dueCards.length}
        </div>

        <div
          onClick={() => setFlipped(true)}
          className="w-full max-w-sm min-h-48 rounded-3xl border border-forja-primary/20
                     bg-forja-surface/80 flex flex-col items-center justify-center p-8
                     cursor-pointer transition-all duration-300 hover:border-forja-primary/40
                     shadow-xl text-center mb-8"
          style={{ boxShadow: '0 0 60px #a29bfe15' }}
        >
          <p className="text-forja-text text-lg font-light leading-relaxed">
            {card.text}
          </p>
          {!flipped && (
            <div className="mt-6 flex flex-col items-center gap-2">
              <button
                onClick={e => { e.stopPropagation(); speak(card.text) }}
                className="text-forja-primary text-xs flex items-center gap-1 hover:opacity-80"
              >
                🔊 Ouvir novamente
              </button>
              <p className="text-forja-muted text-xs">Toque quando terminar</p>
            </div>
          )}
        </div>

        {flipped ? (
          <div className="w-full max-w-sm">
            <p className="text-forja-muted text-sm text-center mb-4">Como essa afirmação ressoou?</p>
            <div className="grid grid-cols-2 gap-3">
              {QUALITY_LABELS.map(q => (
                <button
                  key={q.value}
                  onClick={() => rate(q.value)}
                  className="py-3 px-4 rounded-2xl border border-white/10 bg-forja-surface/60
                             transition-all hover:border-white/20 active:scale-95"
                >
                  <div className="text-2xl">{q.emoji}</div>
                  <div className={`text-xs font-medium mt-1 ${q.color}`}>{q.label}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button onClick={() => setFlipped(true)} className="btn-ghost">
            Avaliar
          </button>
        )}
      </div>
    )
  }

  // === CONCLUÍDO ===
  return (
    <div className="flex flex-col min-h-dvh bg-cosmos items-center justify-center px-5 pb-28 gap-6">
      <div className="text-6xl">🏆</div>
      <h2 className="text-xl font-medium text-forja-text">Revisão concluída!</h2>
      <p className="text-forja-muted text-sm text-center max-w-xs">
        Você revisou {dueCards.length} afirmação{dueCards.length > 1 ? 'ões' : ''}.
        O algoritmo já agendou a próxima revisão de cada uma.
      </p>
      <button onClick={() => setMode('list')} className="btn-primary">Ver todas</button>
      <button onClick={() => navigate('/')} className="text-forja-muted text-sm">Voltar ao início</button>
    </div>
  )
}

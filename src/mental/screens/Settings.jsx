import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getNarratorSettings, updateNarratorSetting, applyPersona,
  getAvailableVoices, waitForVoices, isSupported, speak, stopSpeaking,
  NARRATOR_PERSONAS,
} from '../utils/narrator'
import {
  EL_VOICES, getELApiKey, setELApiKey, getELVoiceId, setELVoiceId,
  isELEnabled, generateSpeech, playAudioUrl, stopELAudio, clearAudioCache,
} from '../audio/elevenLabs'

const TABS = ['ElevenLabs', 'Web Speech', 'Ajustes']

export default function Settings() {
  const navigate   = useNavigate()
  const [tab,      setTab]      = useState('ElevenLabs')
  const [settings, setSettings] = useState(getNarratorSettings())
  const [voices,   setVoices]   = useState([])
  const [apiKey,   setApiKeyState] = useState(getELApiKey())
  const [elVoice,  setElVoice]  = useState(getELVoiceId())
  const [testing,  setTesting]  = useState(null)
  const [testErr,  setTestErr]  = useState('')
  const [saved,    setSaved]    = useState(false)

  useEffect(() => {
    if (!isSupported()) return
    waitForVoices().then(() => setVoices(getAvailableVoices()))
  }, [])

  function update(key, value) {
    updateNarratorSetting(key, value)
    setSettings(s => ({ ...s, [key]: value }))
  }

  function selectPersona(key) {
    applyPersona(key)
    setSettings(getNarratorSettings())
  }

  function saveApiKey() {
    setELApiKey(apiKey)
    clearAudioCache()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function selectElVoice(id) {
    setElVoice(id)
    setELVoiceId(id)
    clearAudioCache()
  }

  async function testELVoice(voice) {
    setTesting(voice.id)
    setTestErr('')
    const key = getELApiKey()
    if (!key) { setTestErr('Adicione sua API Key primeiro'); setTesting(null); return }
    try {
      const url = await generateSpeech(voice.preview, voice.id, key)
      await playAudioUrl(url)
    } catch (err) {
      setTestErr(err.message)
    }
    setTesting(null)
  }

  async function testWSVoice(persona) {
    setTesting(persona.key)
    const prev = getNarratorSettings()
    updateNarratorSetting('rate',  persona.rate)
    updateNarratorSetting('pitch', persona.pitch)
    updateNarratorSetting('volume', persona.volume)
    await speak(persona.preview)
    updateNarratorSetting('rate',  prev.rate)
    updateNarratorSetting('pitch', prev.pitch)
    updateNarratorSetting('volume', prev.volume)
    setTesting(null)
  }

  return (
    <div className="flex flex-col min-h-dvh bg-cosmos px-5 pt-10 pb-28">
      <button onClick={() => navigate('/')} className="text-forja-muted text-sm mb-6 self-start">
        ← Voltar
      </button>

      <h1 className="text-2xl font-light text-forja-text mb-1">
        🎙️ <span className="text-forja-primary font-semibold">Narrador</span>
      </h1>
      <p className="text-forja-muted text-sm mb-6">Escolha a voz que guia suas sessões</p>

      {/* ON/OFF global */}
      <div className="flex items-center justify-between bg-forja-surface/60 border border-white/5 rounded-2xl px-4 py-3 mb-6">
        <p className="text-forja-text font-medium">Narrador ativo</p>
        <button
          onClick={() => update('enabled', !settings.enabled)}
          className={`w-14 h-7 rounded-full transition-all duration-300 relative border border-white/10 ${
            settings.enabled ? 'bg-forja-primary' : 'bg-forja-surface'
          }`}
        >
          <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all duration-300 ${
            settings.enabled ? 'left-7' : 'left-0.5'
          }`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-forja-surface/60 rounded-xl p-1 mb-6">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              tab === t
                ? 'bg-forja-primary text-forja-bg'
                : 'text-forja-muted hover:text-forja-text'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* TAB 1 — ELEVENLABS (vozes realistas IA) */}
      {/* ═══════════════════════════════════════ */}
      {tab === 'ElevenLabs' && (
        <div className="flex flex-col gap-5">

          {/* Explicação */}
          <div className="bg-forja-primary/10 border border-forja-primary/30 rounded-2xl p-4 text-sm">
            <p className="text-forja-primary font-medium mb-1">✨ Vozes com IA — parecem humanas</p>
            <p className="text-forja-muted text-xs leading-relaxed">
              ElevenLabs oferece vozes ultra-realistas. O plano gratuito inclui
              <strong className="text-forja-text"> 10.000 caracteres/mês</strong> (~30 sessões completas).
            </p>
          </div>

          {/* API Key */}
          <div className="bg-forja-surface/60 border border-white/5 rounded-2xl p-4">
            <p className="text-forja-text font-medium mb-1">API Key</p>
            <p className="text-forja-muted text-xs mb-3">
              Crie sua conta grátis em{' '}
              <span className="text-forja-primary">elevenlabs.io</span>
              {' '}→ My Account → API Key
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="sk_..."
                value={apiKey}
                onChange={e => setApiKeyState(e.target.value)}
                className="flex-1 bg-forja-bg border border-white/10 rounded-xl px-3 py-2.5
                           text-forja-text placeholder:text-forja-muted text-sm outline-none
                           focus:border-forja-primary/50 transition-colors"
              />
              <button
                onClick={saveApiKey}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  saved
                    ? 'bg-green-500/20 border border-green-500/40 text-green-400'
                    : 'btn-primary'
                }`}
              >
                {saved ? '✓ Salvo' : 'Salvar'}
              </button>
            </div>
            {!getELApiKey() && (
              <p className="text-forja-muted text-xs mt-2">
                Sem API Key → narrador usa voz do dispositivo como alternativa
              </p>
            )}
          </div>

          {/* Erro de teste */}
          {testErr && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-xs">
              ⚠️ {testErr}
            </div>
          )}

          {/* Grade de vozes */}
          <div>
            <p className="text-forja-muted text-xs uppercase tracking-widest mb-3">
              Escolha a voz do narrador
            </p>
            <div className="flex flex-col gap-3">
              {EL_VOICES.map(voice => {
                const active = elVoice === voice.id
                return (
                  <div
                    key={voice.id}
                    className="rounded-2xl border p-4 transition-all duration-200"
                    style={active
                      ? { borderColor: `${voice.color}66`, background: `${voice.color}10` }
                      : { borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(18,24,58,0.5)' }
                    }
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ background: `${voice.color}22`, border: `1px solid ${voice.color}44` }}
                      >
                        {voice.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-forja-text font-medium">{voice.name}</p>
                          <span className="text-[10px] text-forja-muted border border-white/10 px-1.5 py-0.5 rounded-full">
                            {voice.gender}
                          </span>
                          {active && (
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                              style={{ background: `${voice.color}33`, color: voice.color }}
                            >
                              ativa
                            </span>
                          )}
                        </div>
                        <p className="text-forja-muted text-xs mt-0.5 leading-relaxed">{voice.style}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {voice.best_for.map(tag => (
                            <span key={tag} className="text-[10px] bg-white/5 text-forja-muted px-2 py-0.5 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => selectElVoice(voice.id)}
                        disabled={active}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                          active
                            ? 'cursor-default opacity-60'
                            : 'border border-white/10 text-forja-muted hover:border-white/20 active:scale-95'
                        }`}
                        style={active ? { color: voice.color, border: `1px solid ${voice.color}44` } : {}}
                      >
                        {active ? '✓ Selecionada' : 'Selecionar'}
                      </button>
                      <button
                        onClick={() => testELVoice(voice)}
                        disabled={testing !== null}
                        className="px-4 py-2 rounded-xl border border-white/10 text-forja-muted text-sm
                                   hover:border-white/20 active:scale-95 transition-all disabled:opacity-40
                                   flex items-center gap-1.5 flex-shrink-0"
                      >
                        {testing === voice.id
                          ? <><span className="animate-pulse">🔊</span> Falando...</>
                          : <>🔊 Ouvir</>
                        }
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Como obter API Key */}
          <div className="bg-forja-surface/60 rounded-2xl p-4 border border-white/5 text-xs text-forja-muted leading-relaxed">
            <p className="font-medium text-forja-text mb-2">📋 Como obter a API Key grátis:</p>
            <p>1. Acesse <span className="text-forja-primary">elevenlabs.io</span></p>
            <p>2. Crie uma conta grátis (email ou Google)</p>
            <p>3. Clique no seu avatar → <strong className="text-forja-text">Profile + API Key</strong></p>
            <p>4. Copie a chave e cole acima</p>
            <p className="mt-2 text-forja-muted">
              Plano gratuito: 10.000 caracteres/mês • Sem cartão de crédito
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* TAB 2 — WEB SPEECH (voz do dispositivo) */}
      {/* ═══════════════════════════════════════ */}
      {tab === 'Web Speech' && (
        <div className="flex flex-col gap-4">
          <div className="bg-forja-surface/60 border border-white/5 rounded-2xl p-4 text-xs text-forja-muted">
            <p className="text-forja-text font-medium mb-1">ℹ️ Voz do dispositivo</p>
            <p className="leading-relaxed">
              Funciona offline sem API Key. Qualidade depende do sistema operacional.
              No Android com Google TTS e no iOS com Luciana (pt-BR) a qualidade é boa.
            </p>
          </div>

          {!isSupported() ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-400 text-sm">
              ⚠️ Use o Chrome para suporte a síntese de voz.
            </div>
          ) : (
            <>
              {/* Personas */}
              <p className="text-forja-muted text-xs uppercase tracking-widest">Estilo</p>
              <div className="flex flex-col gap-3">
                {NARRATOR_PERSONAS.map(persona => {
                  const active = settings.persona === persona.key && !isELEnabled()
                  return (
                    <div
                      key={persona.key}
                      className="rounded-2xl border p-4 transition-all"
                      style={active
                        ? { borderColor: `${persona.color}66`, background: `${persona.color}10` }
                        : { borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(18,24,58,0.5)' }
                      }
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                          style={{ background: `${persona.color}22`, border: `1px solid ${persona.color}44` }}
                        >
                          {persona.emoji}
                        </div>
                        <div>
                          <p className="text-forja-text font-medium text-sm">{persona.label}</p>
                          <p className="text-forja-muted text-xs">{persona.description}</p>
                        </div>
                        {active && (
                          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{ background: `${persona.color}33`, color: persona.color }}>
                            ativa
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => selectPersona(persona.key)}
                          disabled={active}
                          className={`flex-1 py-2 rounded-xl text-sm transition-all ${
                            active ? 'cursor-default opacity-60' : 'border border-white/10 text-forja-muted hover:border-white/20'
                          }`}
                          style={active ? { color: persona.color, border: `1px solid ${persona.color}44` } : {}}
                        >
                          {active ? '✓ Ativa' : 'Selecionar'}
                        </button>
                        <button
                          onClick={() => testWSVoice(persona)}
                          disabled={testing !== null}
                          className="px-4 py-2 rounded-xl border border-white/10 text-forja-muted text-sm
                                     hover:border-white/20 transition-all disabled:opacity-40 flex items-center gap-1"
                        >
                          {testing === persona.key
                            ? <><span className="animate-pulse">🔊</span> Falando...</>
                            : <>🔊 Testar</>
                          }
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Voz do sistema */}
              {voices.length > 0 && (
                <div className="bg-forja-surface/60 border border-white/5 rounded-2xl p-4">
                  <p className="text-forja-text font-medium mb-3 text-sm">Voz do sistema (pt-BR)</p>
                  <div className="flex flex-col gap-2">
                    {[{ name: 'Padrão do sistema', voiceURI: null }, ...voices].map(v => (
                      <button
                        key={v.voiceURI ?? 'default'}
                        onClick={() => update('voiceURI', v.voiceURI)}
                        className={`px-4 py-2.5 rounded-xl border text-sm text-left transition-all ${
                          settings.voiceURI === v.voiceURI
                            ? 'bg-forja-primary/20 border-forja-primary/60 text-forja-primary'
                            : 'border-white/10 text-forja-muted hover:border-white/20'
                        }`}
                      >
                        {v.name ?? 'Padrão'}
                        {v.lang && <span className="text-xs ml-2 opacity-60">{v.lang}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* TAB 3 — AJUSTES FINOS                  */}
      {/* ═══════════════════════════════════════ */}
      {tab === 'Ajustes' && (
        <div className="flex flex-col gap-5">
          {[
            { key: 'rate',   label: 'Velocidade', min: 0.5, max: 1.3, step: 0.05,
              desc: v => v < 0.7 ? 'Muito lenta' : v < 0.85 ? 'Lenta (meditativa)' : v < 1.0 ? 'Normal' : 'Rápida' },
            { key: 'pitch',  label: 'Tom de voz',  min: 0.5, max: 1.3, step: 0.05,
              desc: v => v < 0.8 ? 'Grave' : v < 0.95 ? 'Suave' : v < 1.1 ? 'Normal' : 'Agudo' },
            { key: 'volume', label: 'Volume da voz', min: 0.1, max: 1.0, step: 0.05,
              desc: v => `${Math.round(v * 100)}%` },
          ].map(({ key, label, min, max, step, desc }) => (
            <div key={key} className="bg-forja-surface/60 border border-white/5 rounded-2xl p-4">
              <div className="flex justify-between mb-3">
                <p className="text-forja-text font-medium">{label}</p>
                <span className="text-forja-muted text-sm">{desc(settings[key] ?? 0.85)}</span>
              </div>
              <input
                type="range" min={min} max={max} step={step}
                value={settings[key] ?? (key === 'volume' ? 1 : 0.85)}
                onChange={e => update(key, parseFloat(e.target.value))}
                className="slider w-full"
                style={{ '--val': `${((settings[key] - min) / (max - min)) * 100}%` }}
              />
            </div>
          ))}

          <p className="text-forja-muted text-xs text-center">
            💡 Ajustes finos se aplicam apenas ao Web Speech API.
            O ElevenLabs tem qualidade controlada automaticamente.
          </p>
        </div>
      )}
    </div>
  )
}

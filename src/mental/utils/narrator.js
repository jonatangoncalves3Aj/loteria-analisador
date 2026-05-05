// ============================================================
//  Narrador — Web Speech API (SpeechSynthesis)
//  Gratuito, offline, sem API key. Voz nativa do dispositivo.
// ============================================================

// ── Personas de narrador ──────────────────────────────────
export const NARRATOR_PERSONAS = [
  {
    key:         'meditativo',
    label:       'Meditativo',
    emoji:       '🧘',
    description: 'Voz lenta e profunda. Ideal para meditação e sono.',
    rate:        0.72,
    pitch:       0.80,
    volume:      1.0,
    preview:     'Respire fundo... e solte... você está em paz.',
    color:       '#a29bfe',
  },
  {
    key:         'suave',
    label:       'Suave',
    emoji:       '🌙',
    description: 'Delicado e acolhedor. Perfeito para afirmações e sono.',
    rate:        0.78,
    pitch:       0.88,
    volume:      0.9,
    preview:     'Você é amado. Você é suficiente. Você está bem.',
    color:       '#74b9ff',
  },
  {
    key:         'equilibrado',
    label:       'Equilibrado',
    emoji:       '☯️',
    description: 'Tom neutro e claro. Bom para uso geral.',
    rate:        0.88,
    pitch:       0.95,
    volume:      1.0,
    preview:     'Foque no presente. Sua mente está clara e focada.',
    color:       '#48b8a6',
  },
  {
    key:         'coach',
    label:       'Coach',
    emoji:       '💪',
    description: 'Energético e motivador. Ideal para metas e confiança.',
    rate:        1.00,
    pitch:       1.05,
    volume:      1.0,
    preview:     'Você é capaz! Cada passo te aproxima do seu melhor!',
    color:       '#ffd32a',
  },
]

const DEFAULT_SETTINGS = {
  enabled:   true,
  lang:      'pt-BR',
  persona:   'meditativo',   // chave da persona ativa
  rate:      0.72,
  pitch:     0.80,
  volume:    1.0,
  voiceURI:  null,           // null = voz padrão do sistema
}

// Carrega configurações salvas ou usa defaults
function getSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem('forja_narrator') ?? '{}')
    return { ...DEFAULT_SETTINGS, ...saved }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

function saveSettings(settings) {
  localStorage.setItem('forja_narrator', JSON.stringify(settings))
}

// ── Aplica uma persona inteira de uma vez ─────────────────
export function applyPersona(personaKey) {
  const persona = NARRATOR_PERSONAS.find(p => p.key === personaKey)
  if (!persona) return
  const settings = getSettings()
  settings.persona = personaKey
  settings.rate    = persona.rate
  settings.pitch   = persona.pitch
  settings.volume  = persona.volume
  saveSettings(settings)
}

// ── Lista vozes disponíveis em pt-BR ──────────────────────
export function getAvailableVoices() {
  if (!window.speechSynthesis) return []
  const voices = window.speechSynthesis.getVoices()
  const ptBR = voices.filter(v => v.lang === 'pt-BR')
  const pt   = voices.filter(v => v.lang.startsWith('pt') && v.lang !== 'pt-BR')
  return ptBR.length > 0 ? ptBR : pt.length > 0 ? pt : voices.slice(0, 5)
}

// ── Atualiza uma configuração individual ──────────────────
export function updateNarratorSetting(key, value) {
  const settings = getSettings()
  settings[key] = value
  saveSettings(settings)
}

export function getNarratorSettings() { return getSettings() }

// ── Fala um texto (ElevenLabs → fallback Web Speech API) ────
export async function speak(text, overrides = {}) {
  const settings = { ...getSettings(), ...overrides }
  if (!settings.enabled) return

  // Tenta ElevenLabs primeiro (vozes realistas)
  try {
    const { isELEnabled, getELApiKey, getELVoiceId,
            generateSpeech, playAudioUrl } = await import('../audio/elevenLabs.js')

    if (isELEnabled()) {
      const url = await generateSpeech(text, getELVoiceId(), getELApiKey())
      await playAudioUrl(url)
      return
    }
  } catch (err) {
    console.warn('ElevenLabs falhou, usando Web Speech API:', err.message)
  }

  // Fallback: Web Speech API nativa
  if (!window.speechSynthesis) return

  return new Promise((resolve) => {
    window.speechSynthesis.cancel()

    const utterance    = new SpeechSynthesisUtterance(text)
    utterance.lang     = settings.lang
    utterance.rate     = settings.rate
    utterance.pitch    = settings.pitch
    utterance.volume   = settings.volume

    if (settings.voiceURI) {
      const voice = window.speechSynthesis.getVoices().find(v => v.voiceURI === settings.voiceURI)
      if (voice) utterance.voice = voice
    }

    utterance.onend   = () => resolve()
    utterance.onerror = () => resolve()

    window.speechSynthesis.speak(utterance)
  })
}

// ── Para a fala imediatamente ─────────────────────────────
export function stopSpeaking() {
  if (window.speechSynthesis) window.speechSynthesis.cancel()
  // Para ElevenLabs também
  import('../audio/elevenLabs.js').then(({ stopELAudio }) => stopELAudio()).catch(() => {})
}

// ── Fala lista de frases com pausa entre elas ─────────────
export async function speakSequence(phrases, pauseMs = 500, signal = null) {
  for (const phrase of phrases) {
    if (signal?.aborted) break
    await speak(phrase)
    if (signal?.aborted) break
    await new Promise(r => setTimeout(r, pauseMs))
  }
}

// ── Verifica suporte ──────────────────────────────────────
export function isSupported() {
  return 'speechSynthesis' in window
}

// ── Aguarda vozes carregarem (assíncrono no Chrome) ───────
export function waitForVoices() {
  return new Promise(resolve => {
    const voices = window.speechSynthesis?.getVoices() ?? []
    if (voices.length > 0) return resolve(voices)
    window.speechSynthesis.onvoiceschanged = () => resolve(window.speechSynthesis.getVoices())
    setTimeout(() => resolve([]), 2000)
  })
}

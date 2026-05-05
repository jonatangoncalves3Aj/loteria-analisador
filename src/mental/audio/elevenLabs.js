// ============================================================
//  ElevenLabs TTS — Vozes realistas com IA
//  Tier gratuito: 10.000 caracteres/mês
//  https://elevenlabs.io  (criar conta grátis)
// ============================================================

const EL_BASE = 'https://api.elevenlabs.io/v1'

// ── Vozes disponíveis no ElevenLabs ──────────────────────────
// Todas funcionam em pt-BR com o modelo multilingual_v2
export const EL_VOICES = [
  {
    id:          'pFZP5JQG7iQjIQuC4Bku',
    name:        'Lily',
    emoji:       '🌸',
    gender:      'feminino',
    style:       'Suave e meditativa — ideal para relaxamento',
    best_for:    ['visualização', 'sono', 'afirmações'],
    color:       '#fd79a8',
    preview:     'Respire fundo e solte toda a tensão do seu corpo.',
  },
  {
    id:          'onwK4e9ZLuTAKqWW03F9',
    name:        'Daniel',
    emoji:       '🏔️',
    gender:      'masculino',
    style:       'Voz profunda e calma — autoridade suave',
    best_for:    ['meditação', 'EMDR', 'binaural'],
    color:       '#6c5ce7',
    preview:     'Você está seguro. Permita-se descansar completamente.',
  },
  {
    id:          'jsCqWAovK2LkecY7zXl4',
    name:        'Freya',
    emoji:       '⚡',
    gender:      'feminino',
    style:       'Energética e motivadora — coaching',
    best_for:    ['metas', 'confiança', 'manhã'],
    color:       '#ffd32a',
    preview:     'Você é capaz. Cada passo te aproxima do seu melhor!',
  },
  {
    id:          'XB0fDUnXU5powFXDhCwa',
    name:        'Charlotte',
    emoji:       '🌙',
    gender:      'feminino',
    style:       'Acolhedora e íntima — como uma amiga',
    best_for:    ['afirmações', 'amor-próprio', 'noite'],
    color:       '#74b9ff',
    preview:     'Você é amado. Você é suficiente. Exatamente como é.',
  },
  {
    id:          'N2lVS1w4EtoT3dr4eOWO',
    name:        'Callum',
    emoji:       '🧘',
    gender:      'masculino',
    style:       'Neutro e equilibrado — uso geral',
    best_for:    ['respiração', 'foco', 'geral'],
    color:       '#48b8a6',
    preview:     'Foque no presente. Sua mente está clara e tranquila.',
  },
  {
    id:          'IKne3meq5aSn9XLyUdCD',
    name:        'Charlie',
    emoji:       '🔥',
    gender:      'masculino',
    style:       'Jovem e dinâmico — motivação intensa',
    best_for:    ['metas', 'exercício', 'manhã'],
    color:       '#e17055',
    preview:     'Levanta! Hoje é seu dia. Vamos fazer acontecer!',
  },
]

// ── Cache de áudio no SessionStorage (evita re-gerar) ────────
const audioCache = new Map()

function cacheKey(text, voiceId) {
  return `${voiceId}::${text.slice(0, 60)}`
}

// ── Gera áudio via ElevenLabs API ────────────────────────────
export async function generateSpeech(text, voiceId, apiKey) {
  const key = cacheKey(text, voiceId)
  if (audioCache.has(key)) return audioCache.get(key)

  const response = await fetch(`${EL_BASE}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'xi-api-key':    apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability:         0.65,   // 0-1: mais alto = mais consistente
        similarity_boost:  0.80,   // 0-1: mais alto = mais próximo da voz original
        style:             0.25,   // expressividade
        use_speaker_boost: true,
      },
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    const msg = err?.detail?.message
      ?? err?.detail?.status
      ?? (typeof err?.detail === 'string' ? err.detail : null)
      ?? err?.message
      ?? `Erro ${response.status}`
    throw new Error(`ElevenLabs: ${msg}`)
  }

  const blob = await response.blob()
  const url  = URL.createObjectURL(blob)
  audioCache.set(key, url)
  return url
}

// ── Reproduz áudio gerado ─────────────────────────────────────
let currentAudio = null

export function playAudioUrl(url) {
  return new Promise((resolve) => {
    stopELAudio()
    currentAudio = new Audio(url)
    currentAudio.onended  = () => resolve()
    currentAudio.onerror  = () => resolve()
    currentAudio.play().catch(() => resolve())
  })
}

export function stopELAudio() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio = null
  }
}

// ── Verifica se API key está configurada ──────────────────────
const DEFAULT_EL_KEY = 'sk_e9855448ec9423515fe05c7205c19a2db888888cfb0b0741'

export function getELApiKey() {
  return localStorage.getItem('forja_el_key') || DEFAULT_EL_KEY
}

export function setELApiKey(key) {
  localStorage.setItem('forja_el_key', key.trim())
}

export function getELVoiceId() {
  return localStorage.getItem('forja_el_voice') ?? EL_VOICES[0].id
}

export function setELVoiceId(id) {
  localStorage.setItem('forja_el_voice', id)
}

export function isELEnabled() {
  return !!getELApiKey()
}

// ── Limpa cache (útil ao trocar de voz) ──────────────────────
export function clearAudioCache() {
  audioCache.forEach(url => URL.revokeObjectURL(url))
  audioCache.clear()
}

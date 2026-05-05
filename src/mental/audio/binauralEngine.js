import * as Tone from 'tone'

// Presets de frequência para cada estado cerebral
export const BRAIN_STATES = {
  alpha: {
    label:       'Alfa',
    hz:          10,
    description: 'Relaxamento leve, aprendizado acelerado',
    emoji:       '🌊',
    color:       '#48b8a6',
    base:        200,
  },
  theta: {
    label:       'Theta',
    hz:          6,
    description: 'Porta do subconsciente, estado hipnagógico',
    emoji:       '🌀',
    color:       '#a29bfe',
    base:        200,
  },
  delta: {
    label:       'Delta',
    hz:          2,
    description: 'Sono profundo, regeneração celular',
    emoji:       '🌙',
    color:       '#74b9ff',
    base:        200,
  },
}

let leftOsc    = null
let rightOsc   = null
let leftPanner = null
let rightPanner= null
let isRunning  = false

export async function startBinaural(stateKey = 'theta', volume = -20) {
  await Tone.start()
  stopBinaural()

  const state = BRAIN_STATES[stateKey]
  const { base, hz } = state

  // Oscilador ESQUERDO
  leftOsc    = new Tone.Oscillator(base, 'sine')
  leftPanner = new Tone.Panner(-1)  // 100% esquerda
  leftOsc.volume.value = volume

  // Oscilador DIREITO (frequência levemente diferente → beat na diferença)
  rightOsc    = new Tone.Oscillator(base + hz, 'sine')
  rightPanner = new Tone.Panner(1)  // 100% direita
  rightOsc.volume.value = volume

  leftOsc.connect(leftPanner)
  rightOsc.connect(rightPanner)
  leftPanner.toDestination()
  rightPanner.toDestination()

  leftOsc.start()
  rightOsc.start()
  isRunning = true
}

export function stopBinaural() {
  try {
    leftOsc?.stop();  leftOsc?.dispose()
    rightOsc?.stop(); rightOsc?.dispose()
    leftPanner?.dispose()
    rightPanner?.dispose()
  } catch {}
  leftOsc = rightOsc = leftPanner = rightPanner = null
  isRunning = false
}

export function setBinauralVolume(db) {
  if (leftOsc)  leftOsc.volume.rampTo(db, 0.5)
  if (rightOsc) rightOsc.volume.rampTo(db, 0.5)
}

export function isBinauralRunning() { return isRunning }

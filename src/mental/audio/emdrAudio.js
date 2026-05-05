import * as Tone from 'tone'

let leftSynth  = null
let rightSynth = null
let loop       = null
let isRunning  = false
let currentStep = 0  // para alternar L/R

export async function startEMDRAudio(speedMs = 1500) {
  await Tone.start()
  stopEMDRAudio()

  leftSynth = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope:   { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 },
    volume: -10,
  })
  rightSynth = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope:   { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 },
    volume: -10,
  })

  const leftPanner  = new Tone.Panner(-1).toDestination()
  const rightPanner = new Tone.Panner(1).toDestination()
  leftSynth.connect(leftPanner)
  rightSynth.connect(rightPanner)

  currentStep = 0
  loop = new Tone.Loop((time) => {
    if (currentStep % 2 === 0) {
      leftSynth.triggerAttackRelease('C5', '16n', time)
    } else {
      rightSynth.triggerAttackRelease('G4', '16n', time)
    }
    currentStep++
  }, `${speedMs / 1000}`)

  Tone.getTransport().start()
  loop.start(0)
  isRunning = true
}

export function stopEMDRAudio() {
  try {
    loop?.stop(); loop?.dispose()
    leftSynth?.dispose()
    rightSynth?.dispose()
    Tone.getTransport().stop()
  } catch {}
  loop = leftSynth = rightSynth = null
  isRunning = false
}

export function isEMDRRunning() { return isRunning }

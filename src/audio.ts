import { Howl } from 'howler'

const tones = { stamp: [115, 0.13], key: [460, 0.045], incoming: [620, 0.16], success: [810, 0.2], warning: [165, 0.23] } as const
const sounds = new Map<keyof typeof tones, Howl>()

function wave(frequency: number, duration: number) {
  const rate = 16000
  const count = Math.floor(rate * duration)
  const buffer = new ArrayBuffer(44 + count * 2)
  const bytes = new DataView(buffer)
  const tag = (at: number, value: string) => [...value].forEach((letter, index) => bytes.setUint8(at + index, letter.charCodeAt(0)))
  tag(0, 'RIFF'); bytes.setUint32(4, 36 + count * 2, true); tag(8, 'WAVE')
  tag(12, 'fmt '); bytes.setUint32(16, 16, true); bytes.setUint16(20, 1, true)
  bytes.setUint16(22, 1, true); bytes.setUint32(24, rate, true); bytes.setUint32(28, rate * 2, true)
  bytes.setUint16(32, 2, true); bytes.setUint16(34, 16, true)
  tag(36, 'data'); bytes.setUint32(40, count * 2, true)
  for (let index = 0; index < count; index++) {
    const t = index / rate
    const envelope = Math.min(1, t * 500) * (1 - index / count) ** 2
    const sample = Math.sin(t * frequency * Math.PI * 2) + Math.sin(t * frequency * Math.PI * 4.05) * 0.2
    bytes.setInt16(44 + index * 2, sample * envelope * 6500, true)
  }
  let binary = ''
  for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte)
  return 'data:audio/wav;base64,' + btoa(binary)
}

export function play(effect: keyof typeof tones, muted: boolean) {
  if (muted) return
  try {
    let sound = sounds.get(effect)
    if (!sound) {
      const [frequency, duration] = tones[effect]
      sound = new Howl({ src: [wave(frequency, duration)], format: ['wav'], volume: 0.42 })
      sounds.set(effect, sound)
    }
    sound.play()
  } catch {
    // Sound is optional.
  }
}

export function setMuted(muted: boolean) {
  if (muted) sounds.forEach(sound => sound.stop())
}

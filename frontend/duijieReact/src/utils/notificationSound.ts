let audioCtx: AudioContext | null = null
let unlocked = false
let lastPlayTime = 0
const MIN_INTERVAL = 2000

function unlockAudio() {
  if (unlocked) return
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    if (audioCtx.state === 'suspended') {
      audioCtx.resume()
    }
    const buf = audioCtx.createBuffer(1, 1, 22050)
    const src = audioCtx.createBufferSource()
    src.buffer = buf
    src.connect(audioCtx.destination)
    src.start(0)
    unlocked = true
  } catch { /* silent */ }
}

document.addEventListener('click', unlockAudio, { capture: true })
document.addEventListener('touchstart', unlockAudio, { capture: true })
document.addEventListener('keydown', unlockAudio, { capture: true })

export function playNotificationSound() {
  const now = Date.now()
  if (now - lastPlayTime < MIN_INTERVAL) return
  lastPlayTime = now

  if (!audioCtx || audioCtx.state === 'suspended') {
    unlockAudio()
    if (!audioCtx || audioCtx.state !== 'running') return
  }

  try {
    const t = audioCtx.currentTime

    const gain = audioCtx.createGain()
    gain.connect(audioCtx.destination)
    gain.gain.setValueAtTime(0.4, t)
    gain.gain.linearRampToValueAtTime(0.3, t + 0.1)
    gain.gain.linearRampToValueAtTime(0, t + 0.5)

    const osc1 = audioCtx.createOscillator()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(880, t)
    osc1.connect(gain)
    osc1.start(t)
    osc1.stop(t + 0.2)

    const gain2 = audioCtx.createGain()
    gain2.connect(audioCtx.destination)
    gain2.gain.setValueAtTime(0.35, t + 0.2)
    gain2.gain.linearRampToValueAtTime(0, t + 0.5)

    const osc2 = audioCtx.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(1174.66, t + 0.2)
    osc2.connect(gain2)
    osc2.start(t + 0.2)
    osc2.stop(t + 0.5)
  } catch { /* silent */ }
}

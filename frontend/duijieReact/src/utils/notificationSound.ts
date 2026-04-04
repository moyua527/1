let audioElement: HTMLAudioElement | null = null
let lastPlayTime = 0
const MIN_INTERVAL = 1500

function writeStr(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
}

function buildWav(): string {
  const rate = 44100
  const dur = 0.35
  const n = Math.floor(rate * dur)
  const headerSize = 44
  const dataSize = n * 2
  const buf = new ArrayBuffer(headerSize + dataSize)
  const v = new DataView(buf)

  writeStr(v, 0, 'RIFF')
  v.setUint32(4, headerSize + dataSize - 8, true)
  writeStr(v, 8, 'WAVE')
  writeStr(v, 12, 'fmt ')
  v.setUint32(16, 16, true)
  v.setUint16(20, 1, true)
  v.setUint16(22, 1, true)
  v.setUint32(24, rate, true)
  v.setUint32(28, rate * 2, true)
  v.setUint16(32, 2, true)
  v.setUint16(34, 16, true)
  writeStr(v, 36, 'data')
  v.setUint32(40, dataSize, true)

  for (let i = 0; i < n; i++) {
    const t = i / rate
    const env = Math.exp(-t * 12) * (1 - Math.exp(-t * 500))
    const sig =
      Math.sin(2 * Math.PI * 880 * t) * 0.45 +
      Math.sin(2 * Math.PI * 1318.5 * t) * 0.30 +
      Math.sin(2 * Math.PI * 1760 * t) * 0.15 +
      Math.sin(2 * Math.PI * 2640 * t) * 0.10
    v.setInt16(headerSize + i * 2, Math.max(-32768, Math.min(32767, sig * env * 32767 | 0)), true)
  }

  const bytes = new Uint8Array(buf)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return 'data:audio/wav;base64,' + btoa(bin)
}

function ensureAudio() {
  if (audioElement) return
  audioElement = new Audio(buildWav())
  audioElement.volume = 0.8
  audioElement.load()
}

function warmUp() {
  ensureAudio()
  if (!audioElement) return
  const p = audioElement.play()
  if (p) p.then(() => { audioElement!.pause(); audioElement!.currentTime = 0 }).catch(() => {})
}

if (typeof document !== 'undefined') {
  const opts = { capture: true } as const
  ;['click', 'touchstart', 'keydown'].forEach(e => document.addEventListener(e, warmUp, opts))
}

export function playNotificationSound() {
  const now = Date.now()
  if (now - lastPlayTime < MIN_INTERVAL) return
  lastPlayTime = now

  ensureAudio()
  if (!audioElement) return

  audioElement.currentTime = 0
  const p = audioElement.play()
  if (p) p.catch(() => {})
}

let lastPlayTime = 0
const MIN_INTERVAL = 1500
let cachedWavUrl: string | null = null
let audioPool: HTMLAudioElement[] = []

function writeStr(v: DataView, o: number, s: string) {
  for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i))
}

function getWavUrl(): string {
  if (cachedWavUrl) return cachedWavUrl
  const rate = 22050, dur = 0.4, n = Math.floor(rate * dur)
  const buf = new ArrayBuffer(44 + n * 2)
  const v = new DataView(buf)

  writeStr(v, 0, 'RIFF')
  v.setUint32(4, 36 + n * 2, true)
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
  v.setUint32(40, n * 2, true)

  for (let i = 0; i < n; i++) {
    const t = i / rate
    const attack = Math.min(1, t * 200)
    const decay = Math.exp(-t * 8)
    const env = attack * decay
    const sig =
      Math.sin(2 * Math.PI * 830 * t) * 0.5 +
      Math.sin(2 * Math.PI * 1245 * t) * 0.3 +
      Math.sin(2 * Math.PI * 1660 * t) * 0.2
    const val = Math.max(-32768, Math.min(32767, (sig * env * 32000) | 0))
    v.setInt16(44 + i * 2, val, true)
  }

  const blob = new Blob([buf], { type: 'audio/wav' })
  cachedWavUrl = URL.createObjectURL(blob)
  return cachedWavUrl
}

function getAudio(): HTMLAudioElement {
  const free = audioPool.find(a => a.paused || a.ended)
  if (free) return free
  const a = new Audio()
  a.src = getWavUrl()
  a.volume = 1.0
  audioPool.push(a)
  return a
}

function playViaAudioElement(): boolean {
  try {
    const a = getAudio()
    a.currentTime = 0
    const p = a.play()
    if (p) {
      p.catch(() => {
        console.warn('[notif] Audio play blocked')
        playViaAudioContext()
      })
    }
    return true
  } catch {
    return false
  }
}

function playViaAudioContext() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    const rate = ctx.sampleRate
    const dur = 0.4
    const len = Math.floor(rate * dur)
    const buffer = ctx.createBuffer(1, len, rate)
    const ch = buffer.getChannelData(0)

    for (let i = 0; i < len; i++) {
      const t = i / rate
      const attack = Math.min(1, t * 200)
      const decay = Math.exp(-t * 8)
      const env = attack * decay
      ch[i] = (
        Math.sin(2 * Math.PI * 830 * t) * 0.5 +
        Math.sin(2 * Math.PI * 1245 * t) * 0.3 +
        Math.sin(2 * Math.PI * 1660 * t) * 0.2
      ) * env * 0.9
    }

    const src = ctx.createBufferSource()
    src.buffer = buffer
    const gain = ctx.createGain()
    gain.gain.value = 1.0
    src.connect(gain)
    gain.connect(ctx.destination)
    src.start()
    src.onended = () => ctx.close()
  } catch (e) {
    console.warn('[notif] AudioContext fallback failed', e)
  }
}

export function playNotificationSound() {
  const now = Date.now()
  if (now - lastPlayTime < MIN_INTERVAL) return
  lastPlayTime = now

  console.log('[notif] playing notification sound')
  if (!playViaAudioElement()) {
    playViaAudioContext()
  }
}

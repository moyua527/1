import { isCapacitor, SERVER_URL } from './capacitor'

let initialized = false

function toAbsoluteUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (isCapacitor) {
      return url.replace(/https?:\/\/[^/]+/, SERVER_URL)
    }
    return url
  }
  return `${SERVER_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

export async function initLiveUpdate() {
  if (!isCapacitor || initialized) return
  initialized = true

  try {
    const { CapacitorUpdater } = await import('@capgo/capacitor-updater')

    await CapacitorUpdater.notifyAppReady()

    const res = await fetch(`${SERVER_URL}/api/app/bundle`).then(r => r.json()).catch(() => null)
    if (!res?.success || !res.data?.url || !res.data?.version) return

    const current = await CapacitorUpdater.current()
    const currentVer = current.bundle?.version || 'builtin'
    if (currentVer === res.data.version) return

    const downloadUrl = toAbsoluteUrl(res.data.url)
    console.log(`[LiveUpdate] Downloading ${res.data.version} from ${downloadUrl} (current: ${currentVer})`)
    const bundle = await CapacitorUpdater.download({
      url: downloadUrl,
      version: res.data.version,
    })

    console.log(`[LiveUpdate] Bundle downloaded, applying and reloading...`)
    await CapacitorUpdater.set(bundle)
  } catch (e: any) {
    console.warn('[LiveUpdate] Error:', e?.message || e?.errorMessage || String(e), e)
  }
}

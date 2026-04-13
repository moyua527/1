import { isCapacitor, SERVER_URL } from './capacitor'

let initialized = false
let pendingBundle: any = null
let pendingVersion = ''

function toAbsoluteUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (isCapacitor) {
      return url.replace(/https?:\/\/[^/]+/, SERVER_URL)
    }
    return url
  }
  return `${SERVER_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

export function getPendingBundle() {
  return pendingBundle ? { bundle: pendingBundle, version: pendingVersion } : null
}

export async function applyPendingBundle() {
  if (!pendingBundle) return false
  try {
    const { CapacitorUpdater } = await import('@capgo/capacitor-updater')
    await CapacitorUpdater.set(pendingBundle)
    pendingBundle = null
    return true
  } catch (e: any) {
    console.warn('[LiveUpdate] Apply error:', e?.message || String(e))
    return false
  }
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

    console.log(`[LiveUpdate] Bundle downloaded, waiting for user to apply`)
    pendingBundle = bundle
    pendingVersion = res.data.version
    window.dispatchEvent(new CustomEvent('capacitor-update-available', {
      detail: { version: res.data.version },
    }))
  } catch (e: any) {
    console.warn('[LiveUpdate] Error:', e?.message || e?.errorMessage || String(e), e)
  }
}

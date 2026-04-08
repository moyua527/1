import { isCapacitor, SERVER_URL } from './capacitor'

let initialized = false

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

    console.log(`[LiveUpdate] Downloading new bundle: ${res.data.version} (current: ${currentVer})`)
    const bundle = await CapacitorUpdater.download({
      url: res.data.url,
      version: res.data.version,
    })

    console.log(`[LiveUpdate] Bundle downloaded, setting for next launch`)
    await CapacitorUpdater.set(bundle)
  } catch (e) {
    console.warn('[LiveUpdate] Error:', e)
  }
}

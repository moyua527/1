export const isCapacitor = !!(window as any).Capacitor?.isNativePlatform?.()

export const SERVER_URL = 'http://160.202.253.143:8080'

export const APP_NAME = '对接'
export const APP_ID = 'com.duijie.app'
export const API_BASE_URL = ''
declare const __APP_VERSION__: string
declare const __APP_VERSION_CODE__: number
export const APP_VERSION = __APP_VERSION__
export const APP_VERSION_CODE = __APP_VERSION_CODE__

/**
 * Resolve relative asset paths (e.g. /uploads/xxx) to absolute server URLs
 * in Capacitor environment where local WebView can't serve /uploads/.
 */
export function resolveAssetUrl(path: string | null | undefined): string {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:')) return path
  if (isCapacitor && path.startsWith('/')) return SERVER_URL + path
  return path
}

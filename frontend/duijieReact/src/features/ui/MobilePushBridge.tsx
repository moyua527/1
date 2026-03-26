import { useEffect } from 'react'
import { fetchApi } from '../../bootstrap'
import { APP_VERSION, isCapacitor } from '../../utils/capacitor'
import { toast } from './Toast'

const DEVICE_TOKEN_KEY = 'push_device_token'

type PushPlugin = {
  checkPermissions?: () => Promise<{ receive?: string }>
  requestPermissions?: () => Promise<{ receive?: string }>
  register?: () => Promise<void>
  addListener?: (eventName: string, listenerFunc: (payload: any) => void) => any
}

function getPushPlugin(): PushPlugin | null {
  return ((window as any).Capacitor?.Plugins?.PushNotifications || null) as PushPlugin | null
}

function getPlatform() {
  const ua = navigator.userAgent.toLowerCase()
  return ua.includes('android') ? 'android' : 'ios'
}

export default function MobilePushBridge() {
  useEffect(() => {
    if (!isCapacitor) return
    const push = getPushPlugin()
    if (!push) return

    let mounted = true

    const registerToken = async (tokenValue: string) => {
      const token = String(tokenValue || '').trim()
      if (!token || !mounted) return
      localStorage.setItem(DEVICE_TOKEN_KEY, token)
      await fetchApi('/api/notifications/devices', {
        method: 'POST',
        body: JSON.stringify({ device_token: token, platform: getPlatform(), app_version: APP_VERSION }),
      })
    }

    const init = async () => {
      try {
        const current = push.checkPermissions ? await push.checkPermissions() : { receive: 'granted' }
        const granted = current.receive === 'granted'
          ? current
          : (push.requestPermissions ? await push.requestPermissions() : current)

        if (granted.receive !== 'granted') return

        push.addListener?.('registration', (token: any) => {
          registerToken(token?.value || token?.token || '')
        })
        push.addListener?.('registrationError', () => {
          toast('移动推送注册失败', 'error')
        })
        push.addListener?.('pushNotificationActionPerformed', (event: any) => {
          const link = event?.notification?.data?.link || event?.notification?.link
          if (link) window.location.href = link
        })

        await push.register?.()
      } catch {
        toast('移动推送初始化失败', 'error')
      }
    }

    init()
    return () => { mounted = false }
  }, [])

  return null
}

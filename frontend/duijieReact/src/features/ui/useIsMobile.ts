import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'

/** Capacitor 原生包始终走移动端抽屉侧栏，避免横屏/小平板被误判为桌面布局 */
export default function useIsMobile(breakpoint = 768) {
  const native = typeof window !== 'undefined' && Capacitor.isNativePlatform()
  const [isMobile, setIsMobile] = useState(() => native || window.innerWidth < breakpoint)
  useEffect(() => {
    if (native) return
    const handler = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [breakpoint, native])
  return isMobile
}

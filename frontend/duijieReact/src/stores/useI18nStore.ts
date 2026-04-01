import { create } from 'zustand'
import zhCN from '../data/locales/zh-CN'
import enUS from '../data/locales/en-US'

export type Locale = 'zh-CN' | 'en-US'

const locales: Record<Locale, Record<string, string>> = {
  'zh-CN': zhCN,
  'en-US': enUS,
}

interface I18nState {
  locale: Locale
  messages: Record<string, string>
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

function getStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem('locale')
    if (stored === 'zh-CN' || stored === 'en-US') return stored
  } catch {}
  return 'zh-CN'
}

const useI18nStore = create<I18nState>((set, get) => {
  const initial = getStoredLocale()
  return {
    locale: initial,
    messages: locales[initial],

    setLocale(locale: Locale) {
      localStorage.setItem('locale', locale)
      set({ locale, messages: locales[locale] })
    },

    t(key: string, params?: Record<string, string | number>) {
      let msg = get().messages[key] || key
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          msg = msg.replace(`{${k}}`, String(v))
        })
      }
      return msg
    },
  }
})

export default useI18nStore

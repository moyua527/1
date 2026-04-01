import useI18nStore from '../stores/useI18nStore'

/**
 * 国际化 Hook
 * 
 * 用法：
 *   const { t, locale, setLocale } = useI18n()
 *   <span>{t('nav.dashboard')}</span>
 *   <button onClick={() => setLocale('en-US')}>English</button>
 */
export default function useI18n() {
  const t = useI18nStore(s => s.t)
  const locale = useI18nStore(s => s.locale)
  const setLocale = useI18nStore(s => s.setLocale)

  return { t, locale, setLocale }
}

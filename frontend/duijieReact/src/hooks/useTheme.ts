import useThemeStore from '../stores/useThemeStore'
import type { ThemeColors } from '../stores/useThemeStore'

/**
 * 获取当前主题色值的 Hook
 * 
 * 用法：
 *   const { colors, isDark, toggle } = useTheme()
 *   <div style={{ background: colors.bgPrimary, color: colors.textPrimary }}>
 */
export default function useTheme() {
  const colors = useThemeStore(s => s.colors)
  const resolved = useThemeStore(s => s.resolved)
  const mode = useThemeStore(s => s.mode)
  const setMode = useThemeStore(s => s.setMode)
  const toggle = useThemeStore(s => s.toggle)

  return {
    colors,
    isDark: resolved === 'dark',
    mode,
    setMode,
    toggle,
  }
}

export type { ThemeColors }

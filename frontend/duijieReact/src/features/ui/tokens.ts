/**
 * Design Tokens — JS 层对 CSS 变量的引用常量
 * 组件内需要在 JS 中读取设计值时使用本文件，避免硬编码色值字符串
 * CSS 变量本身定义在 index.html :root / [data-theme="dark"]
 */

/* ── 间距 ── */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const

/* ── 圆角 ── */
export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const

/* ── 字号 ── */
export const fontSize = {
  xs: 11,
  sm: 12,
  md: 13,
  base: 14,
  lg: 16,
  xl: 18,
  '2xl': 22,
} as const

/* ── 字重 ── */
export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const

/* ── 阴影 ── */
export const shadow = {
  sm: '0 1px 3px rgba(0,0,0,0.06)',
  md: '0 4px 12px rgba(0,0,0,0.08)',
  lg: '0 8px 24px rgba(0,0,0,0.12)',
  xl: '0 20px 60px rgba(0,0,0,0.15)',
} as const

/* ── 过渡 ── */
export const transition = {
  fast: '0.15s ease',
  normal: '0.2s ease',
  slow: '0.3s ease',
} as const

/* ── CSS 变量引用（运行时会被主题切换改变） ── */
export const cssVar = {
  // 背景
  bgPrimary: 'var(--bg-primary)',
  bgSecondary: 'var(--bg-secondary)',
  bgTertiary: 'var(--bg-tertiary)',
  bgCard: 'var(--bg-card)',
  bgHover: 'var(--bg-hover)',
  bgSelected: 'var(--bg-selected)',

  // 文字
  textHeading: 'var(--text-heading)',
  textPrimary: 'var(--text-primary)',
  textBody: 'var(--text-body)',
  textSecondary: 'var(--text-secondary)',
  textTertiary: 'var(--text-tertiary)',
  textDisabled: 'var(--text-disabled)',
  textInverse: 'var(--text-inverse)',

  // 边框
  borderPrimary: 'var(--border-primary)',
  borderSecondary: 'var(--border-secondary)',
  borderFocus: 'var(--border-focus)',

  // 品牌色
  brand: 'var(--brand)',
  brandHover: 'var(--brand-hover)',
  brandLight: 'var(--brand-light)',
  brandLight2: 'var(--brand-light-2)',
  brandBorder: 'var(--brand-border)',

  // 语义色
  colorSuccess: 'var(--color-success)',
  colorWarning: 'var(--color-warning)',
  colorDanger: 'var(--color-danger)',
  colorInfo: 'var(--color-info)',
} as const

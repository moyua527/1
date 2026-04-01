/**
 * 自动将 features/ 下所有 .tsx 文件中的硬编码颜色替换为 CSS 变量 var(--xxx)
 * 
 * 策略：简单文本替换，不需要修改 imports 或添加 hooks
 * CSS 变量已在 index.html 和 useThemeStore 中定义
 */

const fs = require('fs')
const path = require('path')

// 颜色映射：硬编码颜色 -> CSS 变量
// 注意：只替换在 style 对象中作为值使用的颜色（单引号包裹）
const COLOR_MAP = {
  // 背景色  
  "'#ffffff'": "'var(--bg-primary)'",
  "'#fff'": "'var(--bg-primary)'",
  "'#f8fafc'": "'var(--bg-secondary)'",
  "'#f1f5f9'": "'var(--bg-tertiary)'",
  "'#eff6ff'": "'var(--bg-selected)'",

  // 文字色
  "'#0f172a'": "'var(--text-heading)'",
  "'#1e293b'": "'var(--text-primary)'",
  "'#334155'": "'var(--text-body)'",
  "'#64748b'": "'var(--text-secondary)'",
  "'#94a3b8'": "'var(--text-tertiary)'",
  "'#cbd5e1'": "'var(--text-disabled)'",

  // 边框色
  "'#e2e8f0'": "'var(--border-primary)'",

  // 品牌色
  "'#2563eb'": "'var(--brand)'",
  "'#1e40af'": "'var(--brand)'",
  "'#1d4ed8'": "'var(--brand-hover)'",
  "'#3b82f6'": "'var(--brand)'",
  "'#dbeafe'": "'var(--brand-light-2)'",
  "'#bfdbfe'": "'var(--brand-border)'",

  // 语义色
  "'#16a34a'": "'var(--color-success)'",
  "'#dc2626'": "'var(--color-danger)'",
  "'#d97706'": "'var(--color-warning)'",
  "'#7c3aed'": "'var(--color-purple)'",
  "'#ea580c'": "'var(--color-orange)'",
}

// 边框模式替换
const BORDER_PATTERNS = [
  { from: "'1px solid #e2e8f0'", to: "'1px solid var(--border-primary)'" },
  { from: "'1px solid #f1f5f9'", to: "'1px solid var(--border-secondary)'" },
  { from: "'2px solid #e2e8f0'", to: "'2px solid var(--border-primary)'" },
  { from: "'3px solid #0f172a'", to: "'3px solid var(--text-heading)'" },
]

// 跳过这些文件
const SKIP_FILES = [
  'Layout.tsx',
  'ThemeToggle.tsx',
]

// 处理单个文件
function processFile(filePath) {
  const fileName = path.basename(filePath)
  if (SKIP_FILES.includes(fileName)) return { skipped: true, file: filePath }
  if (!filePath.endsWith('.tsx')) return { skipped: true, file: filePath }

  let content = fs.readFileSync(filePath, 'utf-8')
  const original = content

  // 1. 替换边框模式（在颜色替换之前）
  for (const p of BORDER_PATTERNS) {
    content = content.split(p.from).join(p.to)
  }

  // 2. 替换颜色
  for (const [from, to] of Object.entries(COLOR_MAP)) {
    content = content.split(from).join(to)
  }

  // 3. 也替换 color= 或 color: 属性中 Lucide icon 使用的颜色（如 color="#2563eb"）
  // 这些是 JSX 属性，用双引号
  const JSX_COLOR_MAP = {
    '"#2563eb"': '"var(--brand)"',
    '"#64748b"': '"var(--text-secondary)"',
    '"#0f172a"': '"var(--text-heading)"',
    '"#16a34a"': '"var(--color-success)"',
    '"#dc2626"': '"var(--color-danger)"',
    '"#d97706"': '"var(--color-warning)"',
    '"#7c3aed"': '"var(--color-purple)"',
    '"#0284c7"': '"var(--brand)"',
  }
  
  // 只替换 color= 属性中的颜色（如 <Icon color="#2563eb" />），不替换其他 JSX 属性
  for (const [from, to] of Object.entries(JSX_COLOR_MAP)) {
    // 匹配 color= 前缀
    content = content.split('color=' + from).join('color=' + to)
  }

  if (content === original) return { skipped: true, noChange: true, file: filePath }

  fs.writeFileSync(filePath, content, 'utf-8')
  return { modified: true, file: filePath }
}

// 递归扫描目录
function scanDir(dir) {
  const results = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...scanDir(full))
    } else if (entry.name.endsWith('.tsx')) {
      results.push(full)
    }
  }
  return results
}

// 主程序
const featuresDir = path.join(__dirname, '..', 'src', 'features')
const files = scanDir(featuresDir)
console.log(`Found ${files.length} .tsx files`)

let modified = 0
let skipped = 0
for (const f of files) {
  const result = processFile(f)
  if (result.modified) {
    console.log(`  ✓ ${path.relative(featuresDir, f)}`)
    modified++
  } else {
    skipped++
  }
}

console.log(`\nDone: ${modified} modified, ${skipped} skipped`)

function normalizeTaskTitlePresets(value) {
  const source = Array.isArray(value)
    ? value
    : (() => {
        if (typeof value !== 'string' || !value.trim()) return []
        try {
          const parsed = JSON.parse(value)
          return Array.isArray(parsed) ? parsed : []
        } catch {
          return []
        }
      })()

  const seen = new Set()
  return source
    .map(item => String(item || '').trim())
    .filter(item => item && item.length <= 200)
    .filter(item => {
      if (seen.has(item)) return false
      seen.add(item)
      return true
    })
}

module.exports = {
  normalizeTaskTitlePresets,
}

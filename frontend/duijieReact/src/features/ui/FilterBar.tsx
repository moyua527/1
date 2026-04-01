import { type ReactNode } from 'react'
import { Search, X } from 'lucide-react'

interface FilterOption { value: string; label: string }

interface Props {
  search: string
  onSearchChange: (v: string) => void
  searchPlaceholder?: string
  filters?: Array<{
    value: string
    onChange: (v: string) => void
    options: FilterOption[]
  }>
  resultCount?: number
  hasFilters?: boolean
  activeFilterCount?: number
  onClearFilters?: () => void
  extra?: ReactNode
}

export default function FilterBar({ search, onSearchChange, searchPlaceholder, filters, resultCount, hasFilters, activeFilterCount, onClearFilters, extra }: Props) {
  return (
    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-secondary)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
      <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 280 }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
        <input
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder || '搜索...'}
          style={{ width: '100%', padding: '7px 30px 7px 32px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-body)' }}
        />
        {search && (
          <button onClick={() => onSearchChange('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 0, display: 'flex' }}>
            <X size={14} />
          </button>
        )}
      </div>
      {filters?.map((f, i) => (
        <select key={i} value={f.value} onChange={e => f.onChange(e.target.value)} style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-body)' }}>
          {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ))}
      {extra}
      {hasFilters && onClearFilters && (
        <button onClick={onClearFilters} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <X size={12} /> 清除筛选{activeFilterCount ? ` (${activeFilterCount})` : ''}
        </button>
      )}
      {resultCount !== undefined && (
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>{resultCount} 条结果</div>
      )}
    </div>
  )
}

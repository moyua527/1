import { useRef } from 'react'
import { Search, X } from 'lucide-react'
import { actionLabel, entityLabel, selectStyle, dateStyle } from './constants'
import useThemeStore from '../../stores/useThemeStore'

interface Props {
  filterAction: string
  filterEntity: string
  searchText: string
  startDate: string
  endDate: string
  onFilterAction: (v: string) => void
  onFilterEntity: (v: string) => void
  onSearch: (v: string) => void
  onStartDate: (v: string) => void
  onEndDate: (v: string) => void
  onClear: () => void
  hasFilters: boolean
}

export default function AuditFilterPanel({ filterAction, filterEntity, searchText, startDate, endDate, onFilterAction, onFilterEntity, onSearch, onStartDate, onEndDate, onClear, hasFilters }: Props) {
  const colors = useThemeStore(s => s.colors)
  return (
    <div style={{ background: colors.bgCard, borderRadius: 12, padding: 16, border: `1px solid ${colors.borderPrimary}`, marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <div>
        <label style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 500, display: 'block', marginBottom: 4 }}>搜索</label>
        <div style={{ position: 'relative' }}>
          <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 10, top: 9 }} />
          <input value={searchText} onChange={e => onSearch(e.target.value)} placeholder="用户/详情/IP"
            style={{ ...selectStyle, paddingLeft: 30, width: 180 }} />
        </div>
      </div>
      <div>
        <label style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 500, display: 'block', marginBottom: 4 }}>操作类型</label>
        <select value={filterAction} onChange={e => onFilterAction(e.target.value)} style={selectStyle}>
          <option value="">全部</option>
          {Object.entries(actionLabel).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      <div>
        <label style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 500, display: 'block', marginBottom: 4 }}>对象类型</label>
        <select value={filterEntity} onChange={e => onFilterEntity(e.target.value)} style={selectStyle}>
          <option value="">全部</option>
          {Object.entries(entityLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div>
        <label style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 500, display: 'block', marginBottom: 4 }}>开始日期</label>
        <input type="date" value={startDate} onChange={e => onStartDate(e.target.value)} style={dateStyle} />
      </div>
      <div>
        <label style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 500, display: 'block', marginBottom: 4 }}>结束日期</label>
        <input type="date" value={endDate} onChange={e => onEndDate(e.target.value)} style={dateStyle} />
      </div>
      {hasFilters && (
        <button onClick={onClear} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 12px', borderRadius: 8, border: 'none', background: '#fee2e2', color: 'var(--color-danger)', fontSize: 13, cursor: 'pointer', fontWeight: 500, marginBottom: 0 }}>
          <X size={13} /> 清除
        </button>
      )}
    </div>
  )
}

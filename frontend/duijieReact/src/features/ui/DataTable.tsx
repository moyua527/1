import { type ReactNode, type CSSProperties, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Column<T> {
  key: string
  title: string
  width?: number | string
  render: (row: T, index: number) => ReactNode
  headerStyle?: CSSProperties
}

interface Props<T> {
  columns: Column<T>[]
  data: T[]
  rowKey: (row: T) => string | number
  selected?: Set<string | number>
  onSelect?: (id: string | number) => void
  onSelectAll?: () => void
  allSelected?: boolean
  indeterminate?: boolean
  page?: number
  totalPages?: number
  onPageChange?: (p: number) => void
  totalCount?: number
  pageSize?: number
  onRowClick?: (row: T) => void
}

const thStyle: CSSProperties = { padding: '10px 16px', fontSize: 12, fontWeight: 500, color: 'var(--text-tertiary)', textAlign: 'left', borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', whiteSpace: 'nowrap' }
const tdStyle: CSSProperties = { padding: '12px 16px' }

export default function DataTable<T>({ columns, data, rowKey, selected, onSelect, onSelectAll, allSelected, indeterminate, page, totalPages, onPageChange, totalCount, pageSize, onRowClick }: Props<T>) {
  const checkboxRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (checkboxRef.current) checkboxRef.current.indeterminate = !!indeterminate && !allSelected
  }, [indeterminate, allSelected])

  return (
    <>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {onSelect && (
                <th style={{ ...thStyle, width: 40 }}>
                  <input ref={checkboxRef} type="checkbox" checked={allSelected} onChange={onSelectAll} style={{ cursor: 'pointer' }} />
                </th>
              )}
              {columns.map(col => (
                <th key={col.key} style={{ ...thStyle, width: col.width, ...col.headerStyle }}>{col.title}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => {
              const key = rowKey(row)
              return (
                <tr key={key} style={{ borderBottom: '1px solid var(--border-secondary)', cursor: onRowClick ? 'pointer' : undefined }} onClick={() => onRowClick?.(row)}>
                  {onSelect && (
                    <td style={tdStyle}>
                      <input type="checkbox" checked={selected?.has(key)} onChange={e => { e.stopPropagation(); onSelect(key) }} style={{ cursor: 'pointer' }} />
                    </td>
                  )}
                  {columns.map(col => (
                    <td key={col.key} style={tdStyle}>{col.render(row, idx)}</td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {page && totalPages && totalPages > 1 && onPageChange && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--border-secondary)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            {((page - 1) * (pageSize || 10)) + 1}–{Math.min(page * (pageSize || 10), totalCount || 0)} / {totalCount}
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', cursor: page <= 1 ? 'not-allowed' : 'pointer', color: page <= 1 ? 'var(--text-disabled)' : 'var(--text-body)', display: 'flex' }}><ChevronLeft size={14} /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2).map((p, idx, arr) => {
              const prev = arr[idx - 1]
              const showEllipsis = prev && p - prev > 1
              return (
                <span key={p}>
                  {showEllipsis && <span style={{ padding: '0 4px', color: 'var(--text-tertiary)', fontSize: 12 }}>…</span>}
                  <button onClick={() => onPageChange(p)} style={{ minWidth: 30, padding: '5px 8px', borderRadius: 6, border: p === page ? 'none' : '1px solid var(--border-primary)', background: p === page ? 'var(--brand)' : 'var(--bg-primary)', color: p === page ? '#fff' : 'var(--text-body)', fontSize: 12, fontWeight: p === page ? 600 : 400, cursor: 'pointer' }}>{p}</button>
                </span>
              )
            })}
            <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', cursor: page >= totalPages ? 'not-allowed' : 'pointer', color: page >= totalPages ? 'var(--text-disabled)' : 'var(--text-body)', display: 'flex' }}><ChevronRight size={14} /></button>
          </div>
        </div>
      )}
    </>
  )
}

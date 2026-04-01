import { type ReactNode, type CSSProperties, useRef, useEffect } from 'react'
import Pagination from './Pagination'

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
                <tr key={key} style={{ borderBottom: '1px solid var(--border-secondary)', cursor: onRowClick ? 'pointer' : undefined, transition: 'background 0.15s' }} onClick={() => onRowClick?.(row)}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
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
        <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} totalCount={totalCount} pageSize={pageSize} />
      )}
    </>
  )
}

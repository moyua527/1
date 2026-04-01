import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  totalCount?: number
  pageSize?: number
}

export default function Pagination({ page, totalPages, onPageChange, totalCount, pageSize = 10 }: Props) {
  if (totalPages <= 1) return null

  const btnBase: React.CSSProperties = {
    padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border-primary)',
    background: 'var(--bg-primary)', cursor: 'pointer', color: 'var(--text-body)', display: 'flex',
  }
  const btnDisabled: React.CSSProperties = { cursor: 'not-allowed', color: 'var(--text-disabled)' }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--border-secondary)' }}>
      {totalCount !== undefined ? (
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
          {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} / {totalCount}
        </div>
      ) : <div />}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} style={{ ...btnBase, ...(page <= 1 ? btnDisabled : {}) }}>
          <ChevronLeft size={14} />
        </button>
        {pages.map((p, idx, arr) => {
          const prev = arr[idx - 1]
          const showEllipsis = prev && p - prev > 1
          return (
            <span key={p}>
              {showEllipsis && <span style={{ padding: '0 4px', color: 'var(--text-tertiary)', fontSize: 12 }}>…</span>}
              <button onClick={() => onPageChange(p)} style={{
                minWidth: 30, padding: '5px 8px', borderRadius: 6,
                border: p === page ? 'none' : '1px solid var(--border-primary)',
                background: p === page ? 'var(--brand)' : 'var(--bg-primary)',
                color: p === page ? '#fff' : 'var(--text-body)',
                fontSize: 12, fontWeight: p === page ? 600 : 400, cursor: 'pointer',
              }}>{p}</button>
            </span>
          )
        })}
        <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} style={{ ...btnBase, ...(page >= totalPages ? btnDisabled : {}) }}>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

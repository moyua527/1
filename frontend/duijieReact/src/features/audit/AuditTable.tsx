import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { actionLabel, entityLabel } from './constants'
import useThemeStore from '../../stores/useThemeStore'

interface AuditTableProps {
  logs: any[]
  page: number
  totalPages: number
  onPageChange: (p: number) => void
}

export default function AuditTable({ logs, page, totalPages, onPageChange }: AuditTableProps) {
  const colors = useThemeStore(s => s.colors)
  const tableRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: logs.length,
    getScrollElement: () => tableRef.current,
    estimateSize: () => 42,
    overscan: 10,
  })

  return (
    <div style={{ background: colors.bgCard, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: colors.bgSecondary, borderBottom: `1px solid ${colors.borderPrimary}` }}>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: colors.textSecondary, whiteSpace: 'nowrap' }}>时间</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: colors.textSecondary, whiteSpace: 'nowrap' }}>用户</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: colors.textSecondary, whiteSpace: 'nowrap' }}>操作</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: colors.textSecondary, whiteSpace: 'nowrap' }}>对象</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: colors.textSecondary }}>详情</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: colors.textSecondary, whiteSpace: 'nowrap' }}>IP</th>
            </tr>
          </thead>
        </table>
      </div>
      {logs.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: colors.textTertiary }}>暂无日志记录</div>
      ) : (
        <div ref={tableRef} style={{ maxHeight: 600, overflowY: 'auto', overflowX: 'auto' }}>
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map(vRow => {
              const log = logs[vRow.index]
              const a = actionLabel[log.action] || { label: log.action, color: '#6b7280' }
              return (
                <div key={log.id} data-index={vRow.index}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: vRow.size, transform: `translateY(${vRow.start}px)`,
                    display: 'flex', alignItems: 'center', borderBottom: `1px solid ${colors.borderSecondary}`, fontSize: 13 }}>
                  <div style={{ padding: '10px 16px', whiteSpace: 'nowrap', color: colors.textSecondary, width: '18%', flexShrink: 0 }}>{new Date(log.created_at).toLocaleString('zh-CN')}</div>
                  <div style={{ padding: '10px 16px', whiteSpace: 'nowrap', color: colors.textPrimary, fontWeight: 500, width: '12%', flexShrink: 0 }}>{log.nickname || log.username || '-'}</div>
                  <div style={{ padding: '10px 16px', whiteSpace: 'nowrap', width: '10%', flexShrink: 0 }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: a.color + '18', color: a.color, fontWeight: 600 }}>{a.label}</span>
                  </div>
                  <div style={{ padding: '10px 16px', whiteSpace: 'nowrap', color: colors.textSecondary, width: '14%', flexShrink: 0 }}>
                    {entityLabel[log.entity_type] || log.entity_type || '-'}
                    {log.entity_id ? ` #${log.entity_id}` : ''}
                  </div>
                  <div style={{ padding: '10px 16px', color: colors.textPrimary, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.detail || '-'}</div>
                  <div style={{ padding: '10px 16px', whiteSpace: 'nowrap', color: colors.textTertiary, fontFamily: 'monospace', fontSize: 11, width: '12%', flexShrink: 0 }}>{log.ip || '-'}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16, borderTop: `1px solid ${colors.borderSecondary}` }}>
          <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1}
            style={{ display: 'flex', alignItems: 'center', padding: '4px 10px', borderRadius: 6, border: `1px solid ${colors.borderPrimary}`, background: colors.bgCard, cursor: page <= 1 ? 'default' : 'pointer', color: page <= 1 ? colors.textTertiary : colors.textSecondary }}>
            <ChevronLeft size={16} /> 上一页
          </button>
          <span style={{ fontSize: 13, color: colors.textSecondary }}>{page} / {totalPages}</span>
          <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
            style={{ display: 'flex', alignItems: 'center', padding: '4px 10px', borderRadius: 6, border: `1px solid ${colors.borderPrimary}`, background: colors.bgCard, cursor: page >= totalPages ? 'default' : 'pointer', color: page >= totalPages ? colors.textTertiary : colors.textSecondary }}>
            下一页 <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

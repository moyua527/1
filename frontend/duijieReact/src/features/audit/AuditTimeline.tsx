import { Calendar } from 'lucide-react'
import { actionLabel, entityLabel } from './constants'
import useThemeStore from '../../stores/useThemeStore'

interface Props {
  logs: any[]
}

export default function AuditTimeline({ logs }: Props) {
  const colors = useThemeStore(s => s.colors)
  let lastDate = ''

  if (logs.length === 0) {
    return <div style={{ padding: 32, textAlign: 'center', color: colors.textTertiary }}>暂无日志记录</div>
  }

  return (
    <div style={{ background: colors.bgCard, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', padding: 24, maxHeight: 650, overflowY: 'auto' }}>
      {logs.map((log: any) => {
        const a = actionLabel[log.action] || { label: log.action, color: '#6b7280' }
        const date = new Date(log.created_at).toLocaleDateString('zh-CN')
        const time = new Date(log.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        const showDate = date !== lastDate
        lastDate = date
        return (
          <div key={log.id}>
            {showDate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0 8px', paddingLeft: 20 }}>
                <Calendar size={14} color="var(--brand)" />
                <span style={{ fontSize: 13, fontWeight: 700, color: colors.brandPrimary }}>{date}</span>
                <div style={{ flex: 1, height: 1, background: colors.borderPrimary }} />
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, paddingLeft: 20, position: 'relative' }}>
              <div style={{ position: 'absolute', left: 28, top: 0, bottom: 0, width: 2, background: colors.bgTertiary }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: a.color, flexShrink: 0, marginTop: 6, zIndex: 1, border: '2px solid #fff', boxShadow: '0 0 0 2px ' + a.color + '30' }} />
              <div style={{ flex: 1, paddingBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: colors.textTertiary, fontFamily: 'monospace' }}>{time}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>{log.nickname || log.username || '-'}</span>
                  <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 4, background: a.color + '18', color: a.color, fontWeight: 600 }}>{a.label}</span>
                  <span style={{ fontSize: 12, color: colors.textSecondary }}>{entityLabel[log.entity_type] || log.entity_type || '-'}{log.entity_id ? ` #${log.entity_id}` : ''}</span>
                </div>
                {log.detail && <div style={{ fontSize: 12, color: colors.textPrimary, marginTop: 3, lineHeight: 1.5 }}>{log.detail}</div>}
                {log.ip && <div style={{ fontSize: 11, color: colors.textTertiary, marginTop: 2, fontFamily: 'monospace' }}>{log.ip}</div>}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

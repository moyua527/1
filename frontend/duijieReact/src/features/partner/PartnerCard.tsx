import { useState } from 'react'
import { Copy, RotateCcw, Trash2, Eye, EyeOff, Edit2, Monitor } from 'lucide-react'
import Badge from '../ui/Badge'
import { card } from './constants'
import type { Partner } from './constants'
import useThemeStore from '../../stores/useThemeStore'

interface Props {
  partner: Partner
  onView: (p: Partner) => void
  onEdit: (p: Partner) => void
  onDelete: (p: Partner) => void
  onToggle: (p: Partner) => void
  onCopyKey: (key: string) => void
  onResetKey: (p: Partner) => void
}

export default function PartnerCard({ partner: p, onView, onEdit, onDelete, onToggle, onCopyKey, onResetKey }: Props) {
  const colors = useThemeStore(s => s.colors)
  const [keyVisible, setKeyVisible] = useState(false)

  const maskKey = (key: string) => key.substring(0, 6) + '••••••••••••••••'

  return (
    <div style={{ ...card, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 24px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: p.is_active ? colors.bgSelected : colors.bgSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Monitor size={24} color={p.is_active ? colors.brandPrimary : colors.textTertiary} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 600, color: colors.textPrimary }}>{p.partner_name}</div>
            <div style={{ fontSize: 12, color: colors.textTertiary, marginTop: 2 }}>
              {p.partner_url ? <span style={{ fontFamily: 'monospace' }}>{p.partner_url}</span> : '未配置地址'}
            </div>
          </div>
          <Badge color={p.is_active ? 'green' : 'gray'}>{p.is_active ? '在线' : '离线'}</Badge>
        </div>

        {p.notes && <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 12, padding: '8px 12px', background: colors.bgSecondary, borderRadius: 8 }}>{p.notes}</div>}

        {/* API Key 小行 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: colors.textTertiary }}>
          <span>Key: {keyVisible ? p.api_key : maskKey(p.api_key)}</span>
          <button onClick={() => setKeyVisible(!keyVisible)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textTertiary, display: 'flex', padding: 0 }}>
            {keyVisible ? <EyeOff size={11} /> : <Eye size={11} />}
          </button>
          <button onClick={() => onCopyKey(p.api_key)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.brandPrimary, display: 'flex', padding: 0 }}><Copy size={11} /></button>
          <button onClick={() => onResetKey(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f59e0b', display: 'flex', padding: 0 }}><RotateCcw size={11} /></button>
        </div>
      </div>

      {/* 底部按钮 */}
      <div style={{ padding: '12px 24px', borderTop: `1px solid ${colors.borderSecondary}`, display: 'flex', gap: 8 }}>
        {p.partner_url ? (
          <button onClick={() => onView(p)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', background: colors.brandPrimary, color: colors.bgCard, border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
            <Monitor size={16} /> 打开程序
          </button>
        ) : (
          <button onClick={() => onEdit(p)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', background: colors.bgTertiary, color: colors.textSecondary, border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14 }}>
            配置地址后可打开
          </button>
        )}
        <button onClick={() => onEdit(p)} style={{ background: colors.bgTertiary, border: 'none', borderRadius: 10, padding: '10px 12px', cursor: 'pointer', color: colors.textSecondary, display: 'flex' }} title="编辑"><Edit2 size={15} /></button>
        <button onClick={() => onDelete(p)} style={{ background: '#fef2f2', border: 'none', borderRadius: 10, padding: '10px 12px', cursor: 'pointer', color: 'var(--color-danger)', display: 'flex' }} title="删除"><Trash2 size={15} /></button>
      </div>
    </div>
  )
}

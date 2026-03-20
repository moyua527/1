import { createRoot } from 'react-dom/client'

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

export function confirm({ title = '确认', message, confirmText = '确定', cancelText = '取消', danger = false }: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const close = (result: boolean) => {
      root.unmount()
      container.remove()
      resolve(result)
    }

    root.render(
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} onClick={() => close(false)} />
        <div style={{ position: 'relative', background: '#fff', borderRadius: 14, padding: 24, minWidth: 320, maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>{title}</div>
          <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 20 }}>{message}</div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={() => close(false)}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 14, color: '#334155' }}>
              {cancelText}
            </button>
            <button onClick={() => close(true)}
              style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: danger ? '#dc2626' : '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    )
  })
}

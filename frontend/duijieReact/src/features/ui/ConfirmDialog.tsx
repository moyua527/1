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
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'none' }}
        onTouchMove={e => { if (e.target === e.currentTarget) e.preventDefault() }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} onClick={() => close(false)}
          onTouchMove={e => e.preventDefault()} />
        <div style={{ position: 'relative', background: 'var(--bg-primary)', borderRadius: 14, padding: 24, minWidth: 320, maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', touchAction: 'auto' }}
          onClick={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 8 }}>{title}</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>{message}</div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={() => close(false)}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', cursor: 'pointer', fontSize: 14, color: 'var(--text-body)' }}>
              {cancelText}
            </button>
            <button onClick={() => close(true)}
              style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: danger ? 'var(--color-danger)' : 'var(--brand)', color: 'var(--bg-primary)', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    )
  })
}

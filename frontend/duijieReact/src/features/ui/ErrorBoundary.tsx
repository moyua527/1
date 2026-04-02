import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 40, color: 'var(--text-secondary)' }}>
          <h2 style={{ color: 'var(--color-danger, #ef4444)', marginBottom: 8 }}>页面出错了</h2>
          <p style={{ marginBottom: 16, fontSize: 14 }}>{this.state.error?.message || '发生了未知错误'}</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={this.handleRetry}
              style={{ padding: '8px 20px', borderRadius: 6, border: '1px solid var(--border-primary)', background: 'var(--bg-card)', cursor: 'pointer', fontSize: 14 }}
            >
              重试
            </button>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/' }}
              style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: 'var(--brand)', color: '#fff', cursor: 'pointer', fontSize: 14 }}
            >
              返回首页
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

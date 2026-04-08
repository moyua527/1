import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Loader2 } from 'lucide-react'
import { APP_VERSION, APP_VERSION_CODE } from '../../utils/capacitor'
import { fetchApi } from '../../bootstrap'
import { toast } from '../ui/Toast'

export default function AboutPage() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(false)

  const checkUpdate = async () => {
    setChecking(true)
    try {
      const r = await fetchApi('/api/version')
      if (r.success && r.data) {
        const remote = r.data.version
        if (remote !== APP_VERSION) {
          toast(`发现新版本 v${remote}`, 'success')
        } else {
          toast('已是最新版本', 'success')
        }
      } else {
        toast('已是最新版本', 'success')
      }
    } catch {
      toast('检查更新失败', 'error')
    }
    setChecking(false)
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 8px' }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', padding: 8, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={22} />
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 20px' }}>
        <div style={{ marginTop: 32, marginBottom: 16 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20, background: 'var(--brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }}>
            <span style={{ fontSize: 36, fontWeight: 800, color: '#fff' }}>D</span>
          </div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 4 }}>DuiJie</div>
        <div style={{ fontSize: 15, color: 'var(--text-tertiary)', marginBottom: 32 }}>Version {APP_VERSION}</div>

        <div style={{ width: '100%', background: 'var(--bg-primary)', borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
          <div onClick={checkUpdate} style={{
            display: 'flex', alignItems: 'center', padding: '16px 18px', cursor: 'pointer',
            borderBottom: '1px solid var(--border-secondary)',
          }}>
            <span style={{ flex: 1, fontSize: 16, color: 'var(--text-primary)' }}>版本更新</span>
            {checking
              ? <Loader2 size={16} style={{ color: 'var(--text-tertiary)', animation: 'spin 1s linear infinite' }} />
              : <ChevronRight size={18} style={{ color: 'var(--text-tertiary)' }} />}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', padding: '16px 18px' }}>
            <span style={{ flex: 1, fontSize: 16, color: 'var(--text-primary)' }}>构建号</span>
            <span style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>{APP_VERSION_CODE}</span>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ paddingBottom: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text-disabled)', marginBottom: 4 }}>DuiJie · 轻量级项目协作平台</div>
          <div style={{ fontSize: 12, color: 'var(--text-disabled)' }}>Copyright &copy; 2024-{new Date().getFullYear()} DuiJie. All Rights Reserved.</div>
        </div>
      </div>
    </div>
  )
}

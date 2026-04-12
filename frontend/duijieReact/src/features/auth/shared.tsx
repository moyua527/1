import { useState, useEffect, useCallback } from 'react'
import { confirm } from '../ui/ConfirmDialog'

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function useCountdown(initial = 0) {
  const [count, setCount] = useState(initial)

  useEffect(() => {
    if (count <= 0) return
    const t = setTimeout(() => setCount(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [count])

  const start = useCallback((seconds = 60) => setCount(seconds), [])
  return { count, start, active: count > 0 }
}

interface AgreementCheckboxProps {
  agreed: boolean
  onChange: (v: boolean) => void
  onShowTerms: () => void
}

export function AgreementCheckbox({ agreed, onChange, onShowTerms }: AgreementCheckboxProps) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={agreed}
        onChange={e => onChange(e.target.checked)}
        style={{ marginTop: 3, accentColor: 'var(--brand)', width: 16, height: 16, cursor: 'pointer' }}
      />
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        我已阅读并同意{' '}
        <span onClick={e => { e.preventDefault(); onShowTerms() }} style={{ color: 'var(--brand)', cursor: 'pointer', textDecoration: 'underline' }}>
          《用户服务协议》
        </span>
        {' '}和{' '}
        <span onClick={e => { e.preventDefault(); onShowTerms() }} style={{ color: 'var(--brand)', cursor: 'pointer', textDecoration: 'underline' }}>
          《隐私保护政策》
        </span>
      </span>
    </label>
  )
}

export function useAgreement() {
  const [agreed, setAgreed] = useState(false)
  const [showTerms, setShowTerms] = useState(false)

  const check = useCallback(async () => {
    if (agreed) return true
    const ok = await confirm({
      title: '服务协议',
      message: '登录前需同意《用户服务协议》和《隐私保护政策》，是否同意并继续？',
      confirmText: '同意并继续',
      cancelText: '取消',
    })
    if (ok) { setAgreed(true); return true }
    return false
  }, [agreed])

  return { agreed, setAgreed, showTerms, setShowTerms, check }
}

export function TermsModal({ onClose }: { onClose: (agree?: boolean) => void }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}
      onClick={() => onClose()}
    >
      <div
        style={{ background: 'var(--bg-primary)', borderRadius: 16, padding: '28px 24px', width: 520, maxWidth: '100%', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 16, textAlign: 'center' }}>
          用户服务协议与隐私保护政策
        </h2>
        <div style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.8 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)', margin: '16px 0 8px' }}>一、服务协议</h3>
          <p>1. 本平台（DuiJie 对接平台）为用户提供项目管理、客户管理、任务协作、文件交付、即时通讯等服务。</p>
          <p>2. 用户应如实填写注册信息，对账号安全负责，不得将账号转让或借于他人使用。</p>
          <p>3. 用户不得利用本平台从事违法违规活动，不得侵犯他人合法权益。</p>
          <p>4. 本平台有权对违反协议的用户采取限制或禁止使用等措施。</p>
          <p>5. 本平台保留对服务协议的最终解释权和修改权。</p>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)', margin: '16px 0 8px' }}>二、隐私保护政策</h3>
          <p>1. 我们收集的信息仅用于提供和改进服务，不会出售或出租您的个人信息。</p>
          <p>2. 您的密码经过加密存储，我们采用行业标准的安全措施保护您的数据。</p>
          <p>3. 您有权查看、修改或删除您的个人信息，可通过个人设置或联系管理员操作。</p>
          <p>4. 我们可能会使用 Cookie 和类似技术来改善用户体验和安全性。</p>
          <p>5. 如有任何隐私问题，请联系平台管理员。</p>
        </div>
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            onClick={() => onClose(true)}
            style={{ padding: '10px 40px', borderRadius: 8, border: 'none', background: 'var(--brand)', color: 'var(--bg-primary)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            我已阅读并同意
          </button>
        </div>
      </div>
    </div>
  )
}

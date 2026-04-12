import { useState, useCallback } from 'react'
import { FolderKanban, Search, LogOut, Users, Clock, ArrowRight } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Badge from '../ui/Badge'
import { toast } from '../ui/Toast'
import { projectApi } from './services/api'
import useUserStore from '../../stores/useUserStore'
import useEnterpriseStore from '../../stores/useEnterpriseStore'

const statusMap: Record<string, { label: string; color: string }> = {
  planning: { label: '规划中', color: 'blue' },
  in_progress: { label: '进行中', color: 'yellow' },
  review: { label: '审核中', color: 'blue' },
  completed: { label: '已完成', color: 'green' },
  on_hold: { label: '已暂停', color: 'gray' },
}

export default function ProjectOnboarding() {
  const user = useUserStore(s => s.user)
  const logout = useUserStore(s => s.logout)
  const [code, setCode] = useState('')
  const [searching, setSearching] = useState(false)
  const [projectResult, setProjectResult] = useState<any>(null)
  const [searchError, setSearchError] = useState('')
  const [joining, setJoining] = useState(false)
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [loadedPending, setLoadedPending] = useState(false)

  const loadPendingRequests = useCallback(async () => {
    try {
      const r = await projectApi.list({ page: '1', limit: '1' })
      const rows = Array.isArray(r.data) ? r.data : (r.data?.rows || [])
      if (r.success && rows.length > 0) {
        useEnterpriseStore.getState().setHasProjects(true)
        window.location.reload()
        return
      }
    } catch {}
    setLoadedPending(true)
  }, [])

  if (!loadedPending) {
    loadPendingRequests()
  }

  const handleSearch = async () => {
    const trimmed = code.trim()
    if (!trimmed) { toast('请输入项目邀请码', 'error'); return }
    setSearching(true)
    setProjectResult(null)
    setSearchError('')
    try {
      const r = await projectApi.searchByCode(trimmed)
      if (r.success && r.data) {
        setProjectResult(r.data)
      } else {
        setSearchError(r.message || '未找到该项目')
      }
    } catch {
      setSearchError('搜索失败，请检查网络')
    }
    setSearching(false)
  }

  const handleJoin = async () => {
    if (!projectResult) return
    setJoining(true)
    try {
      const r = await projectApi.joinRequest(projectResult.id)
      if (r.success) {
        toast('申请已提交，等待项目管理员审批', 'success')
        setProjectResult({ ...projectResult, has_pending_request: true })
        setPendingRequests(prev => [...prev, { id: projectResult.id, name: projectResult.name }])
      } else {
        toast(r.message || '申请失败', 'error')
      }
    } catch {
      toast('操作失败，请稍后重试', 'error')
    }
    setJoining(false)
  }

  const st = projectResult ? (statusMap[projectResult.status] || statusMap.planning) : null

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 50%, #f5f3ff 100%)', padding: 20 }}>
      <div style={{ position: 'absolute', top: 20, right: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{user?.nickname || user?.username}</span>
        <button onClick={() => logout()} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>
          <LogOut size={14} /> 退出
        </button>
      </div>

      <div style={{ width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: '0 8px 32px rgba(59,130,246,0.3)' }}>
        <FolderKanban size={40} color="#fff" />
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 8, textAlign: 'center' }}>欢迎使用对接平台</h1>
      <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 8, textAlign: 'center', maxWidth: 400 }}>
        输入项目邀请码加入项目，开始协作
      </p>
      <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 32, textAlign: 'center' }}>
        请向项目负责人获取邀请码
      </p>

      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ background: 'var(--bg-primary)', borderRadius: 16, padding: 28, border: '1px solid var(--border-primary)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <Input
                placeholder="输入项目邀请码"
                value={code}
                onChange={e => { setCode(e.target.value); setSearchError(''); setProjectResult(null) }}
                onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
              />
            </div>
            <Button onClick={handleSearch} disabled={searching} style={{ flexShrink: 0 }}>
              <Search size={16} style={{ marginRight: 4 }} />
              {searching ? '搜索中...' : '搜索'}
            </Button>
          </div>

          {searchError && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13 }}>
              {searchError}
            </div>
          )}

          {projectResult && (
            <div style={{ marginTop: 16, padding: 16, background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <FolderKanban size={20} color="var(--brand)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-heading)' }}>{projectResult.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>创建者: {projectResult.creator_name || '未知'}</div>
                </div>
                {st && <Badge color={st.color}>{st.label}</Badge>}
              </div>
              {projectResult.description && (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>{projectResult.description}</div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 14 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={13} /> {projectResult.member_count || 0} 名成员</span>
              </div>

              {projectResult.is_member ? (
                <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, color: '#16a34a', fontSize: 13, fontWeight: 500 }}>
                  你已经是该项目的成员
                </div>
              ) : projectResult.has_pending_request ? (
                <div style={{ padding: '10px 14px', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 8, color: '#92400e', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={14} /> 申请已提交，等待项目管理员审批
                </div>
              ) : (
                <Button onClick={handleJoin} disabled={joining} style={{ width: '100%' }}>
                  <ArrowRight size={16} style={{ marginRight: 4 }} />
                  {joining ? '申请中...' : '申请加入此项目'}
                </Button>
              )}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button onClick={() => { useEnterpriseStore.getState().setHasProjects(true) }} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '8px 20px', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: 14 }}>
            跳过，直接进入 <ArrowRight size={14} />
          </button>
        </div>

        {pendingRequests.length > 0 && (
          <div style={{ marginTop: 20, padding: '16px 24px', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#92400e', marginBottom: 8 }}>待审批的项目申请</div>
            {pendingRequests.map((r: any) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                <FolderKanban size={16} color="#f59e0b" />
                <span style={{ flex: 1, fontSize: 14, color: 'var(--text-heading)' }}>{r.name}</span>
                <span style={{ fontSize: 12, color: '#92400e', background: '#fef3c7', padding: '2px 8px', borderRadius: 6 }}>等待审批</span>
              </div>
            ))}
            <div style={{ fontSize: 12, color: '#b45309', marginTop: 8 }}>审批通过后刷新页面即可进入平台</div>
            <Button variant="secondary" onClick={() => window.location.reload()} style={{ marginTop: 8 }}>刷新页面</Button>
          </div>
        )}
      </div>
    </div>
  )
}

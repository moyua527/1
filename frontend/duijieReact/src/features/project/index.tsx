import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { Plus, FolderKanban, Loader2, Download, Search, Trash2, RotateCcw, Upload, Link, MoreVertical, X } from 'lucide-react'
import { projectApi } from './services/api'
import { can } from '../../stores/permissions'
import { useProjects, useInvalidate, useProjectUnreadSummary } from '../../hooks/useApi'
import Button from '../ui/Button'

import Modal from '../ui/Modal'
import Input from '../ui/Input'
import { toast } from '../ui/Toast'
import { confirm } from '../ui/ConfirmDialog'
import PageHeader from '../ui/PageHeader'
import EmptyState from '../ui/EmptyState'
import useLiveData from '../../hooks/useLiveData'
import { onSocket } from '../ui/smartSocket'
import { getProjectIcon } from '../../utils/projectIcons'
import useProjectTabStore from '../../stores/useProjectTabStore'

const statusMap: Record<string, string> = {
  planning: '规划中', in_progress: '进行中', review: '审核中', completed: '已完成', on_hold: '已暂停',
}

export default function ProjectList() {
  const { data: projects = [], isLoading: loading } = useProjects()
  const invalidate = useInvalidate()
  const [showCreate, setShowCreate] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [search, setSearch] = useState('')
  const [showJoin, setShowJoin] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinResult, setJoinResult] = useState<any>(null)
  const [joinSearching, setJoinSearching] = useState(false)
  const [joinSubmitting, setJoinSubmitting] = useState(false)
  const [joinMessage, setJoinMessage] = useState('')
  const [showTrash, setShowTrash] = useState(false)
  const [trashList, setTrashList] = useState<any[]>([])
  const [trashLoading, setTrashLoading] = useState(false)
  const [restoringId, setRestoringId] = useState<number | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [showJoinLink, setShowJoinLink] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [joinLinkSubmitting, setJoinLinkSubmitting] = useState(false)
  const nav = useNavigate()
  const { user, isMobile } = useOutletContext<{ user: any; isMobile?: boolean }>()
  const canCreate = can(user?.role || '', 'project:create')
  const openTab = useProjectTabStore(s => s.openTab)
  const projectTabs = useProjectTabStore(s => s.tabs)
  const closeTab = useProjectTabStore(s => s.closeTab)
  const reorderTabs = useProjectTabStore(s => s.reorderTabs)
  const homeTabScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: WheelEvent) => {
      const el = e.currentTarget as HTMLDivElement
      if (el && el.scrollWidth > el.clientWidth) {
        e.preventDefault()
        el.scrollBy({ left: e.deltaY || e.deltaX, behavior: 'smooth' })
      }
    }
    const el = homeTabScrollRef.current
    el?.addEventListener('wheel', handler, { passive: false })
    return () => el?.removeEventListener('wheel', handler)
  })

  const reorderRef = useRef<{ id: number; startX: number; moved: boolean; pointerId: number } | null>(null)
  const [slidingId, setSlidingId] = useState<number | null>(null)
  const projectTabsRef = useRef(projectTabs)
  projectTabsRef.current = projectTabs

  const onContainerPointerDown = useCallback((e: React.PointerEvent) => {
    const tabEl = (e.target as HTMLElement).closest('[data-tab-id]') as HTMLElement | null
    if (!tabEl || (e.target as HTMLElement).closest('button')) return
    const tabId = Number(tabEl.dataset.tabId)
    reorderRef.current = { id: tabId, startX: e.clientX, moved: false, pointerId: e.pointerId }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const onContainerPointerMove = useCallback((e: React.PointerEvent) => {
    const r = reorderRef.current
    if (!r) return
    const dx = e.clientX - r.startX
    if (Math.abs(dx) > 8) r.moved = true
    if (!r.moved) return
    setSlidingId(r.id)
    const tabs = projectTabsRef.current
    const idx = tabs.findIndex(t => t.id === r.id)
    if (idx < 0) return
    const container = e.currentTarget as HTMLElement
    const els = Array.from(container.querySelectorAll('[data-tab-id]')) as HTMLElement[]
    const curEl = els[idx]
    if (!curEl) return
    const w = curEl.offsetWidth
    if (dx > w * 0.5 && idx < tabs.length - 1) {
      reorderTabs(r.id, tabs[idx + 1].id)
      r.startX = e.clientX
    } else if (dx < -w * 0.5 && idx > 0) {
      reorderTabs(r.id, tabs[idx - 1].id)
      r.startX = e.clientX
    }
  }, [reorderTabs])

  const onContainerPointerUp = useCallback(() => {
    reorderRef.current = null
    setSlidingId(null)
  }, [])

  const { data: unreadSummary = {} } = useProjectUnreadSummary()
  const [dismissedSet, setDismissedSet] = useState<Set<number>>(new Set())

  const clearUnread = useCallback((pid: number) => {
    setDismissedSet(prev => new Set(prev).add(pid))
  }, [])

  const load = useCallback(() => { invalidate('projects'); invalidate('project-unread-summary') }, [invalidate])
  useLiveData(['project'], load)

  useEffect(() => {
    const refresh = () => invalidate('project-unread-summary')
    const offNotif = onSocket('new_notification', (payload: any) => {
      const link = payload?.link || ''
      const m = link.match(/\/projects\/(\d+)/)
      if (m) { setDismissedSet(prev => { const n = new Set(prev); n.delete(Number(m[1])); return n }); refresh() }
    })
    const offMsg = onSocket('new_message', (payload: any) => {
      if (payload?.project_id) { setDismissedSet(prev => { const n = new Set(prev); n.delete(Number(payload.project_id)); return n }); refresh() }
    })
    const offData = onSocket('data_changed', (payload: any) => {
      const pid = payload?.project_id ? Number(payload.project_id) : 0
      if (pid) { setDismissedSet(prev => { const n = new Set(prev); n.delete(pid); return n }); refresh() }
    })
    const offTask = onSocket('task_created', (payload: any) => {
      if (payload?.project_id) { setDismissedSet(prev => { const n = new Set(prev); n.delete(Number(payload.project_id)); return n }); refresh() }
    })
    return () => { offNotif(); offMsg(); offData(); offTask() }
  }, [invalidate])

  const filtered = projects.filter((p: any) => {
    if (search) {
      const s = search.toLowerCase()
      const displayName = (p.my_nickname || p.name || '').toLowerCase()
      if (!displayName.includes(s)) return false
    }
    return true
  })

  const handleCreate = async () => {
    if (!form.name.trim()) { toast('请输入项目名称', 'error'); return }
    setSubmitting(true)
    const r = await projectApi.create({ name: form.name.trim(), description: form.description.trim() })
    setSubmitting(false)
    if (r.success) { toast('项目创建成功', 'success'); window.dispatchEvent(new CustomEvent('onboarding-done', { detail: { type: 'create_project' } })); setShowCreate(false); setForm({ name: '', description: '' }); load() }
    else toast(r.message || '创建失败', 'error')
  }

  const handleJoinSearch = async () => {
    if (!joinCode.trim()) { toast('请输入项目ID', 'error'); return }
    setJoinSearching(true); setJoinResult(null)
    const r = await projectApi.searchByCode(joinCode.trim())
    setJoinSearching(false)
    if (r.success) setJoinResult(r.data)
    else toast(r.message || '未找到该项目', 'error')
  }

  const handleJoinByLink = async () => {
    if (!inviteLink.trim()) { toast('请输入邀请链接', 'error'); return }
    let token = inviteLink.trim()
    const match = token.match(/[?&]token=([^&]+)/)
    if (match) token = match[1]
    setJoinLinkSubmitting(true)
    const r = await projectApi.joinByInvite(token)
    setJoinLinkSubmitting(false)
    if (r.success) { toast(r.message || '加入成功', 'success'); setShowJoinLink(false); setInviteLink(''); load() }
    else toast(r.message || '加入失败', 'error')
  }

  const handleJoinSubmit = async () => {
    if (!joinResult) return
    setJoinSubmitting(true)
    const r = await projectApi.joinRequest(joinResult.id, joinMessage)
    setJoinSubmitting(false)
    if (r.success) { toast(r.message || '申请已提交', 'success'); setShowJoin(false); setJoinCode(''); setJoinResult(null); setJoinMessage('') }
    else toast(r.message || '申请失败', 'error')
  }

  return (
    <div>
      {projectTabs.length > 0 && (
        <div style={{ display: 'flex', gap: 0, marginBottom: 0, alignItems: 'stretch', background: 'linear-gradient(180deg, rgba(59,130,246,0.10) 0%, rgba(59,130,246,0.04) 100%)', borderRadius: '10px 10px 0 0', padding: '0 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', whiteSpace: 'nowrap', fontSize: 14, fontWeight: 600, flexShrink: 0,
            background: 'rgba(59,130,246,0.12)', color: 'var(--brand)', borderRadius: '10px 10px 0 0',
            boxShadow: '0 -2px 8px rgba(59,130,246,0.15), 0 -1px 3px rgba(0,0,0,0.06)',
            borderBottom: '2px solid var(--brand)' }}>
            首页
          </div>
          <div style={{ width: 1, background: 'rgba(59,130,246,0.15)', margin: '8px 2px', flexShrink: 0 }} />
          <div ref={homeTabScrollRef} onPointerDown={onContainerPointerDown} onPointerMove={onContainerPointerMove} onPointerUp={onContainerPointerUp} style={{ flex: 1, minWidth: 0, overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', display: 'flex', gap: 0, WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' } as any}>
            {projectTabs.map(pt => {
              return (
                <div key={pt.id} data-tab-id={pt.id}
                  onClick={() => { if (!reorderRef.current?.moved) nav(`/projects/${pt.id}`) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 14, fontWeight: 400, flexShrink: 0, transition: slidingId === pt.id ? 'none' : 'all 0.15s',
                    background: 'transparent', color: 'var(--text-secondary)',
                    boxShadow: slidingId === pt.id ? '0 2px 12px rgba(0,0,0,0.15)' : 'none',
                    opacity: slidingId === pt.id ? 0.8 : 1, userSelect: 'none' } as any}>
                  <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{pt.name}</span>
                  <button
                    onClick={async e => { e.stopPropagation(); if (!(await confirm({ message: `关闭「${pt.name}」标签页？` }))) return; closeTab(pt.id) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, marginLeft: 4, display: 'flex', color: 'var(--text-tertiary)', borderRadius: 4 }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-heading)'; e.currentTarget.style.background = 'rgba(59,130,246,0.06)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.background = 'none' }}>
                    <X size={13} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
      <PageHeader title="项目管理" subtitle={`共 ${filtered.length} 个项目`} actions={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {canCreate && <button onClick={() => setShowCreate(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', borderRadius: 8, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <Plus size={15} /> 创建
          </button>}
          <button onClick={() => { setShowJoin(true); setJoinCode(''); setJoinResult(null); setJoinMessage('') }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--brand)', background: 'transparent', color: 'var(--brand)', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <Search size={15} /> 加入
          </button>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowMenu(v => !v)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <MoreVertical size={16} />
            </button>
            {showMenu && <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowMenu(false)} />
              <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 6, background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 100, minWidth: 180, overflow: 'hidden' }}>
                <button onClick={() => { setShowMenu(false); setShowJoinLink(true); setInviteLink('') }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-body)', textAlign: 'left' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}><Link size={15} /> 通过邀请链接加入</button>
                <div style={{ height: 1, background: 'var(--border-primary)', margin: '2px 8px' }} />
                <button onClick={async () => { setShowMenu(false); const ok = await projectApi.exportCsv(); if (!ok) toast('导出失败', 'error') }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-body)', textAlign: 'left' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}><Download size={15} /> 导出项目</button>
                <button onClick={() => { setShowMenu(false); const input = document.createElement('input'); input.type = 'file'; input.accept = '.csv'; input.onchange = async (e: any) => { const file = e.target.files?.[0]; if (!file) return; const r = await projectApi.importCsv(file); if (r.success) { toast(r.message || '导入成功', 'success'); load() } else toast(r.message || '导入失败', 'error') }; input.click() }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-body)', textAlign: 'left' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}><Upload size={15} /> 导入项目</button>
                <div style={{ height: 1, background: 'var(--border-primary)', margin: '2px 8px' }} />
                <button onClick={async () => { setShowMenu(false); setShowTrash(true); setTrashLoading(true); const r = await projectApi.trash(); setTrashLoading(false); if (r.success) setTrashList(r.data || []); else toast(r.message || '加载失败', 'error') }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-body)', textAlign: 'left' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}><Trash2 size={15} /> 回收站</button>
              </div>
            </>}
          </div>
        </div>
      } />

      {projects.length > 3 && <div style={{ marginBottom: 16 }}>
        <div style={{ position: 'relative', maxWidth: 320 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索项目..."
            style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-body)', fontSize: 14, outline: 'none' }} />
        </div>
      </div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-tertiary)' }}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={FolderKanban} title={projects.length === 0 ? '暂无项目' : '无匹配项目'}
          subtitle={projects.length === 0 ? '点击右上角新建项目' : '调整筛选条件试试'}
          action={projects.length === 0 && canCreate ? { label: '新建项目', onClick: () => setShowCreate(true) } : undefined} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(auto-fill, minmax(140px, 1fr))', gap: isMobile ? 16 : 24, justifyItems: 'center' }}>
          {filtered.map((p: any) => {
            const displayName = p.my_nickname || p.name
            const iconSize = 120
            const Icon = getProjectIcon(p.icon)
            const bgColor = p.icon_color || 'var(--brand)'
            return (
              <div key={p.id}
                onClick={() => {
                  clearUnread(p.id)
                  openTab(p.id, displayName)
                  nav(`/projects/${p.id}`)
                }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', position: 'relative', width: 120 }}
              >
                <div style={{ position: 'relative', marginBottom: 8 }}>
                  {p.cover_image ? (
                    <div style={{
                      width: iconSize, height: iconSize, borderRadius: iconSize * 0.22,
                      backgroundImage: `url(${p.cover_image})`, backgroundSize: 'cover', backgroundPosition: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                    }} />
                  ) : (
                    <div style={{
                      width: iconSize, height: iconSize, borderRadius: iconSize * 0.22,
                      background: `linear-gradient(135deg, ${bgColor}99, ${bgColor}66)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    }}>
                      <Icon size={48} color="rgba(255,255,255,0.9)" />
                    </div>
                  )}
                  {(() => {
                    const info = unreadSummary[String(p.id)]
                    const cnt = info?.total || 0
                    if (cnt <= 0 || dismissedSet.has(p.id)) return null
                    return (
                      <span style={{
                        position: 'absolute', top: -4, right: -4,
                        minWidth: 18, height: 18, borderRadius: 9,
                        background: '#ef4444', color: '#fff',
                        fontSize: 10, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '0 4px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }}>
                        {cnt > 99 ? '99+' : cnt}
                      </span>
                    )
                  })()}
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 500, color: 'var(--text-heading)',
                  textAlign: 'center', lineHeight: 1.3, maxWidth: '100%',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {displayName}
                </span>
                {p.description && (
                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textAlign: 'center', lineHeight: 1.3, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                    {p.description}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="新建项目">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="项目名称 *" placeholder="输入项目名称" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-body)', marginBottom: 4 }}>项目描述</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="简要描述项目内容"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0 }}>创建后可在项目详情中添加成员、关联应用等</p>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column-reverse' : 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <Button variant="secondary" onClick={() => setShowCreate(false)} style={isMobile ? { width: '100%', justifyContent: 'center' } : undefined}>取消</Button>
            <Button onClick={handleCreate} disabled={submitting} style={isMobile ? { width: '100%', justifyContent: 'center' } : undefined}>{submitting ? '创建中...' : '创建'}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showJoin} onClose={() => setShowJoin(false)} title="通过项目ID加入">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Input placeholder="输入项目ID" value={joinCode} onChange={e => setJoinCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJoinSearch()} style={{ flex: 1 }} />
            <Button onClick={handleJoinSearch} disabled={joinSearching} style={{ whiteSpace: 'nowrap' }}>
              {joinSearching ? <Loader2 size={14} className="spin" /> : <Search size={14} />} 搜索
            </Button>
          </div>

          {joinResult && (
            <div style={{ padding: 16, borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600, color: 'var(--text-heading)' }}>{joinResult.name}</h4>
              {joinResult.description && <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-secondary)' }}>{joinResult.description}</p>}
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-tertiary)', flexWrap: 'wrap' }}>
                <span>状态: {statusMap[joinResult.status] || joinResult.status}</span>
                <span>成员: {joinResult.member_count}人</span>
                <span>创建者: {joinResult.creator_name}</span>
              </div>

              {joinResult.is_member ? (
                <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--color-green)', fontWeight: 500 }}>✓ 你已是该项目成员</p>
              ) : joinResult.has_pending_request ? (
                <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--color-yellow)', fontWeight: 500 }}>⏳ 你已提交过加入申请，请等待审核</p>
              ) : (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <textarea value={joinMessage} onChange={e => setJoinMessage(e.target.value)} rows={2}
                    placeholder="申请留言（选填）" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', background: 'var(--bg-primary)', color: 'var(--text-body)' }} />
                  <Button onClick={handleJoinSubmit} disabled={joinSubmitting} style={{ alignSelf: 'flex-end' }}>
                    {joinSubmitting ? '提交中...' : '申请加入'}
                  </Button>
                </div>
              )}
            </div>
          )}

          {!joinResult && <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0, textAlign: 'center' }}>输入项目ID后点击搜索，找到项目即可申请加入</p>}
        </div>
      </Modal>

      {/* 项目回收站 */}
      <Modal open={showTrash} onClose={() => setShowTrash(false)} title="项目回收站">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {trashLoading ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)' }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /></div>
          ) : trashList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)', fontSize: 14 }}>回收站为空</div>
          ) : (<>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>已删除的项目（点击恢复可还原）：</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 350, overflowY: 'auto' }}>
              {trashList.map((p: any) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid transparent' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-heading)', wordBreak: 'break-word' }}>{p.name}</div>
                    {p.description && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</div>}
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>ID {p.id}</div>
                  </div>
                  <button disabled={restoringId === p.id} onClick={async () => {
                    setRestoringId(p.id)
                    const r = await projectApi.restore(String(p.id))
                    setRestoringId(null)
                    if (r.success) { toast('项目已恢复', 'success'); setTrashList(prev => prev.filter(x => x.id !== p.id)); load() }
                    else toast(r.message || '恢复失败', 'error')
                  }} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500, cursor: 'pointer', flexShrink: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-tertiary)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-primary)' }}>
                    <RotateCcw size={12} /> {restoringId === p.id ? '恢复中...' : '恢复'}
                  </button>
                </div>
              ))}
            </div>
          </>)}
        </div>
      </Modal>

      <Modal open={showJoinLink} onClose={() => setShowJoinLink(false)} title="通过邀请链接加入">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="邀请链接" placeholder="粘贴邀请链接" value={inviteLink} onChange={e => setInviteLink(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoinByLink()} />
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0 }}>粘贴项目管理员生成的邀请链接，即可直接加入项目</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="secondary" onClick={() => setShowJoinLink(false)}>取消</Button>
            <Button onClick={handleJoinByLink} disabled={joinLinkSubmitting}>{joinLinkSubmitting ? '加入中...' : '加入项目'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

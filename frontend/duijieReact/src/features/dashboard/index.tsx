import { useState, lazy, Suspense, useRef, useCallback } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { FolderKanban, Users, ListTodo, CheckCircle, TrendingUp, Clock, FileSignature, LogOut, Settings, HelpCircle, ChevronRight, Info, X } from 'lucide-react'
import { SkeletonDashboard } from '../ui/Skeleton'
import { can } from '../../stores/permissions'
import { useDashboardStats, useDashboardChart } from '../../hooks/useApi'
const DashboardCharts = lazy(() => import('./DashboardCharts'))
import ClientDashboard from './ClientDashboard'
import WorkspaceSection from './WorkspaceSection'
import Avatar from '../ui/Avatar'
import { SalesFunnel, FollowUpAlerts, RecentActivity } from './SalesFunnel'
import useUserStore from '../../stores/useUserStore'
import EnterpriseSwitcher from '../ui/EnterpriseSwitcher'
import { APP_VERSION } from '../../utils/capacitor'

interface Stats {
  totalProjects: number; planningProjects: number; activeProjects: number; completedProjects: number
  totalClients: number; totalTasks: number; pendingTasks: number; completedTasks: number
  clientStages?: { potential: number; intent: number; signed: number; active: number; lost: number }
  contracts?: { total: number; totalAmount: number; activeCount: number; activeAmount: number }
  followUpAlerts?: { overdue: number; upcoming: number }
  recentFollowUps?: any[]
  recentContracts?: any[]
  projects?: any[]
  files?: any[]
}

const card: React.CSSProperties = {
  background: 'var(--bg-primary)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'box-shadow 0.15s',
}
const iconBox = (bg: string): React.CSSProperties => ({
  width: 48, height: 48, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
})

export default function Dashboard() {
  const [chartDays, setChartDays] = useState(30)
  const nav = useNavigate()
  const { user, isMobile, openGuide } = useOutletContext<{ user: any; isMobile?: boolean; openGuide?: () => void }>()
  const r = user?.role || ''
  const canClients = can(r, 'dashboard:clients')
  const canTasks = can(r, 'dashboard:tasks')
  const isClient = r === 'client'
  const { logout } = useUserStore()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerClosing, setDrawerClosing] = useState(false)
  const [confirmGuide, setConfirmGuide] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)

  const closeDrawer = useCallback(() => {
    setDrawerClosing(true)
    setTimeout(() => { setDrawerOpen(false); setDrawerClosing(false) }, 220)
  }, [])

  

  const { data: stats } = useDashboardStats() as { data: Stats | undefined }
  const { data: chartData } = useDashboardChart(chartDays) as { data: any }

  if (isClient && stats) return <ClientDashboard stats={stats} nav={nav} />
  if (isClient && !stats) return <div style={{ padding: 16 }}><SkeletonDashboard /></div>

  const items = stats ? [
    { label: '总项目', value: stats.totalProjects, icon: FolderKanban, bg: 'var(--brand-light-2)', color: 'var(--brand)', path: '/projects' },
    { label: '规划中', value: stats.planningProjects, icon: FileSignature, bg: '#f3e8ff', color: 'var(--color-purple)', path: '/projects' },
    { label: '进行中', value: stats.activeProjects, icon: TrendingUp, bg: '#fef3c7', color: 'var(--color-warning)', path: '/projects' },
    { label: '已完成', value: stats.completedProjects, icon: CheckCircle, bg: '#dcfce7', color: 'var(--color-success)', path: '/projects' },
    ...(canClients ? [
      { label: '客户总数', value: stats.totalClients, icon: Users, bg: '#f3e8ff', color: 'var(--color-purple)', path: '/clients' },
    ] : []),
    ...(canTasks ? [
      { label: '总需求', value: stats.totalTasks, icon: ListTodo, bg: '#e0f2fe', color: '#0284c7', path: '/tasks' },
      { label: '待办需求', value: stats.pendingTasks, icon: Clock, bg: '#fee2e2', color: 'var(--color-danger)', path: '/tasks' },
    ] : []),
  ] : []

  return (
    <div style={isMobile ? { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 } : undefined}>
      <div style={{
        marginBottom: isMobile ? 0 : 24, textAlign: isMobile ? 'center' : undefined,
        ...(isMobile ? { flexShrink: 0, zIndex: 10, background: 'var(--bg-secondary)', padding: '16px 16px 10px' } : {}),
      }}>
        {isMobile ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <div onClick={() => setDrawerOpen(true)} style={{
              position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
              width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', borderRadius: '50%',
            }}>
              <Avatar name={user?.nickname || user?.username || ''} size={32} src={user?.avatar || undefined} />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>首页</h1>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>首页</h1>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: 14 }}>项目对接平台概览</p>
          </>
        )}
      </div>
      <div style={isMobile ? { flex: 1, overflowY: 'auto', minHeight: 0, padding: '12px 16px 20px', WebkitOverflowScrolling: 'touch' as any } : undefined}>
      {isMobile && stats ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: 'var(--bg-primary)', borderRadius: 14, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>项目概况</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[
                { label: '总项目', value: stats.totalProjects, color: 'var(--brand)', path: '/projects' },
                { label: '规划中', value: stats.planningProjects, color: 'var(--color-purple)', path: '/projects?status=planning' },
                { label: '进行中', value: stats.activeProjects, color: 'var(--color-warning)', path: '/projects?status=in_progress' },
                { label: '已完成', value: stats.completedProjects, color: 'var(--color-success)', path: '/projects?status=completed' },
              ].map(s => (
                <div key={s.label} onClick={() => nav(s.path)} style={{ textAlign: 'center', cursor: 'pointer', padding: '6px 0', borderRadius: 8 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          {(canClients || canTasks) && (
            <div style={{ background: 'var(--bg-primary)', borderRadius: 14, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>业务概况</div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${(canClients ? 1 : 0) + (canTasks ? 2 : 0)}, 1fr)`, gap: 8 }}>
                {canClients && (
                  <div onClick={() => nav('/clients')} style={{ textAlign: 'center', cursor: 'pointer', padding: '6px 0', borderRadius: 8 }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-purple)' }}>{stats.totalClients}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>客户总数</div>
                  </div>
                )}
                {canTasks && (
                  <>
                    <div onClick={() => nav('/tasks')} style={{ textAlign: 'center', cursor: 'pointer', padding: '6px 0', borderRadius: 8 }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#0284c7' }}>{stats.totalTasks}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>总需求</div>
                    </div>
                    <div onClick={() => nav('/tasks?status=submitted')} style={{ textAlign: 'center', cursor: 'pointer', padding: '6px 0', borderRadius: 8 }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-danger)' }}>{stats.pendingTasks}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>待办需求</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {items.map(item => (
            <div key={item.label} style={card} onClick={() => nav(item.path)}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)')}>
              <div style={iconBox(item.bg)}><item.icon size={22} color={item.color} /></div>
              <div>
                <div style={{ fontSize: typeof item.value === 'string' ? 20 : 28, fontWeight: 700, color: 'var(--text-heading)' }}>{item.value}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      <WorkspaceSection isMobile={!!isMobile} />
      {chartData && <Suspense fallback={<SkeletonDashboard />}><DashboardCharts chartData={chartData} days={chartDays} onDaysChange={setChartDays} canClients={canClients} isMobile={!!isMobile} /></Suspense>}
      {canClients && stats?.clientStages && <SalesFunnel stages={stats.clientStages} isMobile={!!isMobile} />}
      {canClients && stats?.followUpAlerts && <FollowUpAlerts overdue={stats.followUpAlerts.overdue} upcoming={stats.followUpAlerts.upcoming} isMobile={!!isMobile} />}
      {canClients && stats && <RecentActivity followUps={stats.recentFollowUps} contracts={stats.recentContracts} isMobile={!!isMobile} />}
      {!stats && <SkeletonDashboard />}
      </div>

      {isMobile && drawerOpen && (
        <>
          <style>{`
            @keyframes drawerSlideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}
            @keyframes drawerSlideOut{from{transform:translateX(0)}to{transform:translateX(-100%)}}
            @keyframes drawerFadeIn{from{opacity:0}to{opacity:1}}
            @keyframes drawerFadeOut{from{opacity:1}to{opacity:0}}
          `}</style>
          <div onClick={closeDrawer} style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.4)',
            animation: drawerClosing ? 'drawerFadeOut .22s ease forwards' : 'drawerFadeIn .2s ease',
          }}>
            <div ref={drawerRef} onClick={e => e.stopPropagation()} style={{
              position: 'absolute', left: 0, top: 0, bottom: 0, width: '78%', maxWidth: 320,
              background: 'var(--bg-secondary)',
              animation: drawerClosing ? 'drawerSlideOut .22s ease forwards' : 'drawerSlideIn .25s cubic-bezier(.25,.46,.45,.94)',
              display: 'flex', flexDirection: 'column', overflowY: 'auto',
              padding: 'env(safe-area-inset-top, 16px) 16px 20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                <div onClick={closeDrawer} style={{ padding: 4, cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                  <X size={20} />
                </div>
              </div>

              <div onClick={() => { closeDrawer(); nav('/user-settings?tab=account&sub=profile') }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: 16, marginBottom: 12,
                  background: 'var(--bg-primary)', borderRadius: 16, cursor: 'pointer',
                }}>
                <Avatar name={user?.nickname || user?.username || ''} size={56} src={user?.avatar || undefined} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-heading)' }}>
                    {user?.nickname || user?.username}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 3 }}>
                    {user?.email || (r === 'admin' ? '管理员' : '成员')}
                  </div>
                </div>
                <ChevronRight size={18} style={{ color: 'var(--text-tertiary)' }} />
              </div>

              <div style={{ background: 'var(--bg-primary)', borderRadius: 16, marginBottom: 12, position: 'relative', zIndex: 5 }}>
                <EnterpriseSwitcher />
              </div>

              <div style={{ background: 'var(--bg-primary)', borderRadius: 16, overflow: 'hidden' }}>
                {[
                  { icon: Settings, label: '设置', action: () => { closeDrawer(); nav('/user-settings') } },
                  { icon: HelpCircle, label: '新手引导', action: () => { closeDrawer(); setConfirmGuide(true) } },
                ].map((item, i, arr) => (
                  <div key={item.label} onClick={item.action}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '15px 16px', cursor: 'pointer',
                      borderBottom: i < arr.length - 1 ? '1px solid var(--border-secondary)' : 'none',
                    }}>
                    <item.icon size={20} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 15, color: 'var(--text-primary)' }}>{item.label}</span>
                    <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                ))}
              </div>

              <div onClick={() => { closeDrawer(); nav('/about') }} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '15px 16px', marginTop: 12,
                background: 'var(--bg-primary)', borderRadius: 16, cursor: 'pointer',
              }}>
                <Info size={20} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 15, color: 'var(--text-primary)' }}>版本信息</span>
                <span style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>v{APP_VERSION}</span>
                <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
              </div>

              <div onClick={() => { closeDrawer(); logout() }}
                style={{
                  marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: 16, borderRadius: 16, background: 'var(--bg-primary)', cursor: 'pointer',
                  color: 'var(--color-danger)', fontSize: 15, fontWeight: 500,
                }}>
                <LogOut size={16} />
                退出登录
              </div>
            </div>
          </div>
        </>
      )}

      {confirmGuide && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setConfirmGuide(false)}>
          <div onClick={e => e.stopPropagation()}
            style={{ width: 280, background: 'var(--bg-primary)', borderRadius: 16, padding: 24, textAlign: 'center' }}>
            <HelpCircle size={36} style={{ color: 'var(--brand)', marginBottom: 12 }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 8 }}>新手引导</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>将为你展示主要功能的使用方法，是否开始？</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmGuide(false)}
                style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                取消
              </button>
              <button onClick={() => { setConfirmGuide(false); openGuide?.() }}
                style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                开始引导
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

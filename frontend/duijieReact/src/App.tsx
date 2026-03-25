import { useEffect, lazy, Suspense, ComponentType } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './features/auth/index'
import Layout from './features/ui/Layout'
import ToastContainer from './features/ui/Toast'
import AppUpdateChecker from './features/ui/AppUpdateChecker'
import useUserStore from './stores/useUserStore'
import { can } from './stores/permissions'
import EnterpriseOnboarding from './features/enterprise/EnterpriseOnboarding'

function lazyLoad(importFn: () => Promise<{ default: ComponentType<any> }>) {
  return lazy(() => importFn().catch(() => {
    window.location.reload()
    return new Promise<{ default: ComponentType<any> }>(() => {})
  }))
}

const Dashboard = lazyLoad(() => import('./features/dashboard/index'))
const ProjectList = lazyLoad(() => import('./features/project/index'))
const ProjectDetail = lazyLoad(() => import('./features/project/components/ProjectDetail'))
const ClientList = lazyLoad(() => import('./features/client/index'))
const ClientDetail = lazyLoad(() => import('./features/client/components/ClientDetail'))
const TaskBoard = lazyLoad(() => import('./features/task/index'))
const Report = lazyLoad(() => import('./features/dashboard/Report'))
const UserManagement = lazyLoad(() => import('./features/user/index'))
const OpportunityList = lazyLoad(() => import('./features/opportunity/index'))
const Messaging = lazyLoad(() => import('./features/messaging/index'))
const AuditLog = lazyLoad(() => import('./features/audit/index'))
const FileManager = lazyLoad(() => import('./features/file/index'))
const SystemSettings = lazyLoad(() => import('./features/settings/index'))
const Enterprise = lazyLoad(() => import('./features/enterprise/index'))
const TicketPage = lazyLoad(() => import('./features/ticket/index'))
const PartnerManagement = lazyLoad(() => import('./features/partner/index'))

export default function App() {
  const { user, checking, hasEnterprise, setUser, init } = useUserStore()

  useEffect(() => { init() }, [init])

  if (checking) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#94a3b8' }}>加载中...</div>
  if (!user) return <LoginPage onLogin={setUser} />
  if (!hasEnterprise) return <><ToastContainer /><EnterpriseOnboarding /></>

  const r = user.role
  const canProjects = can(r, 'project:view')
  const canClients = can(r, 'client:manage')
  const canViewClient = can(r, 'client:view')
  const canOpportunities = can(r, 'opportunity:view')
  const canTasks = can(r, 'task:view')
  const canReport = can(r, 'report:view')
  const canUsers = can(r, 'user:manage')
  const canAudit = can(r, 'audit:view')
  const canSettings = can(r, 'settings:manage')
  const canTickets = can(r, 'ticket:view')

  return (
    <>
      <ToastContainer />
      <AppUpdateChecker />
      <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', padding: 40 }}>加载中...</div>}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            {canProjects && <Route path="/projects" element={<ProjectList />} />}
            {canProjects && <Route path="/projects/:id" element={<ProjectDetail />} />}
            {canClients && <Route path="/clients" element={<ClientList />} />}
            {canViewClient && <Route path="/clients/:id" element={<ClientDetail />} />}
            {canOpportunities && <Route path="/opportunities" element={<OpportunityList />} />}
            {canTasks && <Route path="/tasks" element={<TaskBoard />} />}
            <Route path="/enterprise" element={<Enterprise />} />
            <Route path="/messaging" element={<Messaging />} />
            {canTickets && <Route path="/tickets" element={<TicketPage />} />}
            {canReport && <Route path="/report" element={<Report />} />}
            {canUsers && <Route path="/users" element={<UserManagement />} />}
            <Route path="/files" element={<FileManager />} />
            {canAudit && <Route path="/audit" element={<AuditLog />} />}
            {canSettings && <Route path="/settings" element={<SystemSettings />} />}
            {canSettings && <Route path="/partners" element={<PartnerManagement />} />}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  )
}

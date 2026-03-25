import { useEffect, lazy, Suspense, ComponentType } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './features/auth/index'
import Layout from './features/ui/Layout'
import ToastContainer from './features/ui/Toast'
import AppUpdateChecker from './features/ui/AppUpdateChecker'
import useUserStore from './stores/useUserStore'
import { can } from './stores/permissions'
import EnterpriseOnboarding from './features/enterprise/EnterpriseOnboarding'

const importFns = {
  dashboard:    () => import('./features/dashboard/index'),
  projectList:  () => import('./features/project/index'),
  projectDetail:() => import('./features/project/components/ProjectDetail'),
  clientList:   () => import('./features/client/index'),
  clientDetail: () => import('./features/client/components/ClientDetail'),
  taskBoard:    () => import('./features/task/index'),
  report:       () => import('./features/dashboard/Report'),
  userMgmt:     () => import('./features/user/index'),
  opportunity:  () => import('./features/opportunity/index'),
  messaging:    () => import('./features/messaging/index'),
  auditLog:     () => import('./features/audit/index'),
  fileManager:  () => import('./features/file/index'),
  settings:     () => import('./features/settings/index'),
  enterprise:   () => import('./features/enterprise/index'),
  ticket:       () => import('./features/ticket/index'),
  partner:      () => import('./features/partner/index'),
}

function lazyLoad(importFn: () => Promise<{ default: ComponentType<any> }>) {
  return lazy(() => importFn().catch(() => {
    window.location.reload()
    return new Promise<{ default: ComponentType<any> }>(() => {})
  }))
}

const Dashboard = lazyLoad(importFns.dashboard)
const ProjectList = lazyLoad(importFns.projectList)
const ProjectDetail = lazyLoad(importFns.projectDetail)
const ClientList = lazyLoad(importFns.clientList)
const ClientDetail = lazyLoad(importFns.clientDetail)
const TaskBoard = lazyLoad(importFns.taskBoard)
const Report = lazyLoad(importFns.report)
const UserManagement = lazyLoad(importFns.userMgmt)
const OpportunityList = lazyLoad(importFns.opportunity)
const Messaging = lazyLoad(importFns.messaging)
const AuditLog = lazyLoad(importFns.auditLog)
const FileManager = lazyLoad(importFns.fileManager)
const SystemSettings = lazyLoad(importFns.settings)
const Enterprise = lazyLoad(importFns.enterprise)
const TicketPage = lazyLoad(importFns.ticket)
const PartnerManagement = lazyLoad(importFns.partner)

function prefetchAll() {
  Object.values(importFns).forEach(fn => fn().catch(() => {}))
}

export default function App() {
  const { user, checking, hasEnterprise, setUser, init } = useUserStore()

  useEffect(() => { init() }, [init])

  useEffect(() => {
    if (user) {
      const id = (window.requestIdleCallback || ((cb: any) => setTimeout(cb, 200)))(prefetchAll)
      return () => (window.cancelIdleCallback || clearTimeout)(id)
    }
  }, [user])

  if (checking) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: 0, color: '#94a3b8' }}>加载中...</div>
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

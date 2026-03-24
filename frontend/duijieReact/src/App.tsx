import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './features/auth/index'
import Layout from './features/ui/Layout'
import ToastContainer from './features/ui/Toast'
import useUserStore from './stores/useUserStore'
import { can } from './stores/permissions'

const Dashboard = lazy(() => import('./features/dashboard/index'))
const ProjectList = lazy(() => import('./features/project/index'))
const ProjectDetail = lazy(() => import('./features/project/components/ProjectDetail'))
const ClientList = lazy(() => import('./features/client/index'))
const ClientDetail = lazy(() => import('./features/client/components/ClientDetail'))
const TaskBoard = lazy(() => import('./features/task/index'))
const Report = lazy(() => import('./features/dashboard/Report'))
const UserManagement = lazy(() => import('./features/user/index'))
const OpportunityList = lazy(() => import('./features/opportunity/index'))
const Messaging = lazy(() => import('./features/messaging/index'))
const AuditLog = lazy(() => import('./features/audit/index'))
const FileManager = lazy(() => import('./features/file/index'))
const SystemSettings = lazy(() => import('./features/settings/index'))
const Enterprise = lazy(() => import('./features/enterprise/index'))

export default function App() {
  const { user, checking, setUser, init } = useUserStore()

  useEffect(() => { init() }, [init])

  if (checking) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#94a3b8' }}>加载中...</div>
  if (!user) return <LoginPage onLogin={setUser} />

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

  return (
    <>
      <ToastContainer />
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
            {canReport && <Route path="/report" element={<Report />} />}
            {canUsers && <Route path="/users" element={<UserManagement />} />}
            <Route path="/files" element={<FileManager />} />
            {canAudit && <Route path="/audit" element={<AuditLog />} />}
            {canSettings && <Route path="/settings" element={<SystemSettings />} />}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  )
}

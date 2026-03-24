import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './features/auth/index'
import Layout from './features/ui/Layout'
import Dashboard from './features/dashboard/index'
import ProjectList from './features/project/index'
import ProjectDetail from './features/project/components/ProjectDetail'
import ClientList from './features/client/index'
import ClientDetail from './features/client/components/ClientDetail'
import TaskBoard from './features/task/index'
import Report from './features/dashboard/Report'
import UserManagement from './features/user/index'
import OpportunityList from './features/opportunity/index'
import Messaging from './features/messaging/index'
import AuditLog from './features/audit/index'
import FileManager from './features/file/index'
import SystemSettings from './features/settings/index'
import Enterprise from './features/enterprise/index'
import ToastContainer from './features/ui/Toast'
import useUserStore from './stores/useUserStore'

export default function App() {
  const { user, checking, setUser, init } = useUserStore()

  useEffect(() => { init() }, [init])

  if (checking) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#94a3b8' }}>加载中...</div>
  if (!user) return <LoginPage onLogin={setUser} />

  const r = user.role
  const canClients = ['admin', 'sales_manager', 'business', 'marketing', 'support'].includes(r)
  const canViewClient = canClients || ['member', 'client', 'viewer', 'tech'].includes(r)
  const canOpportunities = ['admin', 'sales_manager', 'business'].includes(r)
  const canTasks = ['admin', 'sales_manager', 'tech', 'business', 'support', 'member', 'viewer'].includes(r)
  const canReport = ['admin', 'sales_manager', 'business'].includes(r)
  const canProjects = true

  return (
    <>
      <ToastContainer />
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
          {r === 'admin' && <Route path="/users" element={<UserManagement />} />}
          <Route path="/files" element={<FileManager />} />
          {r === 'admin' && <Route path="/audit" element={<AuditLog />} />}
          {r === 'admin' && <Route path="/settings" element={<SystemSettings />} />}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  )
}

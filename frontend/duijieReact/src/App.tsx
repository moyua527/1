import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { authApi } from './features/auth/services/api'
import { getToken } from './bootstrap'
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
import ToastContainer from './features/ui/Toast'

export default function App() {
  const [user, setUser] = useState<any>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!getToken()) { setChecking(false); return }
    authApi.me().then(r => { if (r.success) setUser(r.data) }).finally(() => setChecking(false))
  }, [])

  if (checking) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#94a3b8' }}>加载中...</div>
  if (!user) return <LoginPage onLogin={setUser} />

  const canClients = user.role === 'admin' || user.role === 'business'
  const canTasks = ['admin', 'tech', 'business'].includes(user.role)
  const canReport = user.role === 'admin' || user.role === 'business'

  return (
    <>
      <ToastContainer />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<ProjectList />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          {canClients && <Route path="/clients" element={<ClientList />} />}
          {canClients && <Route path="/clients/:id" element={<ClientDetail />} />}
          {canTasks && <Route path="/tasks" element={<TaskBoard />} />}
          {canReport && <Route path="/report" element={<Report />} />}
          {user.role === 'admin' && <Route path="/users" element={<UserManagement />} />}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  )
}

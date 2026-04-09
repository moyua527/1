import { useEffect, lazy, Suspense, ComponentType } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import LoginPage from './features/auth/index'
import Layout from './features/ui/Layout'
import MobilePushBridge from './features/ui/MobilePushBridge'
import ToastContainer from './features/ui/Toast'
import AppUpdateChecker from './features/ui/AppUpdateChecker'
import GestureLockScreen from './features/ui/GestureLockScreen'
import ErrorBoundary from './features/ui/ErrorBoundary'
import useUserStore from './stores/useUserStore'
import useEnterpriseStore from './stores/useEnterpriseStore'
import { can } from './stores/permissions'
import ProjectOnboarding from './features/project/ProjectOnboarding'
import JoinProjectPage from './features/project/JoinProjectPage'
import InviteLandingPage from './features/auth/InviteLandingPage'
import { flatRoutes, prefetchPages } from './data/routeManifest'

function lazyLoad(importFn: () => Promise<{ default: ComponentType<any> }>) {
  return lazy(() => importFn().catch(() => {
    window.location.reload()
    return new Promise<{ default: ComponentType<any> }>(() => {})
  }))
}

// Build lazy components from manifest (once at module level)
const routeComponents = new Map<string, ComponentType<any>>()
for (const r of flatRoutes()) {
  routeComponents.set(r.path, lazyLoad(r.importFn))
}

function prefetchHighFreq() {
  prefetchPages().forEach(fn => fn().catch(() => {}))
}

export default function App() {
  const { user, checking, setUser, init } = useUserStore()
  const hasEnterprise = useEnterpriseStore(s => s.hasEnterprise)
  const hasProjects = useEnterpriseStore(s => s.hasProjects)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => { init() }, [init])

  useEffect(() => {
    if (user) {
      const redirect = localStorage.getItem('redirect_after_login')
      if (redirect) {
        localStorage.removeItem('redirect_after_login')
        navigate(redirect, { replace: true })
      }
    }
  }, [user, navigate])

  useEffect(() => {
    if (user) {
      const id = (window.requestIdleCallback || ((cb: any) => setTimeout(cb, 200)))(prefetchHighFreq)
      return () => (window.cancelIdleCallback || clearTimeout)(id)
    }
  }, [user])

  if (checking) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: 0, color: 'var(--text-tertiary)' }}>加载中...</div>
  if (location.pathname.startsWith('/invite/')) {
    return <><ToastContainer /><Routes><Route path="/invite/:token" element={<InviteLandingPage />} /></Routes></>
  }
  if (!user) {
    if (location.pathname.startsWith('/join/')) {
      localStorage.setItem('redirect_after_login', location.pathname)
    }
    return <LoginPage onLogin={setUser} />
  }
  if (location.pathname.startsWith('/join/')) {
    return <><ToastContainer /><Routes><Route path="/join/:code" element={<JoinProjectPage />} /></Routes></>
  }
  if (!hasEnterprise && !hasProjects) return <><ToastContainer /><ProjectOnboarding /></>

  const r = user.role
  const allowed = flatRoutes().filter(rt => !rt.perm || can(r, rt.perm))

  return (
    <ErrorBoundary>
      <ToastContainer />
      <MobilePushBridge />
      <AppUpdateChecker />
      <ErrorBoundary fallback={<></>}><GestureLockScreen /></ErrorBoundary>
      <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-tertiary)', padding: 40 }}>加载中...</div>}>
        <Routes>
          <Route element={<Layout />}>
            {allowed.map(rt => {
              const Comp = routeComponents.get(rt.path)!
              return <Route key={rt.path} path={rt.path} element={<Comp />} />
            })}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

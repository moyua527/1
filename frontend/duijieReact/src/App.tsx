import { useEffect, lazy, Suspense, ComponentType } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './features/auth/index'
import Layout from './features/ui/Layout'
import MobilePushBridge from './features/ui/MobilePushBridge'
import ToastContainer from './features/ui/Toast'
import AppUpdateChecker from './features/ui/AppUpdateChecker'
import ErrorBoundary from './features/ui/ErrorBoundary'
import useUserStore from './stores/useUserStore'
import { can } from './stores/permissions'
import EnterpriseOnboarding from './features/enterprise/EnterpriseOnboarding'
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
  const { user, checking, hasEnterprise, setUser, init } = useUserStore()

  useEffect(() => { init() }, [init])

  useEffect(() => {
    if (user) {
      const id = (window.requestIdleCallback || ((cb: any) => setTimeout(cb, 200)))(prefetchHighFreq)
      return () => (window.cancelIdleCallback || clearTimeout)(id)
    }
  }, [user])

  if (checking) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: 0, color: 'var(--text-tertiary)' }}>加载中...</div>
  if (!user) return <LoginPage onLogin={setUser} />
  if (!hasEnterprise) return <><ToastContainer /><EnterpriseOnboarding /></>

  const r = user.role
  const allowed = flatRoutes().filter(rt => !rt.perm || can(r, rt.perm))

  return (
    <ErrorBoundary>
      <ToastContainer />
      <MobilePushBridge />
      <AppUpdateChecker />
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

import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { Star } from 'lucide-react'
import { can } from '../../stores/permissions'
import { navItems, navItemsByGroup } from '../../data/routeManifest'

export default function ServicesPage() {
  const { user, dmUnread } = useOutletContext<{ user: any; dmUnread: number }>()
  const navigate = useNavigate()
  const role = user?.role || 'member'
  const items = navItems().filter(n => n.path !== '/' && (!n.perm || can(role, n.perm)))
  const groups = navItemsByGroup(items)

  const [favPaths, setFavPaths] = useState<string[]>(() => {
    try { const s = localStorage.getItem('sidebar_favorites'); return s ? JSON.parse(s) : [] }
    catch { return [] }
  })
  const toggleFav = (path: string) => {
    setFavPaths(prev => {
      const next = prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
      localStorage.setItem('sidebar_favorites', JSON.stringify(next))
      return next
    })
  }
  const favItems = items.filter(n => favPaths.includes(n.path))

  const renderGrid = (gridItems: typeof items) => (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4,
      background: 'var(--bg-primary)', borderRadius: 16, padding: '12px 6px',
    }}>
      {gridItems.map(item => (
        <div key={item.path}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            padding: '10px 4px', borderRadius: 12, cursor: 'pointer',
            color: 'var(--text-secondary)', position: 'relative',
          }}>
          <div onClick={() => navigate(item.path)} style={{
            width: 48, height: 48, borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-tertiary)',
          }}>
            <item.icon size={24} />
          </div>
          <span onClick={() => navigate(item.path)} style={{ fontSize: 12, textAlign: 'center', lineHeight: 1.2 }}>
            {item.mobileLabel || item.label}
          </span>
          <span onClick={() => toggleFav(item.path)}
            style={{
              position: 'absolute', top: 2, right: '10%',
              padding: 2, borderRadius: 4, color: favPaths.includes(item.path) ? '#f59e0b' : 'var(--text-quaternary)',
            }}>
            <Star size={12} style={favPaths.includes(item.path) ? { fill: '#f59e0b' } : undefined} />
          </span>
          {item.path === '/messaging' && dmUnread > 0 && (
            <span style={{
              position: 'absolute', top: 4, left: '55%',
              minWidth: 16, height: 16, borderRadius: 8,
              background: 'var(--color-danger)', color: '#fff',
              fontSize: 9, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 4px',
            }}>{dmUnread > 99 ? '99+' : dmUnread}</span>
          )}
        </div>
      ))}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{
        flexShrink: 0, zIndex: 10, background: 'var(--bg-secondary)',
        padding: '16px 16px 10px', textAlign: 'center',
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>服务</h1>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '12px 16px 20px', WebkitOverflowScrolling: 'touch' as any }}>
      {favItems.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: 'var(--text-tertiary)', padding: '0 4px 8px' }}>
            <Star size={12} style={{ fill: 'var(--text-tertiary)' }} />
            <span>收藏</span>
          </div>
          {renderGrid(favItems)}
        </div>
      )}
      {groups.map(g => (
        <div key={g.key} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-tertiary)', padding: '0 4px 8px' }}>
            {g.label}
          </div>
          {renderGrid(g.items)}
        </div>
      ))}
      </div>
    </div>
  )
}

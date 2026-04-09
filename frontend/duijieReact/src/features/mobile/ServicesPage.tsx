import { useNavigate, useOutletContext } from 'react-router-dom'
import { can } from '../../stores/permissions'
import { navItems, navItemsByGroup } from '../../data/routeManifest'

export default function ServicesPage() {
  const { user, dmUnread } = useOutletContext<{ user: any; dmUnread: number }>()
  const navigate = useNavigate()
  const role = user?.role || 'member'
  const items = navItems().filter(n => n.path !== '/' && (!n.perm || can(role, n.perm)))
  const groups = navItemsByGroup(items)

  return (
    <div>
      {groups.map(g => (
        <div key={g.key} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-tertiary)', padding: '0 4px 8px' }}>
            {g.label}
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4,
            background: 'var(--bg-primary)', borderRadius: 16, padding: '12px 6px',
          }}>
            {g.items.map(item => (
              <div key={item.path} onClick={() => navigate(item.path)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  padding: '10px 4px', borderRadius: 12, cursor: 'pointer',
                  color: 'var(--text-secondary)', position: 'relative',
                }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--bg-tertiary)',
                }}>
                  <item.icon size={24} />
                </div>
                <span style={{ fontSize: 12, textAlign: 'center', lineHeight: 1.2 }}>
                  {item.mobileLabel || item.label}
                </span>
                {item.path === '/messaging' && dmUnread > 0 && (
                  <span style={{
                    position: 'absolute', top: 4, right: '16%',
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
        </div>
      ))}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Building2, Crown, Shield, Check, ChevronDown } from 'lucide-react'
import { fetchApi } from '../../bootstrap'

export default function EnterpriseSwitcher() {
  const location = useLocation()
  const [myEnterprises, setMyEnterprises] = useState<any[]>([])
  const [activeEntId, setActiveEntId] = useState<number | null>(null)
  const [entDropdownOpen, setEntDropdownOpen] = useState(false)

  const loadMyEnterprises = () => {
    fetchApi('/api/my-enterprise').then(r => {
      if (r.success && r.data) {
        setMyEnterprises(r.data.enterprises || [])
        setActiveEntId(r.data.activeId || null)
      }
    })
  }

  useEffect(() => { loadMyEnterprises() }, [])
  useEffect(() => { if (location.pathname === '/enterprise') loadMyEnterprises() }, [location.pathname])
  useEffect(() => { setEntDropdownOpen(false) }, [location.pathname])

  const switchEnterprise = (id: number) => {
    fetchApi('/api/my-enterprise/switch', { method: 'PUT', body: JSON.stringify({ enterprise_id: id }) }).then(r => {
      if (r.success) {
        setActiveEntId(id)
        setEntDropdownOpen(false)
        if (location.pathname === '/enterprise') window.location.reload()
      }
    })
  }

  if (myEnterprises.length === 0) return null

  const activeEnt = myEnterprises.find((e: any) => e.id === activeEntId)

  return (
    <div style={{ padding: '6px 16px', borderBottom: '1px solid var(--border-secondary)' }}>
      <div style={{ position: 'relative' }}>
        <div onClick={() => setEntDropdownOpen(!entDropdownOpen)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8,
            background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)',
            cursor: 'pointer', transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}>
          <Building2 size={14} style={{ color: 'var(--brand)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeEnt?.name || '未选择企业'}
            </div>
            {activeEnt && (
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 1, display: 'flex', alignItems: 'center', gap: 3 }}>
                {activeEnt.member_role === 'creator' && <Crown size={8} />}
                {activeEnt.member_role === 'admin' && <Shield size={8} />}
                {activeEnt.member_role === 'creator' ? '创建者' : activeEnt.member_role === 'admin' ? '管理员' : '成员'}
              </div>
            )}
          </div>
          <ChevronDown size={14} style={{ color: 'var(--text-tertiary)', transition: 'transform 0.2s', transform: entDropdownOpen ? 'rotate(180deg)' : 'none' }} />
        </div>

        {entDropdownOpen && (
          <div style={{
            position: 'absolute', left: 0, right: 0, top: 'calc(100% + 4px)',
            background: 'var(--bg-primary)', border: '1px solid var(--border-primary)',
            borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 10, maxHeight: 200, overflowY: 'auto',
          }}>
            {myEnterprises.map((ent: any) => {
              const isActive = ent.id === activeEntId
              return (
                <div key={ent.id} onClick={() => { if (!isActive) switchEnterprise(ent.id) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                    cursor: isActive ? 'default' : 'pointer', fontSize: 12,
                    color: isActive ? 'var(--brand)' : 'var(--text-body)',
                    background: isActive ? 'var(--bg-selected)' : 'transparent',
                    fontWeight: isActive ? 600 : 400, transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}>
                  <Building2 size={12} style={{ color: isActive ? 'var(--brand)' : 'var(--text-tertiary)', flexShrink: 0 }} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ent.name}</span>
                  <span style={{ fontSize: 10, color: isActive ? '#60a5fa' : 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 2 }}>
                    {ent.member_role === 'creator' && <Crown size={8} />}
                    {ent.member_role === 'admin' && <Shield size={8} />}
                    {ent.member_role === 'creator' ? '创建者' : ent.member_role === 'admin' ? '管理员' : '成员'}
                  </span>
                  {isActive && <Check size={12} style={{ color: 'var(--brand)' }} />}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

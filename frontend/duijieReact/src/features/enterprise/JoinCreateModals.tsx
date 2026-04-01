import { useEffect, useState } from 'react'
import { Building2, CheckCircle2, KeyRound, Search } from 'lucide-react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { labelStyle, selectStyle, textareaStyle, industryOptions, scaleOptions, companyTypeOptions } from './constants'

interface Props {
  joinModalOpen: boolean
  setJoinModalOpen: (v: boolean) => void
  joinSearch: string
  setJoinSearch: (v: string) => void
  joinResults: any[]
  joinSearching: boolean
  joining: boolean
  selectedJoinEnterpriseId: number | null
  setSelectedJoinEnterpriseId: (v: number | null) => void
  joinCode: string
  setJoinCode: (v: string) => void
  myRequests: any[]
  handleJoinSearch: (keyword?: string) => void
  handleJoin: (id?: number) => void
  createModalOpen: boolean
  setCreateModalOpen: (v: boolean) => void
  createForm: any
  setCreateForm: (v: any) => void
  creating: boolean
  handleCreate: () => void
}

export default function JoinCreateModals({ joinModalOpen, setJoinModalOpen, joinSearch, setJoinSearch, joinResults, joinSearching, joining, selectedJoinEnterpriseId, setSelectedJoinEnterpriseId, joinCode, setJoinCode, myRequests, handleJoinSearch, handleJoin, createModalOpen, setCreateModalOpen, createForm, setCreateForm, creating, handleCreate }: Props) {
  const [selectedEnterpriseSnapshot, setSelectedEnterpriseSnapshot] = useState<any | null>(null)
  const selectedEnterprise = joinResults.find((item: any) => item.id === selectedJoinEnterpriseId) || selectedEnterpriseSnapshot
  const normalizedJoinSearch = joinSearch.trim()
  const selectedEnterpriseName = String(selectedEnterprise?.name || '').trim()
  const searchMatchesSelected = !!selectedEnterpriseName && normalizedJoinSearch === selectedEnterpriseName
  const showSearchDropdown = joinModalOpen && !searchMatchesSelected && (joinSearching || joinResults.length > 0 || !!normalizedJoinSearch)
  const requestStatus = selectedJoinEnterpriseId ? myRequests.find((r: any) => r.client_id === selectedJoinEnterpriseId)?.status : null
  const canDirectJoin = !!joinCode.trim()
  const submitDisabled = joining || !selectedJoinEnterpriseId || (requestStatus === 'pending' && !canDirectJoin)
  const submitText = canDirectJoin
    ? '验证推荐码并加入'
    : requestStatus === 'pending'
      ? '该企业审批中'
      : requestStatus === 'rejected'
        ? '重新提交申请'
        : '提交加入申请'

  useEffect(() => {
    if (!joinModalOpen || !selectedJoinEnterpriseId) {
      setSelectedEnterpriseSnapshot(null)
    }
  }, [joinModalOpen, selectedJoinEnterpriseId])

  const renderSearchOption = (enterprise: any) => {
    const isSelected = selectedJoinEnterpriseId === enterprise.id
    return (
      <button
        key={enterprise.id}
        onClick={() => {
          setSelectedJoinEnterpriseId(enterprise.id)
          setSelectedEnterpriseSnapshot(enterprise)
          setJoinSearch(enterprise.name || '')
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          border: 'none',
          background: isSelected ? 'var(--bg-selected)' : 'var(--bg-primary)',
          padding: '10px 12px',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ width: 34, height: 34, borderRadius: 10, background: isSelected ? 'var(--brand)' : 'var(--border-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Building2 size={16} color={isSelected ? 'var(--bg-primary)' : 'var(--text-secondary)'} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{enterprise.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{enterprise.company || enterprise.industry || '企业名称匹配'}</div>
        </div>
        {isSelected && <span style={{ fontSize: 11, color: 'var(--brand)', fontWeight: 600 }}>已选</span>}
      </button>
    )
  }

  return (
    <>
      <Modal open={joinModalOpen} onClose={() => setJoinModalOpen(false)} title="加入企业">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>搜索企业名称</label>
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={joinSearch} onChange={e => setJoinSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleJoinSearch()} placeholder="先下拉查看平台企业，或输入 1 个字筛选"
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none' }} />
                <button onClick={() => handleJoinSearch()} disabled={joinSearching} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--brand)', color: 'var(--bg-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 500, opacity: joinSearching ? 0.6 : 1 }}>
                  <Search size={14} /> {joinSearching ? '搜索中...' : '搜索'}
                </button>
              </div>
              {showSearchDropdown ? (
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: 'var(--bg-primary)', border: '1px solid #dbeafe', borderRadius: 10, boxShadow: '0 10px 30px rgba(15,23,42,0.12)', overflow: 'hidden', zIndex: 20 }}>
                  {joinSearching ? (
                    <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>正在匹配企业...</div>
                  ) : joinResults.length > 0 ? (
                    <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                      {joinResults.map(renderSearchOption)}
                    </div>
                  ) : (
                    <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-tertiary)' }}>{normalizedJoinSearch ? '未找到包含该字的企业' : '暂无可加入的企业'}</div>
                  )}
                </div>
              ) : null}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-tertiary)' }}>默认下拉展示平台可加入企业，输入 1 个字即可按包含关系实时筛选。</div>
          </div>
          <div style={{ padding: '14px 16px', borderRadius: 12, border: '1px solid #dbeafe', background: '#f8fbff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <CheckCircle2 size={16} color="var(--brand)" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1e3a8a' }}>已选企业</span>
            </div>
            {selectedEnterprise ? (
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)' }}>{selectedEnterprise.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  {selectedEnterprise.company || '未填写公司全称'}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>请先从搜索结果中选择一个企业</div>
            )}
          </div>
          <div>
            <label style={labelStyle}>推荐码（选填）</label>
            <div style={{ position: 'relative' }}>
              <input
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/\s/g, '').slice(0, 20))}
                placeholder="有推荐码就填写，填写后可直接加入企业"
                style={{ width: '100%', padding: '10px 12px 10px 40px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
              <KeyRound size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 11 }} />
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-secondary)' }}>不填写则提交审批；填写正确推荐码则直接加入，企业后台会同步收到通知。</div>
          </div>
          {myRequests.filter((r: any) => r.status === 'pending').length > 0 && (
            <div>
              <label style={labelStyle}>待审批的申请</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {myRequests.filter((r: any) => r.status === 'pending').map((r: any) => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: '1px solid #fef3c7', borderRadius: 8, background: '#fffbeb' }}>
                    <Building2 size={16} color="#f59e0b" />
                    <span style={{ flex: 1, fontSize: 14, color: 'var(--text-heading)' }}>{r.enterprise_name}</span>
                    <span style={{ fontSize: 12, color: '#92400e', background: '#fef3c7', padding: '2px 8px', borderRadius: 6 }}>等待审批</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="secondary" onClick={() => setJoinModalOpen(false)}>关闭</Button>
            <Button onClick={() => handleJoin()} disabled={submitDisabled}>{joining ? '处理中...' : submitText}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} title="创建企业">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '70vh', overflowY: 'auto', paddingRight: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)', borderBottom: '1px solid var(--border-primary)', paddingBottom: 6 }}>基本信息</div>
          <Input label="企业名称 *" placeholder="如：XX科技" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} />
          <Input label="公司全称" placeholder="如：XX科技有限公司" value={createForm.company} onChange={e => setCreateForm({ ...createForm, company: e.target.value })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>企业类型</label>
              <select value={createForm.company_type} onChange={e => setCreateForm({ ...createForm, company_type: e.target.value })} style={selectStyle}>
                <option value="">请选择企业类型</option>
                {companyTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>行业</label>
              <select value={createForm.industry} onChange={e => setCreateForm({ ...createForm, industry: e.target.value })} style={selectStyle}>
                <option value="">请选择行业</option>
                {industryOptions.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>规模</label>
              <select value={createForm.scale} onChange={e => setCreateForm({ ...createForm, scale: e.target.value })} style={selectStyle}>
                <option value="">请选择规模</option>
                {scaleOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <Input label="成立日期" type="date" value={createForm.established_date} onChange={e => setCreateForm({ ...createForm, established_date: e.target.value })} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)', borderBottom: '1px solid var(--border-primary)', paddingBottom: 6, marginTop: 4 }}>工商信息（选填）</div>
          <Input label="统一社会信用代码" placeholder="18位信用代码" maxLength={18} value={createForm.credit_code} onChange={e => setCreateForm({ ...createForm, credit_code: e.target.value.toUpperCase() })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input label="法定代表人" placeholder="法人姓名" value={createForm.legal_person} onChange={e => setCreateForm({ ...createForm, legal_person: e.target.value })} />
            <Input label="注册资本" placeholder="如：100万元人民币" value={createForm.registered_capital} onChange={e => setCreateForm({ ...createForm, registered_capital: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>经营范围</label>
            <textarea value={createForm.business_scope} onChange={e => setCreateForm({ ...createForm, business_scope: e.target.value })} rows={2} placeholder="主营业务范围" style={textareaStyle} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)', borderBottom: '1px solid var(--border-primary)', paddingBottom: 6, marginTop: 4 }}>联系方式</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input label="邮箱" placeholder="company@example.com" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} />
            <Input label="电话" placeholder="联系电话" maxLength={11} value={createForm.phone} onChange={e => setCreateForm({ ...createForm, phone: e.target.value.replace(/\D/g, '').slice(0, 11) })} />
          </div>
          <Input label="地址" placeholder="公司地址" value={createForm.address} onChange={e => setCreateForm({ ...createForm, address: e.target.value })} />
          <Input label="官网" placeholder="如：www.example.com" value={createForm.website} onChange={e => setCreateForm({ ...createForm, website: e.target.value })} />
          <div>
            <label style={labelStyle}>备注</label>
            <textarea value={createForm.notes} onChange={e => setCreateForm({ ...createForm, notes: e.target.value })} rows={2} placeholder="企业简介或备注信息" style={textareaStyle} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={creating}>{creating ? '创建中...' : '创建'}</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

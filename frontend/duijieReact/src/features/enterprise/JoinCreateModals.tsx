import { Building2, Search } from 'lucide-react'
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
  myRequests: any[]
  handleJoinSearch: () => void
  handleJoin: (id: number) => void
  createModalOpen: boolean
  setCreateModalOpen: (v: boolean) => void
  createForm: any
  setCreateForm: (v: any) => void
  creating: boolean
  handleCreate: () => void
}

export default function JoinCreateModals({ joinModalOpen, setJoinModalOpen, joinSearch, setJoinSearch, joinResults, joinSearching, joining, myRequests, handleJoinSearch, handleJoin, createModalOpen, setCreateModalOpen, createForm, setCreateForm, creating, handleCreate }: Props) {
  return (
    <>
      <Modal open={joinModalOpen} onClose={() => setJoinModalOpen(false)} title="加入企业">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>搜索企业名称</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={joinSearch} onChange={e => setJoinSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleJoinSearch()} placeholder="输入企业名称搜索"
                style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none' }} />
              <button onClick={handleJoinSearch} disabled={joinSearching} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 500, opacity: joinSearching ? 0.6 : 1 }}>
                <Search size={14} /> {joinSearching ? '搜索中...' : '搜索'}
              </button>
            </div>
          </div>
          {joinResults.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
              {joinResults.map((e: any) => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: 10, background: '#fafbfc' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Building2 size={20} color="#fff" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{e.name}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', gap: 8 }}>
                      {e.industry && <span>{e.industry}</span>}
                      {e.scale && <span>{e.scale}</span>}
                    </div>
                  </div>
                  {myRequests.some((r: any) => r.client_id === e.id && r.status === 'pending') ? (
                    <span style={{ padding: '6px 14px', borderRadius: 8, background: '#fef3c7', color: '#92400e', fontSize: 13, fontWeight: 500 }}>审批中</span>
                  ) : myRequests.some((r: any) => r.client_id === e.id && r.status === 'rejected') ? (
                    <button onClick={() => handleJoin(e.id)} disabled={joining} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#f97316', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500, opacity: joining ? 0.6 : 1 }}>
                      重新申请
                    </button>
                  ) : (
                    <button onClick={() => handleJoin(e.id)} disabled={joining} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500, opacity: joining ? 0.6 : 1 }}>
                      申请加入
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : joinSearch.trim() && !joinSearching ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 14 }}>未找到匹配的企业</div>
          ) : null}
          {myRequests.filter((r: any) => r.status === 'pending').length > 0 && (
            <div>
              <label style={labelStyle}>待审批的申请</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {myRequests.filter((r: any) => r.status === 'pending').map((r: any) => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: '1px solid #fef3c7', borderRadius: 8, background: '#fffbeb' }}>
                    <Building2 size={16} color="#f59e0b" />
                    <span style={{ flex: 1, fontSize: 14, color: '#0f172a' }}>{r.enterprise_name}</span>
                    <span style={{ fontSize: 12, color: '#92400e', background: '#fef3c7', padding: '2px 8px', borderRadius: 6 }}>等待审批</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setJoinModalOpen(false)}>关闭</Button>
          </div>
        </div>
      </Modal>

      <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} title="创建企业">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '70vh', overflowY: 'auto', paddingRight: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#2563eb', borderBottom: '1px solid #e2e8f0', paddingBottom: 6 }}>基本信息</div>
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
          <div style={{ fontSize: 13, fontWeight: 600, color: '#2563eb', borderBottom: '1px solid #e2e8f0', paddingBottom: 6, marginTop: 4 }}>工商信息（选填）</div>
          <Input label="统一社会信用代码" placeholder="18位信用代码" maxLength={18} value={createForm.credit_code} onChange={e => setCreateForm({ ...createForm, credit_code: e.target.value.toUpperCase() })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input label="法定代表人" placeholder="法人姓名" value={createForm.legal_person} onChange={e => setCreateForm({ ...createForm, legal_person: e.target.value })} />
            <Input label="注册资本" placeholder="如：100万元人民币" value={createForm.registered_capital} onChange={e => setCreateForm({ ...createForm, registered_capital: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>经营范围</label>
            <textarea value={createForm.business_scope} onChange={e => setCreateForm({ ...createForm, business_scope: e.target.value })} rows={2} placeholder="主营业务范围" style={textareaStyle} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#2563eb', borderBottom: '1px solid #e2e8f0', paddingBottom: 6, marginTop: 4 }}>联系方式</div>
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

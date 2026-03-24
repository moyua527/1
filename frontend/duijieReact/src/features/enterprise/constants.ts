import React from 'react'

export const section: React.CSSProperties = { background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0' }
export const infoRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#334155', padding: '6px 0' }
export const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }
export const selectStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', background: '#fff' }
export const textareaStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }

export const industryOptions = ['互联网/IT', '金融', '教育', '医疗健康', '制造业', '房地产', '零售/电商', '物流', '传媒/文化', '咨询/服务', '能源', '农业', '政府/公共事业', '其他']
export const scaleOptions = ['1-10人', '11-50人', '51-200人', '201-500人', '501-1000人', '1000人以上']
export const companyTypeOptions = ['有限责任公司', '股份有限公司', '个人独资企业', '合伙企业', '外商投资企业', '个体工商户', '国有企业', '集体企业', '民办非企业', '社会团体', '其他']

export const roleConfig: Record<string, { label: string; color: string; bg: string }> = {
  creator: { label: '创建者', color: '#9333ea', bg: '#f3e8ff' },
  admin: { label: '管理员', color: '#2563eb', bg: '#eff6ff' },
  member: { label: '成员', color: '#64748b', bg: '#f1f5f9' },
}

export const emptyEntForm = { name: '', company: '', email: '', phone: '', notes: '', industry: '', scale: '', address: '', credit_code: '', legal_person: '', registered_capital: '', established_date: '', business_scope: '', company_type: '', website: '' }
export const emptyMemberForm = { name: '', position: '', department: '', phone: '', email: '', notes: '', employee_id: '', join_date: '', supervisor: '', department_id: '' }
export const emptyDeptForm = { name: '', parent_id: '' }

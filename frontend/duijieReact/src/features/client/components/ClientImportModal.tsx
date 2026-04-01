import { useState } from 'react'
import { Upload } from 'lucide-react'
import { clientApi } from '../services/api'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import { toast } from '../../ui/Toast'

interface Props {
  open: boolean
  onClose: () => void
  onImported: () => void
}

export default function ClientImportModal({ open, onClose, onImported }: Props) {
  const [importData, setImportData] = useState<any[]>([])
  const [importing, setImporting] = useState(false)

  const handleClose = () => {
    onClose()
    setImportData([])
  }

  return (
    <Modal open={open} onClose={handleClose} title="批量导入客户">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: 'var(--bg-secondary)', border: '1px dashed #cbd5e1', borderRadius: 10, padding: 20, textAlign: 'center' }}>
          <Upload size={32} color="#94a3b8" style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>选择 CSV 文件上传</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}>表头: 客户名称, 公司, 渠道, 阶段, 邮箱, 电话, 职位级别, 部门, 工作职能, 备注</div>
          <input type="file" accept=".csv" onChange={e => {
            const file = e.target.files?.[0]
            if (!file) return
            const reader = new FileReader()
            reader.onload = ev => {
              const text = ev.target?.result as string
              const lines = text.split(/\r?\n/).filter(l => l.trim())
              if (lines.length < 2) { toast('CSV文件至少需要表头和一行数据', 'error'); return }
              const headerMap: Record<string, string> = { '客户名称': 'name', '公司': 'company', '渠道': 'channel', '阶段': 'stage', '邮箱': 'email', '电话': 'phone', '职位级别': 'position_level', '部门': 'department', '工作职能': 'job_function', '备注': 'notes' }
              const stageRev: Record<string, string> = { '潜在': 'potential', '意向': 'intent', '签约': 'signed', '合作中': 'active', '流失': 'lost' }
              const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim())
              const keys = headers.map(h => headerMap[h] || h)
              const rows = lines.slice(1).map(line => {
                const vals = line.match(/(".*?"|[^,]*)/g)?.map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"').trim()) || []
                const obj: any = {}
                keys.forEach((k, i) => { obj[k] = vals[i] || '' })
                if (obj.stage && stageRev[obj.stage]) obj.stage = stageRev[obj.stage]
                return obj
              }).filter(r => r.name)
              setImportData(rows)
              toast(`解析成功，共 ${rows.length} 条数据`, 'success')
            }
            reader.readAsText(file, 'UTF-8')
            e.target.value = ''
          }} style={{ fontSize: 13 }} />
        </div>

        {importData.length > 0 && (
          <>
            <div style={{ fontSize: 13, color: 'var(--text-body)', fontWeight: 600 }}>预览 (前10条)</div>
            <div style={{ maxHeight: 240, overflowY: 'auto', border: '1px solid var(--border-primary)', borderRadius: 8 }}>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)', position: 'sticky', top: 0 }}>
                    {['名称', '公司', '渠道', '邮箱', '电话'].map(h => <th key={h} style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1px solid var(--border-primary)', color: 'var(--text-secondary)', fontWeight: 500 }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {importData.slice(0, 10).map((r: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-secondary)' }}>
                      <td style={{ padding: '5px 8px' }}>{r.name}</td>
                      <td style={{ padding: '5px 8px' }}>{r.company}</td>
                      <td style={{ padding: '5px 8px' }}>{r.channel}</td>
                      <td style={{ padding: '5px 8px' }}>{r.email}</td>
                      <td style={{ padding: '5px 8px' }}>{r.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {importData.length > 10 && <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>...还有 {importData.length - 10} 条未显示</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button variant="secondary" onClick={handleClose}>取消</Button>
              <Button disabled={importing} onClick={async () => {
                setImporting(true)
                const r = await clientApi.importClients(importData)
                setImporting(false)
                if (r.success) {
                  const d = r.data
                  toast(`导入完成: 成功 ${d.success} 条${d.failed ? `, 失败 ${d.failed} 条` : ''}`, d.failed ? 'error' : 'success')
                  if (d.success > 0) { handleClose(); onImported() }
                } else toast(r.message || '导入失败', 'error')
              }}>{importing ? '导入中...' : `确认导入 ${importData.length} 条`}</Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

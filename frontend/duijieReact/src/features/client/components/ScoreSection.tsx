import { Zap } from 'lucide-react'
import { sectionStyle } from './constants'

const colors: Record<string, string> = { A: '#16a34a', B: '#2563eb', C: '#d97706', D: '#f97316', E: '#dc2626' }
const dimLabels: Record<string, string> = { follow: '跟进活跃', contract: '合同价值', stage: '阶段进展', contact: '联系人', info: '信息完整' }
const dimMax: Record<string, number> = { follow: 30, contract: 25, stage: 20, contact: 10, info: 15 }

interface ScoreSectionProps {
  score: any
}

export default function ScoreSection({ score }: ScoreSectionProps) {
  if (!score) return null

  return (
    <div style={{ ...sectionStyle, marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Zap size={18} color={colors[score.label]} />
        <span style={{ fontSize: 16, fontWeight: 600, color: '#334155' }}>智能评分</span>
        <span style={{ fontSize: 24, fontWeight: 700, color: colors[score.label], marginLeft: 'auto' }}>{score.label}</span>
        <span style={{ fontSize: 14, color: '#94a3b8' }}>{score.total}/100</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Object.entries(score.breakdown).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <span style={{ width: 70, color: '#64748b', flexShrink: 0 }}>{dimLabels[k] || k}</span>
            <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${((v as number) / dimMax[k]) * 100}%`, background: colors[score.label], borderRadius: 3, transition: 'width 0.3s' }} />
            </div>
            <span style={{ width: 36, textAlign: 'right', color: '#94a3b8', fontSize: 12 }}>{v as number}/{dimMax[k]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

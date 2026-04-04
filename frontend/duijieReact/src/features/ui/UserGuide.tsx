import { useState } from 'react'
import { FolderTree, Users, ListChecks, Flag, MessageCircle, Rocket, ChevronRight, ChevronLeft, X } from 'lucide-react'

interface Step {
  icon: typeof Rocket
  iconBg: string
  title: string
  desc: string
  tips: string[]
}

const STEPS: Step[] = [
  {
    icon: Rocket,
    iconBg: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    title: '欢迎使用 DuiJie',
    desc: '这是一个轻量级的项目协作平台，帮助你和团队高效对接工作。接下来几步带你快速上手。',
    tips: ['左侧导航栏可以切换不同模块', '右上角可以搜索、查看通知和管理账号'],
  },
  {
    icon: FolderTree,
    iconBg: 'linear-gradient(135deg, #10b981, #059669)',
    title: '第一步：创建项目',
    desc: '进入「项目管理」页面，点击右上角的操作菜单，选择「新建项目」来创建你的第一个项目。',
    tips: ['填写项目名称和描述即可快速创建', '创建后会自动生成项目ID，可以分享给别人加入', '你也可以通过项目ID或邀请链接加入已有项目'],
  },
  {
    icon: Users,
    iconBg: 'linear-gradient(135deg, #f59e0b, #d97706)',
    title: '第二步：邀请成员',
    desc: '在项目概览右侧的成员区域，点击「管理」来添加团队成员。你也可以复制邀请链接发给同事，他们点击即可加入。',
    tips: ['添加成员时可以选择角色权限', '通过邀请链接加入无需审批', '项目创建者拥有最高权限'],
  },
  {
    icon: ListChecks,
    iconBg: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    title: '第三步：创建任务',
    desc: '在项目的「任务」标签页中创建任务，指定负责人、截止日期和优先级，让工作分配清晰透明。',
    tips: ['任务支持多种状态流转', '可以给任务分配到特定成员', '任务变更会实时通知相关人员'],
  },
  {
    icon: Flag,
    iconBg: 'linear-gradient(135deg, #ef4444, #dc2626)',
    title: '第四步：设置里程碑',
    desc: '使用「里程碑」功能规划项目阶段，明确每个阶段的目标和截止时间，把控项目整体进度。',
    tips: ['里程碑可以关联多个任务', '完成所有关联任务后标记里程碑完成'],
  },
  {
    icon: MessageCircle,
    iconBg: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
    title: '第五步：团队沟通',
    desc: '在项目的「消息」标签页中与团队成员实时沟通，讨论方案、同步进展，所有对话都在项目上下文中。',
    tips: ['消息支持实时推送', '左侧导航的「消息」可以查看所有私聊'],
  },
]

interface UserGuideProps {
  open: boolean
  onClose: () => void
}

export default function UserGuide({ open, onClose }: UserGuideProps) {
  const [step, setStep] = useState(0)

  if (!open) return null

  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1

  const handleFinish = () => {
    setStep(0)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={handleFinish} />
      <div style={{
        position: 'relative', width: 480, maxWidth: '90vw', background: 'var(--bg-primary)',
        borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden',
        animation: 'guideSlideIn 0.3s ease',
      }}>
        <style>{`
          @keyframes guideSlideIn { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        `}</style>

        <button onClick={handleFinish}
          style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4, zIndex: 1, display: 'flex' }}>
          <X size={18} />
        </button>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 3, padding: '16px 20px 0' }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i <= step ? 'var(--brand)' : 'var(--border-primary)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {/* Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '28px 0 16px' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, background: current.iconBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          }}>
            <Icon size={36} color="#fff" />
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '0 28px 24px', textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 700, color: 'var(--text-heading)' }}>{current.title}</h2>
          <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{current.desc}</p>

          <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '14px 18px', textAlign: 'left' }}>
            {current.tips.map((tip, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--text-body)', lineHeight: 1.6, marginTop: i > 0 ? 6 : 0 }}>
                <span style={{ color: 'var(--brand)', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>•</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px 24px' }}>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{step + 1} / {STEPS.length}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                <ChevronLeft size={14} /> 上一步
              </button>
            )}
            <button onClick={isLast ? handleFinish : () => setStep(s => s + 1)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 20px', borderRadius: 8, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {isLast ? '开始使用' : <>下一步 <ChevronRight size={14} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

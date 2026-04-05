import { useEffect, useRef, useCallback } from 'react'
import { driver, type DriveStep, type Config } from 'driver.js'
import 'driver.js/dist/driver.css'

interface Props {
  open: boolean
  onClose: () => void
}

const STEPS: DriveStep[] = [
  {
    element: '[data-tour="tab-overview"]',
    popover: {
      title: '概览',
      description: '项目基本信息、需求状态分布、最近动态都在这里一目了然。',
      side: 'bottom', align: 'start',
    },
  },
  {
    element: '[data-tour="project-members"]',
    popover: {
      title: '项目成员',
      description: '显示所有项目成员头像。点击头像查看成员信息，点击右侧的 + 可以快速邀请新成员加入项目。',
      side: 'left', align: 'start',
    },
  },
  {
    element: '[data-tour="tab-tasks"]',
    popover: {
      title: '需求',
      description: '管理项目中的所有需求。你可以创建需求、上传附件（支持图片编辑标注）、跟踪状态流转（已提出→执行中→待验收→验收通过）。',
      side: 'bottom', align: 'start',
    },
  },
  {
    element: '[data-tour="tab-milestones"]',
    popover: {
      title: '里程碑',
      description: '用里程碑规划项目的关键阶段节点。可以设置名称和目标日期，标记为已完成或进行中。',
      side: 'bottom', align: 'start',
    },
  },
  {
    element: '[data-tour="tab-messages"]',
    popover: {
      title: '项目消息',
      description: '项目内的实时沟通频道。所有项目成员都可以在这里讨论和协作，比私聊更适合团队沟通。',
      side: 'bottom', align: 'start',
    },
  },
  {
    element: '[data-tour="tab-roles"]',
    popover: {
      title: '角色管理',
      description: '管理项目角色和权限。创建者拥有全部权限，其他角色可以自定义具体权限项（如编辑需求、管理成员等）。',
      side: 'bottom', align: 'start',
    },
  },
  {
    element: '[data-tour="project-tabs"]',
    popover: {
      title: '开始使用吧！',
      description: '现在你已经了解了项目的基本功能。试着点击「需求」创建你的第一个需求，或者邀请成员一起协作！',
      side: 'bottom', align: 'center',
    },
  },
]

const CLS = 'duijie-project-tour'

const CSS = `
.driver-popover.${CLS} {
  background: var(--bg-primary, #fff);
  color: var(--text-body, #374151);
  border: 1px solid var(--border-primary, #e5e7eb);
  border-radius: 14px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.18);
  max-width: 340px;
  padding: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.driver-popover.${CLS} .driver-popover-title {
  font-size: 16px; font-weight: 700; color: var(--text-heading, #111827);
  padding: 18px 20px 0; margin: 0;
}
.driver-popover.${CLS} .driver-popover-description {
  font-size: 13.5px; line-height: 1.7; color: var(--text-secondary, #6b7280);
  padding: 8px 20px 16px; margin: 0;
}
.driver-popover.${CLS} .driver-popover-progress-text {
  font-size: 12px; color: var(--text-tertiary, #9ca3af); font-weight: 500;
}
.driver-popover.${CLS} .driver-popover-footer { padding: 0 20px 16px; gap: 8px; }
.driver-popover.${CLS} .driver-popover-prev-btn {
  background: var(--bg-secondary, #f3f4f6); color: var(--text-secondary, #6b7280);
  border: 1px solid var(--border-primary, #e5e7eb); border-radius: 8px;
  padding: 6px 16px; font-size: 13px; font-weight: 500; cursor: pointer;
}
.driver-popover.${CLS} .driver-popover-next-btn,
.driver-popover.${CLS} .driver-popover-close-btn-text {
  background: var(--brand, #6366f1); color: #fff; border: none; border-radius: 8px;
  padding: 6px 20px; font-size: 13px; font-weight: 600; cursor: pointer;
}
.driver-popover.${CLS} .driver-popover-close-btn { color: var(--text-tertiary, #9ca3af); }
.driver-overlay { background: rgba(0, 0, 0, 0.55) !important; }
`

export default function ProjectGuide({ open, onClose }: Props) {
  const driverRef = useRef<ReturnType<typeof driver> | null>(null)
  const styleRef = useRef<HTMLStyleElement | null>(null)

  const cleanup = useCallback(() => {
    driverRef.current?.destroy()
    driverRef.current = null
    styleRef.current?.remove()
    styleRef.current = null
  }, [])

  useEffect(() => {
    if (!open) { cleanup(); return }
    const style = document.createElement('style')
    style.textContent = CSS
    document.head.appendChild(style)
    styleRef.current = style

    const availableSteps = STEPS.filter(s => {
      if (!s.element) return true
      return document.querySelector(s.element as string)
    })

    const config: Config = {
      showProgress: true, animate: true, smoothScroll: true,
      allowClose: true, overlayClickBehavior: 'close',
      stagePadding: 8, stageRadius: 10, popoverClass: CLS,
      progressText: '{{current}} / {{total}}',
      nextBtnText: '下一步', prevBtnText: '上一步', doneBtnText: '知道了 ✓',
      steps: availableSteps,
      onDestroyStarted: () => { driverRef.current?.destroy(); onClose() },
    }

    const timer = setTimeout(() => {
      const d = driver(config)
      driverRef.current = d
      d.drive()
    }, 500)

    return () => { clearTimeout(timer); cleanup() }
  }, [open, onClose, cleanup])

  return null
}

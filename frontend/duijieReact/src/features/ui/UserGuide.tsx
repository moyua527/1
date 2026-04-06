import { useEffect, useRef, useCallback } from 'react'
import { driver, type DriveStep, type Config } from 'driver.js'
import 'driver.js/dist/driver.css'

interface UserGuideProps {
  open: boolean
  onClose: () => void
}

const TOUR_STEPS: DriveStep[] = [
  {
    element: '[data-tour="logo"]',
    popover: {
      title: '欢迎使用 DuiJie 👋',
      description: '这是一个轻量级的项目协作平台，帮你管理项目、分配需求、追踪进度。点击 Logo 可随时回到首页。',
      side: 'bottom', align: 'start',
    },
  },
  {
    element: '[data-tour="sidebar"]',
    popover: {
      title: '侧边导航',
      description: '你的工作空间入口：\n• 仪表盘 — 查看整体数据\n• 项目管理 — 创建和管理项目\n• 需求看板 — 查看全部需求\n• 消息 — 与团队沟通',
      side: 'right', align: 'start',
    },
  },
  {
    element: '[data-tour="search"]',
    popover: {
      title: '全局搜索',
      description: '快速搜索项目、需求、成员。按 Ctrl+K 快捷打开，输入关键字即可跳转。',
      side: 'bottom', align: 'center',
    },
  },
  {
    element: '[data-tour="toolbar"]',
    popover: {
      title: '工具栏',
      description: '通知铃铛 — 接收需求分配、成员加入等提醒\n主题切换 — 亮色/暗色模式\n头像 — 点击修改个人信息和密码',
      side: 'bottom', align: 'end',
    },
  },
  {
    element: '[data-tour="main-content"]',
    popover: {
      title: '开始第一步：创建项目',
      description: '前往「项目管理」→ 点击「创建」按钮 → 输入项目名称和描述 → 项目创建完成后，你会自动成为「创建者」角色并拥有全部权限。',
      side: 'left', align: 'center',
    },
  },
  {
    popover: {
      title: '项目内的功能',
      description: '创建项目后，你可以：\n• 创建需求 — 分配给成员\n• 上传附件 — 支持图片编辑标注\n• 邀请成员 — 通过ID、链接或快速邀请\n• 管理角色 — 自定义权限',
    },
  },
  {
    element: '[data-tour="guide-btn"]',
    popover: {
      title: '随时重新查看',
      description: '忘记操作？点击这里重新打开引导。进入项目后也有专属的项目功能引导。',
      side: 'right', align: 'end',
    },
  },
]

const POPOVER_CLASS = 'duijie-tour-popover'

const CUSTOM_CSS = `
.driver-popover.${POPOVER_CLASS} {
  background: var(--bg-primary, #fff);
  color: var(--text-body, #374151);
  border: 1px solid var(--border-primary, #e5e7eb);
  border-radius: 14px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.18);
  max-width: 340px;
  padding: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.driver-popover.${POPOVER_CLASS} .driver-popover-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-heading, #111827);
  padding: 18px 20px 0;
  margin: 0;
}
.driver-popover.${POPOVER_CLASS} .driver-popover-description {
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--text-secondary, #6b7280);
  padding: 8px 20px 16px;
  margin: 0;
}
.driver-popover.${POPOVER_CLASS} .driver-popover-progress-text {
  font-size: 12px;
  color: var(--text-tertiary, #9ca3af);
  font-weight: 500;
}
.driver-popover.${POPOVER_CLASS} .driver-popover-footer {
  padding: 0 20px 16px;
  gap: 8px;
}
.driver-popover.${POPOVER_CLASS} .driver-popover-prev-btn {
  background: var(--bg-secondary, #f3f4f6);
  color: var(--text-secondary, #6b7280);
  border: 1px solid var(--border-primary, #e5e7eb);
  border-radius: 8px;
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
}
.driver-popover.${POPOVER_CLASS} .driver-popover-next-btn,
.driver-popover.${POPOVER_CLASS} .driver-popover-close-btn-text {
  background: var(--brand, #6366f1);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 6px 20px;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
}
.driver-popover.${POPOVER_CLASS} .driver-popover-close-btn {
  color: var(--text-tertiary, #9ca3af);
}
.driver-popover.${POPOVER_CLASS} .driver-popover-arrow-side-left .driver-popover-arrow,
.driver-popover.${POPOVER_CLASS} .driver-popover-arrow-side-right .driver-popover-arrow,
.driver-popover.${POPOVER_CLASS} .driver-popover-arrow-side-top .driver-popover-arrow,
.driver-popover.${POPOVER_CLASS} .driver-popover-arrow-side-bottom .driver-popover-arrow {
  border-color: var(--bg-primary, #fff);
}
.driver-overlay {
  background: rgba(0, 0, 0, 0.55) !important;
}
`

export default function UserGuide({ open, onClose }: UserGuideProps) {
  const driverRef = useRef<ReturnType<typeof driver> | null>(null)
  const styleRef = useRef<HTMLStyleElement | null>(null)

  const cleanup = useCallback(() => {
    if (driverRef.current) {
      driverRef.current.destroy()
      driverRef.current = null
    }
    if (styleRef.current) {
      styleRef.current.remove()
      styleRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!open) {
      cleanup()
      return
    }

    const style = document.createElement('style')
    style.textContent = CUSTOM_CSS
    document.head.appendChild(style)
    styleRef.current = style

    const config: Config = {
      showProgress: true,
      animate: true,
      smoothScroll: true,
      allowClose: true,
      overlayClickBehavior: 'close',
      stagePadding: 8,
      stageRadius: 10,
      popoverClass: POPOVER_CLASS,
      progressText: '{{current}} / {{total}}',
      nextBtnText: '下一步',
      prevBtnText: '上一步',
      doneBtnText: '开始使用 🎉',
      steps: TOUR_STEPS,
      onDestroyStarted: () => {
        driverRef.current?.destroy()
        onClose()
      },
    }

    const timer = setTimeout(() => {
      const d = driver(config)
      driverRef.current = d
      d.drive()
    }, 300)

    return () => {
      clearTimeout(timer)
      cleanup()
    }
  }, [open, onClose, cleanup])

  return null
}

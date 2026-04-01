import { useState, useMemo, CSSProperties } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

interface GanttTask {
  id: number
  title: string
  startDate: string | null
  endDate: string | null
  status: string
  progress?: number
  projectName?: string
}

interface GanttChartProps {
  tasks: GanttTask[]
  onTaskClick?: (task: GanttTask) => void
}

const STATUS_COLORS: Record<string, string> = {
  todo: 'var(--text-tertiary)',
  in_progress: 'var(--brand)',
  review: '#f59e0b',
  done: '#22c55e',
  accepted: '#22c55e',
  planning: '#8b5cf6',
  active: 'var(--brand)',
  completed: '#22c55e',
  on_hold: '#f59e0b',
}

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function diffDays(a: Date, b: Date) {
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDate(d: Date) {
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export default function GanttChart({ tasks, onTaskClick }: GanttChartProps) {
    const [viewStart, setViewStart] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    d.setHours(0, 0, 0, 0)
    return d
  })
  const viewDays = 42 // 6 weeks

  const viewEnd = useMemo(() => addDays(viewStart, viewDays), [viewStart])

  const validTasks = useMemo(() =>
    tasks.filter(t => t.startDate && t.endDate).map(t => ({
      ...t,
      start: new Date(t.startDate!),
      end: new Date(t.endDate!),
    })),
    [tasks]
  )

  const dayWidth = 28
  const labelWidth = 200
  const headerHeight = 50
  const rowHeight = 36

  const weeks = useMemo(() => {
    const w: { start: Date; days: Date[] }[] = []
    let cur = new Date(viewStart)
    while (cur < viewEnd) {
      const weekStart = new Date(cur)
      const days: Date[] = []
      for (let i = 0; i < 7 && cur < viewEnd; i++) {
        days.push(new Date(cur))
        cur = addDays(cur, 1)
      }
      w.push({ start: weekStart, days })
    }
    return w
  }, [viewStart, viewEnd])

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayOffset = diffDays(viewStart, today)

  const navigate = (dir: number) => {
    setViewStart(prev => addDays(prev, dir * 7))
  }

  const goToday = () => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    d.setHours(0, 0, 0, 0)
    setViewStart(d)
  }

  const containerStyle: CSSProperties = {
    border: '1px solid var(--border-primary)',
    borderRadius: 8,
    overflow: 'hidden',
    background: 'var(--bg-card)',
  }

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 16px',
    background: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border-primary)',
  }

  return (
    <div style={containerStyle}>
      {/* Header controls */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={18} color={'var(--text-secondary)'} />
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>甘特图</span>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {viewStart.toLocaleDateString('zh-CN')} - {addDays(viewEnd, -1).toLocaleDateString('zh-CN')}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => navigate(-1)} style={navBtnStyle()} title="上一周">
            <ChevronLeft size={16} />
          </button>
          <button onClick={goToday} style={{ ...navBtnStyle(), fontSize: 12, padding: '4px 8px' }}>
            今天
          </button>
          <button onClick={() => navigate(1)} style={navBtnStyle()} title="下一周">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Chart body */}
      <div style={{ display: 'flex', overflow: 'auto' }}>
        {/* Task labels */}
        <div style={{ minWidth: labelWidth, maxWidth: labelWidth, borderRight: '1px solid var(--border-primary)', flexShrink: 0 }}>
          <div style={{ height: headerHeight, borderBottom: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
            任务名称
          </div>
          {validTasks.map(task => (
            <div
              key={task.id}
              onClick={() => onTaskClick?.(task)}
              style={{
                height: rowHeight, display: 'flex', alignItems: 'center', padding: '0 12px',
                borderBottom: '1px solid var(--border-secondary)', cursor: onTaskClick ? 'pointer' : 'default',
                fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
              title={task.title}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[task.status] || 'var(--text-tertiary)', marginRight: 8, flexShrink: 0 }} />
              {task.title}
            </div>
          ))}
          {validTasks.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
              暂无带日期的任务
            </div>
          )}
        </div>

        {/* Timeline */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ minWidth: viewDays * dayWidth }}>
            {/* Date header */}
            <div style={{ height: headerHeight, borderBottom: '1px solid var(--border-primary)', display: 'flex' }}>
              {weeks.map((week, wi) => (
                <div key={wi} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-secondary)' }}>
                    {week.start.getMonth() + 1}月
                  </div>
                  <div style={{ display: 'flex', flex: 1 }}>
                    {week.days.map((day, di) => {
                      const isToday = day.getTime() === today.getTime()
                      const isWeekend = day.getDay() === 0 || day.getDay() === 6
                      return (
                        <div key={di} style={{
                          width: dayWidth, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, color: isToday ? 'var(--brand)' : isWeekend ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                          fontWeight: isToday ? 700 : 400,
                          borderRight: '1px solid var(--border-secondary)',
                        }}>
                          {formatDate(day)}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Task bars */}
            <div style={{ position: 'relative' }}>
              {/* Today line */}
              {todayOffset >= 0 && todayOffset < viewDays && (
                <div style={{
                  position: 'absolute', top: 0, bottom: 0,
                  left: todayOffset * dayWidth + dayWidth / 2,
                  width: 2, background: 'var(--brand)', opacity: 0.5, zIndex: 1,
                }} />
              )}

              {validTasks.map((task, i) => {
                const startOff = diffDays(viewStart, task.start)
                const duration = diffDays(task.start, task.end) + 1
                const left = Math.max(0, startOff) * dayWidth
                const barStart = Math.max(0, startOff)
                const barEnd = Math.min(viewDays, startOff + duration)
                const barWidth = Math.max(0, barEnd - barStart) * dayWidth

                if (barWidth <= 0) return (
                  <div key={task.id} style={{ height: rowHeight, borderBottom: '1px solid var(--border-secondary)' }} />
                )

                return (
                  <div key={task.id} style={{ height: rowHeight, position: 'relative', borderBottom: '1px solid var(--border-secondary)' }}>
                    {/* Weekend backgrounds */}
                    {weeks.flatMap(w => w.days).map((day, di) => {
                      if (day.getDay() !== 0 && day.getDay() !== 6) return null
                      return <div key={di} style={{ position: 'absolute', left: di * dayWidth, top: 0, width: dayWidth, height: '100%', background: 'var(--bg-tertiary)', opacity: 0.3 }} />
                    })}
                    {/* Bar */}
                    <div
                      onClick={() => onTaskClick?.(task)}
                      style={{
                        position: 'absolute', top: 6, left: left + 2, width: barWidth - 4, height: rowHeight - 12,
                        background: STATUS_COLORS[task.status] || 'var(--text-tertiary)', borderRadius: 4, cursor: onTaskClick ? 'pointer' : 'default',
                        opacity: 0.85, display: 'flex', alignItems: 'center', paddingLeft: 6,
                        fontSize: 11, color: 'var(--bg-card)', overflow: 'hidden', whiteSpace: 'nowrap',
                      }}
                      title={`${task.title} (${task.startDate} ~ ${task.endDate})`}
                    >
                      {barWidth > 60 ? task.title : ''}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function navBtnStyle(): CSSProperties {
  return {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 28, height: 28, border: '1px solid var(--border-primary)',
    borderRadius: 6, background: 'var(--bg-primary)', color: 'var(--text-secondary)',
    cursor: 'pointer',
  }
}

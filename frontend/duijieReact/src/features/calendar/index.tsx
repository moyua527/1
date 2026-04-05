import { useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2, Circle } from 'lucide-react'
import { useCalendarEvents } from '../../hooks/useApi'

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

interface CalEvent {
  id: string
  title: string
  date: string // YYYY-MM-DD
  type: 'task' | 'followup' | 'milestone'
  color: string
  meta?: string
}

export default function CalendarPage() {
  const [current, setCurrent] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() } })
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const { isMobile } = useOutletContext<{ isMobile: boolean }>()

  const { data: rawData, isLoading: loading } = useCalendarEvents(current.year, current.month)

  const today = useMemo(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }, [])

  const m = current.month + 1
  const start = `${current.year}-${String(m).padStart(2, '0')}-01`
  const lastDay = new Date(current.year, m, 0).getDate()
  const end = `${current.year}-${String(m).padStart(2, '0')}-${lastDay}`

  const events = useMemo(() => {
    const evts: CalEvent[] = []
    if (rawData?.tasks) {
      for (const t of rawData.tasks) {
        if (t.due_date) {
          const d = t.due_date.slice(0, 10)
          evts.push({ id: `task-${t.id}`, title: t.title, date: d, type: 'task', color: '#2563eb', meta: t.status === 'done' ? '已完成' : t.status === 'in_progress' ? '进行中' : '待处理' })
        }
      }
    }
    if (rawData?.followUps) {
      for (const f of rawData.followUps) {
        const d = (f.next_follow_date || f.created_at || '').slice(0, 10)
        if (d && d >= start && d <= end) {
          evts.push({ id: `followup-${f.id}`, title: f.content ? f.content.slice(0, 30) : '跟进提醒', date: d, type: 'followup', color: '#f59e0b', meta: f.client_name })
        }
      }
    }
    return evts
  }, [rawData, start, end])

  const prevMonth = () => setCurrent(p => p.month === 0 ? { year: p.year - 1, month: 11 } : { ...p, month: p.month - 1 })
  const nextMonth = () => setCurrent(p => p.month === 11 ? { year: p.year + 1, month: 0 } : { ...p, month: p.month + 1 })
  const goToday = () => { const d = new Date(); setCurrent({ year: d.getFullYear(), month: d.getMonth() }) }

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(current.year, current.month, 1)
    let startDay = firstDay.getDay() - 1 // Monday=0
    if (startDay < 0) startDay = 6
    const daysInMonth = new Date(current.year, current.month + 1, 0).getDate()
    const daysInPrev = new Date(current.year, current.month, 0).getDate()

    const days: { day: number; month: 'prev' | 'current' | 'next'; dateStr: string }[] = []

    for (let i = startDay - 1; i >= 0; i--) {
      const d = daysInPrev - i
      const m = current.month === 0 ? 12 : current.month
      const y = current.month === 0 ? current.year - 1 : current.year
      days.push({ day: d, month: 'prev', dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` })
    }

    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ day: d, month: 'current', dateStr: `${current.year}-${String(current.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` })
    }

    const remaining = 42 - days.length
    for (let d = 1; d <= remaining; d++) {
      const m = current.month === 11 ? 1 : current.month + 2
      const y = current.month === 11 ? current.year + 1 : current.year
      days.push({ day: d, month: 'next', dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` })
    }

    return days
  }, [current.year, current.month])

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalEvent[]> = {}
    for (const e of events) {
      if (!map[e.date]) map[e.date] = []
      map[e.date].push(e)
    }
    return map
  }, [events])

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] || []) : []

  const typeLabel: Record<string, string> = { task: '需求', followup: '跟进', milestone: '里程碑' }
  const typeColors: Record<string, string> = { task: '#2563eb', followup: '#f59e0b', milestone: '#8b5cf6' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>日历日程</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: 14 }}>需求截止、跟进提醒一览</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Circle size={8} fill="#2563eb" stroke="none" /> 需求</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Circle size={8} fill="#f59e0b" stroke="none" /> 跟进</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexDirection: isMobile ? 'column' : 'row' }}>
        {/* 日历主体 */}
        <div style={{ flex: 1, background: 'var(--bg-primary)', borderRadius: 12, border: '1px solid var(--border-primary)', overflow: 'hidden' }}>
          {/* 月份导航 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border-secondary)' }}>
            <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-secondary)', display: 'flex' }}><ChevronLeft size={20} /></button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-heading)' }}>{current.year}年{current.month + 1}月</span>
              <button onClick={goToday} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'pointer' }}>今天</button>
            </div>
            <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-secondary)', display: 'flex' }}><ChevronRight size={20} /></button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-tertiary)' }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /></div>
          ) : (
            <>
              {/* 星期头 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border-secondary)' }}>
                {WEEKDAYS.map(w => (
                  <div key={w} style={{ textAlign: 'center', padding: '8px 0', fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)' }}>{w}</div>
                ))}
              </div>

              {/* 日期格子 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {calendarDays.map((d, i) => {
                  const dayEvents = eventsByDate[d.dateStr] || []
                  const isToday = d.dateStr === today
                  const isSelected = d.dateStr === selectedDate
                  return (
                    <div key={i} onClick={() => setSelectedDate(d.dateStr === selectedDate ? null : d.dateStr)}
                      style={{
                        minHeight: isMobile ? 48 : 72, padding: 4, cursor: 'pointer',
                        borderBottom: '1px solid var(--border-secondary)', borderRight: (i + 1) % 7 !== 0 ? '1px solid var(--border-secondary)' : 'none',
                        background: isSelected ? 'var(--bg-selected)' : 'transparent',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)' }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}>
                      <div style={{
                        fontSize: 13, fontWeight: isToday ? 700 : 400,
                        color: d.month !== 'current' ? 'var(--text-tertiary)' : isToday ? 'var(--brand)' : 'var(--text-heading)',
                        textAlign: 'right', padding: '2px 4px',
                        ...(isToday ? { background: 'var(--brand)', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' } : {}),
                      }}>
                        {d.day}
                      </div>
                      {!isMobile && dayEvents.slice(0, 2).map(ev => (
                        <div key={ev.id} style={{
                          fontSize: 10, padding: '1px 4px', borderRadius: 3, marginTop: 2,
                          background: ev.color + '15', color: ev.color,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {ev.title}
                        </div>
                      ))}
                      {!isMobile && dayEvents.length > 2 && (
                        <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textAlign: 'center', marginTop: 1 }}>+{dayEvents.length - 2}</div>
                      )}
                      {isMobile && dayEvents.length > 0 && (
                        <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 2 }}>
                          {dayEvents.slice(0, 3).map(ev => (
                            <div key={ev.id} style={{ width: 5, height: 5, borderRadius: '50%', background: ev.color }} />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* 右侧事件详情 */}
        <div style={{ width: isMobile ? '100%' : 300, background: 'var(--bg-primary)', borderRadius: 12, border: '1px solid var(--border-primary)', padding: 16, flexShrink: 0 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CalendarIcon size={16} />
            {selectedDate ? `${selectedDate.slice(5).replace('-', '月')}日` : '选择日期查看'}
          </h3>
          {selectedDate ? (
            selectedEvents.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: 24 }}>当天无事件</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedEvents.map(ev => (
                  <div key={ev.id} style={{
                    padding: '10px 12px', borderRadius: 8, borderLeft: `3px solid ${ev.color}`,
                    background: 'var(--bg-secondary)',
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 4 }}>{ev.title}</div>
                    <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--text-tertiary)' }}>
                      <span style={{ padding: '1px 6px', borderRadius: 4, background: typeColors[ev.type] + '15', color: typeColors[ev.type], fontWeight: 500 }}>
                        {typeLabel[ev.type]}
                      </span>
                      {ev.meta && <span>{ev.meta}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: 24 }}>
              点击日历日期查看当天事件
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

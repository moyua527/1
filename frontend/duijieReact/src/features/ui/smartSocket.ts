import { io, Socket } from 'socket.io-client'
import { BACKEND_URL, getToken } from '../../bootstrap'
import { isCapacitor, SERVER_URL } from '../../utils/capacitor'
import { playNotificationSound } from '../../utils/notificationSound'
import { isSoundEnabled } from './SettingsPanel'

type Listener = (payload?: any) => void

let socket: Socket | null = null
let heartbeatTimer: any = null
let rttSamples: number[] = []
let currentInterval = 30000
let currentUserId: number | null = null
const listeners: Map<string, Set<Listener>> = new Map()
const joinedProjects = new Set<string>()

function resolveSocketUrl() {
  if (isCapacitor) return SERVER_URL

  const configuredUrl = (BACKEND_URL || '').trim()
  if (!configuredUrl) return undefined

  try {
    return new URL(configuredUrl, window.location.origin).origin
  } catch {
    return undefined
  }
}

function getSocket(): Socket {
  if (socket) return socket

  const socketUrl = resolveSocketUrl()
  const socketOptions = {
    path: '/socket.io/',
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
  }

  socket = socketUrl
    ? io(socketUrl, socketOptions)
    : io(undefined, socketOptions)

  socket.on('connect', () => {
    const token = getToken()
    if (token) socket!.emit('auth', token)
    joinedProjects.forEach(pid => socket!.emit('join_project', pid))
    startSmartHeartbeat()
    emit('reconnect')
  })

  socket.on('heartbeat_ack', (startTime: number) => {
    const rtt = Date.now() - startTime
    rttSamples.push(rtt)
    if (rttSamples.length > 10) rttSamples.shift()
    const avgRtt = rttSamples.reduce((a, b) => a + b, 0) / rttSamples.length
    const newInterval = avgRtt < 100 ? 60000 : avgRtt < 300 ? 30000 : 15000
    if (newInterval !== currentInterval) {
      currentInterval = newInterval
      startSmartHeartbeat()
    }
  })

  socket.on('new_dm', (payload: any) => { if (isSoundEnabled('sound_dm')) playNotificationSound(); emit('new_dm', payload) })
  socket.on('new_notification', (payload: any) => { if (isSoundEnabled('sound_notification')) playNotificationSound(); emit('new_notification', payload) })
  socket.on('task_created', (payload: any) => { if (isSoundEnabled('sound_task')) playNotificationSound(); emit('task_created', payload); emit('data_changed', { entity: 'task', action: 'created', ...payload }) })
  socket.on('new_message', (payload: any) => {
    if (payload?.sender_id !== currentUserId && isSoundEnabled('sound_message')) playNotificationSound()
    emit('new_message', payload)
  })
  socket.on('data_changed', (payload: any) => emit('data_changed', payload))

  socket.on('disconnect', () => {
    if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null }
  })

  return socket
}

function startSmartHeartbeat() {
  if (heartbeatTimer) clearInterval(heartbeatTimer)
  heartbeatTimer = setInterval(() => {
    if (socket?.connected) socket.emit('heartbeat', Date.now())
  }, currentInterval)
}

function emit(event: string, payload?: any) {
  const set = listeners.get(event)
  if (set) set.forEach(fn => fn(payload))
}

export function onSocket(event: string, fn: Listener) {
  getSocket()
  if (!listeners.has(event)) listeners.set(event, new Set())
  listeners.get(event)!.add(fn)
  return () => { listeners.get(event)?.delete(fn) }
}

export function offSocket(event: string, fn: Listener) {
  listeners.get(event)?.delete(fn)
}

export function joinProject(projectId: string) {
  const s = getSocket()
  if (!joinedProjects.has(projectId)) {
    joinedProjects.add(projectId)
    if (s.connected) s.emit('join_project', projectId)
  }
}

export function leaveProject(projectId: string) {
  joinedProjects.delete(projectId)
  if (socket?.connected) socket.emit('leave_project', projectId)
}

export function isConnected() {
  return socket?.connected ?? false
}

export function setSocketUserId(uid: number | null) {
  currentUserId = uid
}

export function getHeartbeatInfo() {
  const avgRtt = rttSamples.length ? Math.round(rttSamples.reduce((a, b) => a + b, 0) / rttSamples.length) : 0
  return { avgRtt, interval: currentInterval, connected: socket?.connected ?? false }
}

// ─── SSE fallback channel ───
let sse: EventSource | null = null
let sseRetryTimer: any = null
let sseRetryDelay = 1000

function connectSSE() {
  const token = localStorage.getItem('token')
  if (!token) return

  const base = isCapacitor ? SERVER_URL : (BACKEND_URL || '')
  const url = `${base}/api/sse?token=${encodeURIComponent(token)}`

  try { sse?.close() } catch {}
  sse = new EventSource(url)

  sse.onopen = () => { sseRetryDelay = 1000 }

  sse.addEventListener('data_changed', (e) => {
    try { emit('data_changed', JSON.parse(e.data)) } catch {}
  })
  sse.addEventListener('new_notification', (e) => {
    try { emit('new_notification', JSON.parse(e.data)) } catch {}
  })
  sse.addEventListener('new_dm', (e) => {
    try { emit('new_dm', JSON.parse(e.data)) } catch {}
  })

  sse.onerror = () => {
    sse?.close()
    sse = null
    sseRetryDelay = Math.min(sseRetryDelay * 2, 30000)
    clearTimeout(sseRetryTimer)
    sseRetryTimer = setTimeout(connectSSE, sseRetryDelay)
  }
}

export function startSSE() { connectSSE() }
export function stopSSE() {
  clearTimeout(sseRetryTimer)
  try { sse?.close() } catch {}
  sse = null
}

import { io, Socket } from 'socket.io-client'
import { isCapacitor, SERVER_URL } from '../../utils/capacitor'

type Listener = (payload?: any) => void

let socket: Socket | null = null
let heartbeatTimer: any = null
let rttSamples: number[] = []
let currentInterval = 30000
const listeners: Map<string, Set<Listener>> = new Map()

function getSocket(): Socket {
  if (socket) return socket

  socket = io(isCapacitor ? SERVER_URL : window.location.origin, {
    path: '/socket.io',
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
  })

  socket.on('connect', () => {
    const token = localStorage.getItem('token')
    if (token) socket!.emit('auth', token)
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

  socket.on('new_dm', (payload: any) => emit('new_dm', payload))
  socket.on('new_notification', (payload: any) => emit('new_notification', payload))

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

export function getHeartbeatInfo() {
  const avgRtt = rttSamples.length ? Math.round(rttSamples.reduce((a, b) => a + b, 0) / rttSamples.length) : 0
  return { avgRtt, interval: currentInterval, connected: socket?.connected ?? false }
}

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { X } from 'lucide-react'
import useIsMobile from './useIsMobile'

interface Props { open: boolean; onClose: () => void; title: string; children: React.ReactNode; width?: number; height?: number }

const _closeStack: (() => void)[] = []

/** Try to close the topmost modal. Returns true if a modal was closed. */
export function popModalClose(): boolean {
  const fn = _closeStack[_closeStack.length - 1]
  if (fn) { fn(); return true }
  return false
}


const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex',
  alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  touchAction: 'none',
}

function lockBody() {
  const scrollY = window.scrollY
  document.body.style.overflow = 'hidden'
  document.body.style.position = 'fixed'
  document.body.style.top = `-${scrollY}px`
  document.body.style.left = '0'
  document.body.style.right = '0'
  document.body.dataset.scrollY = String(scrollY)
}

function unlockBody() {
  const scrollY = Number(document.body.dataset.scrollY || 0)
  document.body.style.overflow = ''
  document.body.style.position = ''
  document.body.style.top = ''
  document.body.style.left = ''
  document.body.style.right = ''
  window.scrollTo(0, scrollY)
}

export default function Modal({ open, onClose, title, children, width = 600, height = 600 }: Props) {
  const isMobile = useIsMobile()
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragging = useRef(false)
  const startPos = useRef({ x: 0, y: 0 })
  const startOffset = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (open) {
      lockBody(); setOffset({ x: 0, y: 0 })
      _closeStack.push(onClose)
      return () => {
        const idx = _closeStack.indexOf(onClose)
        if (idx >= 0) _closeStack.splice(idx, 1)
        unlockBody()
      }
    } else {
      unlockBody()
    }
    return () => { unlockBody() }
  }, [open, onClose])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (isMobile) return
    if ((e.target as HTMLElement).closest('button')) return
    dragging.current = true
    startPos.current = { x: e.clientX, y: e.clientY }
    startOffset.current = { ...offset }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [offset, isMobile])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    setOffset({
      x: startOffset.current.x + e.clientX - startPos.current.x,
      y: startOffset.current.y + e.clientY - startPos.current.y,
    })
  }, [])

  const onPointerUp = useCallback(() => { dragging.current = false }, [])

  const stopTouch = useCallback((e: React.TouchEvent) => {
    if (e.target === e.currentTarget) e.preventDefault()
  }, [])

  if (!open) return null
  return (
    <div style={overlay} onTouchMove={stopTouch} onClick={e => { if (e.target === e.currentTarget && isMobile) e.stopPropagation() }}>
      <div
        onClick={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-primary)', borderRadius: isMobile ? '16px 16px 0 0' : 12,
          width: isMobile ? '100%' : width, height: isMobile ? 'auto' : height,
          maxWidth: isMobile ? '100%' : 'calc(100vw - 24px)',
          maxHeight: isMobile ? '90vh' : '85vh', overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          margin: isMobile ? 0 : 12,
          display: 'flex', flexDirection: 'column',
          touchAction: 'auto',
          ...(isMobile
            ? { position: 'fixed' as const, bottom: 0, left: 0, right: 0 }
            : { transform: `translate(${offset.x}px, ${offset.y}px)`, transition: dragging.current ? 'none' : 'transform 0.15s ease' }),
        }}>
        <div
          {...(!isMobile && { onPointerDown, onPointerMove, onPointerUp })}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px', borderBottom: '1px solid var(--border-primary)', flexShrink: 0,
            cursor: isMobile ? 'default' : 'grab', userSelect: 'none',
            ...(!isMobile && { touchAction: 'none' as const }),
          }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-heading)' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: 4 }}><X size={18} /></button>
        </div>
        <div style={{ padding: 20, flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', touchAction: 'pan-y' }}>{children}</div>
      </div>
    </div>
  )
}

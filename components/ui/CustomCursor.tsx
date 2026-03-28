'use client'

import { useEffect, useRef } from 'react'

export function CustomCursor() {
  const dotRef  = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Hide on touch devices
    if (typeof window === 'undefined' || 'ontouchstart' in window) return

    const dot  = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    let mx = -200, my = -200
    let rx = -200, ry = -200
    let raf = 0

    const onMove = (e: MouseEvent) => {
      mx = e.clientX
      my = e.clientY
      dot.style.left = mx + 'px'
      dot.style.top  = my + 'px'
    }

    const loop = () => {
      rx += (mx - rx) * 0.12
      ry += (my - ry) * 0.12
      ring.style.left = rx + 'px'
      ring.style.top  = ry + 'px'
      raf = requestAnimationFrame(loop)
    }

    const grow = () => {
      dot.style.width  = '14px'
      dot.style.height = '14px'
      ring.style.width  = '48px'
      ring.style.height = '48px'
    }
    const shrink = () => {
      dot.style.width  = '8px'
      dot.style.height = '8px'
      ring.style.width  = '32px'
      ring.style.height = '32px'
    }

    const attachHover = () => {
      document.querySelectorAll('a, button, [role="button"]').forEach(el => {
        el.addEventListener('mouseenter', grow)
        el.addEventListener('mouseleave', shrink)
      })
    }

    document.addEventListener('mousemove', onMove)
    document.body.style.cursor = 'none'
    attachHover()
    raf = requestAnimationFrame(loop)

    // Re-attach hover listeners when DOM changes (new buttons/links)
    const mo = new MutationObserver(attachHover)
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('mousemove', onMove)
      document.body.style.cursor = ''
      mo.disconnect()
    }
  }, [])

  return (
    <>
      <div
        ref={dotRef}
        style={{
          position: 'fixed', left: '-200px', top: '-200px',
          width: '8px', height: '8px',
          background: '#C9A84C', borderRadius: '50%',
          pointerEvents: 'none', zIndex: 9999,
          transform: 'translate(-50%, -50%)',
          transition: 'width 0.2s, height 0.2s',
        }}
      />
      <div
        ref={ringRef}
        style={{
          position: 'fixed', left: '-200px', top: '-200px',
          width: '32px', height: '32px',
          border: '1px solid rgba(201,168,76,0.4)', borderRadius: '50%',
          pointerEvents: 'none', zIndex: 9998,
          transform: 'translate(-50%, -50%)',
          transition: 'width 0.25s, height 0.25s',
        }}
      />
    </>
  )
}

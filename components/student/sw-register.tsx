'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return
    const timer = setTimeout(() => {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  return null
}

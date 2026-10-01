'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function OfflineBanner() {
  const [offline, setOffline] = useState(false)
  const t = useTranslations('common')

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine)
    update()
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  if (!offline) return null

  return (
    <div
      role="status"
      className="sticky top-0 z-50 bg-warning-soft text-warning text-sm font-medium px-4 py-2.5 flex items-center justify-center gap-2"
    >
      <WifiOff className="w-4 h-4" aria-hidden />
      {t('offline')}
    </div>
  )
}

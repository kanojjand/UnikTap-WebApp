'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const VISITS_KEY = 'vn_visits'
const SNOOZE_KEY = 'vn_install_snooze'

/** Показывается на 3-м визите, не чаще раза в неделю (раздел 11). */
export function InstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const t = useTranslations('common')

  useEffect(() => {
    let visits = 0
    try {
      visits = Number(localStorage.getItem(VISITS_KEY) ?? '0') + 1
      localStorage.setItem(VISITS_KEY, String(visits))
      const snooze = Number(localStorage.getItem(SNOOZE_KEY) ?? '0')
      if (snooze === -1 || Date.now() < snooze) return
    } catch {
      return
    }
    if (visits < 3) return

    const handler = (nativeEvent: Event) => {
      nativeEvent.preventDefault()
      setEvent(nativeEvent as BeforeInstallPromptEvent)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function snooze(forever = false) {
    try {
      localStorage.setItem(SNOOZE_KEY, forever ? '-1' : String(Date.now() + 7 * 24 * 3600 * 1000))
    } catch {
      /* игнорируем */
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-24 inset-x-4 md:left-1/2 md:-translate-x-1/2 md:w-96 z-40 bg-white rounded-2xl shadow-modal border border-gray-100 p-4">
      <div className="flex items-start gap-3">
        <div className="bg-softBlue text-corpBlue rounded-xl p-2">
          <Download className="w-5 h-5" aria-hidden />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm text-gray-900">{t('install')}</p>
          <p className="text-xs text-gray-500 mt-1">{t('installHint')}</p>
        </div>
        <button onClick={() => snooze()} aria-label={t('close')} className="text-gray-400">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex gap-2 mt-3">
        <Button
          size="sm"
          fullWidth
          onClick={async () => {
            await event?.prompt()
            setVisible(false)
          }}
        >
          {t('install')}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => snooze(true)}>
          {t('never')}
        </Button>
      </div>
    </div>
  )
}

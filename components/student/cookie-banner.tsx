'use client'

import { useEffect, useState } from 'react'
import NextLink from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

const KEY = 'vn_cookie_ack'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const t = useTranslations('common')
  const locale = useLocale()

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setVisible(true)
    } catch {
      /* приватный режим */
    }
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-[calc(88px+env(safe-area-inset-bottom))] md:bottom-6 inset-x-0 z-50 px-3 md:px-6 pointer-events-none">
      <div className="pointer-events-auto mx-auto md:mx-0 md:max-w-md bg-surface border border-line shadow-modal rounded-2xl p-4 flex items-center gap-3 animate-fade-in">
        <p className="text-sm text-body flex-1">
          {t('cookieText')}{' '}
          <NextLink href={`/${locale}/privacy`} className="text-primary-ink underline">
            {t('privacy')}
          </NextLink>
        </p>
        <Button
          size="sm"
          onClick={() => {
            try {
              localStorage.setItem(KEY, '1')
            } catch {
              /* игнорируем */
            }
            setVisible(false)
          }}
        >
          {t('cookieOk')}
        </Button>
      </div>
    </div>
  )
}

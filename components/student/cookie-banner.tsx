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
    <div className="fixed bottom-20 md:bottom-4 inset-x-0 z-50 px-4">
      <div className="mx-auto md:max-w-md bg-white border border-gray-100 shadow-modal rounded-2xl p-4 flex items-center gap-3">
        <p className="text-xs text-gray-600 flex-1">
          {t('cookieText')}{' '}
          <NextLink href={`/${locale}/privacy`} className="text-corpBlue underline">
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

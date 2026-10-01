'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

export default function LocaleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('errors')

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-[70dvh] flex items-center justify-center px-4">
      <EmptyState
        icon={<AlertTriangle />}
        title={t('title')}
        text={t('text')}
        action={<Button onClick={reset}>{t('retry')}</Button>}
      />
    </div>
  )
}

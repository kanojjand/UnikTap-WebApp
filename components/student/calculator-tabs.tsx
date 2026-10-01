'use client'

import { useTranslations } from 'next-intl'
import { UrlTabs } from '@/components/ui/tabs'

export function CalculatorTabs() {
  const t = useTranslations('calculator')

  return (
    <UrlTabs
      tabs={[
        { id: 'score', label: t('tabScore') },
        { id: 'chances', label: t('tabChances') },
      ]}
    />
  )
}

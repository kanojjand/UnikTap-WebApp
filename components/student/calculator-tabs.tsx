'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Tabs } from '@/components/ui/tabs'

export function CalculatorTabs() {
  const t = useTranslations('calculator')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const active = searchParams.get('tab') === 'chances' ? 'chances' : 'score'

  return (
    <Tabs
      className="px-4 mb-4"
      active={active}
      onChange={(id) => {
        const params = new URLSearchParams(searchParams.toString())
        if (id === 'score') params.delete('tab')
        else params.set('tab', id)
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
      }}
      tabs={[
        { id: 'score', label: t('tabScore') },
        { id: 'chances', label: t('tabChances') },
      ]}
    />
  )
}

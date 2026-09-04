'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Select } from '@/components/ui/input'

export function ReviewsSort() {
  const t = useTranslations('reviews')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return (
    <Select
      aria-label={t('title')}
      value={searchParams.get('rsort') ?? 'helpful'}
      onChange={(event) => {
        const params = new URLSearchParams(searchParams.toString())
        if (event.target.value === 'helpful') params.delete('rsort')
        else params.set('rsort', event.target.value)
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
      }}
      className="py-2 text-sm max-w-[190px]"
    >
      <option value="helpful">{t('sortHelpful')}</option>
      <option value="new">{t('sortNew')}</option>
      <option value="high">{t('sortHigh')}</option>
      <option value="low">{t('sortLow')}</option>
    </Select>
  )
}

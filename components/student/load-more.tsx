'use client'

import { useEffect, useRef, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

/** Бесконечная прокрутка через IntersectionObserver + кнопка как запасной вариант. */
export function LoadMore({ page, hasMore }: { page: number; hasMore: boolean }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const sentinel = useRef<HTMLDivElement>(null)
  const t = useTranslations('common')

  const loadNext = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page + 1))
    startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }))
  }

  useEffect(() => {
    if (!hasMore || !sentinel.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !pending) loadNext()
      },
      { rootMargin: '400px' },
    )
    observer.observe(sentinel.current)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, page, pending])

  if (!hasMore) return null

  return (
    <div ref={sentinel} className="pt-4 flex justify-center">
      <Button variant="secondary" onClick={loadNext} loading={pending}>
        {t('showMore')}
      </Button>
    </div>
  )
}

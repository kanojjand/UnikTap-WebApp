'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export interface TabItem {
  id: string
  label: string
}

/** Активный таб живёт в URL (?tab=majors) — работает «назад» и шеринг ссылки. */
export function UrlTabs({
  tabs,
  paramName = 'tab',
  onChange,
  className,
}: {
  tabs: TabItem[]
  paramName?: string
  onChange?: (id: string) => void
  className?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const active = searchParams.get(paramName) ?? tabs[0]?.id

  function select(id: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (id === tabs[0]?.id) params.delete(paramName)
    else params.set(paramName, id)
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    onChange?.(id)
  }

  return (
    <div className={cn('flex border-b border-gray-100 overflow-x-auto hide-scroll', className)} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => select(tab.id)}
          className={cn(
            'flex-1 min-w-max px-3 pb-3 text-sm font-medium transition-colors whitespace-nowrap',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-corpBlue rounded-t',
            active === tab.id ? 'text-corpBlue border-b-2 border-corpBlue' : 'text-gray-400',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export function Tabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: TabItem[]
  active: string
  onChange: (id: string) => void
  className?: string
}) {
  return (
    <div className={cn('flex border-b border-gray-100 overflow-x-auto hide-scroll', className)} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex-1 min-w-max px-3 pb-3 text-sm font-medium transition-colors whitespace-nowrap',
            active === tab.id ? 'text-corpBlue border-b-2 border-corpBlue' : 'text-gray-400',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

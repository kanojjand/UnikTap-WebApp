'use client'

import { useState, useTransition } from 'react'
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
  const [pending, startTransition] = useTransition()
  const [requested, setRequested] = useState<string | null>(null)
  const current = searchParams.get(paramName) ?? tabs[0]?.id
  // Таб подсвечивается сразу по нажатию, не дожидаясь ответа сервера
  const active = pending && requested ? requested : current

  function select(id: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (id === tabs[0]?.id) params.delete(paramName)
    else params.set(paramName, id)
    const query = params.toString()
    setRequested(id)
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }))
    onChange?.(id)
  }

  return (
    <div aria-busy={pending || undefined} className={className}>
      <TabList tabs={tabs} active={active} onChange={select} />
      <div
        className={cn(
          'h-0.5 -mt-0.5 bg-primary/60 origin-left transition-transform',
          pending ? 'animate-pulse scale-x-100' : 'scale-x-0',
        )}
        aria-hidden
      />
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
  return <TabList tabs={tabs} active={active} onChange={onChange} className={className} />
}

function TabList({
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
    <div className={cn('flex gap-1 border-b border-line overflow-x-auto hide-scroll', className)} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex-1 min-w-max px-4 min-h-[48px] text-[15px] font-semibold transition-colors whitespace-nowrap -mb-px border-b-2',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary rounded-t-lg',
            active === tab.id ? 'text-primary-ink border-primary-ink' : 'text-muted border-transparent hover:text-ink',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

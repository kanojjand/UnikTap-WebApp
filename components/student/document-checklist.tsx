'use client'

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AdmissionBlock } from '@/types/domain'

/** Отметки — черновик пользователя, поэтому живут в localStorage, а не в аккаунте. */
export function DocumentChecklist({
  blocks,
  universityId,
  locale,
}: {
  blocks: AdmissionBlock[]
  universityId: string
  locale: string
}) {
  const storageKey = `vn_docs_${universityId}`
  const [checked, setChecked] = useState<string[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) setChecked(JSON.parse(raw) as string[])
    } catch {
      /* приватный режим */
    }
  }, [storageKey])

  function toggle(id: string) {
    setChecked((current) => {
      const next = current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
      try {
        localStorage.setItem(storageKey, JSON.stringify(next))
      } catch {
        /* игнорируем */
      }
      return next
    })
  }

  return (
    <ul className="space-y-2">
      {blocks.map((block) => {
        const active = checked.includes(block.id)
        const title = locale === 'kk' && block.title_kk ? block.title_kk : block.title_ru
        const content = locale === 'kk' && block.content_kk ? block.content_kk : block.content_ru

        return (
          <li key={block.id}>
            <button
              onClick={() => toggle(block.id)}
              aria-pressed={active}
              className="w-full min-h-[56px] flex items-start gap-3 text-left p-3.5 rounded-xl bg-surface border border-line hover:bg-subtle/60 transition-colors"
            >
              <span
                className={cn(
                  'w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors',
                  active ? 'bg-primary border-primary text-white' : 'border-muted/50',
                )}
              >
                {active ? <Check className="w-4 h-4" strokeWidth={3} aria-hidden /> : null}
              </span>
              <span className="flex-1">
                <span className={cn('block text-[15px] font-medium', active ? 'text-muted line-through' : 'text-ink')}>
                  {title}
                </span>
                {content ? <span className="block text-sm text-muted mt-0.5">{content}</span> : null}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

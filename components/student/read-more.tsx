'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

export function ReadMore({ text, limit = 400 }: { text: string; limit?: number }) {
  const [open, setOpen] = useState(false)
  const t = useTranslations('common')
  if (!text) return null
  const needsCut = text.length > limit

  return (
    <div>
      <p className="prose-content">{open || !needsCut ? text : `${text.slice(0, limit).trimEnd()}…`}</p>
      {needsCut ? (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="mt-1 -ml-2 px-2 min-h-[44px] rounded-lg text-[15px] font-semibold text-primary-ink hover:bg-primary-soft"
        >
          {open ? t('collapse') : t('readMore')}
        </button>
      ) : null}
    </div>
  )
}

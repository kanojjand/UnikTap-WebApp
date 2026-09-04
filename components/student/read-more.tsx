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
        <button onClick={() => setOpen((value) => !value)} className="mt-2 text-sm font-medium text-corpBlue">
          {open ? t('collapse') : t('readMore')}
        </button>
      ) : null}
    </div>
  )
}

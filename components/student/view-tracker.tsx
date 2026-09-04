'use client'

import { useEffect } from 'react'
import { track } from '@/lib/analytics'

export function ViewTracker({ universityId, tab }: { universityId: string; tab: string }) {
  useEffect(() => {
    track('university_view', {}, { universityId })
  }, [universityId])

  useEffect(() => {
    if (tab && tab !== 'overview') track('tab_view', { tab }, { universityId })
  }, [tab, universityId])

  return null
}

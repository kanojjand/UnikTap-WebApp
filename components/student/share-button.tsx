'use client'

import { Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { track } from '@/lib/analytics'

export function ShareButton({
  title,
  universityId,
  className,
}: {
  title: string
  universityId?: string
  className?: string
}) {
  const t = useTranslations('common')

  async function share() {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title, url })
        track('share', { channel: 'native' }, { universityId })
        return
      }
      await navigator.clipboard.writeText(url)
      toast.success(t('linkCopied'))
      track('share', { channel: 'clipboard' }, { universityId })
    } catch {
      /* пользователь отменил */
    }
  }

  return (
    <button onClick={share} aria-label={t('share')} className={className}>
      <Share2 className="w-5 h-5" aria-hidden />
    </button>
  )
}

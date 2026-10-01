'use client'

import { Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/utils'

export function ShareButton({
  title,
  universityId,
  className,
  withLabel = false,
}: {
  title: string
  universityId?: string
  className?: string
  withLabel?: boolean
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
    <button
      type="button"
      onClick={share}
      aria-label={t('share')}
      className={cn('inline-flex items-center justify-center gap-2 min-w-[44px] min-h-[44px]', className)}
    >
      <Share2 className="w-5 h-5" aria-hidden />
      {withLabel ? <span>{t('share')}</span> : null}
    </button>
  )
}

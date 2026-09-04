'use client'

import { useState, useTransition } from 'react'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { toggleFavorite } from '@/lib/actions/favorites'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/utils'
import { AuthWall } from './auth-wall'

export function FavoriteButton({
  universityId,
  initial = false,
  isGuest = false,
  className,
  size = 20,
}: {
  universityId: string
  initial?: boolean
  isGuest?: boolean
  className?: string
  size?: number
}) {
  const [active, setActive] = useState(initial)
  const [wall, setWall] = useState(false)
  const [pending, startTransition] = useTransition()
  const t = useTranslations('favorites')

  function onClick(event: React.MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    if (isGuest) return setWall(true)

    startTransition(async () => {
      const result = await toggleFavorite(universityId)
      if (!result.ok) {
        if (result.error === 'unauthorized') setWall(true)
        return
      }
      setActive(result.added)
      track(result.added ? 'favorite_add' : 'favorite_remove', {}, { universityId })
      toast.success(result.added ? t('added') : t('removed'))
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-pressed={active}
        aria-label={t('title')}
        className={cn(
          'p-2 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center',
          active ? 'text-red-500' : 'text-gray-300 hover:text-gray-400',
          className,
        )}
      >
        <Heart width={size} height={size} fill={active ? 'currentColor' : 'none'} aria-hidden />
      </button>
      <AuthWall open={wall} onClose={() => setWall(false)} reason="favorite" />
    </>
  )
}

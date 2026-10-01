'use client'

import { useState, useTransition } from 'react'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { toggleFavorite } from '@/lib/actions/favorites'
import { track } from '@/lib/analytics'
import { haptic } from '@/lib/haptics'
import { cn } from '@/lib/utils'
import { AuthWall } from './auth-wall'

export function FavoriteButton({
  universityId,
  initial = false,
  isGuest = false,
  className,
  size = 22,
}: {
  universityId: string
  initial?: boolean
  isGuest?: boolean
  className?: string
  size?: number
}) {
  const [active, setActive] = useState(initial)
  const [pops, setPops] = useState(0)
  const [wall, setWall] = useState(false)
  const [pending, startTransition] = useTransition()
  const t = useTranslations('favorites')

  // `next` передаётся явно: «Отменить» в уведомлении вызывается позже, из старого замыкания
  function run(next: boolean, silent = false) {
    // Оптимистично: сердечко меняется сразу, без ожидания сервера
    setActive(next)
    if (next) {
      setPops((value) => value + 1)
      haptic()
    }

    startTransition(async () => {
      const result = await toggleFavorite(universityId)
      if (!result.ok) {
        setActive(!next)
        if (result.error === 'unauthorized') setWall(true)
        else toast.error(t('error'))
        return
      }
      setActive(result.added)
      track(result.added ? 'favorite_add' : 'favorite_remove', {}, { universityId })
      if (silent) return
      // Удаление можно отменить прямо из уведомления — без «Вы уверены?»
      if (result.added) toast.success(t('added'))
      else toast(t('removed'), { action: { label: t('undo'), onClick: () => run(true, true) } })
    })
  }

  function onClick(event: React.MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    if (isGuest) return setWall(true)
    if (pending) return
    run(!active)
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        aria-label={active ? t('removeAria') : t('add')}
        className={cn(
          'rounded-full transition-colors w-11 h-11 flex items-center justify-center',
          active ? 'text-red-500' : 'text-muted hover:text-ink hover:bg-subtle',
          className,
        )}
      >
        <Heart
          key={pops}
          width={size}
          height={size}
          fill={active ? 'currentColor' : 'none'}
          className={pops > 0 && active ? 'animate-pop' : undefined}
          aria-hidden
        />
      </button>
      <AuthWall open={wall} onClose={() => setWall(false)} reason="favorite" />
    </>
  )
}

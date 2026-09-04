'use client'

import { useTranslations } from 'next-intl'
import { LogIn } from 'lucide-react'
import { BottomSheet } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

export type WallReason = 'favorite' | 'review' | 'score' | 'default'

/** «Мягкая стена» из раздела 5.2: гость видит всё, вход нужен только для действий. */
export function AuthWall({
  open,
  onClose,
  reason = 'default',
  next,
}: {
  open: boolean
  onClose: () => void
  reason?: WallReason
  next?: string
}) {
  const t = useTranslations('auth')
  const text =
    reason === 'favorite' ? t('wallFavorite') : reason === 'review' ? t('wallReview') : reason === 'score' ? t('wallScore') : t('wallDefault')

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="text-center pb-2">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-softBlue text-corpBlue flex items-center justify-center mb-3">
          <LogIn className="w-6 h-6" aria-hidden />
        </div>
        <p className="font-bold text-gray-900">{text}</p>
        <div className="mt-5 space-y-2">
          <Link href={next ? `/auth/login?next=${encodeURIComponent(next)}` : '/auth/login'} className="block">
            <Button fullWidth>{t('signIn')}</Button>
          </Link>
          <Link href="/auth/register" className="block">
            <Button fullWidth variant="secondary">
              {t('signUp')}
            </Button>
          </Link>
        </div>
      </div>
    </BottomSheet>
  )
}

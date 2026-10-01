'use client'

import { useTranslations } from 'next-intl'
import { LogIn } from 'lucide-react'
import { BottomSheet } from '@/components/ui/modal'
import { buttonClass } from '@/components/ui/button-styles'
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
  const tc = useTranslations('common')
  const text =
    reason === 'favorite'
      ? t('wallFavorite')
      : reason === 'review'
        ? t('wallReview')
        : reason === 'score'
          ? t('wallScore')
          : t('wallDefault')

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="text-center pt-2">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-primary-soft text-primary-ink flex items-center justify-center mb-4">
          <LogIn className="w-7 h-7" aria-hidden />
        </div>
        <p className="text-lg font-bold text-ink">{text}</p>
        <p className="text-[15px] text-muted mt-1">{t('wallHint')}</p>
        <div className="mt-6 space-y-2">
          <Link
            href={next ? `/auth/login?next=${encodeURIComponent(next)}` : '/auth/login'}
            className={buttonClass('primary', 'md', true)}
          >
            {t('signIn')}
          </Link>
          <Link href="/auth/register" className={buttonClass('secondary', 'md', true)}>
            {t('signUp')}
          </Link>
          <button type="button" onClick={onClose} className={buttonClass('ghost', 'md', true)}>
            {tc('later')}
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}

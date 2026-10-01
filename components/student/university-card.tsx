import Image from 'next/image'
import { MapPin, Star } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Badge } from '@/components/ui/badge'
import { formatMoney, pick } from '@/lib/utils'
import type { Chance } from '@/lib/ent'
import type { University } from '@/types/domain'
import { FavoriteButton } from './favorite-button'
import { ChanceBadge } from './chance-badge'

const PLACEHOLDER =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNlMmU4ZjAiLz48L3N2Zz4='

export async function UniversityCard({
  university,
  locale,
  chance,
  isFavorite = false,
  isGuest = true,
  minReviews = 3,
  priority = false,
}: {
  university: University
  locale: string
  chance?: Chance
  isFavorite?: boolean
  isGuest?: boolean
  minReviews?: number
  priority?: boolean
}) {
  const t = await getTranslations('catalog')
  const tu = await getTranslations('types')
  const name = pick(university as unknown as Record<string, unknown>, 'name', locale)
  const city = university.city ? pick(university.city as unknown as Record<string, unknown>, 'name', locale) : ''
  // В списке показываем логотип (как аватар вуза), обложка — запасной вариант
  const logo = university.logo_url || ''
  const image = logo || university.cover_url || ''
  const hasRating = university.reviews_count >= minReviews

  return (
    <li className="relative bg-surface rounded-2xl border border-line shadow-card transition-[box-shadow,transform] duration-150 hover:shadow-lift active:scale-[0.99] motion-reduce:transform-none">
      {/* Вся карточка — одна большая ссылка */}
      <Link
        href={`/universities/${university.slug}`}
        className="flex gap-4 p-4 pr-14 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="w-16 h-16 md:w-[72px] md:h-[72px] rounded-xl overflow-hidden shrink-0 relative bg-white border border-line flex items-center justify-center">
          {image ? (
            <Image
              src={image}
              alt=""
              fill
              sizes="72px"
              priority={priority}
              className={logo ? 'object-contain p-1.5' : 'object-cover'}
              placeholder="blur"
              blurDataURL={PLACEHOLDER}
            />
          ) : (
            <span className="text-2xl font-bold text-slate-400" aria-hidden>
              {(university.abbr || university.short_name || name).slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[16px] leading-snug text-ink line-clamp-2">
            {university.short_name || name}
          </h3>
          <p className="text-sm text-muted mt-1 flex items-center gap-1 min-w-0">
            <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden />
            <span className="truncate">
              {city}
              {city ? ' · ' : ''}
              {tu(university.type)}
            </span>
          </p>

          <div className="flex items-center gap-1 mt-1.5 text-sm">
            <Star className="w-4 h-4 text-yellow-400" fill="currentColor" strokeWidth={0} aria-hidden />
            {hasRating ? (
              <>
                <span className="font-semibold text-ink">{Number(university.rating).toFixed(1)}</span>
                <span className="text-muted">· {t('reviewsCount', { count: university.reviews_count })}</span>
              </>
            ) : (
              <span className="text-muted">{t('fewRatings')}</span>
            )}
          </div>

          {university.min_fee || university.min_ent_score || chance ? (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {chance ? <ChanceBadge chance={chance} mini /> : null}
              {university.min_ent_score ? (
                <Badge tone="neutral" mini>
                  {t('entFrom', { score: university.min_ent_score })}
                </Badge>
              ) : null}
              {university.min_fee ? (
                <Badge tone="neutral" mini>
                  {t('feeFrom', { value: formatMoney(university.min_fee, locale) })}
                </Badge>
              ) : null}
            </div>
          ) : null}
        </div>
      </Link>

      <div className="absolute top-2 right-2">
        <FavoriteButton universityId={university.id} initial={isFavorite} isGuest={isGuest} />
      </div>
    </li>
  )
}

import Image from 'next/image'
import { MapPin, Star } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
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
}: {
  university: University
  locale: string
  chance?: Chance
  isFavorite?: boolean
  isGuest?: boolean
  minReviews?: number
}) {
  const t = await getTranslations('catalog')
  const tu = await getTranslations('types')
  const name = pick(university as unknown as Record<string, unknown>, 'name', locale)
  const city = university.city ? pick(university.city as unknown as Record<string, unknown>, 'name', locale) : ''
  // В списке показываем логотип (как аватар вуза), обложка — запасной вариант
  const logo = university.logo_url || ''
  const image = logo || university.cover_url || ''

  return (
    <Card as="li" interactive className="p-4 relative">
      <Link href={`/universities/${university.slug}`} className="flex gap-4">
        <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 relative bg-white border border-gray-100 flex items-center justify-center">
          {image ? (
            <Image
              src={image}
              alt={name}
              fill
              sizes="80px"
              className={logo ? 'object-contain p-2' : 'object-cover'}
              placeholder="blur"
              blurDataURL={PLACEHOLDER}
            />
          ) : (
            <span className="text-2xl font-bold text-gray-300">
              {(university.abbr || university.short_name || name).slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0 pr-8">
          <h3 className="font-bold leading-tight text-gray-900 line-clamp-2">{university.short_name || name}</h3>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" aria-hidden />
            {city}
            {city ? ' · ' : ''}
            {tu(university.type)}
          </p>

          <div className="flex items-center gap-1 mt-2">
            <Star className="w-4 h-4 text-yellow-400" fill="currentColor" strokeWidth={0} aria-hidden />
            {university.reviews_count >= minReviews ? (
              <span className="text-sm font-semibold text-gray-700">
                {Number(university.rating).toFixed(1)}{' '}
                <span className="text-xs font-normal text-gray-400">
                  ({t('reviewsCount', { count: university.reviews_count })})
                </span>
              </span>
            ) : (
              <span className="text-xs text-gray-400">{t('fewRatings')}</span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {university.min_fee ? (
              <Badge tone="info" mini>
                от {formatMoney(university.min_fee, locale)}
              </Badge>
            ) : null}
            {university.min_ent_score ? (
              <Badge tone="neutral" mini>
                {t('entFrom', { score: university.min_ent_score })}
              </Badge>
            ) : null}
            {chance ? <ChanceBadge chance={chance} mini /> : null}
          </div>
        </div>
      </Link>

      <div className="absolute top-2 right-2">
        <FavoriteButton universityId={university.id} initial={isFavorite} isGuest={isGuest} />
      </div>
    </Card>
  )
}

import { getTranslations, setRequestLocale } from 'next-intl/server'
import { MapLoader } from '@/components/student/map/map-loader'
import { getMapUniversities } from '@/lib/queries/universities'
import { getCities } from '@/lib/queries/dictionaries'
import { getSettings } from '@/lib/queries/settings'
import { getCurrentProfile } from '@/lib/queries/profile'
import { getChance, getThreshold, resolveThresholdCategory } from '@/lib/ent'

// Зависит от сессии пользователя — рендерим на каждый запрос
export const dynamic = 'force-dynamic'

export default async function MapPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const [t, universities, cities, settings, profile] = await Promise.all([
    getTranslations('map'),
    getMapUniversities(),
    getCities(),
    getSettings(),
    getCurrentProfile(),
  ])

  const score = profile?.ent_score ?? 0
  const points = universities.map((university) => ({
    university,
    chance:
      score > 0
        ? getChance(
            score,
            university.min_ent_score,
            getThreshold(settings.ent_thresholds, resolveThresholdCategory({ universityType: university.type })),
            settings.chance_bands,
          )
        : undefined,
  }))

  return (
    // Карта занимает весь экран между заголовком и нижней навигацией
    <div className="flex flex-col h-[100dvh] md:h-[calc(100dvh-4rem)] pb-[calc(60px+env(safe-area-inset-bottom))] md:pb-6">
      <header className="container-app pt-safe pb-3 md:pb-4 shrink-0">
        <h1 className="text-[26px] md:text-3xl font-bold tracking-tight text-ink">{t('title')}</h1>
      </header>
      <div className="flex-1 min-h-0 w-full md:mx-auto md:max-w-6xl md:px-6">
        <MapLoader points={points} cities={cities} locale={locale} />
      </div>
    </div>
  )
}

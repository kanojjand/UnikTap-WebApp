import { getTranslations, setRequestLocale } from 'next-intl/server'
import { BottomNav } from '@/components/ui/bottom-nav'
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

  const t = await getTranslations('map')
  const [universities, cities, settings, profile] = await Promise.all([
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
    <div className="min-h-[100dvh] pb-20 bg-slateBg">
      <header className="bg-corpBlue px-4 pt-10 pb-6 rounded-b-2xl">
        <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
      </header>
      <MapLoader points={points} cities={cities} locale={locale} />
      <BottomNav />
    </div>
  )
}

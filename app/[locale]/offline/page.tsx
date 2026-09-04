import { WifiOff } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { EmptyState } from '@/components/ui/empty-state'

export default async function OfflinePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('errors')

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-white">
      <EmptyState icon={<WifiOff className="w-12 h-12" />} title={t('offlineTitle')} text={t('offlineText')} />
    </div>
  )
}

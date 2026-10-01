import { SearchX } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { buttonClass } from '@/components/ui/button-styles'
import { EmptyState } from '@/components/ui/empty-state'

export default async function LocaleNotFound() {
  const t = await getTranslations('errors')

  return (
    <div className="min-h-[70dvh] flex items-center justify-center px-4">
      <EmptyState
        icon={<SearchX />}
        title={t('notFoundTitle')}
        text={t('notFoundText')}
        action={
          <Link href="/" className={buttonClass()}>
            {t('toHome')}
          </Link>
        }
      />
    </div>
  )
}

import { SearchX } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

export default async function LocaleNotFound() {
  const t = await getTranslations('errors')

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-white px-4">
      <EmptyState
        icon={<SearchX className="w-12 h-12" />}
        title={t('notFoundTitle')}
        text={t('notFoundText')}
        action={
          <Link href="/">
            <Button>{t('toHome')}</Button>
          </Link>
        }
      />
    </div>
  )
}

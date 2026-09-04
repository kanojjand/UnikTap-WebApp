import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PhoneForm } from '@/components/student/auth-forms'
import { getSettings } from '@/lib/queries/settings'

// Зависит от сессии пользователя — рендерим на каждый запрос
export const dynamic = 'force-dynamic'


export default async function PhonePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const settings = await getSettings()
  if (!settings.auth_phone_enabled) notFound()

  const t = await getTranslations('auth')
  return (
    <>
      <h1 className="text-2xl font-bold mb-6">{t('byPhone')}</h1>
      <PhoneForm />
    </>
  )
}

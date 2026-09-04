import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ForgotForm } from '@/components/student/auth-forms'

// Зависит от сессии пользователя — рендерим на каждый запрос
export const dynamic = 'force-dynamic'


export default async function ForgotPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('auth')

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">{t('resetTitle')}</h1>
      <ForgotForm />
    </>
  )
}

import { redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { RegisterForm } from '@/components/student/auth-forms'
import { getCurrentUser } from '@/lib/queries/profile'

// Зависит от сессии пользователя — рендерим на каждый запрос
export const dynamic = 'force-dynamic'

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const user = await getCurrentUser()
  if (user) redirect(`/${locale}/profile`)

  const t = await getTranslations('auth')
  return (
    <>
      <h1 className="text-[26px] font-bold tracking-tight text-ink mb-6">{t('register')}</h1>
      <RegisterForm />
    </>
  )
}

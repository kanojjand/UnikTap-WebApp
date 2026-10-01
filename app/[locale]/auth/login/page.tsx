import { redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { LoginForm } from '@/components/student/auth-forms'
import { getCurrentUser } from '@/lib/queries/profile'
import { getSettings } from '@/lib/queries/settings'

// Зависит от сессии пользователя — рендерим на каждый запрос
export const dynamic = 'force-dynamic'

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ next?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const { next } = await searchParams

  const user = await getCurrentUser()
  if (user) redirect(`/${locale}/profile`)

  const t = await getTranslations('auth')
  const settings = await getSettings()

  return (
    <>
      <h1 className="text-[26px] font-bold tracking-tight text-ink mb-6">{t('login')}</h1>
      <LoginForm next={next} phoneEnabled={settings.auth_phone_enabled} />
    </>
  )
}

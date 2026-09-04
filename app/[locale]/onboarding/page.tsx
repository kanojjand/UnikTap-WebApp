import { redirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { OnboardingWizard } from '@/components/student/onboarding-wizard'
import { getCities, getDirections, getEntSubjects } from '@/lib/queries/dictionaries'
import { getCurrentProfile } from '@/lib/queries/profile'

// Зависит от сессии пользователя — рендерим на каждый запрос
export const dynamic = 'force-dynamic'


export default async function OnboardingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const profile = await getCurrentProfile()
  if (!profile) redirect(`/${locale}/auth/login`)
  if (profile.onboarded) redirect(`/${locale}`)

  const [cities, subjects, directions] = await Promise.all([getCities(), getEntSubjects(), getDirections()])

  return <OnboardingWizard cities={cities} subjects={subjects} directions={directions} locale={locale} />
}

import Image from 'next/image'
import { ChevronLeft } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('common')

  return (
    <div className="min-h-[100dvh] bg-white">
      <header className="px-4 pt-10 pb-4 flex items-center gap-3">
        <Link href="/" aria-label={t('back')} className="w-10 h-10 rounded-full bg-slateBg flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-gray-600" aria-hidden />
        </Link>
        <Image src="/logo-blue.png" alt={t('appName')} width={900} height={262} priority className="h-7 w-auto" />
      </header>
      <main className="px-4 pb-16 max-w-md mx-auto">{children}</main>
    </div>
  )
}

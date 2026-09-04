import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ChevronLeft } from 'lucide-react'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Markdown } from '@/components/ui/markdown'
import { getStaticPage } from '@/lib/queries/content'
import { pick } from '@/lib/utils'

export const revalidate = 86400


type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const page = await getStaticPage(slug)
  if (!page) return {}
  return {
    title: pick(page as unknown as Record<string, unknown>, 'title', locale),
    alternates: { canonical: `/${locale}/${slug}` },
  }
}

export default async function StaticPage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const page = await getStaticPage(slug)
  if (!page) notFound()

  const t = await getTranslations('common')

  return (
    <div className="min-h-[100dvh] bg-white pb-16">
      <header className="px-4 pt-10 pb-4 flex items-center gap-3">
        <Link href="/" aria-label={t('back')} className="w-10 h-10 rounded-full bg-slateBg flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-gray-600" aria-hidden />
        </Link>
        <h1 className="text-xl font-bold">{pick(page as unknown as Record<string, unknown>, 'title', locale)}</h1>
      </header>
      <main className="px-4">
        <Markdown>{pick(page as unknown as Record<string, unknown>, 'content', locale)}</Markdown>
      </main>
    </div>
  )
}

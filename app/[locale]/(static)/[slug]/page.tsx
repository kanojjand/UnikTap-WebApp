import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/ui/page-header'
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
    <div className="pb-nav">
      <PageHeader
        title={pick(page as unknown as Record<string, unknown>, 'title', locale)}
        backHref="/profile"
        backLabel={t('back')}
      />
      <div className="container-app max-w-3xl">
        <Markdown>{pick(page as unknown as Record<string, unknown>, 'content', locale)}</Markdown>
      </div>
    </div>
  )
}

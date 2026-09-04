import { ChevronLeft } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Accordion } from '@/components/ui/accordion'
import { getFaq } from '@/lib/queries/content'
import { pick } from '@/lib/utils'

export const revalidate = 86400


export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('profile')
  const tc = await getTranslations('common')
  const items = await getFaq()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: pick(item as unknown as Record<string, unknown>, 'question', locale),
      acceptedAnswer: {
        '@type': 'Answer',
        text: pick(item as unknown as Record<string, unknown>, 'answer', locale),
      },
    })),
  }

  return (
    <div className="min-h-[100dvh] bg-white pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="px-4 pt-10 pb-4 flex items-center gap-3">
        <Link href="/" aria-label={tc('back')} className="w-10 h-10 rounded-full bg-slateBg flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-gray-600" aria-hidden />
        </Link>
        <h1 className="text-xl font-bold">{t('faq')}</h1>
      </header>
      <main className="px-4 space-y-2">
        {items.map((item) => (
          <Accordion
            key={item.id}
            header={<span className="font-medium text-sm text-gray-800">{pick(item as unknown as Record<string, unknown>, 'question', locale)}</span>}
          >
            <p className="text-sm text-gray-600 leading-relaxed">
              {pick(item as unknown as Record<string, unknown>, 'answer', locale)}
            </p>
          </Accordion>
        ))}
      </main>
    </div>
  )
}

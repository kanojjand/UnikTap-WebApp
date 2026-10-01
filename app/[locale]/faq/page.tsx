import { getTranslations, setRequestLocale } from 'next-intl/server'
import { PageHeader } from '@/components/ui/page-header'
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
    <div className="pb-nav">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHeader title={t('faq')} backHref="/profile" backLabel={tc('back')} />
      <div className="container-app max-w-3xl space-y-2">
        {items.map((item) => (
          <Accordion
            key={item.id}
            header={
              <span className="font-medium text-[15px] text-ink">
                {pick(item as unknown as Record<string, unknown>, 'question', locale)}
              </span>
            }
          >
            <p className="text-[15px] text-body leading-relaxed">
              {pick(item as unknown as Record<string, unknown>, 'answer', locale)}
            </p>
          </Accordion>
        ))}
      </div>
    </div>
  )
}

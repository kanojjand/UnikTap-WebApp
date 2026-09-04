import { getTranslations } from 'next-intl/server'
import { CalendarDays, ExternalLink } from 'lucide-react'
import { Accordion } from '@/components/ui/accordion'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate, pick } from '@/lib/utils'
import type { AdmissionBlock, University } from '@/types/domain'
import { DocumentChecklist } from './document-checklist'
import { TrackedLink } from './contact-actions'

export async function AdmissionTab({
  university,
  blocks,
  locale,
}: {
  university: University
  blocks: AdmissionBlock[]
  locale: string
}) {
  const t = await getTranslations('university')
  const intro = pick(university as unknown as Record<string, unknown>, 'admission_intro', locale)
  const by = (kind: AdmissionBlock['kind']) => blocks.filter((block) => block.kind === kind)
  const steps = by('step')
  const documents = by('document')
  const conditions = [...by('condition'), ...by('benefit')]
  const deadlines = by('deadline')

  if (blocks.length === 0 && !intro) {
    return <EmptyState title={t('steps')} text="Информация о поступлении пока не заполнена" />
  }

  return (
    <div className="space-y-6">
      {intro ? <p className="prose-content">{intro}</p> : null}

      {steps.length > 0 ? (
        <section>
          <h2 className="text-lg font-bold mb-3">{t('steps')}</h2>
          <ol className="relative border-l-2 border-softBlue ml-3 space-y-4">
            {steps.map((step, index) => (
              <li key={step.id} className="pl-6 relative">
                <span className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-corpBlue text-white text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </span>
                <h3 className="font-bold text-sm text-gray-900">
                  {pick(step as unknown as Record<string, unknown>, 'title', locale)}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed mt-1">
                  {pick(step as unknown as Record<string, unknown>, 'content', locale)}
                </p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {documents.length > 0 ? (
        <section>
          <h2 className="text-lg font-bold mb-3">{t('documents')}</h2>
          <DocumentChecklist blocks={documents} universityId={university.id} locale={locale} />
        </section>
      ) : null}

      {conditions.length > 0 ? (
        <section>
          <h2 className="text-lg font-bold mb-3">{t('conditions')}</h2>
          <div className="space-y-2">
            {conditions.map((block) => (
              <Accordion
                key={block.id}
                header={
                  <span className="font-medium text-sm text-gray-800">
                    {pick(block as unknown as Record<string, unknown>, 'title', locale)}
                  </span>
                }
              >
                <p className="text-sm text-gray-600 leading-relaxed">
                  {pick(block as unknown as Record<string, unknown>, 'content', locale)}
                </p>
              </Accordion>
            ))}
          </div>
        </section>
      ) : null}

      {deadlines.length > 0 ? (
        <section>
          <h2 className="text-lg font-bold mb-3">{t('deadlines')}</h2>
          <div className="space-y-2">
            {deadlines.map((block) => {
              const past = block.date_to ? new Date(block.date_to) < new Date() : false
              return (
                <Card key={block.id} className={past ? 'opacity-50' : ''}>
                  <div className="flex items-start gap-3">
                    <CalendarDays className="w-5 h-5 text-corpBlue shrink-0 mt-0.5" aria-hidden />
                    <div>
                      <p className="font-bold text-sm text-gray-900">
                        {pick(block as unknown as Record<string, unknown>, 'title', locale)}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatDate(block.date_from, locale)} — {formatDate(block.date_to, locale)}
                      </p>
                      {block.content_ru ? (
                        <p className="text-sm text-gray-600 mt-1">
                          {pick(block as unknown as Record<string, unknown>, 'content', locale)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </section>
      ) : null}

      {university.admission_url ? (
        <TrackedLink
          href={university.admission_url}
          universityId={university.id}
          event="contact_site_click"
          props={{ kind: 'admission' }}
          className="inline-flex items-center gap-2 text-corpBlue font-medium text-sm"
        >
          <ExternalLink className="w-4 h-4" aria-hidden />
          {t('admissionSite')}
        </TrackedLink>
      ) : null}
    </div>
  )
}

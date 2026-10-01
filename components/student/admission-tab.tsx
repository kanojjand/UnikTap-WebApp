import { getTranslations } from 'next-intl/server'
import { CalendarDays, ExternalLink } from 'lucide-react'
import { Accordion } from '@/components/ui/accordion'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate, pick } from '@/lib/utils'
import type { AdmissionBlock, University } from '@/types/domain'
import { DocumentChecklist } from './document-checklist'
import { TrackedLink } from './contact-actions'
import { buttonClass } from '@/components/ui/button-styles'

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
    return <EmptyState title={t('steps')} text={t('admissionEmpty')} />
  }

  return (
    <div className="space-y-6">
      {intro ? <p className="prose-content">{intro}</p> : null}

      {steps.length > 0 ? (
        <section>
          <h2 className="text-lg font-bold text-ink mb-3">{t('steps')}</h2>
          <ol className="relative border-l-2 border-line ml-3.5 space-y-5">
            {steps.map((step, index) => (
              <li key={step.id} className="pl-7 relative">
                <span
                  className="absolute -left-[15px] top-0 w-7 h-7 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center"
                  aria-hidden
                >
                  {index + 1}
                </span>
                <h3 className="font-semibold text-[15px] text-ink">
                  {pick(step as unknown as Record<string, unknown>, 'title', locale)}
                </h3>
                <p className="text-[15px] text-body leading-relaxed mt-1">
                  {pick(step as unknown as Record<string, unknown>, 'content', locale)}
                </p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {documents.length > 0 ? (
        <section>
          <h2 className="text-lg font-bold text-ink mb-3">{t('documents')}</h2>
          <DocumentChecklist blocks={documents} universityId={university.id} locale={locale} />
        </section>
      ) : null}

      {conditions.length > 0 ? (
        <section>
          <h2 className="text-lg font-bold text-ink mb-3">{t('conditions')}</h2>
          <div className="space-y-2">
            {conditions.map((block) => (
              <Accordion
                key={block.id}
                header={
                  <span className="font-medium text-[15px] text-ink">
                    {pick(block as unknown as Record<string, unknown>, 'title', locale)}
                  </span>
                }
              >
                <p className="text-[15px] text-body leading-relaxed">
                  {pick(block as unknown as Record<string, unknown>, 'content', locale)}
                </p>
              </Accordion>
            ))}
          </div>
        </section>
      ) : null}

      {deadlines.length > 0 ? (
        <section>
          <h2 className="text-lg font-bold text-ink mb-3">{t('deadlines')}</h2>
          <div className="space-y-2">
            {deadlines.map((block) => {
              const past = block.date_to ? new Date(block.date_to) < new Date() : false
              return (
                <Card key={block.id} className={past ? 'opacity-50' : ''}>
                  <div className="flex items-start gap-3">
                    <CalendarDays className="w-5 h-5 text-primary-ink shrink-0 mt-0.5" aria-hidden />
                    <div>
                      <p className="font-semibold text-[15px] text-ink">
                        {pick(block as unknown as Record<string, unknown>, 'title', locale)}
                      </p>
                      <p className="text-sm text-muted mt-0.5">
                        {formatDate(block.date_from, locale)} — {formatDate(block.date_to, locale)}
                      </p>
                      {block.content_ru ? (
                        <p className="text-sm text-body mt-1">
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
          className={buttonClass('secondary')}
        >
          <ExternalLink className="w-4 h-4" aria-hidden />
          {t('admissionSite')}
        </TrackedLink>
      ) : null}
    </div>
  )
}

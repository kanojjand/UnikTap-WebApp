import { getTranslations } from 'next-intl/server'
import { Building2, ChevronRight, Clock, Globe, Mail, MapPin, Navigation, Phone } from 'lucide-react'
import { normalizePhone, pick } from '@/lib/utils'
import type { University } from '@/types/domain'
import { TrackedLink } from './contact-actions'

const SOCIAL_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  telegram: 'Telegram',
  facebook: 'Facebook',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  vk: 'ВКонтакте',
  x: 'X (Twitter)',
}

const ROW = 'flex items-center gap-3 min-h-[60px] px-4 py-3 hover:bg-subtle/60 active:bg-subtle transition-colors'

/** Контакты — список крупных строк: каждая целиком нажимается одним пальцем. */
export async function ContactsTab({ university, locale }: { university: University; locale: string }) {
  const t = await getTranslations('university')
  const address = pick(university as unknown as Record<string, unknown>, 'address', locale)
  const hours = pick(university as unknown as Record<string, unknown>, 'working_hours', locale)
  const routeUrl =
    university.twogis_url ||
    (university.lat && university.lng
      ? `https://2gis.kz/geo/${university.lng},${university.lat}`
      : university.google_maps_url || '')
  const socials = Object.entries(university.socials ?? {}).filter(([, url]) => Boolean(url))
  const campuses = (university.campuses ?? []).filter((campus) => campus.address_ru)

  return (
    <div className="space-y-4">
      <ul className="bg-surface rounded-2xl border border-line divide-y divide-line overflow-hidden">
        {address ? (
          <li>
            {routeUrl ? (
              <TrackedLink href={routeUrl} universityId={university.id} event="route_click" className={ROW}>
                <RowContent icon={<MapPin />} label={t('address')} value={address} action={t('route')} />
              </TrackedLink>
            ) : (
              <div className={ROW}>
                <RowContent icon={<MapPin />} label={t('address')} value={address} />
              </div>
            )}
          </li>
        ) : null}

        {(university.phones ?? []).map((phone) => (
          <li key={phone}>
            <a href={`tel:+${normalizePhone(phone)}`} className={ROW}>
              <RowContent icon={<Phone />} label={t('phones')} value={phone} />
            </a>
          </li>
        ))}

        {university.email ? (
          <li>
            <a href={`mailto:${university.email}`} className={ROW}>
              <RowContent icon={<Mail />} label={t('email')} value={university.email} />
            </a>
          </li>
        ) : null}

        {university.website ? (
          <li>
            <TrackedLink
              href={university.website}
              universityId={university.id}
              event="contact_site_click"
              props={{ kind: 'site' }}
              className={ROW}
            >
              <RowContent
                icon={<Globe />}
                label={t('website')}
                value={university.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
              />
            </TrackedLink>
          </li>
        ) : null}

        {hours ? (
          <li className={ROW}>
            <RowContent icon={<Clock />} label={t('workingHours')} value={hours} />
          </li>
        ) : null}
      </ul>

      {campuses.length > 0 ? (
        <section>
          <h2 className="text-sm font-semibold text-muted mb-2">{t('campuses')}</h2>
          <ul className="bg-surface rounded-2xl border border-line divide-y divide-line overflow-hidden">
            {campuses.map((campus) => {
              const label = pick(campus as unknown as Record<string, unknown>, 'title', locale) || t('address')
              const value = pick(campus as unknown as Record<string, unknown>, 'address', locale)
              return (
                <li key={`${campus.address_ru}-${campus.title_ru ?? ''}`}>
                  {campus.twogis_url ? (
                    <TrackedLink href={campus.twogis_url} universityId={university.id} event="route_click" className={ROW}>
                      <RowContent icon={<Building2 />} label={label} value={value} action={t('openIn2gis')} />
                    </TrackedLink>
                  ) : (
                    <div className={ROW}>
                      <RowContent icon={<Building2 />} label={label} value={value} />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      {socials.length > 0 ? (
        <section>
          <h2 className="text-sm font-semibold text-muted mb-2">{t('socials')}</h2>
          <div className="flex flex-wrap gap-2">
            {socials.map(([key, url]) => (
              <a
                key={key}
                href={String(url)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center min-h-[44px] px-4 rounded-full border border-line bg-surface text-body text-sm font-medium hover:bg-subtle transition-colors"
              >
                {SOCIAL_LABELS[key] ?? key}
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function RowContent({
  icon,
  label,
  value,
  action,
}: {
  icon: React.ReactNode
  label: string
  value: string
  action?: string
}) {
  return (
    <>
      <span
        className="w-10 h-10 rounded-xl bg-primary-soft text-primary-ink flex items-center justify-center shrink-0 [&_svg]:w-5 [&_svg]:h-5"
        aria-hidden
      >
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm text-muted">{label}</span>
        <span className="block text-[15px] text-ink break-words">{value}</span>
        {action ? (
          <span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-primary-ink">
            <Navigation className="w-3.5 h-3.5" aria-hidden />
            {action}
          </span>
        ) : null}
      </span>
      {action ? <ChevronRight className="w-5 h-5 text-muted shrink-0" aria-hidden /> : null}
    </>
  )
}

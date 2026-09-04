import { getTranslations } from 'next-intl/server'
import { Clock, Globe, Mail, MapPin, Navigation, Phone } from 'lucide-react'
import { Card } from '@/components/ui/card'
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
}

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

  return (
    <div className="space-y-4">
      {address ? (
        <Card>
          <p className="flex items-start gap-2 text-sm text-gray-700">
            <MapPin className="w-4 h-4 text-corpBlue shrink-0 mt-0.5" aria-hidden />
            <span>
              <b className="block text-xs uppercase text-gray-400 mb-0.5">{t('address')}</b>
              {address}
            </span>
          </p>
          {routeUrl ? (
            <TrackedLink
              href={routeUrl}
              universityId={university.id}
              event="route_click"
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-corpBlue"
            >
              <Navigation className="w-4 h-4" aria-hidden />
              {t('route')}
            </TrackedLink>
          ) : null}
        </Card>
      ) : null}

      {university.phones?.length ? (
        <Card>
          <b className="block text-xs uppercase text-gray-400 mb-2">{t('phones')}</b>
          <ul className="space-y-2">
            {university.phones.map((phone) => (
              <li key={phone}>
                <a href={`tel:+${normalizePhone(phone)}`} className="flex items-center gap-2 text-sm text-gray-700">
                  <Phone className="w-4 h-4 text-corpBlue" aria-hidden />
                  {phone}
                </a>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {university.email || university.website ? (
        <Card className="space-y-2">
          {university.email ? (
            <a href={`mailto:${university.email}`} className="flex items-center gap-2 text-sm text-gray-700">
              <Mail className="w-4 h-4 text-corpBlue" aria-hidden />
              {university.email}
            </a>
          ) : null}
          {university.website ? (
            <TrackedLink
              href={university.website}
              universityId={university.id}
              event="contact_site_click"
              props={{ kind: 'site' }}
              className="flex items-center gap-2 text-sm text-gray-700"
            >
              <Globe className="w-4 h-4 text-corpBlue" aria-hidden />
              {t('website')}
            </TrackedLink>
          ) : null}
        </Card>
      ) : null}

      {socials.length > 0 ? (
        <Card>
          <b className="block text-xs uppercase text-gray-400 mb-2">{t('socials')}</b>
          <div className="flex flex-wrap gap-2">
            {socials.map(([key, url]) => (
              <a
                key={key}
                href={String(url)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-full bg-softBlue text-corpBlue text-xs font-medium"
              >
                {SOCIAL_LABELS[key] ?? key}
              </a>
            ))}
          </div>
        </Card>
      ) : null}

      {hours ? (
        <Card>
          <p className="flex items-start gap-2 text-sm text-gray-700">
            <Clock className="w-4 h-4 text-corpBlue shrink-0 mt-0.5" aria-hidden />
            <span>
              <b className="block text-xs uppercase text-gray-400 mb-0.5">{t('workingHours')}</b>
              {hours}
            </span>
          </p>
        </Card>
      ) : null}
    </div>
  )
}

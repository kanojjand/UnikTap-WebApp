'use client'

import { Phone } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { WhatsAppIcon } from '@/components/ui/icons/whatsapp'
import { track } from '@/lib/analytics'
import { normalizePhone } from '@/lib/utils'

/** Липкая нижняя панель карточки ВУЗа. Каждый клик пишется в аналитику (раздел 9). */
export function ContactBar({
  universityId,
  phone,
  whatsapp,
  universityName,
}: {
  universityId: string
  phone?: string | null
  whatsapp?: string | null
  universityName: string
}) {
  const t = useTranslations('university')
  const waNumber = normalizePhone(whatsapp)
  const text = `${t('whatsappText')} — ${universityName}`

  if (!phone && !waNumber) return null

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-100 p-4 flex gap-3 shadow-bar md:max-w-md md:mx-auto"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      {phone ? (
        <a
          href={`tel:+${normalizePhone(phone)}`}
          onClick={() => track('contact_phone_click', {}, { universityId })}
          aria-label={t('call')}
          className="w-12 h-12 rounded-xl bg-softBlue flex items-center justify-center text-corpBlue shrink-0"
        >
          <Phone className="w-5 h-5" aria-hidden />
        </a>
      ) : null}

      {waNumber ? (
        <a
          href={`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('contact_whatsapp_click', {}, { universityId })}
          className="flex-1 bg-whatsapp hover:bg-whatsappHover text-white rounded-xl flex items-center justify-center gap-2 font-bold transition-colors min-h-[48px]"
        >
          <WhatsAppIcon /> {t('whatsapp')}
        </a>
      ) : null}
    </div>
  )
}

export function TrackedLink({
  href,
  universityId,
  event,
  props,
  children,
  className,
}: {
  href: string
  universityId?: string
  event: 'contact_site_click' | 'route_click'
  props?: Record<string, unknown>
  children: React.ReactNode
  className?: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track(event, props ?? {}, { universityId })}
      className={className}
    >
      {children}
    </a>
  )
}

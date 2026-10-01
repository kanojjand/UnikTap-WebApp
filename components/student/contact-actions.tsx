'use client'

import { Phone } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { WhatsAppIcon } from '@/components/ui/icons/whatsapp'
import { buttonClass } from '@/components/ui/button-styles'
import { track } from '@/lib/analytics'
import { cn, normalizePhone } from '@/lib/utils'

interface ContactProps {
  universityId: string
  phone?: string | null
  whatsapp?: string | null
  universityName: string
}

/**
 * Главное действие карточки ВУЗа — связаться с приёмной комиссией.
 * На телефоне — липкая панель снизу, под большой палец; на компьютере — блок в боковой колонке.
 * Каждый клик пишется в аналитику (раздел 9).
 */
export function ContactBar(props: ContactProps) {
  if (!props.phone && !normalizePhone(props.whatsapp)) return null

  return (
    <div
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur-md border-t border-line px-4 pt-3 shadow-bar"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <ContactButtons {...props} />
    </div>
  )
}

/** `stacked` — кнопки друг под другом с подписями (боковая колонка на компьютере). */
export function ContactButtons({
  universityId,
  phone,
  whatsapp,
  universityName,
  stacked = false,
}: ContactProps & { stacked?: boolean }) {
  const t = useTranslations('university')
  const waNumber = normalizePhone(whatsapp)
  const text = `${t('whatsappText')} — ${universityName}`
  const iconOnlyPhone = Boolean(waNumber) && !stacked

  if (!phone && !waNumber) return null

  return (
    <div className={cn('flex gap-3', stacked && 'flex-col-reverse')}>
      {phone ? (
        <a
          href={`tel:+${normalizePhone(phone)}`}
          onClick={() => track('contact_phone_click', {}, { universityId })}
          aria-label={t('call')}
          title={t('call')}
          className={cn(buttonClass('soft', 'lg'), iconOnlyPhone ? 'w-14 px-0 shrink-0' : 'flex-1')}
        >
          <Phone className="w-5 h-5" aria-hidden />
          {iconOnlyPhone ? null : stacked ? phone : t('call')}
        </a>
      ) : null}

      {waNumber ? (
        <a
          href={`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('contact_whatsapp_click', {}, { universityId })}
          className={cn(buttonClass('whatsapp', 'lg'), 'flex-1')}
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

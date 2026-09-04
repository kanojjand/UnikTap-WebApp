'use client'

export type TrackEvent =
  | 'page_view' | 'search' | 'filter_apply' | 'university_view' | 'tab_view' | 'major_expand'
  | 'contact_whatsapp_click' | 'contact_phone_click' | 'contact_site_click' | 'route_click'
  | 'favorite_add' | 'favorite_remove' | 'calculator_use' | 'review_submit' | 'signup'
  | 'login' | 'share' | 'map_pin_click' | 'language_switch'

interface QueuedEvent {
  event_name: TrackEvent
  university_id?: string | null
  major_id?: string | null
  path?: string
  props?: Record<string, unknown>
}

const queue: QueuedEvent[] = []
let timer: ReturnType<typeof setTimeout> | null = null

function device(): string {
  if (typeof window === 'undefined') return 'unknown'
  const w = window.innerWidth
  if (w < 768) return 'mobile'
  if (w < 1024) return 'tablet'
  return 'desktop'
}

function flush() {
  if (typeof window === 'undefined' || queue.length === 0) return
  const batch = queue.splice(0, queue.length)
  const payload = JSON.stringify({
    events: batch,
    device: device(),
    locale: document.documentElement.lang || 'ru',
    referrer: document.referrer,
  })

  try {
    const blob = new Blob([payload], { type: 'application/json' })
    if (!navigator.sendBeacon?.('/api/track', blob)) {
      void fetch('/api/track', { method: 'POST', body: payload, keepalive: true, headers: { 'Content-Type': 'application/json' } })
    }
  } catch {
    // аналитика не должна ломать приложение
  }
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

/** Неблокирующая отправка события. Батчинг: 5 событий или 3 секунды. */
export function track(
  event: TrackEvent,
  props: Record<string, unknown> = {},
  ids: { universityId?: string | null; majorId?: string | null } = {},
) {
  if (typeof window === 'undefined') return
  queue.push({
    event_name: event,
    university_id: ids.universityId ?? null,
    major_id: ids.majorId ?? null,
    path: window.location.pathname,
    props,
  })

  if (queue.length >= 5) return flush()
  if (!timer) timer = setTimeout(flush, 3000)
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flush)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush()
  })
}

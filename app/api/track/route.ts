import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { trackSchema } from '@/lib/validation/schemas'

const SESSION_COOKIE = 'vn_sid'
const WINDOW_MS = 60_000
const MAX_EVENTS_PER_WINDOW = 120
const buckets = new Map<string, { count: number; resetAt: number }>()

function rateLimited(key: string, size: number): boolean {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: size, resetAt: now + WINDOW_MS })
    return false
  }
  bucket.count += size
  return bucket.count > MAX_EVENTS_PER_WINDOW
}

/** Приём событий аналитики (раздел 9). Пишем обезличенно: без IP и user-agent. */
export async function POST(request: NextRequest) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const parsed = trackSchema.safeParse(payload)
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 })

  const cookieStore = await cookies()
  let sessionId = cookieStore.get(SESSION_COOKIE)?.value
  const response = NextResponse.json({ ok: true })

  if (!sessionId) {
    sessionId = crypto.randomUUID()
    response.cookies.set(SESSION_COOKIE, sessionId, {
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    })
  }

  if (rateLimited(sessionId, parsed.data.events.length)) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 })
  }

  let userId: string | null = null
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    userId = user?.id ?? null
  } catch {
    /* гость */
  }

  const referrer = (() => {
    try {
      return parsed.data.referrer ? new URL(parsed.data.referrer).hostname : ''
    } catch {
      return ''
    }
  })()

  try {
    const admin = createAdminClient()
    const rows = parsed.data.events.map((event) => ({
      event_name: event.event_name,
      user_id: userId,
      session_id: sessionId as string,
      university_id: event.university_id ?? null,
      major_id: event.major_id ?? null,
      locale: parsed.data.locale ?? 'ru',
      path: event.path ?? '',
      referrer,
      device: parsed.data.device ?? '',
      props: event.props ?? {},
    }))

    await admin.from('analytics_events').insert(rows)

    const views = rows.filter((row) => row.event_name === 'university_view' && row.university_id)
    await Promise.all(
      views.map((row) => admin.rpc('increment_university_views', { p_id: row.university_id })),
    )
  } catch (error) {
    console.error('track failed', error)
  }

  return response
}

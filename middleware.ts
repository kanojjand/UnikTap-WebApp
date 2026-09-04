import { type NextRequest, NextResponse } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { createServerClient } from '@supabase/ssr'
import { routing } from './i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

/**
 * 1. Обновляет сессию Supabase на каждом запросе (@supabase/ssr).
 * 2. Ставит локаль (next-intl) для всего, кроме /admin — админка только на русском.
 * 3. Первый барьер защиты /admin: без сессии — сразу на страницу входа.
 */
export async function middleware(request: NextRequest) {
  const isAdmin = request.nextUrl.pathname.startsWith('/admin')
  const response = isAdmin ? NextResponse.next({ request }) : intlMiddleware(request)

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return response

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (isAdmin && !user) {
    const loginUrl = new URL('/ru/auth/login', request.url)
    loginUrl.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|icons|.*\\..*).*)'],
}

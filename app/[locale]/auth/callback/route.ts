import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** OAuth и подтверждение почты возвращают пользователя сюда. */
export async function GET(request: NextRequest, context: { params: Promise<{ locale: string }> }) {
  const { locale } = await context.params
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarded')
          .eq('id', data.user.id)
          .maybeSingle()
        if (profile && !profile.onboarded) {
          return NextResponse.redirect(`${origin}/${locale}/onboarding`)
        }
      }
      return NextResponse.redirect(`${origin}${next ?? `/${locale}`}`)
    }
  }

  return NextResponse.redirect(`${origin}/${locale}/auth/login?error=auth`)
}

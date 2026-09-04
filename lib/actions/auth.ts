'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type AuthResult = { ok: true; message?: string } | { ok: false; error: string }

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
}

export async function signInWithEmail(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient()
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { ok: false, error: 'Неверная почта или пароль' }
  return { ok: true }
}

export async function signUpWithEmail(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient()
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const fullName = String(formData.get('full_name') ?? '').trim()
  const locale = String(formData.get('locale') ?? 'ru')

  if (password.length < 8) return { ok: false, error: 'Пароль должен быть не короче 8 символов' }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${siteUrl()}/${locale}/auth/callback`,
    },
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true, message: 'Мы отправили письмо для подтверждения почты' }
}

export async function signInWithGoogle(locale: string, next?: string) {
  const supabase = await createClient()
  const redirectTo = `${siteUrl()}/${locale}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ''}`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  })
  if (error || !data.url) return
  redirect(data.url)
}

export async function sendPhoneOtp(phone: string): Promise<AuthResult> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({ phone })
  if (error) return { ok: false, error: error.message }
  return { ok: true, message: 'Код отправлен' }
}

export async function verifyPhoneOtp(phone: string, token: string): Promise<AuthResult> {
  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' })
  if (error) return { ok: false, error: 'Неверный код' }
  return { ok: true }
}

export async function requestPasswordReset(email: string, locale: string): Promise<AuthResult> {
  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl()}/${locale}/auth/callback?next=/${locale}/profile`,
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true, message: 'Письмо отправлено. Проверьте почту' }
}

export async function signOut(locale: string) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect(`/${locale}`)
}

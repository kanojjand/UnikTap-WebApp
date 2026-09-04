'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { Link } from '@/i18n/navigation'
import {
  requestPasswordReset, sendPhoneOtp, signInWithEmail, signUpWithEmail, verifyPhoneOtp,
} from '@/lib/actions/auth'
import { track } from '@/lib/analytics'

export function LoginForm({ next, phoneEnabled }: { next?: string; phoneEnabled: boolean }) {
  const t = useTranslations('auth')
  const router = useRouter()
  const locale = useLocale()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  return (
    <div className="space-y-4">
      <form
        className="space-y-3"
        action={(formData) =>
          startTransition(async () => {
            setError('')
            const result = await signInWithEmail(formData)
            if (!result.ok) return setError(result.error)
            track('login', { method: 'email' })
            router.replace(next || `/${locale}`)
            router.refresh()
          })
        }
      >
        <Field label={t('email')} required>
          {({ id }) => <Input id={id} name="email" type="email" autoComplete="email" required />}
        </Field>
        <Field label={t('password')} required error={error}>
          {({ id }) => <Input id={id} name="password" type="password" autoComplete="current-password" required />}
        </Field>
        <Button type="submit" fullWidth loading={pending}>
          {t('signIn')}
        </Button>
      </form>

      {phoneEnabled ? (
        <Link href="/auth/phone" className="block">
          <Button variant="ghost" fullWidth>
            {t('byPhone')}
          </Button>
        </Link>
      ) : null}

      <div className="flex justify-between text-sm">
        <Link href="/auth/forgot" className="text-corpBlue">
          {t('forgot')}
        </Link>
        <Link href="/auth/register" className="text-corpBlue">
          {t('signUp')}
        </Link>
      </div>
    </div>
  )
}

export function RegisterForm() {
  const t = useTranslations('auth')
  const locale = useLocale()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  return (
    <div className="space-y-4">
      <form
        className="space-y-3"
        action={(formData) =>
          startTransition(async () => {
            setError('')
            formData.set('locale', locale)
            const result = await signUpWithEmail(formData)
            if (!result.ok) return setError(result.error)
            track('signup', { method: 'email' })
            toast.success(result.message ?? t('confirmEmail'))
            router.replace(`/${locale}/onboarding`)
            router.refresh()
          })
        }
      >
        <Field label={t('name')}>
          {({ id }) => <Input id={id} name="full_name" autoComplete="name" />}
        </Field>
        <Field label={t('email')} required>
          {({ id }) => <Input id={id} name="email" type="email" autoComplete="email" required />}
        </Field>
        <Field label={t('password')} required error={error} hint="Минимум 8 символов">
          {({ id }) => <Input id={id} name="password" type="password" autoComplete="new-password" required minLength={8} />}
        </Field>
        <Button type="submit" fullWidth loading={pending}>
          {t('signUp')}
        </Button>
      </form>

      <p className="text-sm text-center text-gray-500">
        {t('hasAccount')}{' '}
        <Link href="/auth/login" className="text-corpBlue font-medium">
          {t('signIn')}
        </Link>
      </p>
    </div>
  )
}

export function PhoneForm() {
  const t = useTranslations('auth')
  const locale = useLocale()
  const router = useRouter()
  const [phone, setPhone] = useState('+7')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function send() {
    startTransition(async () => {
      setError('')
      const result = await sendPhoneOtp(phone)
      if (!result.ok) return setError(result.error)
      setSent(true)
      setSeconds(60)
      const timer = setInterval(() => {
        setSeconds((value) => {
          if (value <= 1) clearInterval(timer)
          return value - 1
        })
      }, 1000)
    })
  }

  function verify() {
    startTransition(async () => {
      setError('')
      const result = await verifyPhoneOtp(phone, code)
      if (!result.ok) return setError(result.error)
      track('login', { method: 'phone' })
      router.replace(`/${locale}`)
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      <Field label={t('phone')} required error={!sent ? error : ''}>
        {({ id }) => (
          <Input
            id={id}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            inputMode="tel"
            placeholder="+7 (7__) ___-__-__"
            disabled={sent}
          />
        )}
      </Field>

      {sent ? (
        <>
          <Field label={t('code')} required error={error}>
            {({ id }) => (
              <Input
                id={id}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                maxLength={6}
              />
            )}
          </Field>
          <Button fullWidth loading={pending} onClick={verify} disabled={code.length < 6}>
            {t('signIn')}
          </Button>
          <Button variant="ghost" fullWidth disabled={seconds > 0} onClick={send}>
            {seconds > 0 ? t('resendIn', { seconds }) : t('sendCode')}
          </Button>
        </>
      ) : (
        <Button fullWidth loading={pending} onClick={send}>
          {t('sendCode')}
        </Button>
      )}
    </div>
  )
}

export function ForgotForm() {
  const t = useTranslations('auth')
  const locale = useLocale()
  const [email, setEmail] = useState('')
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState('')

  return (
    <div className="space-y-3">
      <Field label={t('email')} required hint={message}>
        {({ id }) => <Input id={id} type="email" value={email} onChange={(event) => setEmail(event.target.value)} />}
      </Field>
      <Button
        fullWidth
        loading={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await requestPasswordReset(email, locale)
            setMessage(result.ok ? (result.message ?? t('resetSent')) : result.error)
          })
        }
      >
        {t('resetSubmit')}
      </Button>
    </div>
  )
}

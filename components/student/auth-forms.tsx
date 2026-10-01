'use client'

import { forwardRef, useState, useTransition } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { buttonClass } from '@/components/ui/button-styles'
import { Field, Input } from '@/components/ui/input'
import { Link } from '@/i18n/navigation'
import {
  requestPasswordReset,
  sendPhoneOtp,
  signInWithEmail,
  signUpWithEmail,
  verifyPhoneOtp,
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
        className="space-y-4"
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
          {({ id }) => <Input id={id} name="email" type="email" inputMode="email" autoComplete="email" required />}
        </Field>
        <Field label={t('password')} required error={error}>
          {({ id }) => <PasswordInput id={id} name="password" autoComplete="current-password" required />}
        </Field>
        <Button type="submit" fullWidth loading={pending}>
          {t('signIn')}
        </Button>
      </form>

      {phoneEnabled ? (
        <Link href="/auth/phone" className={buttonClass('secondary', 'md', true)}>
          {t('byPhone')}
        </Link>
      ) : null}

      <div className="flex justify-between gap-3 text-[15px] -mx-2">
        <Link href="/auth/forgot" className={LINK}>
          {t('forgot')}
        </Link>
        <Link href="/auth/register" className={`${LINK} font-semibold`}>
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
        className="space-y-4"
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
        <Field label={t('name')}>{({ id }) => <Input id={id} name="full_name" autoComplete="name" />}</Field>
        <Field label={t('email')} required>
          {({ id }) => <Input id={id} name="email" type="email" inputMode="email" autoComplete="email" required />}
        </Field>
        <Field label={t('password')} required error={error} hint={t('passwordHint')}>
          {({ id }) => <PasswordInput id={id} name="password" autoComplete="new-password" required minLength={8} />}
        </Field>
        <Button type="submit" fullWidth loading={pending}>
          {t('signUp')}
        </Button>
      </form>

      <p className="text-[15px] text-center text-muted">
        {t('hasAccount')}{' '}
        <Link href="/auth/login" className={`${LINK} font-semibold`}>
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
    <div className="space-y-4">
      <Field label={t('phone')} required error={!sent ? error : ''}>
        {({ id }) => (
          <Input
            id={id}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
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
                autoComplete="one-time-code"
                maxLength={6}
                className="text-2xl font-semibold tracking-[0.4em]"
              />
            )}
          </Field>
          <Button fullWidth loading={pending} onClick={verify} disabled={code.length < 6}>
            {t('signIn')}
          </Button>
          <Button variant="ghost" fullWidth disabled={seconds > 0} onClick={send}>
            {seconds > 0 ? t('resendIn', { seconds }) : t('sendCode')}
          </Button>
          {/* Ошиблись номером — можно исправить, не начиная заново */}
          <Button
            variant="ghost"
            fullWidth
            onClick={() => {
              setSent(false)
              setCode('')
              setError('')
            }}
          >
            {t('changePhone')}
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
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        startTransition(async () => {
          const result = await requestPasswordReset(email, locale)
          setMessage(
            result.ok ? { ok: true, text: result.message ?? t('resetSent') } : { ok: false, text: result.error },
          )
        })
      }}
    >
      <Field label={t('email')} required error={message && !message.ok ? message.text : undefined}>
        {({ id }) => (
          <Input
            id={id}
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        )}
      </Field>
      {message?.ok ? (
        <p role="status" className="text-[15px] text-success bg-success-soft rounded-xl p-3">
          {message.text}
        </p>
      ) : null}
      <Button type="submit" fullWidth loading={pending}>
        {t('resetSubmit')}
      </Button>
    </form>
  )
}

const LINK = 'inline-flex items-center min-h-[44px] px-2 rounded-lg text-primary-ink hover:bg-primary-soft'

/** Пароль с кнопкой «показать» — меньше ошибок при вводе на телефоне. */
const PasswordInput = forwardRef<HTMLInputElement, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>>(
  function PasswordInput(props, ref) {
    const [visible, setVisible] = useState(false)
    const t = useTranslations('auth')
    return (
      <div className="relative">
        <Input ref={ref} type={visible ? 'text' : 'password'} className="pr-12" {...props} />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? t('hidePassword') : t('showPassword')}
          aria-pressed={visible}
          className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 rounded-lg flex items-center justify-center text-muted hover:text-ink"
        >
          {visible ? <EyeOff className="w-5 h-5" aria-hidden /> : <Eye className="w-5 h-5" aria-hidden />}
        </button>
      </div>
    )
  },
)

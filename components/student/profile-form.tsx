'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { LogOut, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { BottomSheet } from '@/components/ui/modal'
import { updateProfile, deleteAccount } from '@/lib/actions/profile'
import { signOut } from '@/lib/actions/auth'
import { haptic } from '@/lib/haptics'
import type { City, EntSubject, Profile } from '@/types/domain'

export function ProfileForm({
  profile,
  cities,
  subjects,
  locale,
}: {
  profile: Profile
  cities: City[]
  subjects: EntSubject[]
  locale: string
}) {
  const t = useTranslations('profile')
  const ta = useTranslations('auth')
  const tc = useTranslations('common')
  const [pending, startTransition] = useTransition()
  const initial = {
    full_name: profile.full_name ?? '',
    city_id: profile.city_id ? String(profile.city_id) : '',
    school: profile.school ?? '',
    graduation_year: profile.graduation_year ? String(profile.graduation_year) : '',
    ent_score: profile.ent_score ? String(profile.ent_score) : '',
    ent_subject_1_id: profile.ent_subject_1_id ? String(profile.ent_subject_1_id) : '',
    ent_subject_2_id: profile.ent_subject_2_id ? String(profile.ent_subject_2_id) : '',
  }
  const [saved, setSaved] = useState(initial)
  const [form, setForm] = useState(initial)
  const dirty = JSON.stringify(form) !== JSON.stringify(saved)

  function save() {
    startTransition(async () => {
      const result = await updateProfile({
        full_name: form.full_name,
        city_id: form.city_id ? Number(form.city_id) : null,
        school: form.school,
        graduation_year: form.graduation_year ? Number(form.graduation_year) : null,
        ent_score: form.ent_score ? Number(form.ent_score) : null,
        ent_subject_1_id: form.ent_subject_1_id ? Number(form.ent_subject_1_id) : null,
        ent_subject_2_id: form.ent_subject_2_id ? Number(form.ent_subject_2_id) : null,
      })
      if (result.ok) {
        setSaved(form)
        haptic()
        toast.success(t('saved'))
      } else {
        // Введённое не стирается — можно исправить и сохранить ещё раз
        toast.error(result.error)
      }
    })
  }

  const subjectOptions = subjects.map((subject) => (
    <option key={subject.id} value={subject.id}>
      {locale === 'kk' && subject.name_kk ? subject.name_kk : subject.name_ru}
    </option>
  ))

  return (
    <Card as="section" className="p-4 md:p-6">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          save()
        }}
      >
        <Field label={ta('name')}>
          {({ id }) => (
            <Input
              id={id}
              autoComplete="name"
              value={form.full_name}
              onChange={(event) => setForm({ ...form, full_name: event.target.value })}
            />
          )}
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t('score')} hint="0–140">
            {({ id, describedBy }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                type="number"
                inputMode="numeric"
                min={0}
                max={140}
                value={form.ent_score}
                onChange={(event) => setForm({ ...form, ent_score: event.target.value })}
              />
            )}
          </Field>
          <Field label={tc('city')}>
            {({ id }) => (
              <Select
                id={id}
                value={form.city_id}
                onChange={(event) => setForm({ ...form, city_id: event.target.value })}
              >
                <option value="">—</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {locale === 'kk' && city.name_kk ? city.name_kk : city.name_ru}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(['ent_subject_1_id', 'ent_subject_2_id'] as const).map((key, index) => (
            <Field key={key} label={`${t('subjects')} ${index + 1}`}>
              {({ id }) => (
                <Select id={id} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })}>
                  <option value="">—</option>
                  {subjectOptions}
                </Select>
              )}
            </Field>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_160px] gap-4">
          <Field label={t('school')}>
            {({ id }) => (
              <Input
                id={id}
                value={form.school}
                onChange={(event) => setForm({ ...form, school: event.target.value })}
              />
            )}
          </Field>
          <Field label={t('graduationYear')}>
            {({ id }) => (
              <Input
                id={id}
                type="number"
                inputMode="numeric"
                value={form.graduation_year}
                onChange={(event) => setForm({ ...form, graduation_year: event.target.value })}
              />
            )}
          </Field>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
          {dirty ? (
            <Button variant="ghost" onClick={() => setForm(saved)} disabled={pending}>
              {tc('cancel')}
            </Button>
          ) : null}
          <Button type="submit" loading={pending} disabled={!dirty} className="sm:min-w-[180px]">
            {dirty ? tc('save') : t('saved')}
          </Button>
        </div>
      </form>
    </Card>
  )
}

export function ProfileActions({ locale }: { locale: string }) {
  const t = useTranslations('profile')
  const ta = useTranslations('auth')
  const tc = useTranslations('common')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="space-y-2 pt-2">
      <Button variant="secondary" fullWidth onClick={() => startTransition(() => signOut(locale))}>
        <LogOut className="w-5 h-5" aria-hidden />
        {ta('logout')}
      </Button>
      <Button
        variant="ghost"
        fullWidth
        className="text-danger hover:bg-danger-soft"
        onClick={() => setConfirming(true)}
      >
        <Trash2 className="w-5 h-5" aria-hidden />
        {t('deleteAccount')}
      </Button>

      {/* Удаление необратимо — только здесь и спрашиваем подтверждение */}
      <BottomSheet open={confirming} onClose={() => setConfirming(false)} title={t('deleteAccount')}>
        <p className="text-[15px] text-body">{t('deleteConfirm')}</p>
        <div className="flex flex-col sm:flex-row-reverse gap-2 mt-6">
          <Button
            variant="danger"
            fullWidth
            loading={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await deleteAccount()
                if (result.ok) {
                  router.replace(`/${locale}`)
                  router.refresh()
                } else {
                  toast.error(result.error)
                }
              })
            }
          >
            {t('deleteAccount')}
          </Button>
          <Button variant="secondary" fullWidth onClick={() => setConfirming(false)}>
            {tc('cancel')}
          </Button>
        </div>
      </BottomSheet>
    </div>
  )
}

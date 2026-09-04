'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { updateProfile, deleteAccount } from '@/lib/actions/profile'
import { signOut } from '@/lib/actions/auth'
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
  const tc = useTranslations('common')
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState({
    full_name: profile.full_name ?? '',
    city_id: profile.city_id ? String(profile.city_id) : '',
    school: profile.school ?? '',
    graduation_year: profile.graduation_year ? String(profile.graduation_year) : '',
    ent_score: profile.ent_score ? String(profile.ent_score) : '',
    ent_subject_1_id: profile.ent_subject_1_id ? String(profile.ent_subject_1_id) : '',
    ent_subject_2_id: profile.ent_subject_2_id ? String(profile.ent_subject_2_id) : '',
  })

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
      if (result.ok) toast.success(t('saved'))
      else toast.error(result.error)
    })
  }

  return (
    <Card className="space-y-3">
      <Field label={t('edit')}>
        {({ id }) => (
          <Input id={id} value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} />
        )}
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={tc('city')}>
          {({ id }) => (
            <Select id={id} value={form.city_id} onChange={(event) => setForm({ ...form, city_id: event.target.value })}>
              <option value="">—</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {locale === 'kk' && city.name_kk ? city.name_kk : city.name_ru}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t('graduationYear')}>
          {({ id }) => (
            <Input
              id={id}
              type="number"
              value={form.graduation_year}
              onChange={(event) => setForm({ ...form, graduation_year: event.target.value })}
            />
          )}
        </Field>
      </div>

      <Field label={t('school')}>
        {({ id }) => <Input id={id} value={form.school} onChange={(event) => setForm({ ...form, school: event.target.value })} />}
      </Field>

      <Field label={t('score')}>
        {({ id }) => (
          <Input
            id={id}
            type="number"
            min={0}
            max={140}
            value={form.ent_score}
            onChange={(event) => setForm({ ...form, ent_score: event.target.value })}
          />
        )}
      </Field>

      <div className="grid grid-cols-2 gap-3">
        {(['ent_subject_1_id', 'ent_subject_2_id'] as const).map((key, index) => (
          <Field key={key} label={`${t('subjects')} ${index + 1}`}>
            {({ id }) => (
              <Select id={id} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })}>
                <option value="">—</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {locale === 'kk' && subject.name_kk ? subject.name_kk : subject.name_ru}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        ))}
      </div>

      <Button fullWidth loading={pending} onClick={save}>
        {tc('save')}
      </Button>
    </Card>
  )
}

export function ProfileActions({ locale }: { locale: string }) {
  const t = useTranslations('profile')
  const ta = useTranslations('auth')
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <div className="space-y-2 pt-4">
      <Button variant="secondary" fullWidth onClick={() => startTransition(() => signOut(locale))}>
        {ta('logout')}
      </Button>
      <Button
        variant="ghost"
        fullWidth
        loading={pending}
        className="text-red-600"
        onClick={() => {
          if (!confirm(t('deleteConfirm'))) return
          startTransition(async () => {
            const result = await deleteAccount()
            if (result.ok) {
              router.replace(`/${locale}`)
              router.refresh()
            } else {
              toast.error(result.error)
            }
          })
        }}
      >
        {t('deleteAccount')}
      </Button>
    </div>
  )
}

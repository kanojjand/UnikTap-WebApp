'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ExternalLink, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Input, Select, Switch, Textarea } from '@/components/ui/input'
import { Tabs } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { saveUniversity } from '@/lib/actions/admin-universities'
import { cardCompleteness, missingFields } from '@/lib/ent'
import { slugify } from '@/lib/utils'
import type { AdmissionBlock, City, Specialty, University, UniversityImage, UniversityMajor } from '@/types/domain'
import { AdmissionBlocksEditor, ImagesEditor, MajorsEditor } from './university-related'
import { ImageUpload } from './image-upload'
import { LocationPicker } from './location-picker'

const TABS = [
  { id: 'main', label: 'Основное' },
  { id: 'description', label: 'Описание' },
  { id: 'contacts', label: 'Контакты и локация' },
  { id: 'media', label: 'Медиа' },
  { id: 'admission', label: 'Поступление' },
  { id: 'majors', label: 'Специальности' },
  { id: 'seo', label: 'SEO' },
]

const FIELD_LABELS: Record<string, string> = {
  description_ru: 'Короткое описание',
  history_ru: 'История',
  address_ru: 'Адрес',
  whatsapp: 'WhatsApp',
  email: 'Email',
  website: 'Сайт',
  admission_url: 'Сайт приёмной комиссии',
  logo_url: 'Логотип',
  cover_url: 'Обложка',
  founded_year: 'Год основания',
  students_count: 'Количество студентов',
  lat: 'Координаты',
}

type FormState = Record<string, unknown>

function initialState(university?: University | null): FormState {
  return {
    slug: university?.slug ?? '',
    name_ru: university?.name_ru ?? '',
    name_kk: university?.name_kk ?? '',
    short_name: university?.short_name ?? '',
    abbr: university?.abbr ?? '',
    city_id: university?.city_id ?? null,
    type: university?.type ?? 'state',
    founded_year: university?.founded_year ?? null,
    students_count: university?.students_count ?? null,
    teachers_count: university?.teachers_count ?? null,
    has_military_department: university?.has_military_department ?? false,
    has_dormitory: university?.has_dormitory ?? false,
    dormitory_info_ru: university?.dormitory_info_ru ?? '',
    dormitory_info_kk: university?.dormitory_info_kk ?? '',
    license_number: university?.license_number ?? '',
    accreditation_ru: university?.accreditation_ru ?? '',
    accreditation_kk: university?.accreditation_kk ?? '',
    description_ru: university?.description_ru ?? '',
    description_kk: university?.description_kk ?? '',
    history_ru: university?.history_ru ?? '',
    history_kk: university?.history_kk ?? '',
    admission_intro_ru: university?.admission_intro_ru ?? '',
    admission_intro_kk: university?.admission_intro_kk ?? '',
    address_ru: university?.address_ru ?? '',
    address_kk: university?.address_kk ?? '',
    lat: university?.lat ?? null,
    lng: university?.lng ?? null,
    twogis_url: university?.twogis_url ?? '',
    google_maps_url: university?.google_maps_url ?? '',
    phones: university?.phones ?? [],
    whatsapp: university?.whatsapp ?? '',
    email: university?.email ?? '',
    website: university?.website ?? '',
    admission_url: university?.admission_url ?? '',
    socials: university?.socials ?? {},
    working_hours_ru: university?.working_hours_ru ?? '',
    working_hours_kk: university?.working_hours_kk ?? '',
    logo_url: university?.logo_url ?? '',
    cover_url: university?.cover_url ?? '',
    is_published: university?.is_published ?? false,
    is_featured: university?.is_featured ?? false,
    sort_order: university?.sort_order ?? 100,
    seo_title_ru: university?.seo_title_ru ?? '',
    seo_title_kk: university?.seo_title_kk ?? '',
    seo_description_ru: university?.seo_description_ru ?? '',
    seo_description_kk: university?.seo_description_kk ?? '',
  }
}

export function UniversityForm({
  university,
  cities,
  specialties,
  blocks,
  majors,
  images,
}: {
  university?: University | null
  cities: City[]
  specialties: Specialty[]
  blocks: AdmissionBlock[]
  majors: UniversityMajor[]
  images: UniversityImage[]
}) {
  const router = useRouter()
  const [tab, setTab] = useState('main')
  const [form, setForm] = useState<FormState>(() => initialState(university))
  const [dirty, setDirty] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const autosaved = useRef<number>(0)

  const set = (patch: FormState) => {
    setForm((current) => ({ ...current, ...patch }))
    setDirty(true)
  }

  const completeness = cardCompleteness(form)
  const missing = missingFields(form)

  function save(publish?: boolean, silent = false) {
    const payload = { ...form, is_published: publish ?? form.is_published }
    startTransition(async () => {
      const result = await saveUniversity(payload, university?.id)
      if (!result.ok) {
        setError(result.error)
        if (!silent) toast.error(result.error)
        return
      }
      setError('')
      setDirty(false)
      if (!silent) toast.success('Сохранено')
      if (!university && result.data) router.replace(`/admin/universities/${result.data.id}`)
      else router.refresh()
    })
  }

  // Автосохранение черновика раз в 30 секунд (раздел 8.4)
  useEffect(() => {
    if (!university || !dirty) return
    const timer = setInterval(() => {
      if (Date.now() - autosaved.current < 30000) return
      autosaved.current = Date.now()
      save(undefined, true)
    }, 30000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, university, form])

  // Предупреждение о несохранённых изменениях
  useEffect(() => {
    function handler(event: BeforeUnloadEvent) {
      if (!dirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  return (
    <div className="pb-28">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <div className="flex items-center justify-between gap-4 mb-2">
          <p className="text-sm font-bold text-gray-700">Заполнено {Math.round(completeness * 100)}%</p>
          {dirty ? <span className="text-xs text-yellow-600">Есть несохранённые изменения</span> : null}
        </div>
        <Progress value={completeness} />
        {missing.length > 0 ? (
          <p className="text-xs text-gray-500 mt-2">
            Не заполнено: {missing.map((field) => FIELD_LABELS[field] ?? field).join(', ')}
          </p>
        ) : null}
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} className="bg-white rounded-t-2xl px-4 pt-4 border border-gray-100 border-b-0" />

      <div className="bg-white rounded-b-2xl border border-gray-100 p-6 space-y-5">
        {tab === 'main' ? (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Название (RU)" required>
                {({ id }) => (
                  <Input
                    id={id}
                    surface="admin"
                    value={String(form.name_ru)}
                    onChange={(event) => {
                      const value = event.target.value
                      set({ name_ru: value, ...(university ? {} : { slug: slugify(value) }) })
                    }}
                  />
                )}
              </Field>
              <Field label="Название (KZ)" hint={!form.name_kk ? 'KZ не заполнено' : undefined}>
                {({ id }) => (
                  <Input id={id} surface="admin" value={String(form.name_kk)} onChange={(event) => set({ name_kk: event.target.value })} />
                )}
              </Field>
              <Field label="Короткое имя">
                {({ id }) => (
                  <Input id={id} surface="admin" value={String(form.short_name)} onChange={(event) => set({ short_name: event.target.value })} />
                )}
              </Field>
              <Field label="Аббревиатура">
                {({ id }) => <Input id={id} surface="admin" value={String(form.abbr)} onChange={(event) => set({ abbr: event.target.value })} />}
              </Field>
              <Field label="Slug (адрес страницы)" required hint="только латиница, цифры и дефис">
                {({ id }) => <Input id={id} surface="admin" value={String(form.slug)} onChange={(event) => set({ slug: event.target.value })} />}
              </Field>
              <Field label="Город">
                {({ id }) => (
                  <Select
                    id={id}
                    surface="admin"
                    value={form.city_id ? String(form.city_id) : ''}
                    onChange={(event) => set({ city_id: event.target.value ? Number(event.target.value) : null })}
                  >
                    <option value="">—</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name_ru}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Тип ВУЗа">
                {({ id }) => (
                  <Select id={id} surface="admin" value={String(form.type)} onChange={(event) => set({ type: event.target.value })}>
                    <option value="national">Национальный</option>
                    <option value="state">Государственный</option>
                    <option value="private">Частный</option>
                    <option value="international">Международный</option>
                    <option value="autonomous">Автономный</option>
                  </Select>
                )}
              </Field>
              <Field label="Год основания">
                {({ id }) => (
                  <Input
                    id={id}
                    surface="admin"
                    type="number"
                    value={form.founded_year ? String(form.founded_year) : ''}
                    onChange={(event) => set({ founded_year: event.target.value ? Number(event.target.value) : null })}
                  />
                )}
              </Field>
              <Field label="Студентов">
                {({ id }) => (
                  <Input
                    id={id}
                    surface="admin"
                    type="number"
                    value={form.students_count ? String(form.students_count) : ''}
                    onChange={(event) => set({ students_count: event.target.value ? Number(event.target.value) : null })}
                  />
                )}
              </Field>
              <Field label="Преподавателей">
                {({ id }) => (
                  <Input
                    id={id}
                    surface="admin"
                    type="number"
                    value={form.teachers_count ? String(form.teachers_count) : ''}
                    onChange={(event) => set({ teachers_count: event.target.value ? Number(event.target.value) : null })}
                  />
                )}
              </Field>
              <Field label="Лицензия">
                {({ id }) => (
                  <Input id={id} surface="admin" value={String(form.license_number)} onChange={(event) => set({ license_number: event.target.value })} />
                )}
              </Field>
              <Field label="Аккредитация (RU)">
                {({ id }) => (
                  <Input id={id} surface="admin" value={String(form.accreditation_ru)} onChange={(event) => set({ accreditation_ru: event.target.value })} />
                )}
              </Field>
              <Field label="Порядок сортировки">
                {({ id }) => (
                  <Input
                    id={id}
                    surface="admin"
                    type="number"
                    value={String(form.sort_order)}
                    onChange={(event) => set({ sort_order: Number(event.target.value) })}
                  />
                )}
              </Field>
            </div>

            <div className="flex flex-wrap gap-6 pt-2">
              <label className="flex items-center gap-3 text-sm text-gray-700">
                <Switch checked={Boolean(form.has_military_department)} onChange={(value) => set({ has_military_department: value })} label="Военная кафедра" />
                Военная кафедра
              </label>
              <label className="flex items-center gap-3 text-sm text-gray-700">
                <Switch checked={Boolean(form.has_dormitory)} onChange={(value) => set({ has_dormitory: value })} label="Общежитие" />
                Общежитие
              </label>
              <label className="flex items-center gap-3 text-sm text-gray-700">
                <Switch checked={Boolean(form.is_featured)} onChange={(value) => set({ is_featured: value })} label="Рекомендуемый" />
                Рекомендуемый
              </label>
            </div>

            {form.has_dormitory ? (
              <Field label="Об общежитии (RU)">
                {({ id }) => (
                  <Textarea
                    id={id}
                    surface="admin"
                    rows={3}
                    value={String(form.dormitory_info_ru)}
                    onChange={(event) => set({ dormitory_info_ru: event.target.value })}
                  />
                )}
              </Field>
            ) : null}
          </>
        ) : null}

        {tab === 'description' ? (
          <div className="space-y-4">
            {([
              ['description_ru', 'description_kk', 'Короткое описание', 3],
              ['history_ru', 'history_kk', 'История (markdown)', 10],
              ['admission_intro_ru', 'admission_intro_kk', 'Вводный текст «Поступление»', 4],
            ] as const).map(([ru, kk, label, rows]) => (
              <div key={ru} className="grid md:grid-cols-2 gap-4">
                <Field label={`${label} · RU`}>
                  {({ id }) => (
                    <Textarea id={id} surface="admin" rows={rows} value={String(form[ru])} onChange={(event) => set({ [ru]: event.target.value })} />
                  )}
                </Field>
                <Field label={`${label} · KZ`} hint={!form[kk] ? 'KZ не заполнено — покажем русский текст' : undefined}>
                  {({ id }) => (
                    <Textarea id={id} surface="admin" rows={rows} value={String(form[kk])} onChange={(event) => set({ [kk]: event.target.value })} />
                  )}
                </Field>
              </div>
            ))}
          </div>
        ) : null}

        {tab === 'contacts' ? (
          <div className="space-y-6">
            <LocationPicker
              lat={form.lat as number | null}
              lng={form.lng as number | null}
              city={cities.find((item) => item.id === form.city_id) ?? null}
              onChange={(patch) => set(patch)}
            />

            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Адрес (RU)">
                {({ id }) => (
                  <Input id={id} surface="admin" value={String(form.address_ru)} onChange={(event) => set({ address_ru: event.target.value })} />
                )}
              </Field>
              <Field label="Адрес (KZ)">
                {({ id }) => (
                  <Input id={id} surface="admin" value={String(form.address_kk)} onChange={(event) => set({ address_kk: event.target.value })} />
                )}
              </Field>
              <Field label="WhatsApp" hint="в формате 77001234567">
                {({ id }) => <Input id={id} surface="admin" value={String(form.whatsapp)} onChange={(event) => set({ whatsapp: event.target.value })} />}
              </Field>
              <Field label="Email">
                {({ id }) => <Input id={id} surface="admin" value={String(form.email)} onChange={(event) => set({ email: event.target.value })} />}
              </Field>
              <Field label="Сайт">
                {({ id }) => <Input id={id} surface="admin" value={String(form.website)} onChange={(event) => set({ website: event.target.value })} />}
              </Field>
              <Field label="Сайт приёмной комиссии">
                {({ id }) => (
                  <Input id={id} surface="admin" value={String(form.admission_url)} onChange={(event) => set({ admission_url: event.target.value })} />
                )}
              </Field>
              <Field label="Ссылка 2GIS">
                {({ id }) => <Input id={id} surface="admin" value={String(form.twogis_url)} onChange={(event) => set({ twogis_url: event.target.value })} />}
              </Field>
              <Field label="Ссылка Google Maps">
                {({ id }) => (
                  <Input id={id} surface="admin" value={String(form.google_maps_url)} onChange={(event) => set({ google_maps_url: event.target.value })} />
                )}
              </Field>
              <Field label="Часы работы (RU)">
                {({ id }) => (
                  <Input id={id} surface="admin" value={String(form.working_hours_ru)} onChange={(event) => set({ working_hours_ru: event.target.value })} />
                )}
              </Field>
            </div>

            <Field label="Телефоны" hint="по одному в строке">
              {({ id }) => (
                <Textarea
                  id={id}
                  surface="admin"
                  rows={3}
                  value={(form.phones as string[]).join('\n')}
                  onChange={(event) =>
                    set({ phones: event.target.value.split('\n').map((value) => value.trim()).filter(Boolean) })
                  }
                />
              )}
            </Field>

            <div className="grid md:grid-cols-3 gap-4">
              {['instagram', 'telegram', 'facebook', 'youtube', 'tiktok', 'linkedin', 'vk'].map((key) => (
                <Field key={key} label={key === 'vk' ? 'ВКонтакте' : key[0].toUpperCase() + key.slice(1)}>
                  {({ id }) => (
                    <Input
                      id={id}
                      surface="admin"
                      value={String((form.socials as Record<string, string>)[key] ?? '')}
                      onChange={(event) =>
                        set({ socials: { ...(form.socials as Record<string, string>), [key]: event.target.value } })
                      }
                    />
                  )}
                </Field>
              ))}
            </div>
          </div>
        ) : null}

        {tab === 'media' ? (
          <div className="space-y-6">
            <div className="grid md:grid-cols-[200px_1fr] gap-6 items-start">
              <ImageUpload
                universityId={university?.id ?? 'new'}
                label="Логотип"
                aspect="square"
                value={String(form.logo_url)}
                onChange={(url) => set({ logo_url: url })}
              />
              <ImageUpload
                universityId={university?.id ?? 'new'}
                label="Обложка карточки"
                value={String(form.cover_url)}
                onChange={(url) => set({ cover_url: url })}
                hint="Показывается в шапке страницы ВУЗа. Лучше горизонтальное фото от 1200 px"
              />
            </div>

            <details className="text-sm">
              <summary className="cursor-pointer text-gray-500">Указать ссылки вручную</summary>
              <div className="grid md:grid-cols-2 gap-4 mt-3">
                <Field label="Логотип (URL)">
                  {({ id }) => <Input id={id} surface="admin" value={String(form.logo_url)} onChange={(event) => set({ logo_url: event.target.value })} />}
                </Field>
                <Field label="Обложка (URL)">
                  {({ id }) => <Input id={id} surface="admin" value={String(form.cover_url)} onChange={(event) => set({ cover_url: event.target.value })} />}
                </Field>
              </div>
            </details>

            {university ? (
              <ImagesEditor universityId={university.id} images={images} />
            ) : (
              <p className="text-sm text-gray-500">Сохраните карточку, чтобы добавить галерею.</p>
            )}
          </div>
        ) : null}

        {tab === 'admission' ? (
          university ? (
            <AdmissionBlocksEditor universityId={university.id} blocks={blocks} />
          ) : (
            <p className="text-sm text-gray-500">Сохраните карточку, чтобы добавить блоки поступления.</p>
          )
        ) : null}

        {tab === 'majors' ? (
          university ? (
            <MajorsEditor universityId={university.id} majors={majors} specialties={specialties} />
          ) : (
            <p className="text-sm text-gray-500">Сохраните карточку, чтобы добавить специальности.</p>
          )
        ) : null}

        {tab === 'seo' ? (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="SEO title · RU">
                {({ id }) => (
                  <Input id={id} surface="admin" value={String(form.seo_title_ru)} onChange={(event) => set({ seo_title_ru: event.target.value })} />
                )}
              </Field>
              <Field label="SEO title · KZ">
                {({ id }) => (
                  <Input id={id} surface="admin" value={String(form.seo_title_kk)} onChange={(event) => set({ seo_title_kk: event.target.value })} />
                )}
              </Field>
              <Field label="SEO description · RU">
                {({ id }) => (
                  <Textarea id={id} surface="admin" rows={3} value={String(form.seo_description_ru)} onChange={(event) => set({ seo_description_ru: event.target.value })} />
                )}
              </Field>
              <Field label="SEO description · KZ">
                {({ id }) => (
                  <Textarea id={id} surface="admin" rows={3} value={String(form.seo_description_kk)} onChange={(event) => set({ seo_description_kk: event.target.value })} />
                )}
              </Field>
            </div>

            <div className="border border-gray-200 rounded-xl p-4 bg-slateBg">
              <p className="text-[10px] uppercase font-bold text-gray-400 mb-2">Превью в поиске</p>
              <p className="text-corpBlue text-lg leading-tight">{String(form.seo_title_ru) || String(form.name_ru)}</p>
              <p className="text-green-700 text-xs">
                {process.env.NEXT_PUBLIC_SITE_URL}/ru/universities/{String(form.slug)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {String(form.seo_description_ru) || String(form.description_ru)}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {error ? <p className="text-sm text-red-600 mt-3">{error}</p> : null}

      <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-gray-100 px-10 py-4 flex gap-3 justify-end z-30">
        {university ? (
          <a
            href={`/ru/universities/${String(form.slug)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 px-4 py-3"
          >
            <ExternalLink className="w-4 h-4" aria-hidden /> Предпросмотр
          </a>
        ) : null}
        <Button variant="secondary" onClick={() => router.push('/admin/universities')}>
          Отмена
        </Button>
        <Button variant="secondary" loading={pending} onClick={() => save(false)}>
          <Save className="w-4 h-4" aria-hidden /> Сохранить черновик
        </Button>
        <Button loading={pending} onClick={() => save(true)}>
          Сохранить и опубликовать
        </Button>
      </div>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ImagePlus, Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Input, Select, Textarea } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  deleteAdmissionBlock, deleteImage, deleteMajor, saveAdmissionBlock, saveImage, saveMajor, saveScoreHistory,
} from '@/lib/actions/admin-universities'
import { deleteUniversityMedia, uploadUniversityMedia } from '@/lib/actions/uploads'
import { formatMoney, majorCode, majorName } from '@/lib/utils'
import type { AdmissionBlock, Specialty, UniversityImage, UniversityMajor } from '@/types/domain'

const KIND_LABELS: Record<string, string> = {
  step: 'Шаг',
  document: 'Документ',
  condition: 'Условие',
  deadline: 'Срок',
  benefit: 'Льгота',
}

function useAction() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const run = (action: () => Promise<{ ok: boolean; error?: string }>, message: string) =>
    startTransition(async () => {
      const result = await action()
      if (result.ok) {
        toast.success(message)
        router.refresh()
      } else {
        toast.error(result.error ?? 'Ошибка')
      }
    })
  return { pending, run }
}

export function AdmissionBlocksEditor({ universityId, blocks }: { universityId: string; blocks: AdmissionBlock[] }) {
  const { pending, run } = useAction()
  const [draft, setDraft] = useState({ kind: 'step', title_ru: '', content_ru: '', date_from: '', date_to: '', sort_order: 100 })

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {blocks.map((block) => (
          <div key={block.id} className="border border-gray-100 rounded-xl p-4 flex justify-between gap-4">
            <div>
              <Badge tone="info" mini>
                {KIND_LABELS[block.kind]}
              </Badge>
              <p className="font-medium text-sm text-gray-900 mt-1">{block.title_ru}</p>
              <p className="text-xs text-gray-500 line-clamp-2">{block.content_ru}</p>
              {block.date_from ? (
                <p className="text-xs text-gray-400 mt-1">
                  {block.date_from} — {block.date_to}
                </p>
              ) : null}
            </div>
            <button
              onClick={() => run(() => deleteAdmissionBlock(block.id), 'Блок удалён')}
              className="text-gray-400 hover:text-red-600 p-2 self-start"
              aria-label="Удалить"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {blocks.length === 0 ? <p className="text-sm text-gray-400">Блоков пока нет</p> : null}
      </div>

      <div className="border border-dashed border-gray-200 rounded-xl p-4 space-y-3">
        <div className="grid md:grid-cols-4 gap-3">
          <Field label="Тип">
            {({ id }) => (
              <Select id={id} surface="admin" value={draft.kind} onChange={(event) => setDraft({ ...draft, kind: event.target.value })}>
                {Object.entries(KIND_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <div className="md:col-span-3">
            <Field label="Заголовок (RU)">
              {({ id }) => (
                <Input id={id} surface="admin" value={draft.title_ru} onChange={(event) => setDraft({ ...draft, title_ru: event.target.value })} />
              )}
            </Field>
          </div>
        </div>
        <Field label="Содержимое (RU)">
          {({ id }) => (
            <Textarea id={id} surface="admin" rows={3} value={draft.content_ru} onChange={(event) => setDraft({ ...draft, content_ru: event.target.value })} />
          )}
        </Field>
        {draft.kind === 'deadline' ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Дата с">
              {({ id }) => (
                <Input id={id} surface="admin" type="date" value={draft.date_from} onChange={(event) => setDraft({ ...draft, date_from: event.target.value })} />
              )}
            </Field>
            <Field label="Дата по">
              {({ id }) => (
                <Input id={id} surface="admin" type="date" value={draft.date_to} onChange={(event) => setDraft({ ...draft, date_to: event.target.value })} />
              )}
            </Field>
          </div>
        ) : null}
        <Button
          loading={pending}
          disabled={!draft.title_ru}
          onClick={() =>
            run(
              () =>
                saveAdmissionBlock({
                  university_id: universityId,
                  kind: draft.kind as 'step',
                  title_ru: draft.title_ru,
                  content_ru: draft.content_ru,
                  date_from: draft.date_from || null,
                  date_to: draft.date_to || null,
                  sort_order: draft.sort_order,
                  is_published: true,
                }),
              'Блок добавлен',
            )
          }
        >
          <Plus className="w-4 h-4" aria-hidden /> Добавить блок
        </Button>
      </div>
    </div>
  )
}

export function MajorsEditor({
  universityId,
  majors,
  specialties,
}: {
  universityId: string
  majors: UniversityMajor[]
  specialties: Specialty[]
}) {
  const { pending, run } = useAction()
  const [draft, setDraft] = useState({ specialty_id: '', program_code: '', program_name_ru: '', fee_per_year: '', grant_score: '', paid_min_score: '', grants_count: '' })
  const [historyFor, setHistoryFor] = useState<string | null>(null)
  const [historyDraft, setHistoryDraft] = useState({ year: new Date().getFullYear(), grant_score: '', paid_min_score: '', grants_count: '' })

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slateBg text-gray-500 text-left">
              <th className="py-3 px-4 font-medium">Код</th>
              <th className="py-3 px-4 font-medium">Название</th>
              <th className="py-3 px-4 font-medium">Грант</th>
              <th className="py-3 px-4 font-medium">Платное</th>
              <th className="py-3 px-4 font-medium">Стоимость</th>
              <th className="py-3 px-4 font-medium">Статус</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {majors.map((major) => (
              <tr key={major.id} className={major.deleted_at ? 'opacity-40' : ''}>
                <td className="py-3 px-4 font-mono text-gray-500">{majorCode(major)}</td>
                <td className="py-3 px-4">
                  {majorName(major, 'ru')}
                  {major.program_name_ru && major.specialty ? (
                    <span className="block text-xs text-gray-400 mt-0.5">
                      {major.specialty.code} · {major.specialty.name_ru}
                    </span>
                  ) : null}
                  <button
                    onClick={() => setHistoryFor(historyFor === major.id ? null : major.id)}
                    className="block text-xs text-corpBlue mt-1"
                  >
                    История баллов ({major.history?.length ?? 0})
                  </button>
                  {historyFor === major.id ? (
                    <div className="mt-2 bg-slateBg rounded-xl p-3 space-y-2">
                      <ul className="text-xs text-gray-600 space-y-1">
                        {(major.history ?? [])
                          .sort((a, b) => b.year - a.year)
                          .map((row) => (
                            <li key={row.id}>
                              {row.year}: грант {row.grant_score ?? '—'}, платное {row.paid_min_score ?? '—'}
                            </li>
                          ))}
                      </ul>
                      <div className="grid grid-cols-4 gap-2">
                        <Input
                          surface="admin"
                          type="number"
                          value={String(historyDraft.year)}
                          onChange={(event) => setHistoryDraft({ ...historyDraft, year: Number(event.target.value) })}
                          aria-label="Год"
                        />
                        <Input
                          surface="admin"
                          type="number"
                          placeholder="грант"
                          value={historyDraft.grant_score}
                          onChange={(event) => setHistoryDraft({ ...historyDraft, grant_score: event.target.value })}
                          aria-label="Грант"
                        />
                        <Input
                          surface="admin"
                          type="number"
                          placeholder="платное"
                          value={historyDraft.paid_min_score}
                          onChange={(event) => setHistoryDraft({ ...historyDraft, paid_min_score: event.target.value })}
                          aria-label="Платное"
                        />
                        <Button
                          size="sm"
                          loading={pending}
                          onClick={() =>
                            run(
                              () =>
                                saveScoreHistory({
                                  university_major_id: major.id,
                                  year: historyDraft.year,
                                  grant_score: historyDraft.grant_score ? Number(historyDraft.grant_score) : null,
                                  paid_min_score: historyDraft.paid_min_score ? Number(historyDraft.paid_min_score) : null,
                                  grants_count: null,
                                }),
                              'Год сохранён',
                            )
                          }
                        >
                          ОК
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </td>
                <td className="py-3 px-4">
                  <Input
                    surface="admin"
                    type="number"
                    defaultValue={major.grant_score ?? ''}
                    aria-label="Проходной на грант"
                    className="w-24 py-1.5"
                    onBlur={(event) =>
                      run(
                        () =>
                          saveMajor({
                            id: major.id,
                            university_id: universityId,
                            specialty_id: major.specialty_id,
                            degree: major.degree,
                            study_forms: major.study_forms,
                            languages: major.languages,
                            duration_years: major.duration_years,
                            fee_per_year: major.fee_per_year,
                            grant_score: event.target.value ? Number(event.target.value) : null,
                            paid_min_score: major.paid_min_score,
                            grants_count: major.grants_count,
                            is_published: major.is_published,
                            sort_order: major.sort_order,
                          }),
                        'Балл обновлён',
                      )
                    }
                  />
                </td>
                <td className="py-3 px-4">{major.paid_min_score ?? '—'}</td>
                <td className="py-3 px-4">{formatMoney(major.fee_per_year)}</td>
                <td className="py-3 px-4">
                  {major.is_published ? <Badge tone="success" mini>Опубликовано</Badge> : <Badge tone="warning" mini>Скрыто</Badge>}
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => run(() => deleteMajor(major.id), 'Специальность удалена')}
                    className="text-gray-400 hover:text-red-600 p-2"
                    aria-label="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {majors.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-gray-400">
                  Специальностей пока нет
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="border border-dashed border-gray-200 rounded-xl p-4 grid md:grid-cols-6 gap-3 items-end">
        <div className="md:col-span-2">
          <Field label="Группа ОП" hint="от неё берутся предметы ЕНТ">
            {({ id }) => (
              <Select id={id} surface="admin" value={draft.specialty_id} onChange={(event) => setDraft({ ...draft, specialty_id: event.target.value })}>
                <option value="">—</option>
                {specialties.map((specialty) => (
                  <option key={specialty.id} value={specialty.id}>
                    {specialty.code} · {specialty.name_ru}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
        <Field label="Код ОП" hint="например, 6B01101">
          {({ id }) => (
            <Input id={id} surface="admin" value={draft.program_code} onChange={(event) => setDraft({ ...draft, program_code: event.target.value })} />
          )}
        </Field>
        <div className="md:col-span-3">
          <Field label="Название программы" hint="пусто — название группы">
            {({ id }) => (
              <Input id={id} surface="admin" value={draft.program_name_ru} onChange={(event) => setDraft({ ...draft, program_name_ru: event.target.value })} />
            )}
          </Field>
        </div>
        <Field label="Грант">
          {({ id }) => (
            <Input id={id} surface="admin" type="number" value={draft.grant_score} onChange={(event) => setDraft({ ...draft, grant_score: event.target.value })} />
          )}
        </Field>
        <Field label="Платное">
          {({ id }) => (
            <Input id={id} surface="admin" type="number" value={draft.paid_min_score} onChange={(event) => setDraft({ ...draft, paid_min_score: event.target.value })} />
          )}
        </Field>
        <Field label="Стоимость ₸" hint="пусто — не опубликована">
          {({ id }) => (
            <Input id={id} surface="admin" type="number" value={draft.fee_per_year} onChange={(event) => setDraft({ ...draft, fee_per_year: event.target.value })} />
          )}
        </Field>
        <Button
          loading={pending}
          disabled={!draft.specialty_id}
          onClick={() =>
            run(
              () =>
                saveMajor({
                  university_id: universityId,
                  specialty_id: Number(draft.specialty_id),
                  program_code: draft.program_code,
                  program_name_ru: draft.program_name_ru,
                  degree: 'bachelor',
                  study_forms: ['full_time'],
                  languages: ['ru'],
                  duration_years: 4,
                  fee_per_year: draft.fee_per_year ? Number(draft.fee_per_year) : null,
                  grant_score: draft.grant_score ? Number(draft.grant_score) : null,
                  paid_min_score: draft.paid_min_score ? Number(draft.paid_min_score) : null,
                  grants_count: draft.grants_count ? Number(draft.grants_count) : null,
                  is_published: true,
                  sort_order: 100,
                }),
              'Специальность добавлена',
            )
          }
        >
          <Plus className="w-4 h-4" aria-hidden /> Добавить
        </Button>
      </div>
    </div>
  )
}

export function ImagesEditor({ universityId, images }: { universityId: string; images: UniversityImage[] }) {
  const { pending, run } = useAction()
  const [url, setUrl] = useState('')
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const router = useRouter()

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    let added = 0

    for (const file of Array.from(files).slice(0, 12)) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}: больше 5 МБ`)
        continue
      }
      const formData = new FormData()
      formData.set('file', file)
      formData.set('university_id', universityId)

      const uploaded = await uploadUniversityMedia(formData)
      if (!uploaded.ok) {
        toast.error(uploaded.error)
        continue
      }
      const saved = await saveImage({ university_id: universityId, url: uploaded.url, caption_ru: '', sort_order: 100 })
      if (saved.ok) added += 1
    }

    setUploading(false)
    if (added > 0) {
      toast.success(`Добавлено фото: ${added}`)
      router.refresh()
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-gray-700">Галерея</p>

      <ul className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {images.map((image) => (
          <li key={image.id} className="relative border border-gray-100 rounded-xl overflow-hidden bg-slateBg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.url} alt={image.caption_ru ?? ''} className="w-full h-24 object-cover" />
            <input
              defaultValue={image.caption_ru ?? ''}
              placeholder="Подпись"
              aria-label="Подпись к фото"
              className="w-full text-xs text-gray-600 p-2 bg-white outline-none border-t border-gray-100"
              onBlur={(event) =>
                event.target.value !== image.caption_ru &&
                run(
                  () => saveImage({ university_id: universityId, url: image.url, caption_ru: event.target.value, sort_order: image.sort_order }),
                  'Подпись сохранена',
                )
              }
            />
            <button
              onClick={() =>
                run(async () => {
                  await deleteUniversityMedia(image.url)
                  return deleteImage(image.id)
                }, 'Фото удалено')
              }
              className="absolute top-1 right-1 bg-white/90 rounded-full p-1.5 text-gray-500 hover:text-red-600"
              aria-label="Удалить"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </li>
        ))}

        <li>
          <label className="flex flex-col items-center justify-center gap-2 h-full min-h-[120px] rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-corpBlue hover:text-corpBlue cursor-pointer text-xs text-center px-2">
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : <ImagePlus className="w-5 h-5" aria-hidden />}
            {uploading ? 'Загружаем…' : 'Добавить фото'}
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                void uploadFiles(event.target.files)
                event.target.value = ''
              }}
            />
          </label>
        </li>
      </ul>

      <details className="text-sm">
        <summary className="cursor-pointer text-gray-500">Добавить по ссылке</summary>
        <div className="flex gap-3 items-end mt-3">
          <Field label="URL изображения" className="flex-1">
            {({ id }) => <Input id={id} surface="admin" value={url} onChange={(event) => setUrl(event.target.value)} />}
          </Field>
          <Field label="Подпись (RU)" className="flex-1">
            {({ id }) => <Input id={id} surface="admin" value={caption} onChange={(event) => setCaption(event.target.value)} />}
          </Field>
          <Button
            loading={pending}
            disabled={!url}
            onClick={() => {
              run(() => saveImage({ university_id: universityId, url, caption_ru: caption, sort_order: 100 }), 'Фото добавлено')
              setUrl('')
              setCaption('')
            }}
          >
            <Plus className="w-4 h-4" aria-hidden /> Добавить
          </Button>
        </div>
      </details>
    </div>
  )
}

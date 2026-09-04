'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { deleteDictionaryRow, saveDictionaryRow } from '@/lib/actions/admin-content'
import type { City, EntSubject, Specialty } from '@/types/domain'

type Table = 'cities' | 'specialties' | 'ent_subjects'

export function DictionariesEditor({
  cities,
  specialties,
  subjects,
}: {
  cities: City[]
  specialties: Specialty[]
  subjects: EntSubject[]
}) {
  const [tab, setTab] = useState<Table>('cities')
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [, startTransition] = useTransition()

  function run(action: () => Promise<{ ok: boolean; error?: string }>, message: string) {
    startTransition(async () => {
      const result = await action()
      if (result.ok) {
        toast.success(message)
        setDraft({})
      } else toast.error(result.error ?? 'Ошибка')
    })
  }

  const save = (table: Table, row: Record<string, unknown>) => run(() => saveDictionaryRow(table, row), 'Сохранено')
  const remove = (table: Table, id: number) => run(() => deleteDictionaryRow(table, id), 'Удалено')

  return (
    <div className="space-y-4">
      <Tabs
        className="bg-white rounded-2xl px-4 pt-4 border border-gray-100"
        active={tab}
        onChange={(id) => setTab(id as Table)}
        tabs={[
          { id: 'cities', label: `Города (${cities.length})` },
          { id: 'specialties', label: `Специальности (${specialties.length})` },
          { id: 'ent_subjects', label: `Предметы ЕНТ (${subjects.length})` },
        ]}
      />

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slateBg text-gray-500 text-left">
            <tr>
              {tab === 'cities' ? (
                <>
                  <th className="py-3 px-4 font-medium">Slug</th>
                  <th className="py-3 px-4 font-medium">Название RU</th>
                  <th className="py-3 px-4 font-medium">Название KZ</th>
                  <th className="py-3 px-4 font-medium">Координаты</th>
                </>
              ) : tab === 'specialties' ? (
                <>
                  <th className="py-3 px-4 font-medium">Код</th>
                  <th className="py-3 px-4 font-medium">Название RU</th>
                  <th className="py-3 px-4 font-medium">Направление</th>
                  <th className="py-3 px-4 font-medium">Активна</th>
                </>
              ) : (
                <>
                  <th className="py-3 px-4 font-medium">Код</th>
                  <th className="py-3 px-4 font-medium">Название RU</th>
                  <th className="py-3 px-4 font-medium">Название KZ</th>
                  <th className="py-3 px-4 font-medium">Активен</th>
                </>
              )}
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tab === 'cities'
              ? cities.map((city) => (
                  <tr key={city.id}>
                    <td className="py-3 px-4 font-mono text-gray-500">{city.slug}</td>
                    <td className="py-3 px-4">
                      <Input surface="admin" defaultValue={city.name_ru} className="py-1.5" aria-label="Название RU"
                        onBlur={(event) => event.target.value !== city.name_ru && save('cities', { id: city.id, name_ru: event.target.value })} />
                    </td>
                    <td className="py-3 px-4">
                      <Input surface="admin" defaultValue={city.name_kk} className="py-1.5" aria-label="Название KZ"
                        onBlur={(event) => event.target.value !== city.name_kk && save('cities', { id: city.id, name_kk: event.target.value })} />
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {city.lat?.toFixed(3)}, {city.lng?.toFixed(3)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => remove('cities', city.id)} className="text-gray-400 hover:text-red-600 p-2" aria-label="Удалить">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              : tab === 'specialties'
                ? specialties.map((specialty) => (
                    <tr key={specialty.id}>
                      <td className="py-3 px-4 font-mono text-gray-500">{specialty.code}</td>
                      <td className="py-3 px-4">
                        <Input surface="admin" defaultValue={specialty.name_ru} className="py-1.5" aria-label="Название"
                          onBlur={(event) => event.target.value !== specialty.name_ru && save('specialties', { id: specialty.id, name_ru: event.target.value })} />
                      </td>
                      <td className="py-3 px-4 text-gray-500">{specialty.direction_ru}</td>
                      <td className="py-3 px-4">
                        {specialty.is_active ? <Badge tone="success" mini>Да</Badge> : <Badge tone="neutral" mini>Нет</Badge>}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => remove('specialties', specialty.id)} className="text-gray-400 hover:text-red-600 p-2" aria-label="Удалить">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                : subjects.map((subject) => (
                    <tr key={subject.id}>
                      <td className="py-3 px-4 font-mono text-gray-500">{subject.code}</td>
                      <td className="py-3 px-4">{subject.name_ru}</td>
                      <td className="py-3 px-4">{subject.name_kk}</td>
                      <td className="py-3 px-4">
                        {subject.is_active ? <Badge tone="success" mini>Да</Badge> : <Badge tone="neutral" mini>Нет</Badge>}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => remove('ent_subjects', subject.id)} className="text-gray-400 hover:text-red-600 p-2" aria-label="Удалить">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-4 flex flex-wrap gap-3 items-end">
        {tab === 'cities' ? (
          <>
            <Input surface="admin" placeholder="slug" value={draft.slug ?? ''} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} aria-label="slug" className="max-w-[160px]" />
            <Input surface="admin" placeholder="Название RU" value={draft.name_ru ?? ''} onChange={(event) => setDraft({ ...draft, name_ru: event.target.value })} aria-label="Название RU" className="max-w-[200px]" />
            <Input surface="admin" placeholder="Название KZ" value={draft.name_kk ?? ''} onChange={(event) => setDraft({ ...draft, name_kk: event.target.value })} aria-label="Название KZ" className="max-w-[200px]" />
            <Input surface="admin" placeholder="lat" value={draft.lat ?? ''} onChange={(event) => setDraft({ ...draft, lat: event.target.value })} aria-label="lat" className="max-w-[110px]" />
            <Input surface="admin" placeholder="lng" value={draft.lng ?? ''} onChange={(event) => setDraft({ ...draft, lng: event.target.value })} aria-label="lng" className="max-w-[110px]" />
            <Button
              disabled={!draft.slug || !draft.name_ru}
              onClick={() =>
                save('cities', {
                  slug: draft.slug,
                  name_ru: draft.name_ru,
                  name_kk: draft.name_kk ?? '',
                  lat: draft.lat ? Number(draft.lat) : null,
                  lng: draft.lng ? Number(draft.lng) : null,
                })
              }
            >
              <Plus className="w-4 h-4" aria-hidden /> Добавить
            </Button>
          </>
        ) : tab === 'specialties' ? (
          <>
            <Input surface="admin" placeholder="Код (B057)" value={draft.code ?? ''} onChange={(event) => setDraft({ ...draft, code: event.target.value })} aria-label="Код" className="max-w-[140px]" />
            <Input surface="admin" placeholder="Название RU" value={draft.name_ru ?? ''} onChange={(event) => setDraft({ ...draft, name_ru: event.target.value })} aria-label="Название" className="max-w-[260px]" />
            <Input surface="admin" placeholder="Направление" value={draft.direction_ru ?? ''} onChange={(event) => setDraft({ ...draft, direction_ru: event.target.value })} aria-label="Направление" className="max-w-[240px]" />
            <Button
              disabled={!draft.code || !draft.name_ru}
              onClick={() => save('specialties', { code: draft.code, name_ru: draft.name_ru, direction_ru: draft.direction_ru ?? '' })}
            >
              <Plus className="w-4 h-4" aria-hidden /> Добавить
            </Button>
          </>
        ) : (
          <>
            <Input surface="admin" placeholder="Код (math)" value={draft.code ?? ''} onChange={(event) => setDraft({ ...draft, code: event.target.value })} aria-label="Код" className="max-w-[160px]" />
            <Input surface="admin" placeholder="Название RU" value={draft.name_ru ?? ''} onChange={(event) => setDraft({ ...draft, name_ru: event.target.value })} aria-label="Название" className="max-w-[220px]" />
            <Input surface="admin" placeholder="Название KZ" value={draft.name_kk ?? ''} onChange={(event) => setDraft({ ...draft, name_kk: event.target.value })} aria-label="Название KZ" className="max-w-[220px]" />
            <Button
              disabled={!draft.code || !draft.name_ru}
              onClick={() => save('ent_subjects', { code: draft.code, name_ru: draft.name_ru, name_kk: draft.name_kk ?? '' })}
            >
              <Plus className="w-4 h-4" aria-hidden /> Добавить
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

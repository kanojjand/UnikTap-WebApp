'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { type ColumnDef } from '@tanstack/react-table'
import { Copy, Eye, EyeOff, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Input, Select } from '@/components/ui/input'
import { ExportButton } from './charts'
import {
  deleteUniversity, duplicateUniversity, restoreUniversity, setUniversityPublished,
} from '@/lib/actions/admin-universities'
import { formatDate } from '@/lib/utils'
import type { City, University } from '@/types/domain'

export function UniversitiesTable({ universities, cities }: { universities: University[]; cities: City[] }) {
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')
  const [status, setStatus] = useState('')
  const [, startTransition] = useTransition()

  function run(action: () => Promise<{ ok: boolean; error?: string }>, message: string) {
    startTransition(async () => {
      const result = await action()
      if (result.ok) toast.success(message)
      else toast.error(result.error ?? 'Ошибка')
    })
  }

  const rows = useMemo(
    () =>
      universities.filter((university) => {
        if (city && String(university.city_id) !== city) return false
        if (status === 'published' && !university.is_published) return false
        if (status === 'draft' && university.is_published) return false
        if (status === 'deleted' && !university.deleted_at) return false
        if (status !== 'deleted' && university.deleted_at) return false
        if (status === 'no_majors' && university.majors_count > 0) return false
        if (query && !`${university.name_ru} ${university.abbr} ${university.slug}`.toLowerCase().includes(query.toLowerCase()))
          return false
        return true
      }),
    [universities, query, city, status],
  )

  const columns = useMemo<ColumnDef<University, unknown>[]>(
    () => [
      {
        accessorKey: 'name_ru',
        header: 'Название',
        cell: ({ row }) => (
          <div className="min-w-[220px] flex items-center gap-3">
            <span className="w-10 h-10 shrink-0 rounded-lg border border-gray-100 bg-white flex items-center justify-center overflow-hidden">
              {row.original.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={row.original.logo_url} alt="" className="w-full h-full object-contain p-1" />
              ) : (
                <span className="text-sm font-bold text-gray-300">
                  {(row.original.abbr || row.original.name_ru).slice(0, 1).toUpperCase()}
                </span>
              )}
            </span>
            <span className="min-w-0">
              <Link href={`/admin/universities/${row.original.id}`} className="font-medium text-gray-900 hover:text-corpBlue block truncate">
                {row.original.short_name || row.original.name_ru}
              </Link>
              <span className="text-xs text-gray-400 font-mono">{row.original.slug}</span>
            </span>
          </div>
        ),
      },
      {
        id: 'city',
        header: 'Город',
        accessorFn: (row) => row.city?.name_ru ?? '—',
      },
      { accessorKey: 'majors_count', header: 'ОП' },
      { accessorKey: 'rating', header: 'Рейтинг', cell: ({ row }) => Number(row.original.rating).toFixed(1) },
      { accessorKey: 'reviews_count', header: 'Отзывы' },
      { accessorKey: 'views_count', header: 'Просмотры' },
      {
        id: 'status',
        header: 'Статус',
        cell: ({ row }) =>
          row.original.deleted_at ? (
            <Badge tone="danger">Удалён</Badge>
          ) : row.original.is_published ? (
            <Badge tone="success">Опубликован</Badge>
          ) : (
            <Badge tone="warning">Черновик</Badge>
          ),
      },
      {
        id: 'updated',
        header: 'Обновлён',
        accessorFn: (row) => formatDate(row.updated_at),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex gap-1 justify-end">
            <Link href={`/admin/universities/${row.original.id}`} className="p-2 text-gray-400 hover:text-corpBlue" title="Редактировать">
              <Pencil className="w-4 h-4" />
            </Link>
            <button
              onClick={() => run(() => duplicateUniversity(row.original.id), 'Скопировано')}
              className="p-2 text-gray-400 hover:text-corpBlue"
              title="Дублировать"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                run(
                  () => setUniversityPublished(row.original.id, !row.original.is_published),
                  row.original.is_published ? 'Снято с публикации' : 'Опубликовано',
                )
              }
              className="p-2 text-gray-400 hover:text-corpBlue"
              title={row.original.is_published ? 'Снять с публикации' : 'Опубликовать'}
            >
              {row.original.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            {row.original.deleted_at ? (
              <button
                onClick={() => run(() => restoreUniversity(row.original.id), 'Восстановлено')}
                className="p-2 text-gray-400 hover:text-green-600"
                title="Восстановить"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  if (confirm('Удалить университет? Его можно будет восстановить.')) {
                    run(() => deleteUniversity(row.original.id), 'Удалено')
                  }
                }}
                className="p-2 text-gray-400 hover:text-red-600"
                title="Удалить"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <Input
          surface="admin"
          placeholder="Поиск по названию или slug"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="max-w-xs"
        />
        <Select surface="admin" value={city} onChange={(event) => setCity(event.target.value)} className="max-w-[200px]" aria-label="Город">
          <option value="">Все города</option>
          {cities.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name_ru}
            </option>
          ))}
        </Select>
        <Select surface="admin" value={status} onChange={(event) => setStatus(event.target.value)} className="max-w-[200px]" aria-label="Статус">
          <option value="">Все статусы</option>
          <option value="published">Опубликованные</option>
          <option value="draft">Черновики</option>
          <option value="no_majors">Без специальностей</option>
          <option value="deleted">Удалённые</option>
        </Select>
        <div className="ml-auto">
          <ExportButton
            rows={rows.map((row) => ({
              slug: row.slug,
              name: row.name_ru,
              city: row.city?.name_ru ?? '',
              type: row.type,
              majors: row.majors_count,
              rating: row.rating,
              reviews: row.reviews_count,
              views: row.views_count,
              published: row.is_published,
            }))}
            filename="universities"
          />
        </div>
      </div>

      <DataTable columns={columns} data={rows} emptyText="Университеты не найдены" />
    </div>
  )
}

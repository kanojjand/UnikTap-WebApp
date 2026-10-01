'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { type ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Upload } from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { ExportButton } from './charts'
import { importMajorsCsv, saveMajor } from '@/lib/actions/admin-universities'
import { formatMoney, majorCode, majorName } from '@/lib/utils'
import type { City, UniversityMajor } from '@/types/domain'

const CSV_TEMPLATE =
  'university_slug,specialty_code,program_code,program_name_ru,degree,fee_per_year,grant_score,paid_min_score,grants_count,languages,study_forms\n' +
  'satbayev-university,B057,6B06101,Информационные системы,bachelor,1000000,95,60,120,"ru,kk,en",full_time'

export function MajorsTable({ majors, cities }: { majors: UniversityMajor[]; cities: City[] }) {
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')
  const [filter, setFilter] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [, startTransition] = useTransition()

  const rows = useMemo(
    () =>
      majors.filter((major) => {
        if (city && String(major.university?.city_id ?? '') !== city) return false
        if (filter === 'no_score' && major.grant_score != null) return false
        if (filter === 'hidden' && major.is_published) return false
        if (query) {
          const haystack = `${majorCode(major)} ${majorName(major, 'ru')} ${major.specialty?.code} ${major.specialty?.name_ru} ${major.university?.name_ru}`.toLowerCase()
          if (!haystack.includes(query.toLowerCase())) return false
        }
        return true
      }),
    [majors, query, city, filter],
  )

  const columns = useMemo<ColumnDef<UniversityMajor, unknown>[]>(
    () => [
      {
        id: 'university',
        header: 'ВУЗ',
        accessorFn: (row) => row.university?.name_ru ?? '—',
        cell: ({ row }) => (
          <Link href={`/admin/universities/${row.original.university_id}`} className="text-gray-900 hover:text-corpBlue">
            {row.original.university?.name_ru ?? '—'}
          </Link>
        ),
      },
      { id: 'code', header: 'Код', accessorFn: (row) => majorCode(row) },
      { id: 'name', header: 'Программа', accessorFn: (row) => majorName(row, 'ru') },
      { id: 'group', header: 'Группа', accessorFn: (row) => row.specialty?.code ?? '' },
      { accessorKey: 'degree', header: 'Уровень' },
      {
        accessorKey: 'grant_score',
        header: 'Грант',
        cell: ({ row }) => (
          <InlineNumber
            value={row.original.grant_score}
            onSave={(value) =>
              startTransition(async () => {
                const result = await saveMajor({
                  id: row.original.id,
                  university_id: row.original.university_id,
                  specialty_id: row.original.specialty_id,
                  degree: row.original.degree,
                  study_forms: row.original.study_forms,
                  languages: row.original.languages,
                  duration_years: row.original.duration_years,
                  fee_per_year: row.original.fee_per_year,
                  grant_score: value,
                  paid_min_score: row.original.paid_min_score,
                  grants_count: row.original.grants_count,
                  is_published: row.original.is_published,
                  sort_order: row.original.sort_order,
                })
                if (result.ok) toast.success('Сохранено')
                else toast.error(result.error)
                return undefined
              })
            }
          />
        ),
      },
      { accessorKey: 'paid_min_score', header: 'Платное', cell: ({ row }) => row.original.paid_min_score ?? '—' },
      { accessorKey: 'fee_per_year', header: 'Стоимость', cell: ({ row }) => formatMoney(row.original.fee_per_year) },
      { accessorKey: 'grants_count', header: 'Грантов', cell: ({ row }) => row.original.grants_count ?? '—' },
      {
        id: 'languages',
        header: 'Языки',
        accessorFn: (row) => row.languages.join(', ').toUpperCase(),
      },
      {
        id: 'status',
        header: 'Статус',
        cell: ({ row }) =>
          row.original.is_published ? <Badge tone="success" mini>Опубликовано</Badge> : <Badge tone="warning" mini>Скрыто</Badge>,
      },
    ],
    [startTransition],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <Input
          surface="admin"
          placeholder="Поиск по коду, названию, ВУЗу"
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
        <Select surface="admin" value={filter} onChange={(event) => setFilter(event.target.value)} className="max-w-[220px]" aria-label="Фильтр">
          <option value="">Все программы</option>
          <option value="no_score">Без проходного балла</option>
          <option value="hidden">Скрытые</option>
        </Select>
        <div className="ml-auto flex gap-2">
          <Button variant="secondary" onClick={() => setImportOpen(true)}>
            <Upload className="w-4 h-4" aria-hidden /> Импорт CSV
          </Button>
          <ExportButton
            rows={rows.map((row) => ({
              university_slug: row.university?.slug ?? '',
              specialty_code: row.specialty?.code ?? '',
              program_code: row.program_code ?? '',
              program_name_ru: row.program_name_ru ?? '',
              degree: row.degree,
              fee_per_year: row.fee_per_year,
              grant_score: row.grant_score ?? '',
              paid_min_score: row.paid_min_score ?? '',
              grants_count: row.grants_count ?? '',
              languages: row.languages.join(','),
              study_forms: row.study_forms.join(','),
            }))}
            filename="majors"
          />
        </div>
      </div>

      <DataTable columns={columns} data={rows} emptyText="Специальности не найдены" pageSize={25} />
      <CsvImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  )
}

function InlineNumber({ value, onSave }: { value: number | null; onSave: (value: number | null) => void }) {
  return (
    <Input
      surface="admin"
      type="number"
      defaultValue={value ?? ''}
      aria-label="Проходной балл"
      className="w-20 py-1.5 text-sm"
      onBlur={(event) => {
        const next = event.target.value ? Number(event.target.value) : null
        if (next !== value) onSave(next)
      }}
    />
  )
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const parseLine = (line: string) => {
    const values: string[] = []
    let current = ''
    let quoted = false
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i]
      if (char === '"') {
        if (quoted && line[i + 1] === '"') {
          current += '"'
          i += 1
        } else quoted = !quoted
      } else if (char === ',' && !quoted) {
        values.push(current)
        current = ''
      } else current += char
    }
    values.push(current)
    return values.map((value) => value.trim())
  }

  const headers = parseLine(lines[0])
  return lines.slice(1).map((line) => Object.fromEntries(parseLine(line).map((value, index) => [headers[index], value])))
}

function CsvImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [text, setText] = useState('')
  const [report, setReport] = useState<{ created: number; updated: number; errors: { line: number; message: string }[] } | null>(null)
  const [pending, startTransition] = useTransition()

  function process(apply: boolean) {
    const rows = parseCsv(text)
    if (rows.length === 0) {
      toast.error('Не удалось разобрать CSV')
      return
    }
    startTransition(async () => {
      const result = await importMajorsCsv(rows, apply)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setReport(result.data ?? null)
      if (apply) toast.success(`Создано ${result.data?.created}, обновлено ${result.data?.updated}`)
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="Импорт специальностей из CSV">
      <div className="p-6 space-y-4">
        <p className="text-sm text-gray-500">
          Формат: <code className="text-xs bg-slateBg px-1 py-0.5 rounded">{CSV_TEMPLATE.split('\n')[0]}</code>
        </p>
        <Textarea
          surface="admin"
          rows={8}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={CSV_TEMPLATE}
          aria-label="CSV"
          className="font-mono text-xs"
        />
        <input
          type="file"
          accept=".csv,text/csv"
          className="text-sm"
          onChange={async (event) => {
            const file = event.target.files?.[0]
            if (file) setText(await file.text())
          }}
        />

        {report ? (
          <div className="bg-slateBg rounded-xl p-4 text-sm">
            <p>
              Будет создано: <b>{report.created}</b>, обновлено: <b>{report.updated}</b>, ошибок:{' '}
              <b className={report.errors.length ? 'text-red-600' : ''}>{report.errors.length}</b>
            </p>
            {report.errors.length > 0 ? (
              <ul className="mt-2 space-y-1 text-xs text-red-600 max-h-32 overflow-y-auto">
                {report.errors.map((error) => (
                  <li key={`${error.line}-${error.message}`}>
                    Строка {error.line}: {error.message}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <div className="flex gap-2">
          <Button variant="secondary" fullWidth loading={pending} onClick={() => process(false)}>
            Проверить
          </Button>
          <Button fullWidth loading={pending} disabled={!report} onClick={() => process(true)}>
            Применить
          </Button>
        </div>
      </div>
    </Modal>
  )
}

'use client'

import { useMemo, useState, useTransition } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Ban, ShieldCheck, Trash2 } from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Input, Select } from '@/components/ui/input'
import { ExportButton } from './charts'
import { deleteUser, logExport, setUserBlocked, setUserRole } from '@/lib/actions/admin-content'
import { formatDate, maskEmail } from '@/lib/utils'
import type { City, Profile } from '@/types/domain'

type Row = Profile & { reviews_count: number; favorites_count: number }

export function UsersTable({ users, cities }: { users: Row[]; cities: City[] }) {
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('')
  const [city, setCity] = useState('')
  const [revealed, setRevealed] = useState<string[]>([])
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
      users.filter((user) => {
        if (role && user.role !== role) return false
        if (city && String(user.city_id ?? '') !== city) return false
        if (query && !`${user.full_name} ${user.email} ${user.phone}`.toLowerCase().includes(query.toLowerCase())) return false
        return true
      }),
    [users, query, role, city],
  )

  const columns = useMemo<ColumnDef<Row, unknown>[]>(
    () => [
      {
        accessorKey: 'full_name',
        header: 'Имя',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-gray-900">{row.original.full_name || '—'}</p>
            <button
              onClick={() => setRevealed((current) => [...current, row.original.id])}
              className="text-xs text-gray-400 hover:text-corpBlue"
            >
              {revealed.includes(row.original.id) ? row.original.email : maskEmail(row.original.email)}
            </button>
          </div>
        ),
      },
      { id: 'city', header: 'Город', accessorFn: (row) => cities.find((item) => item.id === row.city_id)?.name_ru ?? '—' },
      { accessorKey: 'ent_score', header: 'Балл ЕНТ', cell: ({ row }) => row.original.ent_score ?? '—' },
      {
        accessorKey: 'role',
        header: 'Роль',
        cell: ({ row }) =>
          row.original.role === 'superadmin' ? <Badge tone="info" mini>Суперадмин</Badge> : <span className="text-gray-500">Пользователь</span>,
      },
      { accessorKey: 'reviews_count', header: 'Отзывы' },
      { accessorKey: 'favorites_count', header: 'Избранное' },
      { id: 'created', header: 'Регистрация', accessorFn: (row) => formatDate(row.created_at) },
      {
        id: 'status',
        header: 'Статус',
        cell: ({ row }) => (row.original.is_blocked ? <Badge tone="danger" mini>Заблокирован</Badge> : <Badge tone="success" mini>Активен</Badge>),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex gap-1 justify-end">
            <button
              onClick={() => {
                const reason = row.original.is_blocked ? '' : prompt('Причина блокировки') ?? ''
                run(() => setUserBlocked(row.original.id, !row.original.is_blocked, reason), 'Готово')
              }}
              className="p-2 text-gray-400 hover:text-yellow-600"
              title={row.original.is_blocked ? 'Разблокировать' : 'Заблокировать'}
            >
              <Ban className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const next = row.original.role === 'superadmin' ? 'user' : 'superadmin'
                if (!confirm(`Изменить роль на «${next}»?`)) return
                if (!confirm('Подтвердите ещё раз: смена роли даёт полный доступ к платформе.')) return
                run(() => setUserRole(row.original.id, next), 'Роль изменена')
              }}
              className="p-2 text-gray-400 hover:text-corpBlue"
              title="Роль суперадмина"
            >
              <ShieldCheck className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (confirm('Удалить аккаунт? Отзывы будут скрыты.')) run(() => deleteUser(row.original.id), 'Удалено')
              }}
              className="p-2 text-gray-400 hover:text-red-600"
              title="Удалить"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [cities, revealed],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <Input surface="admin" placeholder="Поиск" value={query} onChange={(event) => setQuery(event.target.value)} className="max-w-xs" />
        <Select surface="admin" value={role} onChange={(event) => setRole(event.target.value)} className="max-w-[200px]" aria-label="Роль">
          <option value="">Все роли</option>
          <option value="user">Пользователи</option>
          <option value="superadmin">Суперадмины</option>
        </Select>
        <Select surface="admin" value={city} onChange={(event) => setCity(event.target.value)} className="max-w-[200px]" aria-label="Город">
          <option value="">Все города</option>
          {cities.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name_ru}
            </option>
          ))}
        </Select>
        <div className="ml-auto" onClick={() => logExport('profiles', rows.length)}>
          <ExportButton
            rows={rows.map((row) => ({
              name: row.full_name,
              email: row.email,
              city: cities.find((item) => item.id === row.city_id)?.name_ru ?? '',
              ent_score: row.ent_score ?? '',
              role: row.role,
              reviews: row.reviews_count,
              created_at: row.created_at,
            }))}
            filename="users"
          />
        </div>
      </div>

      <DataTable columns={columns} data={rows} emptyText="Пользователи не найдены" pageSize={25} />
    </div>
  )
}

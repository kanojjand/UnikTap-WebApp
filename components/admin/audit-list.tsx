'use client'

import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input, Select } from '@/components/ui/input'
import { ExportButton } from './charts'
import { formatDateTime } from '@/lib/utils'
import type { AuditEntry } from '@/types/domain'

const ACTION_TONES: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  insert: 'success',
  update: 'info',
  delete: 'danger',
  restore: 'warning',
  moderate: 'info',
  export: 'neutral',
  settings: 'warning',
}

export function AuditList({ entries }: { entries: AuditEntry[] }) {
  const [query, setQuery] = useState('')
  const [entity, setEntity] = useState('')
  const [action, setAction] = useState('')
  const [open, setOpen] = useState<number | null>(null)

  const entities = useMemo(() => Array.from(new Set(entries.map((entry) => entry.entity))), [entries])

  const rows = useMemo(
    () =>
      entries.filter((entry) => {
        if (entity && entry.entity !== entity) return false
        if (action && entry.action !== action) return false
        if (query) {
          const haystack = `${entry.actor?.full_name} ${entry.actor?.email} ${entry.entity_id}`.toLowerCase()
          if (!haystack.includes(query.toLowerCase())) return false
        }
        return true
      }),
    [entries, query, entity, action],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <Input surface="admin" placeholder="Поиск по автору или объекту" value={query} onChange={(event) => setQuery(event.target.value)} className="max-w-xs" />
        <Select surface="admin" value={entity} onChange={(event) => setEntity(event.target.value)} className="max-w-[220px]" aria-label="Сущность">
          <option value="">Все сущности</option>
          {entities.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
        <Select surface="admin" value={action} onChange={(event) => setAction(event.target.value)} className="max-w-[200px]" aria-label="Действие">
          <option value="">Все действия</option>
          {Object.keys(ACTION_TONES).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
        <div className="ml-auto">
          <ExportButton
            rows={rows.map((row) => ({
              created_at: row.created_at,
              actor: row.actor?.email ?? '',
              action: row.action,
              entity: row.entity,
              entity_id: row.entity_id ?? '',
            }))}
            filename="audit"
          />
        </div>
      </div>

      <ul className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
        {rows.map((entry) => (
          <li key={entry.id}>
            <button onClick={() => setOpen(open === entry.id ? null : entry.id)} className="w-full flex items-center gap-3 px-5 py-3 text-left text-sm hover:bg-softBlue/40">
              <span className="text-gray-400 w-40 shrink-0">{formatDateTime(entry.created_at)}</span>
              <Badge tone={ACTION_TONES[entry.action] ?? 'neutral'} mini>
                {entry.action}
              </Badge>
              <span className="text-gray-700 font-medium">{entry.entity}</span>
              <span className="text-gray-400 font-mono text-xs truncate">{entry.entity_id}</span>
              <span className="ml-auto text-gray-500 truncate max-w-[220px]">
                {entry.actor?.full_name || entry.actor?.email || 'Система'}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-300 transition-transform ${open === entry.id ? 'rotate-180' : ''}`} aria-hidden />
            </button>
            {open === entry.id ? (
              <div className="px-5 pb-4 grid md:grid-cols-2 gap-3 text-xs">
                <pre className="bg-slateBg rounded-xl p-3 overflow-x-auto max-h-64">
                  <b className="block mb-1 text-gray-500">Было</b>
                  {JSON.stringify(entry.before, null, 2)}
                </pre>
                <pre className="bg-slateBg rounded-xl p-3 overflow-x-auto max-h-64">
                  <b className="block mb-1 text-gray-500">Стало</b>
                  {JSON.stringify(entry.after, null, 2)}
                </pre>
              </div>
            ) : null}
          </li>
        ))}
        {rows.length === 0 ? <li className="py-8 text-center text-gray-400">Записей нет</li> : null}
      </ul>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Tabs } from '@/components/ui/tabs'
import { BigStat } from './page-header'
import { BarsChart, ExportButton } from './charts'
import type { AnalyticsData } from '@/lib/queries/admin'

const TABS = [
  { id: 'audience', label: 'Аудитория' },
  { id: 'content', label: 'Контент' },
  { id: 'majors', label: 'Специальности' },
  { id: 'search', label: 'Поиск' },
  { id: 'ent', label: 'ЕНТ' },
  { id: 'reviews', label: 'Отзывы' },
]

export function AnalyticsView({ data }: { data: AnalyticsData }) {
  const [tab, setTab] = useState('audience')

  return (
    <div className="space-y-6">
      <Tabs className="bg-white rounded-2xl px-4 pt-4 border border-gray-100" active={tab} onChange={setTab} tabs={TABS} />

      {tab === 'audience' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <BigStat label="Сессии" value={data.audience.sessions} />
            <BigStat label="Пользователи" value={data.audience.users} />
            <BigStat label="Новые" value={data.audience.newUsers} />
            <BigStat label="Городов" value={data.audience.cities.length} />
          </div>
          <div className="grid xl:grid-cols-2 gap-6">
            <BarsChart title="Устройства" data={data.audience.devices} xKey="name" valueKey="value" filename="devices" />
            <BarsChart title="Языки интерфейса" data={data.audience.locales} xKey="name" valueKey="value" filename="locales" />
            <BarsChart title="Источники переходов" data={data.audience.referrers} xKey="name" valueKey="value" layout="horizontal" filename="referrers" />
            <BarsChart title="Города пользователей" data={data.audience.cities} xKey="name" valueKey="value" layout="horizontal" filename="user-cities" />
          </div>
        </div>
      ) : null}

      {tab === 'content' ? (
        <Table
          title="Университеты"
          rows={data.content}
          filename="content"
          columns={[
            { key: 'name', label: 'ВУЗ' },
            { key: 'views', label: 'Просмотры' },
            { key: 'uniques', label: 'Уникальные' },
            { key: 'favorites', label: 'В избранном' },
            { key: 'contacts', label: 'Клики «Связаться»' },
            { key: 'conversion', label: 'Конверсия, %' },
            { key: 'rating', label: 'Оценка' },
          ]}
        />
      ) : null}

      {tab === 'majors' ? (
        <BarsChart title="Самые просматриваемые программы" data={data.majors} xKey="name" valueKey="views" layout="horizontal" filename="majors-views" />
      ) : null}

      {tab === 'search' ? (
        <div className="grid xl:grid-cols-2 gap-6">
          <Table title="Топ запросов" rows={data.search.top} filename="search-top" columns={[{ key: 'query', label: 'Запрос' }, { key: 'count', label: 'Раз' }]} />
          <Table
            title="Запросы без результатов"
            rows={data.search.empty}
            filename="search-empty"
            columns={[{ key: 'query', label: 'Запрос' }, { key: 'count', label: 'Раз' }]}
            hint="Показывает, каких ВУЗов не хватает в базе"
          />
          <Table title="Используемые фильтры" rows={data.search.filters} filename="filters" columns={[{ key: 'name', label: 'Фильтр' }, { key: 'count', label: 'Раз' }]} />
        </div>
      ) : null}

      {tab === 'ent' ? (
        <div className="grid xl:grid-cols-2 gap-6">
          <BarsChart title="Распределение баллов" data={data.ent.buckets} xKey="bucket" valueKey="count" filename="ent-buckets" />
          <BarsChart title="Средний балл по городам" data={data.ent.byCity} xKey="city" valueKey="avg" layout="horizontal" filename="ent-cities" />
        </div>
      ) : null}

      {tab === 'reviews' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <BigStat label="Опубликовано" value={data.reviews.approved} />
            <BigStat label="На модерации" value={data.reviews.pending} tone="warning" />
            <BigStat label="Отклонено" value={data.reviews.rejected} />
          </div>
          <div className="grid xl:grid-cols-2 gap-6">
            <BarsChart title="Поступление отзывов по дням" data={data.reviews.daily} xKey="day" valueKey="count" filename="reviews-daily" />
            <BarsChart title="Средние по критериям" data={data.reviews.criteria} xKey="name" valueKey="value" layout="horizontal" filename="reviews-criteria" />
            <Table title="Лучшие оценки" rows={data.reviews.best} filename="best" columns={[{ key: 'name', label: 'ВУЗ' }, { key: 'rating', label: 'Оценка' }]} />
            <Table title="Худшие оценки" rows={data.reviews.worst} filename="worst" columns={[{ key: 'name', label: 'ВУЗ' }, { key: 'rating', label: 'Оценка' }]} />
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Table({
  title,
  rows,
  columns,
  filename,
  hint,
}: {
  title: string
  rows: Record<string, unknown>[]
  columns: { key: string; label: string }[]
  filename: string
  hint?: string
}) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between p-5">
        <div>
          <h2 className="font-bold text-gray-900">{title}</h2>
          {hint ? <p className="text-xs text-gray-500 mt-1">{hint}</p> : null}
        </div>
        <ExportButton rows={rows} filename={filename} label="CSV" />
      </div>
      <div className="overflow-x-auto max-h-[520px]">
        <table className="w-full text-sm">
          <thead className="bg-slateBg text-gray-500 text-left sticky top-0">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="py-3 px-5 font-medium whitespace-nowrap">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <td key={column.key} className="py-3 px-5">
                    {String(row[column.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-8 text-center text-gray-400">
                  Данных пока нет
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  )
}

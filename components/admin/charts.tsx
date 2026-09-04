'use client'

import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import { Download } from 'lucide-react'
import { toCsv } from '@/lib/utils'

const BLUES = ['#1E3A8A', '#2748A6', '#3B62C4', '#5C82DA', '#8AA7E8', '#B3C6F1', '#64748B', '#94A3B8']

function ChartCard({
  title,
  rows,
  filename,
  children,
}: {
  title: string
  rows: Record<string, unknown>[]
  filename: string
  children: React.ReactNode
}) {
  function exportCsv() {
    const blob = new Blob(['﻿' + toCsv(rows)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900">{title}</h2>
        <button onClick={exportCsv} className="text-xs text-gray-400 hover:text-corpBlue flex items-center gap-1">
          <Download className="w-3.5 h-3.5" aria-hidden /> CSV
        </button>
      </div>
      <div className="h-64">{children}</div>
    </section>
  )
}

export function TrafficChart({ data }: { data: { day: string; sessions: number; university_views: number }[] }) {
  return (
    <ChartCard title="Посещаемость по дням" rows={data} filename="traffic">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#94A3B8" />
          <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" allowDecimals={false} />
          <Tooltip />
          <Line type="monotone" dataKey="sessions" name="Сессии" stroke="#1E3A8A" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="university_views" name="Просмотры ВУЗов" stroke="#5C82DA" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function BarsChart({
  title,
  data,
  xKey,
  valueKey,
  layout = 'vertical',
  filename,
}: {
  title: string
  data: Record<string, unknown>[]
  xKey: string
  valueKey: string
  layout?: 'vertical' | 'horizontal'
  filename: string
}) {
  return (
    <ChartCard title={title} rows={data} filename={filename}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout={layout === 'horizontal' ? 'vertical' : 'horizontal'} margin={{ left: layout === 'horizontal' ? 60 : 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          {layout === 'horizontal' ? (
            <>
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94A3B8" allowDecimals={false} />
              <YAxis type="category" dataKey={xKey} tick={{ fontSize: 10 }} width={140} stroke="#94A3B8" />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} tick={{ fontSize: 10 }} stroke="#94A3B8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" allowDecimals={false} />
            </>
          )}
          <Tooltip />
          <Bar dataKey={valueKey} fill="#1E3A8A" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function CityPie({ data }: { data: { city: string; count: number }[] }) {
  return (
    <ChartCard title="Пользователи по городам" rows={data} filename="cities">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="city" outerRadius={90} label={{ fontSize: 11 }}>
            {data.map((entry, index) => (
              <Cell key={entry.city} fill={BLUES[index % BLUES.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function Funnel({ data }: { data: { step: string; value: number }[] }) {
  const max = Math.max(...data.map((item) => item.value), 1)

  return (
    <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card">
      <h2 className="font-bold text-gray-900 mb-4">Воронка «просмотр → контакт»</h2>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={item.step}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">{item.step}</span>
              <span className="font-bold text-gray-900">
                {item.value}
                {index > 0 && data[0].value > 0 ? (
                  <span className="text-xs text-gray-400 ml-2">
                    {Math.round((item.value / data[0].value) * 100)}%
                  </span>
                ) : null}
              </span>
            </div>
            <div className="h-3 rounded-full bg-slateBg overflow-hidden">
              <div className="h-full bg-corpBlue rounded-full" style={{ width: `${(item.value / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function ExportButton({
  rows,
  filename,
  label = 'Экспорт CSV',
}: {
  rows: Record<string, unknown>[]
  filename: string
  label?: string
}) {
  return (
    <button
      onClick={() => {
        const blob = new Blob(['﻿' + toCsv(rows)], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${filename}.csv`
        link.click()
        URL.revokeObjectURL(url)
      }}
      className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl px-4 py-2.5 hover:bg-white"
    >
      <Download className="w-4 h-4" aria-hidden /> {label}
    </button>
  )
}

import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { BigStat, PageHeader } from '@/components/admin/page-header'
import { BarsChart, CityPie, Funnel, TrafficChart } from '@/components/admin/charts'
import { adminDashboard } from '@/lib/queries/admin'
import { formatDateTime } from '@/lib/utils'

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>
}) {
  const { days } = await searchParams
  const period = Number(days) || 30

  let data
  try {
    data = await adminDashboard(period)
  } catch (error) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <p className="font-bold text-gray-900">Нет доступа к данным</p>
        <p className="text-sm text-gray-500 mt-2">
          Проверьте переменную SUPABASE_SERVICE_ROLE_KEY. {error instanceof Error ? error.message : ''}
        </p>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Дашборд"
        subtitle={`Данные за последние ${period} дней`}
        action={
          <div className="flex gap-2">
            {[7, 30, 90].map((value) => (
              <Link
                key={value}
                href={`/admin?days=${value}`}
                className={`px-4 py-2 rounded-xl text-sm font-medium border ${
                  period === value ? 'bg-corpBlue text-white border-corpBlue' : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                {value} дней
              </Link>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <BigStat label="Сессии" value={data.totals.sessions} />
        <BigStat label="Новые пользователи" value={data.totals.newUsers} hint={`всего ${data.totals.users}`} />
        <BigStat label="Просмотры ВУЗов" value={data.totals.cardViews} />
        <BigStat label="Клики «Связаться»" value={data.totals.contactClicks} />
        <BigStat label="Отзывы на модерации" value={data.totals.reviewsPending} tone="warning" />
        <BigStat label="Средняя оценка" value={data.totals.avgRating || '—'} hint={`${data.totals.reviewsTotal} отзывов`} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="xl:col-span-2">
          <TrafficChart data={data.daily} />
        </div>
        <BarsChart title="Топ-10 ВУЗов по просмотрам" data={data.topUniversities} xKey="name" valueKey="views" layout="horizontal" filename="top-universities" />
        <BarsChart title="Топ-10 специальностей по интересу" data={data.topMajors} xKey="name" valueKey="interest" layout="horizontal" filename="top-majors" />
        <BarsChart title="Распределение баллов ЕНТ" data={data.scoreBuckets} xKey="bucket" valueKey="count" filename="ent-scores" />
        <CityPie data={data.cityShare} />
        <Funnel data={data.funnel} />

        <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-500" aria-hidden />
            Требует внимания
          </h2>
          <ul className="divide-y divide-gray-100">
            {data.attention.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="flex justify-between py-3 text-sm hover:text-corpBlue">
                  <span className="text-gray-600">{item.label}</span>
                  <span className={`font-bold ${item.count > 0 ? 'text-yellow-600' : 'text-gray-300'}`}>{item.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card xl:col-span-2">
          <h2 className="font-bold text-gray-900 mb-4">Последние действия</h2>
          <ul className="divide-y divide-gray-100 text-sm">
            {data.recentAudit.map((entry) => (
              <li key={entry.id} className="py-2.5 flex justify-between gap-4">
                <span className="text-gray-600">
                  <b className="text-gray-900">{entry.actor?.full_name || entry.actor?.email || 'Система'}</b> ·{' '}
                  {entry.action} · {entry.entity}
                </span>
                <span className="text-gray-400 shrink-0">{formatDateTime(entry.created_at)}</span>
              </li>
            ))}
            {data.recentAudit.length === 0 ? <li className="py-4 text-gray-400 text-center">Пока пусто</li> : null}
          </ul>
        </section>
      </div>
    </>
  )
}

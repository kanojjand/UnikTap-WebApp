import Link from 'next/link'
import { PageHeader } from '@/components/admin/page-header'
import { AnalyticsView } from '@/components/admin/analytics-view'
import { adminAnalytics } from '@/lib/queries/admin'

export default async function AdminAnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const { days } = await searchParams
  const period = Number(days) || 30
  const data = await adminAnalytics(period)

  return (
    <>
      <PageHeader
        title="Статистика"
        subtitle={`Шесть отчётов за последние ${period} дней`}
        action={
          <div className="flex gap-2">
            {[7, 30, 90].map((value) => (
              <Link
                key={value}
                href={`/admin/analytics?days=${value}`}
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
      <AnalyticsView data={data} />
    </>
  )
}

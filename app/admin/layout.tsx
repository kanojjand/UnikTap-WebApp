import { notFound } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/sidebar'
import { getCurrentProfile } from '@/lib/queries/profile'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = { robots: { index: false, follow: false }, title: 'Админка · UnikTap' }
export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile()
  // Нет роли — отдаём 404, а не 403: не подсказываем существование раздела (8.1)
  if (!profile || profile.role !== 'superadmin' || profile.is_blocked) notFound()

  let pending = 0
  try {
    const { count } = await createAdminClient()
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .is('deleted_at', null)
    pending = count ?? 0
  } catch {
    /* сервисный ключ не задан */
  }

  return (
    // Админка всегда в светлой теме: её таблицы и формы свёрстаны под светлый фон
    <div className="theme-light flex min-h-screen bg-slateBg text-gray-900">
      <AdminSidebar name={profile.full_name ?? ''} email={profile.email ?? ''} pendingReviews={pending} />
      <main className="flex-1 overflow-x-hidden p-6 lg:p-10">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  )
}

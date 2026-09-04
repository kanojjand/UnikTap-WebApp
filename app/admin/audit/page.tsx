import { PageHeader } from '@/components/admin/page-header'
import { AuditList } from '@/components/admin/audit-list'
import { adminAudit } from '@/lib/queries/admin'

export default async function AdminAuditPage() {
  const entries = await adminAudit(500)

  return (
    <>
      <PageHeader title="Журнал действий" subtitle="Все изменения в админке, хранятся 12 месяцев" />
      <AuditList entries={entries} />
    </>
  )
}

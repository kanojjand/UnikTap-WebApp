import { PageHeader } from '@/components/admin/page-header'
import { UsersTable } from '@/components/admin/users-table'
import { adminDictionaries, adminUsers } from '@/lib/queries/admin'

export default async function AdminUsersPage() {
  const [users, dictionaries] = await Promise.all([adminUsers(), adminDictionaries()])

  return (
    <>
      <PageHeader title="Пользователи" subtitle={`${users.length} аккаунтов. Экспорт персональных данных пишется в аудит`} />
      <UsersTable users={users} cities={dictionaries.cities} />
    </>
  )
}

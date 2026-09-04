import { PageHeader } from '@/components/admin/page-header'
import { MajorsTable } from '@/components/admin/majors-table'
import { adminDictionaries, adminMajors } from '@/lib/queries/admin'

export default async function AdminMajorsPage() {
  const [majors, dictionaries] = await Promise.all([adminMajors(), adminDictionaries()])

  return (
    <>
      <PageHeader title="Специальности" subtitle={`${majors.length} образовательных программ по всем ВУЗам`} />
      <MajorsTable majors={majors} cities={dictionaries.cities} />
    </>
  )
}

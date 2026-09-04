import { PageHeader } from '@/components/admin/page-header'
import { UniversityForm } from '@/components/admin/university-form'
import { adminDictionaries } from '@/lib/queries/admin'

export default async function NewUniversityPage() {
  const dictionaries = await adminDictionaries()

  return (
    <>
      <PageHeader title="Новый университет" subtitle="Заполните основные поля и сохраните черновик" />
      <UniversityForm cities={dictionaries.cities} specialties={dictionaries.specialties} blocks={[]} majors={[]} images={[]} />
    </>
  )
}

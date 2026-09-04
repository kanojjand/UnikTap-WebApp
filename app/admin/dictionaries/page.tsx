import { PageHeader } from '@/components/admin/page-header'
import { DictionariesEditor } from '@/components/admin/dictionaries-editor'
import { adminDictionaries } from '@/lib/queries/admin'

export default async function AdminDictionariesPage() {
  const { cities, specialties, subjects } = await adminDictionaries()

  return (
    <>
      <PageHeader title="Справочники" subtitle="Города, образовательные программы и предметы ЕНТ" />
      <DictionariesEditor cities={cities} specialties={specialties} subjects={subjects} />
    </>
  )
}

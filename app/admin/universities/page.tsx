import Link from 'next/link'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'
import { UniversitiesTable } from '@/components/admin/universities-table'
import { adminUniversities, adminDictionaries } from '@/lib/queries/admin'

export default async function AdminUniversitiesPage() {
  const [universities, dictionaries] = await Promise.all([adminUniversities(), adminDictionaries()])

  return (
    <>
      <PageHeader
        title="Университеты"
        subtitle={`Всего ${universities.length} карточек`}
        action={
          <Link
            href="/admin/universities/new"
            className="bg-corpBlue hover:bg-corpBlueHover text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"
          >
            <Plus className="w-5 h-5" aria-hidden /> Добавить
          </Link>
        }
      />
      <UniversitiesTable universities={universities} cities={dictionaries.cities} />
    </>
  )
}

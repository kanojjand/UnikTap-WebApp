import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/admin/page-header'
import { UniversityForm } from '@/components/admin/university-form'
import { adminDictionaries, adminUniversity } from '@/lib/queries/admin'

export default async function EditUniversityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [{ university, majors, blocks, images }, dictionaries] = await Promise.all([
    adminUniversity(id),
    adminDictionaries(),
  ])
  if (!university) notFound()

  return (
    <>
      <PageHeader title={university.short_name || university.name_ru} subtitle="Редактирование карточки университета" />
      <UniversityForm
        university={university}
        cities={dictionaries.cities}
        specialties={dictionaries.specialties}
        blocks={blocks}
        majors={majors}
        images={images}
      />
    </>
  )
}

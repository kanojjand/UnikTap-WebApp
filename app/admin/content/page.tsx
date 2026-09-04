import { PageHeader } from '@/components/admin/page-header'
import { ContentEditor } from '@/components/admin/content-editor'
import { adminContent, adminSettings } from '@/lib/queries/admin'

export default async function AdminContentPage() {
  const [{ faq, pages }, settings] = await Promise.all([adminContent(), adminSettings()])
  const announcement = (settings.announcement as { enabled: boolean; text_ru: string; text_kk: string; link: string }) ?? {
    enabled: false,
    text_ru: '',
    text_kk: '',
    link: '',
  }

  return (
    <>
      <PageHeader title="Контент" subtitle="FAQ, статические страницы и баннер-объявление" />
      <ContentEditor faq={faq} pages={pages} announcement={announcement} />
    </>
  )
}

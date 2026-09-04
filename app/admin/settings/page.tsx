import { PageHeader } from '@/components/admin/page-header'
import { SettingsForm } from '@/components/admin/settings-form'
import { adminSettings } from '@/lib/queries/admin'

export default async function AdminSettingsPage() {
  const settings = await adminSettings()

  return (
    <>
      <PageHeader title="Настройки" subtitle="Значения, которые меняются каждый год, живут здесь, а не в коде" />
      <SettingsForm settings={settings} />
    </>
  )
}

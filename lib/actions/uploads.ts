'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentProfile, isSuperadmin } from '@/lib/queries/profile'
import { writeAudit } from '@/lib/audit'

type UploadResult = { ok: true; url: string; path: string } | { ok: false; error: string }

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

function extensionFor(type: string): string {
  if (type === 'image/png') return 'png'
  if (type === 'image/webp') return 'webp'
  return 'jpg'
}

function validate(file: unknown): { ok: true; file: File } | { ok: false; error: string } {
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'Файл не выбран' }
  if (file.size > MAX_SIZE) return { ok: false, error: 'Файл больше 5 МБ' }
  if (!ALLOWED.includes(file.type)) return { ok: false, error: 'Только JPG, PNG или WEBP' }
  return { ok: true, file }
}

/**
 * Загрузка медиа университета в бакет university-media.
 * Путь: universities/{university_id}/{uuid}.{ext} — как в разделе 4.11 ТЗ.
 */
export async function uploadUniversityMedia(formData: FormData): Promise<UploadResult> {
  if (!(await isSuperadmin())) return { ok: false, error: 'Нет доступа' }

  const checked = validate(formData.get('file'))
  if (!checked.ok) return checked

  const universityId = String(formData.get('university_id') ?? 'common')
  const path = `universities/${universityId}/${crypto.randomUUID()}.${extensionFor(checked.file.type)}`

  try {
    const admin = createAdminClient()
    const { error } = await admin.storage.from('university-media').upload(path, checked.file, {
      contentType: checked.file.type,
      cacheControl: '31536000',
      upsert: false,
    })
    if (error) return { ok: false, error: error.message }

    const { data } = admin.storage.from('university-media').getPublicUrl(path)
    const profile = await getCurrentProfile()
    await writeAudit({
      actorId: profile?.id ?? null,
      action: 'insert',
      entity: 'storage.university-media',
      entityId: universityId,
      after: { path },
    })

    return { ok: true, url: data.publicUrl, path }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Не удалось загрузить файл' }
  }
}

export async function deleteUniversityMedia(url: string): Promise<{ ok: boolean }> {
  if (!(await isSuperadmin())) return { ok: false }
  const marker = '/university-media/'
  const index = url.indexOf(marker)
  if (index === -1) return { ok: true }

  try {
    const admin = createAdminClient()
    await admin.storage.from('university-media').remove([url.slice(index + marker.length)])
  } catch {
    /* файла может уже не быть */
  }
  return { ok: true }
}

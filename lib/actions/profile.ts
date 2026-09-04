'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { profileSchema } from '@/lib/validation/schemas'

type ActionResult = { ok: true } | { ok: false; error: string }

/**
 * Обновление профиля. Белый список полей: role, university_id и is_blocked
 * сюда не попадают — их меняет только админка сервисным ключом.
 */
export async function updateProfile(input: unknown): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Проверьте форму' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthorized' }

  const { error } = await supabase.from('profiles').update(parsed.data).eq('id', user.id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/[locale]/profile', 'page')
  return { ok: true }
}

export async function saveEntScore(score: number | null): Promise<ActionResult> {
  return updateProfile({ ent_score: score })
}

export async function finishOnboarding(input: unknown): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Проверьте форму' }
  return updateProfile({ ...parsed.data, onboarded: true })
}

export async function deleteAccount(): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthorized' }

  // Отзывы анонимизируем мягким удалением, аккаунт удаляет сервисный ключ
  await supabase.from('reviews').update({ deleted_at: new Date().toISOString() }).eq('user_id', user.id)

  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const admin = createAdminClient()
    await admin.auth.admin.deleteUser(user.id)
  } catch {
    return { ok: false, error: 'Не удалось удалить аккаунт, напишите нам' }
  }

  await supabase.auth.signOut()
  return { ok: true }
}
